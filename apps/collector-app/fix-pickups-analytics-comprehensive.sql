-- ============================================================================
-- COMPREHENSIVE FIX FOR PICKUPS AND ANALYTICS FUNCTIONALITY
-- ============================================================================
-- This script creates the necessary database structure for Pickups and Analytics
-- to work properly in the Collector App

-- 1. Create collections table if it doesn't exist
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    collector_id UUID REFERENCES users(id),
    pickup_address_id UUID,
    material_type VARCHAR(100),
    weight_kg DECIMAL(10,3) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    collection_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create pickup_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS pickup_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    material_id VARCHAR(100),
    quantity DECIMAL(10,3) DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) DEFAULT 0,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create materials table if it doesn't exist
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    rate_per_kg DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default materials if they don't exist
INSERT INTO materials (name, rate_per_kg, is_active) VALUES
    ('Aluminium Cans', 18.55, true),
    ('PET Bottles', 1.50, true),
    ('Clear Glass', 2.00, true),
    ('White Paper', 1.20, true),
    ('Cardboard', 1.00, true),
    ('Steel Cans', 3.50, true),
    ('Mixed Plastics', 0.80, true)
ON CONFLICT (name) DO NOTHING;

-- 5. Create collection_details view for pickups page
CREATE OR REPLACE VIEW collection_details AS
SELECT 
    c.id,
    c.collection_code,
    c.user_id,
    c.collector_id,
    c.pickup_address_id,
    c.material_type,
    c.weight_kg,
    c.status,
    c.notes,
    c.collection_date,
    c.created_at,
    c.updated_at,
    u.first_name || ' ' || u.last_name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone,
    m.name as material_name,
    m.rate_per_kg as material_unit_price,
    (c.weight_kg * COALESCE(m.rate_per_kg, 0)) as estimated_value,
    (c.weight_kg * COALESCE(m.rate_per_kg, 0) * 0.7) as green_scholar_fund_amount,
    (c.weight_kg * COALESCE(m.rate_per_kg, 0) * 0.3) as user_wallet_amount
FROM collections c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN materials m ON c.material_type = m.name;

-- 6. Create unified_collections view for analytics
CREATE OR REPLACE VIEW unified_collections AS
SELECT 
    c.id,
    c.collection_code,
    c.user_id as customer_id,
    c.collector_id,
    c.pickup_address_id,
    c.material_type,
    c.weight_kg as total_weight_kg,
    (c.weight_kg * COALESCE(m.rate_per_kg, 0)) as total_value,
    1 as material_count,
    c.status,
    c.collection_date as scheduled_date,
    c.collection_date as actual_date,
    c.created_at,
    c.updated_at,
    u.first_name || ' ' || u.last_name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone,
    c.collector_id as created_by
FROM collections c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN materials m ON c.material_type = m.name;

-- 7. Create collector_dashboard_view for dashboard
CREATE OR REPLACE VIEW collector_dashboard_view AS
SELECT 
    c.id as pickup_id,
    c.collection_code,
    c.user_id as customer_id,
    c.collector_id,
    c.pickup_address_id,
    c.material_type,
    c.weight_kg as total_kg,
    c.status,
    c.notes,
    c.collection_date as scheduled_date,
    c.created_at as started_at,
    c.updated_at as completed_at,
    u.first_name || ' ' || u.last_name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone,
    a.line1 as pickup_address,
    a.suburb as pickup_suburb,
    a.city as pickup_city,
    m.name as material_name,
    m.rate_per_kg as material_rate,
    (c.weight_kg * COALESCE(m.rate_per_kg, 0)) as total_value,
    (c.weight_kg * 6) as total_points,
    (c.weight_kg * 0.5) as co2_saved,
    (c.weight_kg * 3.5) as water_saved,
    c.weight_kg as landfill_saved,
    (c.weight_kg * 0.045) as trees_equivalent
FROM collections c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN addresses a ON c.pickup_address_id = a.id
LEFT JOIN materials m ON c.material_type = m.name;

