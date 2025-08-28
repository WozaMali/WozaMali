-- =====================================================
-- SUPABASE SCHEMA UPDATE SCRIPT
-- WozaMali Application - Complete Database Schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- WITHDRAWAL SYSTEM TABLES
-- =====================================================

-- Create withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Account Owner Information
  owner_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(100) NOT NULL CHECK (account_type IN (
    'Savings Account', 'Current Account', 'Cheque Account', 
    'Credit Card', 'Investment Account'
  )),
  
  -- Banking Information
  bank_name VARCHAR(255) NOT NULL,
  bank_code VARCHAR(10) NOT NULL,
  branch_code VARCHAR(10) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  
  -- Withdrawal Details
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  
  -- Processing Information
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create withdrawal bank reference table
CREATE TABLE IF NOT EXISTS withdrawal_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name VARCHAR(255) NOT NULL UNIQUE,
  bank_code VARCHAR(10) NOT NULL UNIQUE,
  branch_code VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert South African banks data
INSERT INTO withdrawal_banks (bank_name, bank_code, branch_code) VALUES
  ('ABSA Bank', '632005', '632005'),
  ('First National Bank (FNB)', '250655', '250655'),
  ('Nedbank', '198765', '198765'),
  ('Standard Bank', '051001', '051001'),
  ('Capitec Bank', '470010', '470010'),
  ('African Bank', '430000', '430000'),
  ('Bidvest Bank', '462005', '462005'),
  ('Discovery Bank', '679000', '679000'),
  ('Grindrod Bank', '450105', '450105'),
  ('Investec Bank', '580105', '580105'),
  ('Mercantile Bank', '450106', '450106'),
  ('Sasfin Bank', '683000', '683000'),
  ('TymeBank', '678910', '678910'),
  ('VBS Mutual Bank', '198766', '198766')
ON CONFLICT (bank_code) DO UPDATE SET
  bank_name = EXCLUDED.bank_name,
  branch_code = EXCLUDED.branch_code,
  updated_at = NOW();

-- =====================================================
-- GREEN SCHOLAR FUND TABLES
-- =====================================================

-- Create Green Scholar Fund donations table
CREATE TABLE IF NOT EXISTS green_scholar_fund_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('wallet', 'mtn-momo', 'cash')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create PET/Plastic Bottle collections table
CREATE TABLE IF NOT EXISTS green_scholar_fund_bottles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bottle_count INTEGER NOT NULL CHECK (bottle_count > 0),
  weight_kg DECIMAL(8,3) NOT NULL CHECK (weight_kg > 0),
  bottle_type VARCHAR(50) DEFAULT 'PET' CHECK (bottle_type IN ('PET', 'HDPE', 'Other')),
  collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'processed')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fund statistics table for real-time tracking
CREATE TABLE IF NOT EXISTS green_scholar_fund_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year VARCHAR(7) NOT NULL UNIQUE, -- Format: YYYY-MM
  monthly_goal DECIMAL(10,2) NOT NULL DEFAULT 50000.00,
  total_donations DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_bottle_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_fund DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  beneficiaries_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS green_scholar_fund_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  id_number VARCHAR(50),
  
  -- Academic Information
  school_name VARCHAR(255) NOT NULL,
  grade VARCHAR(10) NOT NULL,
  student_number VARCHAR(100),
  academic_performance VARCHAR(50) NOT NULL,
  
  -- Financial Information
  household_income VARCHAR(50) NOT NULL,
  household_size VARCHAR(10) NOT NULL,
  employment_status VARCHAR(50),
  other_income_sources TEXT,
  
  -- Support Needs
  support_type TEXT[] NOT NULL,
  urgent_needs TEXT,
  previous_support TEXT,
  
  -- Documentation
  has_id_document BOOLEAN NOT NULL DEFAULT FALSE,
  has_school_report BOOLEAN NOT NULL DEFAULT FALSE,
  has_income_proof BOOLEAN NOT NULL DEFAULT FALSE,
  has_bank_statement BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Additional Information
  special_circumstances TEXT,
  community_involvement TEXT,
  references_info TEXT,
  
  -- Application Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WALLET SYSTEM TABLES
-- =====================================================

-- Create enhanced wallets table
CREATE TABLE IF NOT EXISTS enhanced_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_weight_kg DECIMAL(8,3) NOT NULL DEFAULT 0.00,
  tier VARCHAR(50) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create legacy wallets table (for backward compatibility)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_points INTEGER NOT NULL DEFAULT 0,
  tier VARCHAR(50) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RECYCLING SYSTEM TABLES
