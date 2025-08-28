-- =====================================================
-- ADD MATERIAL_ID COLUMN TO EXISTING PICKUPS TABLE
-- =====================================================

-- Add material_id column to existing pickups table
ALTER TABLE pickups 
ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES materials(id) ON DELETE CASCADE;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_pickups_material_id ON pickups(material_id);

-- Update any existing pickups to have a default material (optional)
-- Uncomment the line below if you want to set a default material for existing records
-- UPDATE pickups SET material_id = (SELECT id FROM materials WHERE name = 'PET Plastic Bottles' LIMIT 1) WHERE material_id IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check if the column was added successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'pickups' AND column_name = 'material_id';

-- Show the updated table structure
\d pickups;
