-- ============================================================================
-- CLEAN SLATE: REMOVE ALL TABLES AND CREATE UNIFIED SCHEMA
-- ============================================================================
-- This will completely wipe the database and create the new unified schema

-- ============================================================================
-- 1. DROP ALL EXISTING TABLES AND VIEWS
-- ============================================================================

-- Drop all views first
DROP VIEW IF EXISTS public.collector_residents CASCADE;
DROP VIEW IF EXISTS public.residents_view CASCADE;
DROP VIEW IF EXISTS public.subdivision_dropdown CASCADE;
DROP VIEW IF EXISTS public.township_dropdown CASCADE;

-- Drop all tables in public schema
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.areas CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.pickups CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.enhanced_wallets CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.collection_pickups CASCADE;
DROP TABLE IF EXISTS public.pickup_items CASCADE;
DROP TABLE IF EXISTS public.pickup_photos CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.withdrawal_requests CASCADE;
DROP TABLE IF EXISTS public.withdrawal_banks CASCADE;
DROP TABLE IF EXISTS public.points_transactions CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS migrate_existing_users() CASCADE;

-- ============================================================================
-- 2. CREATE UNIFIED SCHEMA
-- ============================================================================

-- ============================================================================
-- 2.1 ROLES TABLE
-- ============================================================================
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'resident', 'collector', 'admin'
    description TEXT,
    permissions JSONB DEFAULT '{}', -- Store role-specific permissions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2.2 AREAS TABLE
-- ============================================================================
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
-- 2.3 USERS TABLE
-- ============================================================================
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
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================================

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

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

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
-- 5. SEED DATA
-- ============================================================================

-- Insert the three core roles with permissions
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
-- 6. HELPFUL VIEWS FOR ADDRESS DROPDOWNS
-- ============================================================================

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
-- 7. VERIFICATION
-- ============================================================================

-- Check tables were created
SELECT 
    'Clean Slate Complete' as info,
    'roles' as table_name,
    COUNT(*) as count
FROM public.roles
UNION ALL
SELECT 
    'Clean Slate Complete' as info,
    'areas' as table_name,
    COUNT(*) as count
FROM public.areas
UNION ALL
SELECT 
    'Clean Slate Complete' as info,
    'users' as table_name,
    COUNT(*) as count
FROM public.users;

-- Show all Soweto areas
SELECT 
    'Soweto Areas Ready' as info,
    name,
    postal_code,
    city
FROM public.areas
ORDER BY name;

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
SELECT 'Section 1: Clean Slate Complete!' as status,
       'All old tables removed, new unified schema created' as message,
       'Ready for Main App signup updates' as next_step;