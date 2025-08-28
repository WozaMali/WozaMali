-- Find Your User ID for Wallet Setup
-- Run this in Supabase SQL Editor to get your user ID

-- Option 1: If you know your email
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users 
WHERE email = 'your-email@example.com'; -- Replace with your actual email

-- Option 2: List all users (if you're not sure which one is yours)
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC;

-- Option 3: Find users created recently
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
