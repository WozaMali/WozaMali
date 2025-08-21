-- =====================================================
-- WOZAMALI COMPLETE SCHEMA DUMP AND REINSTALL
-- This script will:
-- 1. Dump current data (if any)
-- 2. Drop existing schemas
-- 3. Reinstall with Office and Collector roles
-- 4. Set up proper RLS policies
-- =====================================================

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA (if any)
-- =====================================================

-- Create backup tables for existing data
DO $$ 
BEGIN
    -- Backup profiles if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Create backup with only existing columns
        EXECUTE format('CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT %s FROM public.profiles', 
            (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) 
             FROM information_schema.columns 
             WHERE table_name = 'profiles' AND table_schema = 'public'));
        RAISE NOTICE 'Profiles backed up to profiles_backup table';
    END IF;
    
    -- Backup wallets if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') THEN
        -- Create backup with only existing columns
        EXECUTE format('CREATE TABLE IF NOT EXISTS wallets_backup AS SELECT %s FROM public.wallets', 
            (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) 
             FROM information_schema.columns 
             WHERE table_name = 'wallets' AND table_schema = 'public'));
        RAISE NOTICE 'Wallets backed up to wallets_backup table';
    END IF;
    
    -- Backup collection areas if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_areas') THEN
        -- Create backup with only existing columns
        EXECUTE format('CREATE TABLE IF NOT EXISTS collection_areas_backup AS SELECT %s FROM public.collection_areas', 
            (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) 
             FROM information_schema.columns 
             WHERE table_name = 'collection_areas' AND table_schema = 'public'));
        RAISE NOTICE 'Collection areas backed up to collection_areas_backup table';
    END IF;
    
    -- Backup other collection tables if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_schedules') THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS collection_schedules_backup AS SELECT %s FROM public.collection_schedules', 
            (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) 
             FROM information_schema.columns 
             WHERE table_name = 'collection_schedules' AND table_schema = 'public'));
        RAISE NOTICE 'Collection schedules backed up to collection_schedules_backup table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_routes') THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS collection_routes_backup AS SELECT %s FROM public.collection_routes', 
            (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) 
             FROM information_schema.columns 
             WHERE table_name = 'collection_routes' AND table_schema = 'public'));
        RAISE NOTICE 'Collection routes backed up to collection_routes_backup table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_logs') THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS collection_logs_backup AS SELECT %s FROM public.collection_logs', 
            (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) 
             FROM information_schema.columns 
             WHERE table_name = 'collection_logs' AND table_schema = 'public'));
        RAISE NOTICE 'Collection logs backed up to collection_logs_backup table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'household_collections') THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS household_collections_backup AS SELECT %s FROM public.household_collections', 
            (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) 
             FROM information_schema.columns 
             WHERE table_name = 'household_collections' AND table_schema = 'public'));
        RAISE NOTICE 'Household collections backed up to household_collections_backup table';
    END IF;
END $$;

-- =====================================================
-- STEP 2: DROP EXISTING SCHEMAS AND TABLES
-- =====================================================

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS public.household_collections CASCADE;
DROP TABLE IF EXISTS public.collection_logs CASCADE;
DROP TABLE IF EXISTS public.collection_routes CASCADE;
DROP TABLE IF EXISTS public.collection_schedules CASCADE;
DROP TABLE IF EXISTS public.collection_areas CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.user_activity_log CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop extensions (will recreate)
DROP EXTENSION IF EXISTS "pg_cron";

-- =====================================================
-- STEP 3: REINSTALL EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =====================================================
-- STEP 4: CREATE ENHANCED PROFILES TABLE WITH OFFICE ROLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    street_address TEXT,
    suburb TEXT,
    ext_zone_phase TEXT,
    city TEXT DEFAULT 'Soweto',
    postal_code TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'office', 'collector', 'manager', 'user', 'member', 'recycler')),
    office_id UUID, -- Reference to office for office users
    collector_id UUID, -- Reference to collector profile for collector users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: CREATE OFFICE MANAGEMENT TABLES
-- =====================================================

-- Offices table for managing different office locations
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

-- Office zones for better area management
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

-- Office staff assignments
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
-- STEP 6: CREATE ENHANCED COLLECTOR TABLES
-- =====================================================

-- Collection areas with office association
CREATE TABLE IF NOT EXISTS public.collection_areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    office_id UUID REFERENCES public.offices(id),
    township_id UUID, -- Can be null if not using townships
    ext_zone_phase TEXT,
    city TEXT NOT NULL DEFAULT 'Soweto',
    province TEXT NOT NULL DEFAULT 'Gauteng',
    boundaries JSONB, -- GeoJSON boundaries
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection schedules with enhanced tracking
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

-- Collection routes with office management
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

-- Enhanced collection logs
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

-- Household collections
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
-- STEP 7: CREATE CORE SYSTEM TABLES
-- =====================================================

