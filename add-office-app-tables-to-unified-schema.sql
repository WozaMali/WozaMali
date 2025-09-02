-- ============================================================================
-- ADD OFFICE APP TABLES TO UNIFIED SCHEMA
-- ============================================================================
-- This script adds the missing tables that the WozaMaliOffice app needs
-- to work with the unified schema

-- ============================================================================
-- STEP 1: CREATE MATERIALS TABLE
-- ============================================================================

-- Drop existing materials table if it exists (to ensure clean creation)
DROP TABLE IF EXISTS materials CASCADE;

CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default materials
INSERT INTO materials (id, name, category, unit_price, unit, description) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Plastic Bottles', 'Plastic', 2.50, 'kg', 'Clean plastic bottles'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Paper', 'Paper', 1.80, 'kg', 'Clean paper and cardboard'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Glass Bottles', 'Glass', 1.20, 'kg', 'Clean glass bottles'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Metal Cans', 'Metal', 18.55, 'kg', 'Aluminum and steel cans'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Electronic Waste', 'Electronics', 5.00, 'kg', 'Small electronic devices'),
    ('550e8400-e29b-41d4-a716-446655440006', 'Textiles', 'Textile', 1.50, 'kg', 'Clothing and fabric'),
    ('550e8400-e29b-41d4-a716-446655440007', 'Organic Waste', 'Organic', 0.80, 'kg', 'Food scraps and garden waste')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: CREATE PICKUP ITEMS TABLE
-- ============================================================================

-- Drop existing pickup_items table if it exists
DROP TABLE IF EXISTS pickup_items CASCADE;

CREATE TABLE pickup_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_id UUID NOT NULL, -- Will reference collections table
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE PICKUP PHOTOS TABLE
-- ============================================================================

-- Drop existing pickup_photos table if it exists
DROP TABLE IF EXISTS pickup_photos CASCADE;

CREATE TABLE pickup_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_id UUID NOT NULL, -- Will reference collections table
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(20) NOT NULL CHECK (photo_type IN ('before', 'after', 'general', 'verification')),
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

-- Materials indexes
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active) WHERE is_active = true;

-- Pickup items indexes
CREATE INDEX IF NOT EXISTS idx_pickup_items_pickup_id ON pickup_items(pickup_id);
CREATE INDEX IF NOT EXISTS idx_pickup_items_material_id ON pickup_items(material_id);
CREATE INDEX IF NOT EXISTS idx_pickup_items_created_at ON pickup_items(created_at);

-- Pickup photos indexes
CREATE INDEX IF NOT EXISTS idx_pickup_photos_pickup_id ON pickup_photos(pickup_id);
CREATE INDEX IF NOT EXISTS idx_pickup_photos_type ON pickup_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_pickup_photos_taken_at ON pickup_photos(taken_at);

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_photos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- Materials policies (everyone can read, only office can manage)
CREATE POLICY "Anyone can view materials" ON materials
    FOR SELECT USING (true);

CREATE POLICY "Only office can manage materials" ON materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- Pickup items policies
CREATE POLICY "Users can view pickup items for their collections" ON pickup_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = pickup_items.pickup_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Collectors can view pickup items in their area" ON pickup_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections c
            JOIN users u ON c.user_id = u.id
            JOIN users collector ON collector.id = auth.uid()
            WHERE c.id = pickup_items.pickup_id
            AND collector.role = 'collector'
            AND collector.area_id = u.area_id
        )
    );

CREATE POLICY "Office can view all pickup items" ON pickup_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

CREATE POLICY "Collectors can manage pickup items" ON pickup_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = pickup_items.pickup_id
            AND c.collector_id = auth.uid()
        )
    );

CREATE POLICY "Office can manage all pickup items" ON pickup_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- Pickup photos policies
CREATE POLICY "Users can view photos for their collections" ON pickup_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = pickup_photos.pickup_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Collectors can view photos in their area" ON pickup_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections c
            JOIN users u ON c.user_id = u.id
            JOIN users collector ON collector.id = auth.uid()
            WHERE c.id = pickup_photos.pickup_id
            AND collector.role = 'collector'
            AND collector.area_id = u.area_id
        )
    );

CREATE POLICY "Office can view all pickup photos" ON pickup_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

CREATE POLICY "Collectors can manage pickup photos" ON pickup_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = pickup_photos.pickup_id
            AND c.collector_id = auth.uid()
        )
    );

CREATE POLICY "Office can manage all pickup photos" ON pickup_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'office'
        )
    );

-- ============================================================================
-- STEP 7: CREATE TRIGGERS
-- ============================================================================

-- Create trigger for updated_at on materials
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on pickup_items
CREATE TRIGGER update_pickup_items_updated_at BEFORE UPDATE ON pickup_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to calculate total_price on pickup_items
CREATE OR REPLACE FUNCTION calculate_pickup_item_total_price()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price = NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_pickup_item_total_price_trigger
    BEFORE INSERT OR UPDATE ON pickup_items
    FOR EACH ROW EXECUTE FUNCTION calculate_pickup_item_total_price();

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 9: VERIFICATION QUERIES
-- ============================================================================

-- Check that all tables were created successfully
DO $$
BEGIN
    -- Verify materials table exists and has correct structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'materials' 
        AND column_name = 'unit_price'
    ) THEN
        RAISE EXCEPTION 'Materials table does not have unit_price column';
    END IF;
    
    -- Verify pickup_items table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pickup_items'
    ) THEN
        RAISE EXCEPTION 'pickup_items table was not created';
    END IF;
    
    -- Verify pickup_photos table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pickup_photos'
    ) THEN
        RAISE EXCEPTION 'pickup_photos table was not created';
    END IF;
    
    RAISE NOTICE 'All tables created successfully!';
END $$;

-- Check that all tables were created
SELECT 
    'Materials' as table_name, 
    COUNT(*) as record_count 
FROM materials
UNION ALL
SELECT 
    'Pickup Items' as table_name, 
    COUNT(*) as record_count 
FROM pickup_items
UNION ALL
SELECT 
    'Pickup Photos' as table_name, 
    COUNT(*) as record_count 
FROM pickup_photos;

-- Show sample materials
SELECT 
    'Sample Materials' as test_type,
    id,
    name,
    category,
    unit_price,
    unit
FROM materials
LIMIT 5;

-- ============================================================================
-- OFFICE APP TABLES ADDED! 🎉
-- ============================================================================
-- The WozaMaliOffice app now has all the tables it needs:
-- - materials: Material types and pricing
-- - pickup_items: Individual items in collections
-- - pickup_photos: Photos for collections
-- 
-- These tables work alongside the unified schema and provide
-- the detailed functionality that the Office app requires.
-- ============================================================================
