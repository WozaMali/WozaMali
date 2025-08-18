-- WozaMoney Database Migration
-- Run this if you already have an existing profiles table

-- Add new address columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS suburb TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Add new address columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ext_zone_phase TEXT;

-- Make full_name NOT NULL if it isn't already
ALTER TABLE public.profiles 
ALTER COLUMN full_name SET NOT NULL;

-- Update the handle_new_user function to handle new fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    street_address,
    suburb,
    ext_zone_phase,
    city,
    postal_code
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'street_address',
    NEW.raw_user_meta_data->>'suburb',
    NEW.raw_user_meta_data->>'ext_zone_phase',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'postal_code'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
