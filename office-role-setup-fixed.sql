-- =====================================================
-- WOZAMALI OFFICE ROLE SETUP (CORRECTED VERSION)
-- This script ensures all required tables exist before creating office functionality
-- Run this after the main schema installation
-- =====================================================

-- =====================================================
-- STEP 1: CREATE REQUIRED TABLES IF THEY DON'T EXIST
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create offices table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.offices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL DEFAULT 'Soweto',
    province TEXT NOT NULL DEFAULT 'Gauteng',
    phone TEXT,
    email TEXT,
    manager_id UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create office_staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.office_staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'supervisor', 'staff', 'collector')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(office_id, profile_id)
);

-- Create collection_areas table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.collection_areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    office_id UUID REFERENCES public.offices(id),
    ext_zone_phase TEXT,
    city TEXT NOT NULL DEFAULT 'Soweto',
    province TEXT NOT NULL DEFAULT 'Gauteng',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.collection_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collector_id UUID REFERENCES public.profiles(id),
    office_id UUID REFERENCES public.offices(id),
    area_id UUID REFERENCES public.collection_areas(id),
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

-- Create collection_routes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.collection_routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    office_id UUID REFERENCES public.offices(id),
    area_ids UUID[] NOT NULL,
    collector_id UUID REFERENCES public.profiles(id),
    estimated_duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: ADD MISSING COLUMNS TO PROFILES TABLE
-- =====================================================

DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'office', 'collector', 'member'));
        RAISE NOTICE 'Added role column to profiles table';
    END IF;
    
    -- Add office_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'office_id') THEN
        ALTER TABLE public.profiles ADD COLUMN office_id UUID REFERENCES public.offices(id);
        RAISE NOTICE 'Added office_id column to profiles table';
    END IF;
    
    -- Add collector_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'collector_id') THEN
        ALTER TABLE public.profiles ADD COLUMN collector_id UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Added collector_id column to profiles table';
    END IF;
END $$;

-- =====================================================
-- STEP 3: CREATE OFFICE USER ROLES
-- =====================================================

-- Function to create an office user
CREATE OR REPLACE FUNCTION create_office_user(
    p_email TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_office_id UUID,
    p_role TEXT DEFAULT 'staff'
)
RETURNS UUID AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    -- Check if profile already exists
    SELECT id INTO v_profile_id 
    FROM public.profiles 
    WHERE email = p_email;
    
    IF v_profile_id IS NOT NULL THEN
        -- Update existing profile to office role
        UPDATE public.profiles 
        SET 
            role = 'office',
            office_id = p_office_id,
            updated_at = NOW()
        WHERE id = v_profile_id;
        
        -- Add to office staff
        INSERT INTO public.office_staff (office_id, profile_id, role, start_date)
        VALUES (p_office_id, v_profile_id, p_role, CURRENT_DATE)
        ON CONFLICT (office_id, profile_id) 
        DO UPDATE SET 
            role = EXCLUDED.role,
            start_date = EXCLUDED.start_date,
            updated_at = NOW();
            
        RETURN v_profile_id;
    ELSE
        RAISE EXCEPTION 'Profile not found for email: %', p_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: CREATE OFFICE MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to assign collector to office
CREATE OR REPLACE FUNCTION assign_collector_to_office(
    p_collector_id UUID,
    p_office_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update collector's office assignment
    UPDATE public.profiles 
    SET 
        office_id = p_office_id,
        updated_at = NOW()
    WHERE id = p_collector_id AND role = 'collector';
    
    -- Add collector to office staff if not already there
    INSERT INTO public.office_staff (office_id, profile_id, role, start_date)
    VALUES (p_office_id, p_collector_id, 'collector', CURRENT_DATE)
    ON CONFLICT (office_id, profile_id) 
    DO UPDATE SET 
        role = 'collector',
        updated_at = NOW();
        
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get office statistics
CREATE OR REPLACE FUNCTION get_office_stats(p_office_id UUID)
RETURNS TABLE(
    total_users INTEGER,
    total_collectors INTEGER,
    total_collections INTEGER,
    total_weight DECIMAL(10,2),
    active_areas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT p.id)::INTEGER as total_users,
        COUNT(DISTINCT CASE WHEN p.role = 'collector' THEN p.id END)::INTEGER as total_collectors,
        COUNT(DISTINCT cl.id)::INTEGER as total_collections,
        COALESCE(SUM(cl.total_weight_kg), 0.00) as total_weight,
        COUNT(DISTINCT ca.id)::INTEGER as active_areas
    FROM public.offices o
    LEFT JOIN public.profiles p ON o.id = p.office_id
    LEFT JOIN public.collection_areas ca ON o.id = ca.office_id AND ca.is_active = true
    LEFT JOIN public.collection_logs cl ON o.id = cl.office_id
    WHERE o.id = p_office_id
    GROUP BY o.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: INSERT SAMPLE OFFICE DATA
-- =====================================================

-- Insert default office if none exists
INSERT INTO public.offices (id, name, address, city, province, phone, email) VALUES
('00000000-0000-0000-0000-000000000001', 'WozaMali Main Office', '123 Main Street, Soweto', 'Soweto', 'Gauteng', '+27 11 123 4567', 'office@wozamali.com')
ON CONFLICT DO NOTHING;

-- Insert additional offices if they don't already exist
INSERT INTO public.offices (name, address, city, province, phone, email) VALUES
('WozaMali Soweto East', '456 East Street, Soweto', 'Soweto', 'Gauteng', '+27 11 123 4568', 'east@wozamali.com'),
('WozaMali Soweto West', '789 West Avenue, Soweto', 'Soweto', 'Gauteng', '+27 11 123 4569', 'west@wozamali.com'),
('WozaMali Johannesburg Central', '321 Central Road, Johannesburg', 'Johannesburg', 'Gauteng', '+27 11 123 4570', 'central@wozamali.com')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 6: CREATE OFFICE VIEWS
-- =====================================================

-- View for office dashboard
CREATE OR REPLACE VIEW office_dashboard AS
SELECT 
    o.id as office_id,
    o.name as office_name,
    o.city,
    o.province,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT CASE WHEN p.role = 'collector' THEN p.id END) as total_collectors,
    COUNT(DISTINCT ca.id) as total_areas,
    COUNT(DISTINCT cr.id) as total_routes,
    COUNT(DISTINCT cl.id) as total_collections_today,
    COALESCE(SUM(CASE WHEN cl.collection_date = CURRENT_DATE THEN cl.total_weight_kg ELSE 0 END), 0.00) as weight_today