-- =====================================================

-- Create materials table with updated rates
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  rate_per_kg DECIMAL(8,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert/Update materials with current market rates
INSERT INTO materials (name, category, rate_per_kg, description) VALUES
  ('PET Plastic Bottles', 'Plastic', 2.50, 'Clear plastic bottles and containers'),
  ('HDPE Plastic', 'Plastic', 3.00, 'High-density polyethylene containers'),
  ('Aluminum Cans', 'Metal', 15.00, 'Beverage and food cans'),
  ('Steel Cans', 'Metal', 8.00, 'Food and beverage steel containers'),
  ('Cardboard', 'Paper', 1.50, 'Corrugated cardboard boxes'),
  ('Office Paper', 'Paper', 2.00, 'White office paper and documents'),
  ('Newspaper', 'Paper', 1.00, 'Newsprint and magazines'),
  ('Glass Bottles', 'Glass', 1.50, 'Clear and colored glass containers'),
  ('Copper Wire', 'Metal', 45.00, 'Electrical copper wiring'),
  ('Batteries', 'Electronics', 5.00, 'Used household batteries'),
  ('Electronics', 'Electronics', 8.00, 'Small electronic devices'),
  ('Textiles', 'Fabric', 2.50, 'Used clothing and fabric materials')
ON CONFLICT (name) DO UPDATE SET
  rate_per_kg = EXCLUDED.rate_per_kg,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Create pickups table (if not exists)
CREATE TABLE IF NOT EXISTS pickups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  weight_kg DECIMAL(8,3) NOT NULL CHECK (weight_kg > 0),
  pickup_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user metrics table (if not exists)
CREATE TABLE IF NOT EXISTS user_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_recycled_kg DECIMAL(8,3) NOT NULL DEFAULT 0.00,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  co2_saved_kg DECIMAL(8,3) NOT NULL DEFAULT 0.00,
  water_saved_liters DECIMAL(8,3) NOT NULL DEFAULT 0.00,
  landfill_saved_kg DECIMAL(8,3) NOT NULL DEFAULT 0.00,
  last_calculation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Withdrawal indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);

-- Green Scholar Fund indexes
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON green_scholar_fund_donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON green_scholar_fund_donations(created_at);
CREATE INDEX IF NOT EXISTS idx_donations_status ON green_scholar_fund_donations(status);

CREATE INDEX IF NOT EXISTS idx_bottles_user_id ON green_scholar_fund_bottles(user_id);
CREATE INDEX IF NOT EXISTS idx_bottles_collection_date ON green_scholar_fund_bottles(collection_date);
CREATE INDEX IF NOT EXISTS idx_bottles_status ON green_scholar_fund_bottles(status);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON green_scholar_fund_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON green_scholar_fund_applications(status);

