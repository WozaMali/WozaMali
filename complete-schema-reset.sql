-- ============================================================================
-- WOZA MALI COMPLETE SCHEMA RESET
-- ============================================================================
-- This script performs a complete reset of the Woza Mali database schema
-- WARNING: This will delete ALL existing data and recreate everything from scratch
-- 
-- Run this script in your Supabase SQL Editor to completely reset the database
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING OBJECTS
-- ============================================================================

-- Drop all views first (they depend on tables) - use CASCADE to handle dependencies
DROP VIEW IF EXISTS collections_with_addresses CASCADE;
DROP VIEW IF EXISTS user_collections_summary CASCADE;
DROP VIEW IF EXISTS user_points_summary CASCADE;

-- Drop all tables (in reverse dependency order) - use CASCADE to handle all dependencies
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS areas CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all triggers (they will be dropped with tables, but just to be safe)
-- Note: These will fail silently if tables don't exist, which is fine
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_areas_updated_at ON areas CASCADE;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, which is fine
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, which is fine
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON user_addresses CASCADE;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, which is fine
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_collections_updated_at ON collections CASCADE;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, which is fine
END $$;

-- ============================================================================
-- STEP 2: RECREATE EVERYTHING FROM SCRATCH
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Create areas table first (referenced by users)
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (simplified - addresses are handled by user_addresses table)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('resident', 'collector', 'office')),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_addresses table (from existing Woza Mali system)
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Will reference users(id) after users table is created
    address_type TEXT DEFAULT 'primary' CHECK (address_type IN ('primary', 'secondary', 'pickup', 'billing')),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    country TEXT DEFAULT 'South Africa',
    coordinates POINT, -- For GPS mapping and route optimization
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT, -- Additional delivery instructions, landmarks, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one default address per user per type
    CONSTRAINT unique_default_per_type UNIQUE (user_id, address_type, is_default) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Create collections table
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES users(id) ON DELETE SET NULL,
    pickup_address_id UUID, -- Will reference user_addresses table after it's created
    material_type VARCHAR(100) NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL CHECK (weight_kg > 0),
    photo_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL DEFAULT 'collection' CHECK (transaction_type IN ('collection', 'withdrawal', 'bonus', 'penalty')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Create indexes for better performance (basic indexes first)
CREATE INDEX idx_users_area_id ON users(area_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_collector_id ON collections(collector_id);
CREATE INDEX idx_collections_status ON collections(status);
CREATE INDEX idx_collections_created_at ON collections(created_at);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_collection_id ON transactions(collection_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- User addresses indexes
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_active ON user_addresses(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_addresses_default ON user_addresses(user_id, address_type, is_default) WHERE is_default = true;
CREATE INDEX idx_user_addresses_coordinates ON user_addresses USING GIST(coordinates);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies will be created after sample data insertion

-- ============================================================================
-- CREATE TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert sample areas
INSERT INTO areas (id, name) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Downtown'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Suburbs'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Industrial Zone')
ON CONFLICT (id) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, name, phone, area_id, role, email) VALUES 
    ('650e8400-e29b-41d4-a716-446655440001', 'John Doe', '+1234567890', '550e8400-e29b-41d4-a716-446655440001', 'resident', 'john@example.com'),
    ('650e8400-e29b-41d4-a716-446655440002', 'Jane Smith', '+1234567891', '550e8400-e29b-41d4-a716-446655440001', 'resident', 'jane@example.com'),
    ('650e8400-e29b-41d4-a716-446655440003', 'Mike Johnson', '+1234567892', '550e8400-e29b-41d4-a716-446655440002', 'collector', 'mike@example.com'),
    ('650e8400-e29b-41d4-a716-446655440004', 'Sarah Wilson', '+1234567893', '550e8400-e29b-41d4-a716-446655440003', 'office', 'sarah@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample user addresses
INSERT INTO user_addresses (id, user_id, address_type, address_line1, address_line2, city, province, postal_code, is_default, notes) VALUES 
    ('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'primary', '123 Main Street', 'Apt 4B', 'Cape Town', 'Western Cape', '8001', true, 'Main residence'),
    ('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'pickup', '123 Main Street', 'Apt 4B', 'Cape Town', 'Western Cape', '8001', true, 'Same as primary address'),
    ('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'primary', '456 Oak Avenue', 'Unit 2', 'Cape Town', 'Western Cape', '8002', true, 'Family home'),
    ('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 'pickup', '456 Oak Avenue', 'Unit 2', 'Cape Town', 'Western Cape', '8002', true, 'Same as primary address'),
    ('950e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', 'primary', '789 Pine Road', 'House 12', 'Cape Town', 'Western Cape', '8003', true, 'Collector residence'),
    ('950e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440004', 'primary', '321 Elm Street', 'Office Building', 'Cape Town', 'Western Cape', '8004', true, 'Office headquarters')
ON CONFLICT (id) DO NOTHING;

-- Insert sample collections
INSERT INTO collections (id, user_id, collector_id, pickup_address_id, material_type, weight_kg, photo_url, status) VALUES 
    ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440002', 'plastic', 5.5, 'https://example.com/photo1.jpg', 'approved'),
    ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440004', 'paper', 3.2, 'https://example.com/photo2.jpg', 'pending')
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (id, user_id, collection_id, points, transaction_type, description) VALUES 
    ('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 55, 'collection', 'Plastic collection reward'),
    ('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', 32, 'collection', 'Paper collection reward')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Now add the foreign key constraints after all data is inserted
ALTER TABLE user_addresses 
ADD CONSTRAINT fk_user_addresses_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE collections 
ADD CONSTRAINT fk_collections_pickup_address_id 
FOREIGN KEY (pickup_address_id) REFERENCES user_addresses(id) ON DELETE SET NULL;

-- Create additional indexes after foreign key constraints are added
CREATE INDEX idx_collections_pickup_address_id ON collections(pickup_address_id);

-- ============================================================================
-- CREATE RLS POLICIES (after all data and constraints are in place)
-- ============================================================================

-- Verify tables exist before creating policies
DO $$
BEGIN
    -- Check if areas table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'areas') THEN
        RAISE EXCEPTION 'Areas table does not exist. Cannot create RLS policies.';
    END IF;
    
    -- Check if users table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Users table does not exist. Cannot create RLS policies.';
    END IF;
    
    RAISE NOTICE 'All required tables exist. Proceeding with RLS policy creation.';
END $$;

-- Drop existing policies first (in case they exist from previous runs)
DROP POLICY IF EXISTS "Anyone can view areas" ON areas;
DROP POLICY IF EXISTS "Only office can insert areas" ON areas;
DROP POLICY IF EXISTS "Only office can update areas" ON areas;
DROP POLICY IF EXISTS "Only office can delete areas" ON areas;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Collectors can view users in their area" ON users;
DROP POLICY IF EXISTS "Office can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Only office can insert users" ON users;
DROP POLICY IF EXISTS "Only office can delete users" ON users;
DROP POLICY IF EXISTS "Users can view own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Collectors can view addresses in their area" ON user_addresses;
DROP POLICY IF EXISTS "Office can view all addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can manage own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Office can manage all addresses" ON user_addresses;
DROP POLICY IF EXISTS "Residents can view own collections" ON collections;
DROP POLICY IF EXISTS "Collectors can view collections in their area" ON collections;
DROP POLICY IF EXISTS "Office can view all collections" ON collections;
DROP POLICY IF EXISTS "Residents can create collections" ON collections;
DROP POLICY IF EXISTS "Collectors can update assigned collections" ON collections;
DROP POLICY IF EXISTS "Office can manage all collections" ON collections;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Office can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Only office can manage transactions" ON transactions;

-- RLS Policies for areas table
-- Everyone can read areas
CREATE POLICY "Anyone can view areas" ON areas
    FOR SELECT USING (true);

-- Only office can manage areas
CREATE POLICY "Only office can insert areas" ON areas
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

CREATE POLICY "Only office can update areas" ON areas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

CREATE POLICY "Only office can delete areas" ON areas
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- RLS Policies for users table
-- Users can view their own profile and profiles in their area (for collectors)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Collectors can view users in their area" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users collector
            WHERE collector.id = auth.uid() 
            AND collector.role = 'collector'
            AND collector.area_id = users.area_id
        )
    );

CREATE POLICY "Office can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Only office can insert/delete users
CREATE POLICY "Only office can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

CREATE POLICY "Only office can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- RLS Policies for user_addresses table
-- Users can view their own addresses
CREATE POLICY "Users can view own addresses" ON user_addresses
    FOR SELECT USING (user_id = auth.uid());

-- Collectors can view addresses of users in their area
CREATE POLICY "Collectors can view addresses in their area" ON user_addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users collector, users resident
            WHERE collector.id = auth.uid() 
            AND collector.role = 'collector'
            AND resident.id = user_addresses.user_id
            AND collector.area_id = resident.area_id
        )
    );

-- Office can view all addresses
CREATE POLICY "Office can view all addresses" ON user_addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- Users can manage their own addresses
CREATE POLICY "Users can manage own addresses" ON user_addresses
    FOR ALL USING (user_id = auth.uid());

-- Office can manage all addresses
CREATE POLICY "Office can manage all addresses" ON user_addresses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- RLS Policies for collections table
-- Residents can view their own collections
CREATE POLICY "Residents can view own collections" ON collections
    FOR SELECT USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'resident'
        )
    );

-- Collectors can view collections in their area
CREATE POLICY "Collectors can view collections in their area" ON collections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users collector, users resident
            WHERE collector.id = auth.uid() 
            AND collector.role = 'collector'
            AND resident.id = collections.user_id
            AND collector.area_id = resident.area_id
        )
    );

