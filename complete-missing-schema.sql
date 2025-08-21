-- =====================================================
-- COMPLETE MISSING SCHEMA PARTS
-- This script completes the missing parts without dropping existing tables
-- Run this to finish your schema installation
-- =====================================================

-- =====================================================
-- STEP 1: CHECK WHAT'S MISSING
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Checking what tables exist and what is missing...';
    
    -- Check main tables
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offices') THEN
        RAISE NOTICE 'Missing: offices table';
    ELSE
        RAISE NOTICE 'Exists: offices table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'office_zones') THEN
        RAISE NOTICE 'Missing: office_zones table';
    ELSE
        RAISE NOTICE 'Exists: office_zones table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'office_staff') THEN
        RAISE NOTICE 'Missing: office_staff table';
    ELSE
        RAISE NOTICE 'Exists: office_staff table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_logs') THEN
        RAISE NOTICE 'Missing: collection_logs table';
    ELSE
        RAISE NOTICE 'Exists: collection_logs table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_routes') THEN
        RAISE NOTICE 'Missing: collection_routes table';
    ELSE
        RAISE NOTICE 'Exists: collection_routes table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_schedules') THEN
        RAISE NOTICE 'Missing: collection_schedules table';
    ELSE
        RAISE NOTICE 'Exists: collection_schedules table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'household_collections') THEN
        RAISE NOTICE 'Missing: household_collections table';
    ELSE
        RAISE NOTICE 'Exists: household_collections table';
    END IF;
END $$;

-- =====================================================
-- STEP 2: CREATE MISSING OFFICE TABLES
-- =====================================================

-- Create offices table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.offices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Soweto',
    province TEXT NOT NULL DEFAULT 'Gauteng',
    phone TEXT,
    email TEXT,
    manager_id UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create office_zones table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.office_zones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    boundaries JSONB, -- GeoJSON or custom boundary data
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create office_staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.office_staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'staff', 'supervisor')),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(office_id, profile_id)
);

-- =====================================================
-- STEP 3: CREATE MISSING COLLECTION TABLES
-- =====================================================

-- Create collection_schedules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.collection_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    area_id UUID REFERENCES public.collection_areas(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.profiles(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
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

-- Create collection_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.collection_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collector_id UUID REFERENCES public.profiles(id),
    office_id UUID REFERENCES public.offices(id),
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

-- Create household_collections table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.household_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_log_id UUID REFERENCES public.collection_logs(id) ON DELETE CASCADE,
    household_id UUID REFERENCES public.profiles(id),
    collection_date DATE NOT NULL,
    weight_kg DECIMAL(6,2) NOT NULL,
    items_collected TEXT[],
    payment_amount DECIMAL(8,2) DEFAULT 0.00,
    payment_method TEXT DEFAULT 'points',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add office_id to collection_areas if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collection_areas' AND column_name = 'office_id'
    ) THEN
        ALTER TABLE public.collection_areas ADD COLUMN office_id UUID REFERENCES public.offices(id);
        RAISE NOTICE 'Added office_id column to collection_areas';
    END IF;
END $$;

-- Add office_id to wallets if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'office_id'
    ) THEN
        ALTER TABLE public.wallets ADD COLUMN office_id UUID REFERENCES public.offices(id);
        RAISE NOTICE 'Added office_id column to wallets';
    END IF;
END $$;

-- Add role column to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'office', 'collector', 'manager', 'user', 'member', 'recycler'));
        RAISE NOTICE 'Added role column to profiles';
    END IF;
END $$;

-- Add office_id to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'office_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN office_id UUID REFERENCES public.offices(id);
        RAISE NOTICE 'Added office_id column to profiles';
    END IF;
END $$;

-- =====================================================
-- STEP 5: CREATE INDEXES
-- =====================================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_office_id ON public.profiles(office_id);
CREATE INDEX IF NOT EXISTS idx_offices_city ON public.offices(city);
CREATE INDEX IF NOT EXISTS idx_collection_areas_office_id ON public.collection_areas(office_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_collector_id ON public.collection_schedules(collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_routes_office_id ON public.collection_routes(office_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_collector_id ON public.collection_logs(collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_office_id ON public.collection_logs(office_id);
CREATE INDEX IF NOT EXISTS idx_wallets_office_id ON public.wallets(office_id);

-- =====================================================
-- STEP 6: INSERT DEFAULT OFFICE
-- =====================================================

-- Insert default office if none exists
INSERT INTO public.offices (id, name, address, city, province, phone, email)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'WozaMali Main Office',
    '123 Main Street, Soweto',
    'Soweto',
    'Gauteng',
    '+27 11 123 4567',
    'office@wozamali.com'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_collections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 8: VERIFICATION
-- =====================================================

-- Verify all tables now exist
SELECT 
    'Schema completion status' as info,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'offices', 'office_zones', 'office_staff',
    'collection_areas', 'collection_schedules', 'collection_routes',
    'collection_logs', 'household_collections', 'wallets'
);

-- Show what was created
SELECT 
    'Tables created' as info,
    table_name,
    CASE WHEN table_name IN ('offices', 'office_zones', 'office_staff', 'collection_schedules', 'collection_routes', 'collection_logs', 'household_collections') 
         THEN 'New' 
         ELSE 'Existing' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'offices', 'office_zones', 'office_staff',
    'collection_areas', 'collection_schedules', 'collection_routes',
    'collection_logs', 'household_collections', 'wallets'
)
ORDER BY table_name;

DO $$ 
BEGIN
    RAISE NOTICE 'Schema completion finished! You can now run the office-role-setup-fixed.sql script.';
END $$;
