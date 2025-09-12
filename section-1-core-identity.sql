-- ============================================================================
-- SECTION 1: CORE IDENTITY LAYER
-- ============================================================================
-- This creates the foundation that ALL THREE APPS will use
-- Main App, Collector App, and Office App all drink from this same cup!

-- ============================================================================
-- 1. ROLES TABLE
-- ============================================================================
-- Defines user roles across all apps
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g. 'resident', 'collector', 'office'
    description TEXT,
    permissions JSONB DEFAULT '{}', -- Store role permissions for different apps
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. AREAS TABLE
-- ============================================================================
-- Geographic areas for collection management with Soweto townships
CREATE TABLE public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g. 'Dobsonville', 'Orlando East'
    description TEXT,
    city TEXT NOT NULL DEFAULT 'Soweto',
    province TEXT DEFAULT 'Gauteng',
    postal_code TEXT NOT NULL, -- e.g. '1863', '1804'
    subdivisions JSONB, -- Array of subdivisions like ["Ext 1", "Ext 2", "Zone 1"]
    boundaries JSONB, -- GeoJSON for area boundaries (future use)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. USERS TABLE
-- ============================================================================
-- This is the CORE table that ALL THREE APPS use
-- Links directly to Supabase Auth users via the same UUID
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Name fields for signup form (nullable for existing users)
    first_name TEXT, -- Made nullable for existing users
    last_name TEXT, -- Made nullable for existing users
    full_name TEXT, -- Made nullable for existing users
    -- Date of birth for age verification
    date_of_birth DATE,
    -- Contact info
    phone TEXT,
    email TEXT UNIQUE,
    -- Role and area assignment
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
    -- Address fields for signup form (nullable for existing users)
    street_addr TEXT,
    township_id UUID REFERENCES public.areas(id) ON DELETE SET NULL, -- Selected township
    subdivision TEXT, -- Selected subdivision from township
    city TEXT DEFAULT 'Soweto', -- Auto-filled
    postal_code TEXT, -- Auto-filled from township
    -- Legacy fields for existing users
    suburb TEXT, -- Keep for existing users
    -- System fields
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================
-- These indexes will make all three apps fast

-- User lookup indexes
CREATE INDEX idx_users_role ON public.users(role_id);
CREATE INDEX idx_users_area ON public.users(area_id);
CREATE INDEX idx_users_township ON public.users(township_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_address ON public.users(street_addr);
CREATE INDEX idx_users_name ON public.users(first_name, last_name);

-- Area lookup indexes
CREATE INDEX idx_areas_city ON public.areas(city);
CREATE INDEX idx_areas_active ON public.areas(is_active) WHERE is_active = TRUE;

-- Role lookup indexes
CREATE INDEX idx_roles_name ON public.roles(name);
CREATE INDEX idx_roles_active ON public.roles(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- These policies ensure all three apps can access the data they need

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Roles policies - All authenticated users can read roles
CREATE POLICY "Anyone can view roles" ON public.roles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage roles" ON public.roles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'admin')
        )
    );

-- Areas policies - All authenticated users can read areas
CREATE POLICY "Anyone can view areas" ON public.areas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage areas" ON public.areas
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'admin')
        )
    );

-- Users policies - Complex but necessary for all three apps
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Collectors can view users in their area" ON public.users
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'collector')
            AND area_id = (SELECT area_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Admin can view all users" ON public.users
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'admin')
        )
    );

CREATE POLICY "Admin can manage all users" ON public.users
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'admin')
        )
    );

-- ============================================================================
-- 6. SEED DATA
-- ============================================================================
-- Insert default roles that all three apps will use

INSERT INTO public.roles (name, description, permissions) VALUES
('resident', 'Main App users - Registered household or individual for collections', 
 '{"can_request_collections": true, "can_view_own_data": true, "can_withdraw_money": true}'),
('collector', 'Collector App users - Performs waste collections in assigned area', 
 '{"can_view_assigned_pickups": true, "can_update_pickup_status": true, "can_view_customer_data": true}'),
('admin', 'Office App users - Manages approvals, wallets, and reporting', 
 '{"can_manage_all_users": true, "can_manage_collections": true, "can_view_analytics": true, "can_manage_finances": true}');