-- Office can view all collections
CREATE POLICY "Office can view all collections" ON collections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- Residents can create collections
CREATE POLICY "Residents can create collections" ON collections
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'resident'
        )
    );

-- Collectors can update assigned collections
CREATE POLICY "Collectors can update assigned collections" ON collections
    FOR UPDATE USING (
        collector_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'collector'
        )
    );

-- Office can manage all collections
CREATE POLICY "Office can manage all collections" ON collections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- RLS Policies for transactions table
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (user_id = auth.uid());

-- Office can view all transactions
CREATE POLICY "Office can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- Only office can create/update/delete transactions
CREATE POLICY "Only office can manage transactions" ON transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- ============================================================================
-- CREATE VIEWS
-- ============================================================================

-- Create views for common queries
CREATE OR REPLACE VIEW user_collections_summary AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.role,
    a.name as area_name,
    COUNT(c.id) as total_collections,
    COALESCE(SUM(c.weight_kg), 0) as total_weight,
    COUNT(CASE WHEN c.status = 'approved' THEN 1 END) as approved_collections,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_collections
FROM users u
LEFT JOIN areas a ON u.area_id = a.id
LEFT JOIN collections c ON u.id = c.user_id
GROUP BY u.id, u.name, u.role, a.name;

CREATE OR REPLACE VIEW user_points_summary AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COALESCE(SUM(t.points), 0) as total_points,
    COUNT(t.id) as total_transactions
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.name;