-- Wallet indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_wallets_user_id ON enhanced_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Materials and recycling indexes
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);
CREATE INDEX IF NOT EXISTS idx_pickups_user_id ON pickups(user_id);
CREATE INDEX IF NOT EXISTS idx_pickups_material_id ON pickups(material_id);
CREATE INDEX IF NOT EXISTS idx_pickups_date ON pickups(pickup_date);
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_id ON user_metrics(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_scholar_fund_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_scholar_fund_bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_scholar_fund_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_scholar_fund_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Withdrawal policies
DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users can view their own withdrawal requests" ON withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users can insert their own withdrawal requests" ON withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users can update their own withdrawal requests" ON withdrawal_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Bank reference policies (read-only for all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view bank information" ON withdrawal_banks;
CREATE POLICY "Authenticated users can view bank information" ON withdrawal_banks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Green Scholar Fund policies
DROP POLICY IF EXISTS "Users can view their own donations" ON green_scholar_fund_donations;
CREATE POLICY "Users can view their own donations" ON green_scholar_fund_donations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own donations" ON green_scholar_fund_donations;
CREATE POLICY "Users can insert their own donations" ON green_scholar_fund_donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own donations" ON green_scholar_fund_donations;
CREATE POLICY "Users can update their own donations" ON green_scholar_fund_donations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own bottle collections" ON green_scholar_fund_bottles;
CREATE POLICY "Users can view their own bottle collections" ON green_scholar_fund_bottles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bottle collections" ON green_scholar_fund_bottles;
CREATE POLICY "Users can insert their own bottle collections" ON green_scholar_fund_bottles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bottle collections" ON green_scholar_fund_bottles;
CREATE POLICY "Users can update their own bottle collections" ON green_scholar_fund_bottles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view fund stats" ON green_scholar_fund_stats;
CREATE POLICY "Authenticated users can view fund stats" ON green_scholar_fund_stats
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view their own applications" ON green_scholar_fund_applications;
CREATE POLICY "Users can view their own applications" ON green_scholar_fund_applications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own applications" ON green_scholar_fund_applications;
CREATE POLICY "Users can insert their own applications" ON green_scholar_fund_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own applications" ON green_scholar_fund_applications;
CREATE POLICY "Users can update their own applications" ON green_scholar_fund_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Wallet policies
DROP POLICY IF EXISTS "Users can view their own wallet" ON enhanced_wallets;
CREATE POLICY "Users can view their own wallet" ON enhanced_wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wallet" ON enhanced_wallets;
CREATE POLICY "Users can insert their own wallet" ON enhanced_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wallet" ON enhanced_wallets;
CREATE POLICY "Users can update their own wallet" ON enhanced_wallets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own wallet" ON wallets;
CREATE POLICY "Users can view their own wallet" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wallet" ON wallets;
CREATE POLICY "Users can insert their own wallet" ON wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wallet" ON wallets;
CREATE POLICY "Users can update their own wallet" ON wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Materials policies (read-only for all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view materials" ON materials;
CREATE POLICY "Authenticated users can view materials" ON materials
  FOR SELECT USING (auth.role() = 'authenticated');

-- Pickup and metrics policies
DROP POLICY IF EXISTS "Users can view their own pickups" ON pickups;
CREATE POLICY "Users can view their own pickups" ON pickups
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own pickups" ON pickups;
CREATE POLICY "Users can insert their own pickups" ON pickups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pickups" ON pickups;
CREATE POLICY "Users can update their own pickups" ON pickups
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own metrics" ON user_metrics;
CREATE POLICY "Users can view their own metrics" ON user_metrics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own metrics" ON user_metrics;
CREATE POLICY "Users can insert their own metrics" ON user_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own metrics" ON user_metrics;
CREATE POLICY "Users can update their own metrics" ON user_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS (MOVED TO END)
-- =====================================================
-- Note: Functions are created after all tables, indexes, and policies are created

-- =====================================================
-- COLUMN NAME FIXES (FOR EXISTING TABLES)
-- =====================================================

-- Fix column name mismatches in user_metrics table if it exists
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
  END IF;
  
  -- Check and rename total_earnings_rand to total_earnings (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_earnings_rand'
  ) THEN
    ALTER TABLE user_metrics RENAME COLUMN total_earnings_rand TO total_earnings;
    RAISE NOTICE 'Column total_earnings_rand renamed to total_earnings';
  END IF;
  
  -- Check and rename total_co2_saved to co2_saved_kg (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_co2_saved'
  ) THEN
    ALTER TABLE user_metrics RENAME COLUMN total_co2_saved TO co2_saved_kg;
    RAISE NOTICE 'Column total_co2_saved renamed to co2_saved_kg';
  END IF;
  
  -- Check and rename total_water_saved to water_saved_liters (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_water_saved'
  ) THEN
    ALTER TABLE user_metrics RENAME COLUMN total_water_saved TO water_saved_liters;
    RAISE NOTICE 'Column total_water_saved renamed to water_saved_liters';
  END IF;
  
  -- Check and rename total_landfill_saved to landfill_saved_kg (if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_landfill_saved'
  ) THEN
    ALTER TABLE user_metrics RENAME COLUMN total_landfill_saved TO landfill_saved_kg;
    RAISE NOTICE 'Column total_landfill_saved renamed to landfill_saved_kg';
  END IF;
  
  -- Verify the required columns exist after renaming, add them if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_earnings'
  ) THEN
    ALTER TABLE user_metrics ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00;
    RAISE NOTICE 'Added missing total_earnings column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'total_recycled_kg'
  ) THEN
    ALTER TABLE user_metrics ADD COLUMN IF NOT EXISTS total_recycled_kg DECIMAL(8,3) NOT NULL DEFAULT 0.00;
    RAISE NOTICE 'Added missing total_recycled_kg column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'co2_saved_kg'
  ) THEN
    ALTER TABLE user_metrics ADD COLUMN IF NOT EXISTS co2_saved_kg DECIMAL(8,3) NOT NULL DEFAULT 0.00;
    RAISE NOTICE 'Added missing co2_saved_kg column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'water_saved_liters'
  ) THEN
    ALTER TABLE user_metrics ADD COLUMN IF NOT EXISTS water_saved_liters DECIMAL(8,3) NOT NULL DEFAULT 0.00;
    RAISE NOTICE 'Added missing water_saved_liters column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_metrics' 
    AND column_name = 'landfill_saved_kg'
  ) THEN
    ALTER TABLE user_metrics ADD COLUMN IF NOT EXISTS landfill_saved_kg DECIMAL(8,3) NOT NULL DEFAULT 0.00;
    RAISE NOTICE 'Added missing landfill_saved_kg column';
  END IF;
