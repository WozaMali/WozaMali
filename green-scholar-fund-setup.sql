-- Green Scholar Fund Database Setup
-- This script creates the necessary tables and RLS policies for the Green Scholar Fund

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON green_scholar_fund_donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON green_scholar_fund_donations(created_at);
CREATE INDEX IF NOT EXISTS idx_donations_status ON green_scholar_fund_donations(status);

CREATE INDEX IF NOT EXISTS idx_bottles_user_id ON green_scholar_fund_bottles(user_id);
CREATE INDEX IF NOT EXISTS idx_bottles_collection_date ON green_scholar_fund_bottles(collection_date);
CREATE INDEX IF NOT EXISTS idx_bottles_status ON green_scholar_fund_bottles(status);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON green_scholar_fund_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON green_scholar_fund_applications(status);

-- Enable Row Level Security (RLS)
ALTER TABLE green_scholar_fund_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_scholar_fund_bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_scholar_fund_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_scholar_fund_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donations
CREATE POLICY "Users can view their own donations" ON green_scholar_fund_donations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own donations" ON green_scholar_fund_donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own donations" ON green_scholar_fund_donations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for bottles
CREATE POLICY "Users can view their own bottle collections" ON green_scholar_fund_bottles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bottle collections" ON green_scholar_fund_bottles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bottle collections" ON green_scholar_fund_bottles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for fund stats (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view fund stats" ON green_scholar_fund_stats
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for applications
CREATE POLICY "Users can view their own applications" ON green_scholar_fund_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON green_scholar_fund_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" ON green_scholar_fund_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update fund statistics
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

-- Create function to update donation stats
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

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_bottle_stats ON green_scholar_fund_bottles;
CREATE TRIGGER trigger_update_bottle_stats
  AFTER INSERT OR UPDATE OR DELETE ON green_scholar_fund_bottles
  FOR EACH ROW EXECUTE FUNCTION update_green_scholar_fund_stats();

DROP TRIGGER IF EXISTS trigger_update_donation_stats ON green_scholar_fund_donations;
CREATE TRIGGER trigger_update_donation_stats
  AFTER INSERT OR UPDATE OR DELETE ON green_scholar_fund_donations
  FOR EACH ROW EXECUTE FUNCTION update_donation_stats();

-- Insert initial fund stats for current month
INSERT INTO green_scholar_fund_stats (month_year, monthly_goal, total_donations, total_bottle_value, total_fund)
VALUES (TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 50000.00, 0.00, 0.00, 0.00)
ON CONFLICT (month_year) DO NOTHING;

-- Create view for current fund status
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON green_scholar_fund_donations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON green_scholar_fund_bottles TO authenticated;
GRANT SELECT ON green_scholar_fund_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON green_scholar_fund_applications TO authenticated;
GRANT SELECT ON current_fund_status TO authenticated;

-- Create function to get user's total bottle contributions
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_bottle_contributions(UUID) TO authenticated;
