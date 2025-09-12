-- Clean RLS fix for collection_pickups

-- Disable RLS
ALTER TABLE collection_pickups DISABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON collection_pickups TO authenticated;
GRANT ALL ON pickup_items TO authenticated;
GRANT ALL ON materials TO authenticated;

-- Check status
SELECT 'RLS disabled and permissions granted' as status;