END $$;

-- =====================================================
-- VIEWS
-- =====================================================

-- View for current fund status
CREATE OR REPLACE VIEW current_fund_status AS
SELECT 
  month_year,
  monthly_goal,
  total_donations,
  total_bottle_value,
  total_fund,
  ROUND((total_fund / monthly_goal) * 100, 2) as progress_percentage,
  monthly_goal - total_fund as remaining_amount,
  beneficiaries_count,
  created_at,
  updated_at
FROM green_scholar_fund_stats
WHERE month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

-- View for user wallet summary
CREATE OR REPLACE VIEW user_wallet_summary AS
SELECT 
  w.user_id,
  COALESCE(w.balance, 0) as wallet_balance,
  COALESCE(w.total_points, 0) as total_points,
  COALESCE(w.tier, 'bronze') as current_tier,
  COALESCE(um.total_recycled_kg, 0) as total_recycled_kg,
  COALESCE(um.total_earnings, 0) as total_earnings,
  COALESCE(um.co2_saved_kg, 0) as co2_saved_kg,
  COALESCE(um.water_saved_liters, 0) as water_saved_liters,
  COALESCE(um.landfill_saved_kg, 0) as landfill_saved_kg
FROM wallets w
LEFT JOIN user_metrics um ON w.user_id = um.user_id
UNION ALL
SELECT 
  ew.user_id,
  COALESCE(ew.balance, 0) as wallet_balance,
  COALESCE(ew.total_points, 0) as total_points,
  COALESCE(ew.tier, 'bronze') as current_tier,
  COALESCE(um.total_recycled_kg, 0) as total_recycled_kg,
  COALESCE(um.total_earnings, 0) as total_earnings,
  COALESCE(um.co2_saved_kg, 0) as co2_saved_kg,
  COALESCE(um.water_saved_liters, 0) as water_saved_liters,
  COALESCE(um.landfill_saved_kg, 0) as landfill_saved_kg
FROM enhanced_wallets ew
LEFT JOIN user_metrics um ON ew.user_id = um.user_id;

-- =====================================================
-- FUNCTIONS (CREATED BEFORE PERMISSIONS)
-- =====================================================

-- Function to get user's total bottle contributions
CREATE OR REPLACE FUNCTION get_user_bottle_contributions(user_uuid UUID)
RETURNS TABLE(
  total_bottles INTEGER,
  total_weight DECIMAL(8,3),
  total_value DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(bottle_count), 0)::INTEGER,
    COALESCE(SUM(weight_kg), 0.00),
    COALESCE(SUM(weight_kg * 2.00), 0.00)
  FROM green_scholar_fund_bottles
  WHERE user_id = user_uuid AND status = 'verified';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert initial fund stats for current month
INSERT INTO green_scholar_fund_stats (month_year, monthly_goal, total_donations, total_bottle_value, total_fund)
VALUES (TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 50000.00, 0.00, 0.00, 0.00)
ON CONFLICT (month_year) DO NOTHING;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON withdrawal_requests TO authenticated;
GRANT SELECT ON withdrawal_banks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON green_scholar_fund_donations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON green_scholar_fund_bottles TO authenticated;
GRANT SELECT ON green_scholar_fund_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON green_scholar_fund_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON enhanced_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON wallets TO authenticated;
GRANT SELECT ON materials TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pickups TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_metrics TO authenticated;
GRANT SELECT ON current_fund_status TO authenticated;
GRANT SELECT ON user_wallet_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_bottle_contributions(UUID) TO authenticated;

-- =====================================================
-- SCHEMA VERSION TRACKING
-- =====================================================

-- Create schema version table
CREATE TABLE IF NOT EXISTS schema_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert current schema version
INSERT INTO schema_versions (version, description) VALUES 
('2.0.0', 'Complete WozaMali schema with withdrawal system, Green Scholar Fund, and enhanced wallet functionality')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCTIONS AND TRIGGERS (CREATED AFTER ALL TABLES)
-- =====================================================