-- Wallets with office association
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) UNIQUE NOT NULL,
    office_id UUID REFERENCES public.offices(id),
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'Gold Recycler',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- User sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity log
CREATE TABLE IF NOT EXISTS public.user_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    office_id UUID REFERENCES public.offices(id),
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email logs
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_name TEXT,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB
);

-- =====================================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_office_id ON public.profiles(office_id);
CREATE INDEX IF NOT EXISTS idx_profiles_collector_id ON public.profiles(collector_id);

-- Office indexes
CREATE INDEX IF NOT EXISTS idx_offices_city ON public.offices(city);
CREATE INDEX IF NOT EXISTS idx_offices_manager_id ON public.offices(manager_id);

-- Collection indexes
CREATE INDEX IF NOT EXISTS idx_collection_areas_office_id ON public.collection_areas(office_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_collector_id ON public.collection_schedules(collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_routes_office_id ON public.collection_routes(office_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_collector_id ON public.collection_logs(collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_office_id ON public.collection_logs(office_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_collection_date ON public.collection_logs(collection_date);

-- Wallet indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_office_id ON public.wallets(office_id);

-- =====================================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 10: CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Office users can view profiles in their office" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.office_staff 
            WHERE profile_id = auth.uid() 
            AND office_id = profiles.office_id
        )
    );

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

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

-- Collection schedules policies
CREATE POLICY "Collectors can view their schedules" ON public.collection_schedules
    FOR SELECT USING (
        collector_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.office_staff os
            JOIN public.collection_areas ca ON os.office_id = ca.office_id
            WHERE os.profile_id = auth.uid() 
            AND ca.id = collection_schedules.area_id
        )
    );

CREATE POLICY "Office staff can manage schedules in their office" ON public.collection_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.office_staff os
            JOIN public.collection_areas ca ON os.office_id = ca.office_id
            WHERE os.profile_id = auth.uid() 
            AND ca.id = collection_schedules.area_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Collection logs policies
CREATE POLICY "Collectors can view their logs" ON public.collection_logs
    FOR SELECT USING (collector_id = auth.uid());

CREATE POLICY "Collectors can create logs" ON public.collection_logs
    FOR INSERT WITH CHECK (collector_id = auth.uid());

CREATE POLICY "Collectors can update their logs" ON public.collection_logs
    FOR UPDATE USING (collector_id = auth.uid());

CREATE POLICY "Office staff can view logs in their office" ON public.collection_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.office_staff 
            WHERE profile_id = auth.uid() 
            AND office_id = collection_logs.office_id
        )
    );

-- Wallets policies
CREATE POLICY "Users can view their own wallet" ON public.wallets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Office staff can view wallets in their office" ON public.wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.office_staff 
            WHERE profile_id = auth.uid() 
            AND office_id = wallets.office_id
        )
    );

-- =====================================================
-- STEP 11: CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offices_updated_at BEFORE UPDATE ON public.offices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_office_zones_updated_at BEFORE UPDATE ON public.office_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collection_areas_updated_at BEFORE UPDATE ON public.collection_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collection_schedules_updated_at BEFORE UPDATE ON public.collection_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collection_routes_updated_at BEFORE UPDATE ON public.collection_routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collection_logs_updated_at BEFORE UPDATE ON public.collection_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 12: INSERT DEFAULT DATA
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
-- STEP 13: RESTORE BACKUP DATA (if exists)
-- =====================================================