-- 8. Create collection_metrics view for analytics
CREATE OR REPLACE VIEW collection_metrics AS
SELECT 
    DATE(c.collection_date) as date,
    c.collector_id,
    COUNT(*) as total_collections,
    SUM(c.weight_kg) as total_kg,
    SUM(c.weight_kg * 6) as total_points,
    SUM(c.weight_kg * COALESCE(m.rate_per_kg, 0)) as total_earnings,
    AVG(c.weight_kg) as avg_weight_per_collection,
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_collections,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_collections
FROM collections c
LEFT JOIN materials m ON c.material_type = m.name
WHERE c.collector_id IS NOT NULL
GROUP BY DATE(c.collection_date), c.collector_id
ORDER BY date DESC;

-- 9. Create system_impact_view for analytics
CREATE OR REPLACE VIEW system_impact_view AS
SELECT 
    COUNT(*) as total_collections,
    SUM(c.weight_kg) as total_kg_collected,
    SUM(c.weight_kg * 0.5) as total_co2_saved,
    SUM(c.weight_kg * 3.5) as total_water_saved,
    SUM(c.weight_kg) as total_landfill_saved,
    SUM(c.weight_kg * 0.045) as total_trees_equivalent,
    SUM(c.weight_kg * COALESCE(m.rate_per_kg, 0)) as total_value_generated,
    COUNT(DISTINCT c.user_id) as total_customers,
    COUNT(DISTINCT c.collector_id) as total_collectors
FROM collections c
LEFT JOIN materials m ON c.material_type = m.name
WHERE c.status IN ('completed', 'approved');

-- 10. Create material_performance_view for analytics
CREATE OR REPLACE VIEW material_performance_view AS
SELECT 
    c.material_type as material_name,
    COUNT(*) as total_collections,
    SUM(c.weight_kg) as total_kg_collected,
    AVG(c.weight_kg) as avg_weight_per_collection,
    SUM(c.weight_kg * COALESCE(m.rate_per_kg, 0)) as total_value,
    AVG(m.rate_per_kg) as avg_rate_per_kg
FROM collections c
LEFT JOIN materials m ON c.material_type = m.name
WHERE c.status IN ('completed', 'approved')
GROUP BY c.material_type, m.rate_per_kg
ORDER BY total_kg_collected DESC;

-- 11. Create collector_performance_view for analytics
CREATE OR REPLACE VIEW collector_performance_view AS
SELECT 
    c.collector_id,
    u.first_name || ' ' || u.last_name as collector_name,
    u.email as collector_email,
    COUNT(*) as total_collections,
    SUM(c.weight_kg) as total_kg_collected,
    AVG(c.weight_kg) as avg_weight_per_collection,
    SUM(c.weight_kg * COALESCE(m.rate_per_kg, 0)) as total_earnings,
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_collections,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_collections,
    ROUND(COUNT(CASE WHEN c.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM collections c
LEFT JOIN users u ON c.collector_id = u.id
LEFT JOIN materials m ON c.material_type = m.name
WHERE c.collector_id IS NOT NULL
GROUP BY c.collector_id, u.first_name, u.last_name, u.email
ORDER BY total_kg_collected DESC;

-- 12. Enable RLS on new tables
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS policies for collections
CREATE POLICY "Collectors can view their own collections" ON collections
    FOR SELECT USING (collector_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Collectors can insert collections" ON collections
    FOR INSERT WITH CHECK (collector_id = auth.uid());

CREATE POLICY "Collectors can update their collections" ON collections
    FOR UPDATE USING (collector_id = auth.uid());

-- 14. Create RLS policies for pickup_items
CREATE POLICY "Users can view pickup items for their collections" ON pickup_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections c 
            WHERE c.id = pickup_items.pickup_id 
            AND (c.collector_id = auth.uid() OR c.user_id = auth.uid())
        )
    );

CREATE POLICY "Collectors can insert pickup items" ON pickup_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM collections c 
            WHERE c.id = pickup_items.pickup_id 
            AND c.collector_id = auth.uid()
        )
    );

-- 15. Create RLS policies for materials
CREATE POLICY "Everyone can view active materials" ON materials
    FOR SELECT USING (is_active = true);

