-- WozaMoney Collector Database Schema
-- Run this in your Supabase SQL Editor

-- Create collection_areas table
CREATE TABLE IF NOT EXISTS public.collection_areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    township_id UUID REFERENCES public.townships(id),
    ext_zone_phase TEXT,
    city TEXT NOT NULL DEFAULT 'Soweto',
    province TEXT NOT NULL DEFAULT 'Gauteng',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_schedules table
CREATE TABLE IF NOT EXISTS public.collection_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    area_id UUID REFERENCES public.collection_areas(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.profiles(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_routes table
CREATE TABLE IF NOT EXISTS public.collection_routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    area_ids UUID[] NOT NULL, -- Array of area IDs
    collector_id UUID REFERENCES public.profiles(id),
    estimated_duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_logs table
CREATE TABLE IF NOT EXISTS public.collection_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collector_id UUID REFERENCES public.profiles(id),
    area_id UUID REFERENCES public.collection_areas(id),
    route_id UUID REFERENCES public.collection_routes(id),
    collection_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    households_visited INTEGER DEFAULT 0,
    households_collected INTEGER DEFAULT 0,
    total_weight_kg DECIMAL(8,2) DEFAULT 0.00,
    notes TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create household_collections table
CREATE TABLE IF NOT EXISTS public.household_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_log_id UUID REFERENCES public.collection_logs(id) ON DELETE CASCADE,
    household_id UUID REFERENCES public.profiles(id),
    collection_date DATE NOT NULL,
    weight_kg DECIMAL(6,2) NOT NULL,
    items_collected TEXT[], -- Array of item types
    payment_amount DECIMAL(8,2) DEFAULT 0.00,
    payment_method TEXT DEFAULT 'points',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'member';
    END IF;
END $$;

-- Update role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'manager', 'user', 'member', 'recycler', 'collector'));

-- Enable Row Level Security
ALTER TABLE public.collection_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collection_areas
CREATE POLICY "Anyone can view collection areas" ON public.collection_areas
    FOR SELECT USING (true);

CREATE POLICY "Only admins and managers can manage collection areas" ON public.collection_areas
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        (auth.jwt() ->> 'role' = 'collector' AND auth.uid() IN (
            SELECT collector_id FROM public.collection_schedules WHERE area_id = id
        ))
    );

-- RLS Policies for collection_schedules
CREATE POLICY "Anyone can view collection schedules" ON public.collection_schedules
    FOR SELECT USING (true);

CREATE POLICY "Only admins and managers can manage schedules" ON public.collection_schedules
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Collectors can view their own schedules" ON public.collection_schedules
    FOR SELECT USING (auth.uid() = collector_id);

-- RLS Policies for collection_routes
CREATE POLICY "Anyone can view collection routes" ON public.collection_routes
    FOR SELECT USING (true);

CREATE POLICY "Only admins and managers can manage routes" ON public.collection_routes
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Collectors can view their assigned routes" ON public.collection_routes
    FOR SELECT USING (auth.uid() = collector_id);

-- RLS Policies for collection_logs
CREATE POLICY "Collectors can view their own logs" ON public.collection_logs
    FOR SELECT USING (auth.uid() = collector_id);

CREATE POLICY "Admins and managers can view all logs" ON public.collection_logs
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Collectors can create and update their own logs" ON public.collection_logs
    FOR ALL USING (auth.uid() = collector_id);

-- RLS Policies for household_collections
CREATE POLICY "Collectors can view their collected households" ON public.household_collections
    FOR SELECT USING (
        auth.uid() IN (
            SELECT collector_id FROM public.collection_logs WHERE id = collection_log_id
        )
    );

CREATE POLICY "Admins and managers can view all household collections" ON public.household_collections
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Collectors can create household collections" ON public.household_collections
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT collector_id FROM public.collection_logs WHERE id = collection_log_id
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_areas_township ON public.collection_areas(township_id);
CREATE INDEX IF NOT EXISTS idx_collection_areas_city ON public.collection_areas(city);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_collector ON public.collection_schedules(collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_area ON public.collection_schedules(area_id);
CREATE INDEX IF NOT EXISTS idx_collection_routes_collector ON public.collection_routes(collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_collector ON public.collection_logs(collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_date ON public.collection_logs(collection_date);
CREATE INDEX IF NOT EXISTS idx_household_collections_log ON public.household_collections(collection_log_id);
CREATE INDEX IF NOT EXISTS idx_household_collections_date ON public.household_collections(collection_date);

-- Create triggers for updated_at
CREATE TRIGGER update_collection_areas_updated_at
    BEFORE UPDATE ON public.collection_areas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collection_schedules_updated_at
    BEFORE UPDATE ON public.collection_schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collection_routes_updated_at
    BEFORE UPDATE ON public.collection_routes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collection_logs_updated_at
    BEFORE UPDATE ON public.collection_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Functions for collector operations
CREATE OR REPLACE FUNCTION public.get_collector_areas(collector_uuid UUID)
RETURNS TABLE (
    area_id UUID,
    area_name TEXT,
    township_name TEXT,
    city TEXT,
    schedule_days INTEGER[],
    schedule_times TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id as area_id,
        ca.name as area_name,
        t.name as township_name,
        ca.city,
        ARRAY_AGG(cs.day_of_week) as schedule_days,
        ARRAY_AGG(cs.start_time::text || ' - ' || cs.end_time::text) as schedule_times
    FROM public.collection_areas ca
    LEFT JOIN public.townships t ON ca.township_id = t.id
    INNER JOIN public.collection_schedules cs ON ca.id = cs.area_id
    WHERE cs.collector_id = collector_uuid AND cs.is_active = true
    GROUP BY ca.id, ca.name, t.name, ca.city;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_collector_routes(collector_uuid UUID)
RETURNS TABLE (
    route_id UUID,
    route_name TEXT,
    description TEXT,
    area_count INTEGER,
    estimated_duration_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id as route_id,
        cr.name as route_name,
        cr.description,
        array_length(cr.area_ids, 1) as area_count,
        cr.estimated_duration_minutes
    FROM public.collection_routes cr
    WHERE cr.collector_id = collector_uuid AND cr.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for testing
INSERT INTO public.collection_areas (name, city, province) VALUES
    ('Baragwanath Central', 'Soweto', 'Gauteng'),
    ('Chiawelo Extension', 'Soweto', 'Gauteng'),
    ('Dlamini Zone 1', 'Soweto', 'Gauteng'),
    ('Protea Glen North', 'Soweto', 'Gauteng')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON public.collection_areas TO authenticated;
GRANT SELECT ON public.collection_schedules TO authenticated;
GRANT SELECT ON public.collection_routes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.collection_logs TO authenticated;
GRANT SELECT, INSERT ON public.household_collections TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_collector_areas(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_collector_routes(UUID) TO authenticated;