-- Restore profiles data with role mapping
DO $$ 
DECLARE
    v_select_columns TEXT;
    v_insert_columns TEXT;
    v_row_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_backup') THEN
        -- Build dynamic column lists
        v_insert_columns := 'id, email, full_name, phone, street_address, suburb, ext_zone_phase, city, postal_code, avatar_url, email_verified, phone_verified, last_login, login_count, status, role, office_id, created_at, updated_at';
        
        -- Build SELECT statement with COALESCE for missing columns
        v_select_columns := 'id, email, full_name, phone, street_address, suburb, ';
        
        -- Add ext_zone_phase if it exists, otherwise use NULL
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles_backup' AND column_name = 'ext_zone_phase'
        ) THEN
            v_select_columns := v_select_columns || 'ext_zone_phase, ';
        ELSE
            v_select_columns := v_select_columns || 'NULL as ext_zone_phase, ';
        END IF;
        
        v_select_columns := v_select_columns || 'COALESCE(city, ''Soweto'') as city, postal_code, ';
        
        -- Add avatar_url if it exists, otherwise use NULL
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles_backup' AND column_name = 'avatar_url'
        ) THEN
            v_select_columns := v_select_columns || 'avatar_url, ';
        ELSE
            v_select_columns := v_select_columns || 'NULL as avatar_url, ';
        END IF;
        
        -- Add other optional columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles_backup' AND column_name = 'email_verified'
        ) THEN
            v_select_columns := v_select_columns || 'email_verified, ';
        ELSE
            v_select_columns := v_select_columns || 'FALSE as email_verified, ';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles_backup' AND column_name = 'phone_verified'
        ) THEN
            v_select_columns := v_select_columns || 'phone_verified, ';
        ELSE
            v_select_columns := v_select_columns || 'FALSE as phone_verified, ';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles_backup' AND column_name = 'last_login'
        ) THEN
            v_select_columns := v_select_columns || 'last_login, ';
        ELSE
            v_select_columns := v_select_columns || 'NULL as last_login, ';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles_backup' AND column_name = 'login_count'
        ) THEN
            v_select_columns := v_select_columns || 'login_count, ';
        ELSE
            v_select_columns := v_select_columns || '0 as login_count, ';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles_backup' AND column_name = 'status'
        ) THEN
            v_select_columns := v_select_columns || 'status, ';
        ELSE
            v_select_columns := v_select_columns || '''active'' as status, ';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles_backup' AND column_name = 'role'
        ) THEN
            v_select_columns := v_select_columns || 'CASE WHEN role = ''collector'' THEN ''collector'' WHEN role = ''admin'' THEN ''admin'' ELSE ''member'' END as role, ';
        ELSE
            v_select_columns := v_select_columns || '''member'' as role, ';
        END IF;
        
        v_select_columns := v_select_columns || '''00000000-0000-0000-0000-000000000001'' as office_id, created_at, updated_at';
        
        -- Execute dynamic INSERT with auth.users check
        EXECUTE format('
            INSERT INTO public.profiles (%s)
            SELECT %s
            FROM profiles_backup pb
            WHERE EXISTS (
                SELECT 1 FROM auth.users u 
                WHERE u.id = pb.id
            )
        ', v_insert_columns, v_select_columns);
        
        -- Log how many profiles were restored
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        RAISE NOTICE 'Restored % profiles from backup (skipped profiles without auth.users)', v_row_count;
        
        RAISE NOTICE 'Profiles restored from backup with dynamic column handling';
    END IF;
    
    -- Restore wallets data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets_backup') THEN
        INSERT INTO public.wallets (id, user_id, office_id, balance, total_points, tier, created_at, updated_at)
        SELECT 
            id, user_id, '00000000-0000-0000-0000-0000-000000000001', -- Default office
            balance, total_points, tier, created_at, updated_at
        FROM wallets_backup;
        
        RAISE NOTICE 'Wallets restored from backup';
    END IF;
    
    -- Restore collection data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_areas_backup') THEN
        -- Check if ext_zone_phase exists in backup
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'collection_areas_backup' AND column_name = 'ext_zone_phase'
        ) THEN
            INSERT INTO public.collection_areas (id, name, office_id, ext_zone_phase, city, province, is_active, created_at, updated_at)
            SELECT 
                id, name, '00000000-0000-0000-0000-0000-0000-000000000001', -- Default office
                ext_zone_phase, city, province, is_active, created_at, updated_at
            FROM collection_areas_backup;
        ELSE
            INSERT INTO public.collection_areas (id, name, office_id, city, province, is_active, created_at, updated_at)
            SELECT 
                id, name, '00000000-0000-0000-0000-0000-0000-000000000001', -- Default office
                city, province, is_active, created_at, updated_at
            FROM collection_areas_backup;
        END IF;
        
        RAISE NOTICE 'Collection areas restored from backup';
    END IF;
    
    -- Restore other collection tables as needed
    -- (Add similar restore logic for other tables)
    
END $$;

-- =====================================================
-- STEP 14: VERIFICATION AND CLEANUP
-- =====================================================

-- Verify the installation
SELECT 
    'Schema installation complete' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'offices', 'office_zones', 'office_staff',
    'collection_areas', 'collection_schedules', 'collection_routes',
    'collection_logs', 'household_collections', 'wallets'
);

-- Show role distribution
SELECT 
    role,
    COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY count DESC;

-- Show office assignments
SELECT 
    o.name as office_name,
    COUNT(p.id) as user_count
FROM public.offices o
LEFT JOIN public.profiles p ON o.id = p.office_id
GROUP BY o.id, o.name
ORDER BY user_count DESC;

-- Clean up backup tables (optional - uncomment if you want to remove them)
-- DROP TABLE IF EXISTS profiles_backup;
-- DROP TABLE IF EXISTS wallets_backup;
-- DROP TABLE IF EXISTS collection_areas_backup;
-- DROP TABLE IF EXISTS collection_schedules_backup;
-- DROP TABLE IF EXISTS collection_routes_backup;
-- DROP TABLE IF EXISTS collection_logs_backup;
-- DROP TABLE IF EXISTS household_collections_backup;

DO $$ 
BEGIN
    RAISE NOTICE 'WozaMali schema installation complete with Office and Collector roles!';
END $$;
