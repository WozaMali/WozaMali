-- =====================================================
-- FIX COLUMN NAME MISMATCHES IN USER_METRICS TABLE
-- =====================================================

-- First, let's check what columns actually exist in the user_metrics table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_metrics'
ORDER BY ordinal_position;

-- Check if there's a column with a similar name
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'user_metrics' 
  AND column_name LIKE '%recycl%'
ORDER BY column_name;

-- Fix all column name mismatches in user_metrics table
DO $$
BEGIN
  -- Check and rename total_recycling_kg to total_recycled_kg
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_recycling_kg'
  ) THEN
    ALTER TABLE user_metrics RENAME COLUMN total_recycling_kg TO total_recycled_kg;
    RAISE NOTICE 'Column total_recycling_kg renamed to total_recycled_kg';
  ELSE
    RAISE NOTICE 'Column total_recycling_kg does not exist, no rename needed';
  END IF;
  
  -- Check and rename total_earnings_rand to total_earnings
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_earnings_rand'
  ) THEN
    ALTER TABLE user_metrics RENAME COLUMN total_earnings_rand TO total_earnings;
    RAISE NOTICE 'Column total_earnings_rand renamed to total_earnings';
  ELSE
    RAISE NOTICE 'Column total_earnings_rand does not exist, no rename needed';
  END IF;
  
  -- Check and rename total_co2_saved to co2_saved_kg
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_co2_saved'
  ) THEN
    ALTER TABLE user_metrics RENAME COLUMN total_co2_saved TO co2_saved_kg;
    RAISE NOTICE 'Column total_co2_saved renamed to co2_saved_kg';
  ELSE
    RAISE NOTICE 'Column total_co2_saved does not exist, no rename needed';
  END IF;
  
  -- Check and rename total_water_saved to water_saved_liters
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_water_saved'
  ) THEN
    ALTER TABLE user_metrics RENAME COLUMN total_water_saved TO water_saved_liters;
    RAISE NOTICE 'Column total_water_saved renamed to water_saved_liters';
  ELSE
    RAISE NOTICE 'Column total_water_saved does not exist, no rename needed';
  END IF;
  
  -- Check and rename total_landfill_saved to landfill_saved_kg
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_landfill_saved'
  ) THEN
    ALTER TABLE user_metrics RENAME COLUMN total_landfill_saved TO landfill_saved_kg;
    RAISE NOTICE 'Column total_landfill_saved renamed to landfill_saved_kg';
  ELSE
    RAISE NOTICE 'Column total_landfill_saved does not exist, no rename needed';
  END IF;
  
  -- Verify all required columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_recycled_kg'
  ) THEN
    RAISE NOTICE 'Column total_recycled_kg exists and is correctly named';
  ELSE
    RAISE NOTICE 'WARNING: Column total_recycled_kg does not exist!';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_earnings'
  ) THEN
    RAISE NOTICE 'Column total_earnings exists and is correctly named';
  ELSE
    RAISE NOTICE 'WARNING: Column total_earnings does not exist!';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'co2_saved_kg'
  ) THEN
    RAISE NOTICE 'Column co2_saved_kg exists and is correctly named';
  ELSE
    RAISE NOTICE 'WARNING: Column co2_saved_kg does not exist!';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'water_saved_liters'
  ) THEN
    RAISE NOTICE 'Column water_saved_liters exists and is correctly named';
  ELSE
    RAISE NOTICE 'WARNING: Column water_saved_liters does not exist!';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'landfill_saved_kg'
  ) THEN
    RAISE NOTICE 'Column landfill_saved_kg exists and is correctly named';
  ELSE
    RAISE NOTICE 'WARNING: Column landfill_saved_kg does not exist!';
  END IF;
END $$;

-- Verify the final table structure
\d user_metrics;