-- Simple test function to check if basic function creation works
CREATE OR REPLACE FUNCTION test_function()
RETURNS TEXT AS $$
BEGIN
  RETURN 'Function created successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to update wallet balance and points
CREATE OR REPLACE FUNCTION update_wallet_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple placeholder function for now
  -- We'll implement the full logic after confirming function creation works
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update Green Scholar Fund statistics
CREATE OR REPLACE FUNCTION update_green_scholar_fund_stats()
RETURNS TRIGGER AS $$
DECLARE
  current_month VARCHAR(7);
  bottle_value DECIMAL(10,2);
BEGIN
  -- Get current month-year
  current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  -- Calculate bottle value (assuming R2 per kg for PET bottles)
  IF TG_TABLE_NAME = 'green_scholar_fund_bottles' THEN
    IF TG_OP = 'INSERT' THEN
      bottle_value := NEW.weight_kg * 2.00;
    ELSIF TG_OP = 'UPDATE' THEN
      bottle_value := (NEW.weight_kg - OLD.weight_kg) * 2.00;
    ELSIF TG_OP = 'DELETE' THEN
      bottle_value := -OLD.weight_kg * 2.00;
    END IF;
  END IF;
  
  -- Insert or update monthly stats
  INSERT INTO green_scholar_fund_stats (month_year, total_bottle_value, total_fund)
  VALUES (current_month, COALESCE(bottle_value, 0), 0)
  ON CONFLICT (month_year)
  DO UPDATE SET
    total_bottle_value = green_scholar_fund_stats.total_bottle_value + COALESCE(bottle_value, 0),
    total_fund = green_scholar_fund_stats.total_donations + green_scholar_fund_stats.total_bottle_value,
    updated_at = NOW();
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update donation stats
CREATE OR REPLACE FUNCTION update_donation_stats()
RETURNS TRIGGER AS $$
DECLARE
  current_month VARCHAR(7);
  donation_amount DECIMAL(10,2);
BEGIN
  -- Get current month-year
  current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  -- Calculate donation amount
  IF TG_OP = 'INSERT' THEN
    donation_amount := NEW.amount;
  ELSIF TG_OP = 'UPDATE' THEN
    donation_amount := NEW.amount - OLD.amount;
  ELSIF TG_OP = 'DELETE' THEN
    donation_amount := -OLD.amount;
  END IF;
  
  -- Insert or update monthly stats
  INSERT INTO green_scholar_fund_stats (month_year, total_donations, total_fund)
  VALUES (current_month, COALESCE(donation_amount, 0), 0)
  ON CONFLICT (month_year)
  DO UPDATE SET
    total_donations = green_scholar_fund_stats.total_donations + COALESCE(donation_amount, 0),
    total_fund = green_scholar_fund_stats.total_donations + green_scholar_fund_stats.total_bottle_value,
    updated_at = NOW();
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for updating user metrics when pickups change
DROP TRIGGER IF EXISTS trigger_update_user_metrics ON pickups;
CREATE TRIGGER trigger_update_user_metrics
  AFTER INSERT OR UPDATE OR DELETE ON pickups
  FOR EACH ROW EXECUTE FUNCTION update_wallet_metrics();

-- Trigger for updating Green Scholar Fund bottle statistics
DROP TRIGGER IF EXISTS trigger_update_bottle_stats ON green_scholar_fund_bottles;
CREATE TRIGGER trigger_update_bottle_stats
  AFTER INSERT OR UPDATE OR DELETE ON green_scholar_fund_bottles
  FOR EACH ROW EXECUTE FUNCTION update_green_scholar_fund_stats();

-- Trigger for updating donation statistics
DROP TRIGGER IF EXISTS trigger_update_donation_stats ON green_scholar_fund_donations;
CREATE TRIGGER trigger_update_donation_stats
  AFTER INSERT OR UPDATE OR DELETE ON green_scholar_fund_donations
  FOR EACH ROW EXECUTE FUNCTION update_donation_stats();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'WozaMali Supabase schema update completed successfully!';
  RAISE NOTICE 'Version: 2.0.0';
  RAISE NOTICE 'Tables created: withdrawal_requests, withdrawal_banks, green_scholar_fund_*, enhanced_wallets, materials, pickups, user_metrics';
  RAISE NOTICE 'RLS policies enabled for all tables';
  RAISE NOTICE 'Functions and triggers created for automatic calculations';
  RAISE NOTICE 'Views created for easy data access';
  RAISE NOTICE 'Initial data populated for banks and materials';
END $$;