-- 16. Insert some sample data for testing
INSERT INTO collections (collection_code, user_id, collector_id, material_type, weight_kg, status, collection_date)
SELECT 
    'COL-' || LPAD(ROW_NUMBER() OVER()::text, 4, '0'),
    u.id,
    c.id,
    m.name,
    ROUND((RANDOM() * 10 + 1)::numeric, 2),
    CASE (RANDOM() * 3)::int
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'completed'
        ELSE 'approved'
    END,
    CURRENT_DATE - (RANDOM() * 30)::int
FROM users u
CROSS JOIN users c
CROSS JOIN materials m
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'member' LIMIT 1)
  AND c.role_id = (SELECT id FROM roles WHERE name = 'collector' LIMIT 1)
  AND m.is_active = true
LIMIT 20
ON CONFLICT (collection_code) DO NOTHING;

-- 17. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_collector_id ON collections(collector_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_date ON collections(collection_date);
CREATE INDEX IF NOT EXISTS idx_pickup_items_pickup_id ON pickup_items(pickup_id);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);

-- 18. Grant necessary permissions
GRANT SELECT ON collection_details TO authenticated;
GRANT SELECT ON unified_collections TO authenticated;
GRANT SELECT ON collector_dashboard_view TO authenticated;
GRANT SELECT ON collection_metrics TO authenticated;
GRANT SELECT ON system_impact_view TO authenticated;
GRANT SELECT ON material_performance_view TO authenticated;
GRANT SELECT ON collector_performance_view TO authenticated;

-- 19. Create function to refresh material rates
CREATE OR REPLACE FUNCTION refresh_material_rates()
RETURNS void AS $$
BEGIN
    -- Update material rates based on current market prices
    UPDATE materials SET rate_per_kg = 
        CASE name
            WHEN 'Aluminium Cans' THEN 18.55
            WHEN 'PET Bottles' THEN 1.50
            WHEN 'Clear Glass' THEN 2.00
            WHEN 'White Paper' THEN 1.20
            WHEN 'Cardboard' THEN 1.00
            WHEN 'Steel Cans' THEN 3.50
            WHEN 'Mixed Plastics' THEN 0.80
            ELSE rate_per_kg
        END,
        updated_at = NOW()
    WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 20. Create function to calculate collection statistics
CREATE OR REPLACE FUNCTION get_collector_stats(collector_uuid UUID)
RETURNS TABLE (
    total_collections BIGINT,
    total_kg DECIMAL,
    total_earnings DECIMAL,
    avg_weight_per_collection DECIMAL,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_collections,
        COALESCE(SUM(c.weight_kg), 0) as total_kg,
        COALESCE(SUM(c.weight_kg * m.rate_per_kg), 0) as total_earnings,
        COALESCE(AVG(c.weight_kg), 0) as avg_weight_per_collection,
        COALESCE(
            ROUND(
                COUNT(CASE WHEN c.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 
                2
            ), 
            0
        ) as completion_rate
    FROM collections c
    LEFT JOIN materials m ON c.material_type = m.name
    WHERE c.collector_id = collector_uuid;
END;
$$ LANGUAGE plpgsql;

-- 21. Create trigger to update collection_code automatically
CREATE OR REPLACE FUNCTION generate_collection_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.collection_code IS NULL OR NEW.collection_code = '' THEN
        NEW.collection_code := 'COL-' || LPAD(nextval('collection_code_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for collection codes
CREATE SEQUENCE IF NOT EXISTS collection_code_seq START 1;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_generate_collection_code ON collections;
CREATE TRIGGER trigger_generate_collection_code
    BEFORE INSERT ON collections
    FOR EACH ROW
    EXECUTE FUNCTION generate_collection_code();

-- 22. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_collections_updated_at ON collections;
CREATE TRIGGER trigger_update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_materials_updated_at ON materials;
CREATE TRIGGER trigger_update_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 23. Final verification
SELECT 'Database structure created successfully!' as status;

-- Show created tables and views
SELECT 'TABLES' as type, table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('collections', 'pickup_items', 'materials')
UNION ALL
SELECT 'VIEWS' as type, table_name FROM information_schema.views 
WHERE table_schema = 'public' AND table_name LIKE '%collection%' OR table_name LIKE '%pickup%'
ORDER BY type, table_name;