FROM public.offices o
LEFT JOIN public.profiles p ON o.id = p.office_id
LEFT JOIN public.collection_areas ca ON o.id = ca.office_id AND ca.is_active = true
LEFT JOIN public.collection_routes cr ON o.id = cr.office_id AND cr.is_active = true
LEFT JOIN public.collection_logs cl ON o.id = cl.office_id AND cl.collection_date = CURRENT_DATE
WHERE o.is_active = true
GROUP BY o.id, o.name, o.city, o.province;

-- View for office staff
CREATE OR REPLACE VIEW office_staff_view AS
SELECT 
    os.id,
    os.office_id,
    o.name as office_name,
    p.id as profile_id,
    p.full_name,
    p.email,
    p.phone,
    os.role as staff_role,
    os.start_date,
    os.end_date,
    os.is_active,
    p.status as profile_status
FROM public.office_staff os
JOIN public.offices o ON os.office_id = o.id
JOIN public.profiles p ON os.profile_id = p.id
WHERE os.is_active = true AND p.status = 'active';

-- =====================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_routes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 8: CREATE RLS POLICIES
-- =====================================================

-- Offices policies
CREATE POLICY "Anyone can view active offices" ON public.offices
    FOR SELECT USING (is_active = true);

CREATE POLICY "Office managers can manage their office" ON public.offices
    FOR ALL USING (
        manager_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Office staff policies
CREATE POLICY "Office staff can view staff in their office" ON public.office_staff
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.office_staff 
            WHERE profile_id = auth.uid() 
            AND office_id = office_staff.office_id
        )
    );

-- Collection areas policies
CREATE POLICY "Anyone can view collection areas" ON public.collection_areas
    FOR SELECT USING (true);

CREATE POLICY "Office staff can manage areas in their office" ON public.collection_areas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.office_staff 
            WHERE profile_id = auth.uid() 
            AND office_id = collection_areas.office_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Collection logs policies
CREATE POLICY "Collectors can view their logs" ON public.collection_logs
    FOR SELECT USING (collector_id = auth.uid());

CREATE POLICY "Office staff can view logs in their office" ON public.collection_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.office_staff 
            WHERE profile_id = auth.uid() 
            AND office_id = collection_logs.office_id
        )
    );

-- =====================================================
-- STEP 9: VERIFICATION QUERIES
-- =====================================================

-- Verify office setup
SELECT 
    'Office setup complete' as status,
    COUNT(*) as total_offices,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_offices
FROM public.offices;

-- Show office staff distribution
SELECT 
    o.name as office_name,
    os.role as staff_role,
    COUNT(*) as staff_count
FROM public.offices o
JOIN public.office_staff os ON o.id = os.office_id
WHERE os.is_active = true
GROUP BY o.name, os.role
ORDER BY o.name, os.role;

-- Show office collection areas
SELECT 
    o.name as office_name,
    COUNT(ca.id) as total_areas,
    COUNT(CASE WHEN ca.is_active = true THEN 1 END) as active_areas
FROM public.offices o
LEFT JOIN public.collection_areas ca ON o.id = ca.office_id
GROUP BY o.id, o.name
ORDER BY o.name;

-- =====================================================
-- STEP 10: COMPLETION NOTICE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Office role setup complete! You can now create office users and manage collections by office.';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create office users using create_office_user() function';
    RAISE NOTICE '2. Assign collectors to offices using assign_collector_to_office() function';
    RAISE NOTICE '3. Create collection areas for each office';
    RAISE NOTICE '4. Set up collection routes and schedules';
END $$;
