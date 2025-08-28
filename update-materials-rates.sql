-- ============================================================================
-- UPDATE MATERIALS WITH CURRENT MARKET RATES
-- ============================================================================
-- Run this in your Supabase SQL Editor to update material rates

-- Update existing materials with current market rates
UPDATE materials SET 
  rate_per_kg = 1.50,
  description = 'Polyethylene terephthalate bottles and containers',
  category = 'Plastic'
WHERE name = 'PET';

UPDATE materials SET 
  rate_per_kg = 18.55,
  description = 'Aluminum beverage and food cans',
  category = 'Metal'
WHERE name = 'Aluminium Cans';

UPDATE materials SET 
  rate_per_kg = 2.00,
  description = 'High-density polyethylene containers',
  category = 'Plastic'
WHERE name = 'HDPE';

UPDATE materials SET 
  rate_per_kg = 1.20,
  description = 'Glass bottles and containers',
  category = 'Glass'
WHERE name = 'Glass';

UPDATE materials SET 
  rate_per_kg = 0.80,
  description = 'Mixed paper and cardboard',
  category = 'Paper'
WHERE name = 'Paper';

UPDATE materials SET 
  rate_per_kg = 0.60,
  description = 'Corrugated cardboard boxes',
  category = 'Paper'
WHERE name = 'Cardboard';

-- Add new materials if they don't exist
INSERT INTO materials (name, unit, rate_per_kg, is_active, description, category) VALUES
  ('Steel Cans', 'kg', 2.50, true, 'Steel food and beverage cans', 'Metal'),
  ('LDPE', 'kg', 1.80, true, 'Low-density polyethylene bags and films', 'Plastic'),
  ('PP', 'kg', 2.20, true, 'Polypropylene containers and packaging', 'Plastic'),
  ('Mixed Metals', 'kg', 5.00, true, 'Mixed metal scrap and items', 'Metal')
ON CONFLICT (name) DO NOTHING;

-- Verify the updates
SELECT 
  name,
  rate_per_kg,
  category,
  description,
  is_active
FROM materials 
ORDER BY category, rate_per_kg DESC;
