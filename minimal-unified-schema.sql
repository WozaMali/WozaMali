-- ============================================================================
-- MINIMAL UNIFIED SCHEMA - NO TRIGGERS OR FUNCTIONS
-- ============================================================================
-- This creates the basic unified schema without any complex features
-- Run this to test if the basic structure works

-- ============================================================================
-- 1. CLEAN SLATE - DROP EVERYTHING
-- ============================================================================

-- Drop all existing tables
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', table_name);
    END LOOP;
END $$;

-- Drop all views
DO $$
DECLARE
    view_name text;
BEGIN
    FOR view_name IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
    END LOOP;
END $$;

-- ============================================================================
-- 2. CREATE BASIC TABLES
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User addresses
CREATE TABLE public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    line1 TEXT NOT NULL,
    suburb TEXT NOT NULL,
    city TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection zones
CREATE TABLE public.collection_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection requests
CREATE TABLE public.collection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address_id UUID REFERENCES public.user_addresses(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection pickups
CREATE TABLE public.collection_pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.collection_requests(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    pickup_code TEXT UNIQUE NOT NULL,
    pickup_date DATE NOT NULL,
    status TEXT DEFAULT 'scheduled',
    total_weight_kg DECIMAL(10,2) DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Material categories
CREATE TABLE public.material_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.material_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    unit TEXT DEFAULT 'kg',
    current_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    points_per_unit INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pickup items
CREATE TABLE public.pickup_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_id UUID REFERENCES public.collection_pickups(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User wallets
CREATE TABLE public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    current_points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    points INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. BASIC RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Simple policies - allow all for authenticated users
CREATE POLICY "Allow all for authenticated users" ON public.users
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.user_addresses
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.collection_zones
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.collection_requests
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.collection_pickups
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.material_categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.materials
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.pickup_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.user_wallets
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.transactions
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- 4. SAMPLE DATA
-- ============================================================================

-- Insert material categories
INSERT INTO public.material_categories (name, description) VALUES
('Plastic', 'Various plastic materials'),
('Paper', 'Paper and cardboard materials'),
('Metal', 'Metal cans and containers'),
('Glass', 'Glass bottles and containers'),
('Electronics', 'Electronic waste');

-- Insert materials
INSERT INTO public.materials (category_id, name, unit, current_rate, points_per_unit) VALUES
((SELECT id FROM public.material_categories WHERE name = 'Plastic'), 'PET Bottles', 'kg', 2.50, 10),
((SELECT id FROM public.material_categories WHERE name = 'Plastic'), 'HDPE Containers', 'kg', 2.00, 8),
((SELECT id FROM public.material_categories WHERE name = 'Paper'), 'Cardboard', 'kg', 1.50, 6),
((SELECT id FROM public.material_categories WHERE name = 'Paper'), 'Newspaper', 'kg', 1.00, 4),
((SELECT id FROM public.material_categories WHERE name = 'Metal'), 'Aluminum Cans', 'kg', 8.00, 20),
((SELECT id FROM public.material_categories WHERE name = 'Metal'), 'Steel Cans', 'kg', 3.00, 12),
((SELECT id FROM public.material_categories WHERE name = 'Glass'), 'Glass Bottles', 'kg', 0.50, 2),
((SELECT id FROM public.material_categories WHERE name = 'Electronics'), 'Mobile Phones', 'piece', 50.00, 100);

-- Insert collection zones
INSERT INTO public.collection_zones (name, city) VALUES
('Zone 1 - Central', 'Johannesburg'),
('Zone 2 - Northern Suburbs', 'Johannesburg'),
('Zone 3 - Southern Suburbs', 'Johannesburg'),
('Zone 4 - Eastern Suburbs', 'Johannesburg'),
('Zone 5 - Western Suburbs', 'Johannesburg');

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

-- Check tables created
SELECT 
    'Tables Created' as info,
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Test access
SELECT 
    'Materials Count' as test,
    COUNT(*) as count
FROM public.materials;

-- ============================================================================
-- 6. SUCCESS MESSAGE
-- ============================================================================

SELECT 
    '✅ MINIMAL UNIFIED SCHEMA CREATED' as status,
    'Basic tables and RLS policies are ready' as result,
    'Test your apps to verify they can access the data' as next_step;