-- View for collections with address details
CREATE OR REPLACE VIEW collections_with_addresses AS
SELECT 
    c.id as collection_id,
    c.user_id,
    c.collector_id,
    c.pickup_address_id,
    c.material_type,
    c.weight_kg,
    c.photo_url,
    c.status,
    c.notes,
    c.created_at,
    c.updated_at,
    u.name as user_name,
    u.phone as user_phone,
    u.email as user_email,
    collector.name as collector_name,
    collector.phone as collector_phone,
    ua.address_type,
    ua.address_line1,
    ua.address_line2,
    ua.city,
    ua.province,
    ua.postal_code,
    ua.country,
    ua.coordinates,
    ua.notes as address_notes,
    CONCAT(
        ua.address_line1,
        CASE WHEN ua.address_line2 IS NOT NULL THEN ', ' || ua.address_line2 ELSE '' END,
        ', ', ua.city, ', ', ua.province,
        CASE WHEN ua.postal_code IS NOT NULL THEN ', ' || ua.postal_code ELSE '' END
    ) as full_address
FROM collections c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN users collector ON c.collector_id = collector.id
LEFT JOIN user_addresses ua ON c.pickup_address_id = ua.id;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('areas', 'users', 'user_addresses', 'collections', 'transactions')
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('areas', 'users', 'user_addresses', 'collections', 'transactions')
AND rowsecurity = true
ORDER BY tablename;

-- Verify sample data
SELECT 'Areas' as table_name, COUNT(*) as record_count FROM areas
UNION ALL
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'User Addresses' as table_name, COUNT(*) as record_count FROM user_addresses
UNION ALL
SELECT 'Collections' as table_name, COUNT(*) as record_count FROM collections
UNION ALL
SELECT 'Transactions' as table_name, COUNT(*) as record_count FROM transactions;

-- ============================================================================
-- SCHEMA RESET COMPLETE! 🎉
-- ============================================================================
-- Your Woza Mali database has been completely reset and recreated with:
-- ✅ All tables with proper relationships
-- ✅ Row Level Security policies for all roles
-- ✅ Indexes for optimal performance
-- ✅ Triggers for automatic timestamp updates
-- ✅ Sample data for testing
-- ✅ Views for common queries
-- ✅ Address integration with existing Woza Mali system
-- 
-- The database is now ready for use with all three apps:
-- - User App (residents)
-- - Collector App (collectors)
-- - Office App (office staff)
-- ============================================================================