-- Insert complete Soweto areas with postal codes and subdivisions
INSERT INTO public.areas (name, description, city, postal_code, subdivisions) VALUES
('Braamfischerville', 'Braamfischerville township with Phase 1-4', 'Soweto', '1863', '["Phase 1", "Phase 2", "Phase 3", "Phase 4"]'),
('Chiawelo', 'Chiawelo township with Ext 3, Ext 4, Ext 5', 'Soweto', '1818', '["Ext 3", "Ext 4", "Ext 5"]'),
('Diepkloof', 'Diepkloof township with Zone 1–6, Ext 1–10', 'Soweto', '1862', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5", "Ext 6", "Ext 7", "Ext 8", "Ext 9", "Ext 10"]'),
('Dobsonville', 'Dobsonville township with Old Dobsonville, Ext 1-5, Ext 7', 'Soweto', '1863', '["Old Dobsonville", "Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5", "Ext 7"]'),
('Doornkop', 'Doornkop township with Block 1–12', 'Soweto', '1874', '["Block 1", "Block 2", "Block 3", "Block 4", "Block 5", "Block 6", "Block 7", "Block 8", "Block 9", "Block 10", "Block 11", "Block 12"]'),
('Dube', 'Dube township with Zone 1–9', 'Soweto', '1801', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9"]'),
('Eldorado Park', 'Eldorado Park with Ext 1–10', 'Soweto', '1811', '["Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5", "Ext 6", "Ext 7", "Ext 8", "Ext 9", "Ext 10"]'),
('Greenvillage', 'Greenvillage with Ext 1–3', 'Soweto', '1818', '["Ext 1", "Ext 2", "Ext 3"]'),
('Jabavu', 'Jabavu township with Zone 1–4', 'Soweto', '1809', '["Zone 1", "Zone 2", "Zone 3", "Zone 4"]'),
('Jabulani', 'Jabulani township with Zone 1–9', 'Soweto', '1868', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9"]'),
('Mapetla', 'Mapetla with Ext 1–2', 'Soweto', '1818', '["Ext 1", "Ext 2"]'),
('Meadowlands', 'Meadowlands township with Zone 1–12', 'Soweto', '1852', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9", "Zone 10", "Zone 11", "Zone 12"]'),
('Mmesi Park', 'Mmesi Park township', 'Soweto', '1863', '[]'),
('Mofolo', 'Mofolo township with North, Central, South', 'Soweto', '1801', '["North", "Central", "South"]'),
('Molapo', 'Molapo township with Zone 1–4', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3", "Zone 4"]'),
('Moroka', 'Moroka township with North, South', 'Soweto', '1818', '["North", "South"]'),
('Naledi', 'Naledi township with Ext 1–4', 'Soweto', '1861', '["Ext 1", "Ext 2", "Ext 3", "Ext 4"]'),
('Orlando East', 'Orlando East township with Zone 1–7', 'Soweto', '1804', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7"]'),
('Orlando West', 'Orlando West township with Zone 1–6, Ext 1–5', 'Soweto', '1804', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5"]'),
('Phiri', 'Phiri township with Zone 1–3', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3"]'),
('Pimville', 'Pimville township with Zone 1–9, Ext 1–5', 'Soweto', '1809', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9", "Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5"]'),
('Protea Glen', 'Protea Glen township with Ext 1–31', 'Soweto', '1819', '["Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5", "Ext 6", "Ext 7", "Ext 8", "Ext 9", "Ext 10", "Ext 11", "Ext 12", "Ext 13", "Ext 14", "Ext 15", "Ext 16", "Ext 17", "Ext 18", "Ext 19", "Ext 20", "Ext 21", "Ext 22", "Ext 23", "Ext 24", "Ext 25", "Ext 26", "Ext 27", "Ext 28", "Ext 29", "Ext 30", "Ext 31"]'),
('Protea North', 'Protea North township with Ext 1–4', 'Soweto', '1818', '["Ext 1", "Ext 2", "Ext 3", "Ext 4"]'),
('Protea South', 'Protea South township with Ext 1–4', 'Soweto', '1818', '["Ext 1", "Ext 2", "Ext 3", "Ext 4"]'),
('Senaoane', 'Senaoane township with Zone 1–4', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3", "Zone 4"]'),
('Thulani', 'Thulani township with Ext 1–3', 'Soweto', '1874', '["Ext 1", "Ext 2", "Ext 3"]'),
('Tladi', 'Tladi township with Zone 1–3', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3"]'),
('Zola', 'Zola township with Zone 1–6', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6"]'),
('Zondi', 'Zondi township with Zone 1–5', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"]');

-- ============================================================================
-- 7. HELPFUL VIEWS FOR ADDRESS DROPDOWNS
-- ============================================================================
-- Create views that all three apps can use for address selection

-- View for township dropdown (Main App)
CREATE VIEW public.township_dropdown AS
SELECT 
    id,
    name as township_name,
    postal_code,
    city,
    subdivisions
FROM public.areas 
WHERE is_active = TRUE 
ORDER BY name;

-- View for subdivision dropdown (Main App)
CREATE VIEW public.subdivision_dropdown AS
SELECT 
    a.id as area_id,
    a.name as township_name,
    a.postal_code,
    subdivision
FROM public.areas a,
     jsonb_array_elements_text(a.subdivisions) as subdivision
WHERE a.is_active = TRUE 
ORDER BY a.name, subdivision;

-- View for all residents (Collector and Office Apps)
CREATE VIEW public.residents_view AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.full_name,
    u.email,
    u.phone,
    u.date_of_birth,
    u.street_addr,
    u.township_id,
    a_township.name as township_name,
    u.subdivision,
    u.suburb, -- Legacy field for existing users
    u.city,
    u.postal_code,
    u.status,
    u.created_at,
    u.updated_at,
    -- Address completeness indicator
    CASE 
        WHEN u.township_id IS NOT NULL AND u.subdivision IS NOT NULL THEN 'complete'
        WHEN u.suburb IS NOT NULL THEN 'legacy'
        ELSE 'incomplete'
    END as address_status
FROM public.users u
LEFT JOIN public.areas a_township ON u.township_id = a_township.id
WHERE u.role_id = (SELECT id FROM public.roles WHERE name = 'resident')
ORDER BY u.created_at DESC;

-- View for collectors to see residents in their area
CREATE VIEW public.collector_residents AS
SELECT 
    r.*,
    c.area_id as collector_area_id,
    a_collector.name as collector_area_name
FROM public.residents_view r
CROSS JOIN public.users c
LEFT JOIN public.areas a_collector ON c.area_id = a_collector.id
WHERE c.id = auth.uid() 
AND c.role_id = (SELECT id FROM public.roles WHERE name = 'collector')
AND (r.township_id = c.area_id OR r.suburb = a_collector.name);

-- ============================================================================
-- 8. MIGRATE EXISTING USERS
-- ============================================================================
-- Handle existing users from old schema

-- First, let's check if there are existing users to migrate
-- This will be run after the schema is created

-- Function to migrate existing users
CREATE OR REPLACE FUNCTION migrate_existing_users()
RETURNS TEXT AS $$
DECLARE
    user_count INTEGER;
    migrated_count INTEGER := 0;
BEGIN
    -- Check if there are existing users in the old profiles table
    SELECT COUNT(*) INTO user_count 
    FROM information_schema.tables 
    WHERE table_name = 'profiles' AND table_schema = 'public';
    
    IF user_count > 0 THEN
        -- Migrate existing users from profiles table
        INSERT INTO public.users (
            id, 
            full_name, 
            email, 
            phone,
            role_id,
            street_addr,
            suburb,
            city,
            postal_code,
            status,
            created_at,
            updated_at
        )
        SELECT 
            p.id,
            p.full_name,
            p.email,
            p.phone,
            (SELECT id FROM public.roles WHERE name = 'resident'), -- Default to resident
            p.street_addr,
            p.suburb,
            COALESCE(p.city, 'Soweto'),
            p.postal_code,
            'active',
            p.created_at,
            p.updated_at
        FROM public.profiles p
        WHERE p.id NOT IN (SELECT id FROM public.users)
        ON CONFLICT (id) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
    END IF;
    
    RETURN 'Migrated ' || migrated_count || ' existing users';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. INITIAL USERS
-- ============================================================================
-- Add initial users for testing (these will need to be created in Supabase Auth first)

-- Note: These users need to be created in Supabase Auth first with these exact emails
-- Then their UUIDs will be used here

-- Dumi Mngqi - Collector
-- INSERT INTO public.users (id, first_name, last_name, email, role_id, area_id, township_id, street_addr, subdivision, city, postal_code)
-- VALUES (
--     'dumi-auth-uuid-here', -- Replace with actual UUID from Supabase Auth
--     'Dumi',
--     'Mngqi',
--     'dumi@wozamali.co.za',
--     (SELECT id FROM public.roles WHERE name = 'collector'),
--     (SELECT id FROM public.areas WHERE name = 'Dobsonville'),
--     (SELECT id FROM public.areas WHERE name = 'Dobsonville'),
--     '123 Main Street',
--     'Ext 1',
--     'Soweto',
--     '1863'
-- );

-- Admin Woza - Admin
-- INSERT INTO public.users (id, first_name, last_name, email, role_id, area_id, township_id, street_addr, subdivision, city, postal_code)
-- VALUES (
--     'admin-auth-uuid-here', -- Replace with actual UUID from Supabase Auth
--     'Admin',
--     'Woza',
--     'admin@wozamali.com',
--     (SELECT id FROM public.roles WHERE name = 'admin'),
--     (SELECT id FROM public.areas WHERE name = 'Dobsonville'),
--     (SELECT id FROM public.areas WHERE name = 'Dobsonville'),
--     '456 Admin Street',
--     'Ext 2',
--     'Soweto',
--     '1863'
-- );

-- ============================================================================
-- 9. VERIFICATION
-- ============================================================================
-- Test that the foundation is working

-- Check tables were created
SELECT 
    'Section 1 Tables Created' as info,
    tablename,
    'Ready for all three apps' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('roles', 'areas', 'users')
ORDER BY tablename;

-- Check RLS is enabled
SELECT 
    'RLS Status' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('roles', 'areas', 'users')
ORDER BY tablename;

-- Check seed data
SELECT 
    'Roles Created' as info,
    name,
    description
FROM public.roles
ORDER BY name;

SELECT 
    'Areas Created' as info,
    name,
    city
FROM public.areas
ORDER BY name;

-- Migrate existing users
SELECT migrate_existing_users() as migration_result;

-- Show all residents (including existing ones with incomplete addresses)
SELECT 
    'All Residents' as info,
    COUNT(*) as total_residents,
    COUNT(CASE WHEN address_status = 'complete' THEN 1 END) as complete_addresses,
    COUNT(CASE WHEN address_status = 'legacy' THEN 1 END) as legacy_addresses,
    COUNT(CASE WHEN address_status = 'incomplete' THEN 1 END) as incomplete_addresses
FROM public.residents_view;

-- Test basic access
SELECT 
    'Access Test' as info,
    'Can read roles' as test,
    COUNT(*) as count
FROM public.roles
UNION ALL
SELECT 
    'Access Test' as info,
    'Can read areas' as test,
    COUNT(*) as count
FROM public.areas
UNION ALL
SELECT 
    'Access Test' as info,
    'Can read users' as test,
    COUNT(*) as count
FROM public.users;

-- Test township dropdown functionality
SELECT 
    'Township Dropdown Test' as info,
    township_name,
    postal_code,
    city
FROM public.township_dropdown 
LIMIT 5;

-- Test subdivision dropdown functionality
SELECT 
    'Subdivision Dropdown Test' as info,
    township_name,
    subdivision,
    postal_code
FROM public.subdivision_dropdown 
WHERE township_name = 'Dobsonville'
LIMIT 5;

-- ============================================================================
-- 8. SUCCESS MESSAGE
-- ============================================================================

SELECT 
    '🎉 SECTION 1 COMPLETE - CORE IDENTITY LAYER' as status,
    'All three apps can now use the same user system' as result,
    'Ready to implement Section 2: Materials & Pricing' as next_step,
    'Unified data foundation is established' as note;
