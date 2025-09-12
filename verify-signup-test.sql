-- Verification script to check signup test results
-- Run this AFTER testing the signup flow

-- 1. Check new user was created
SELECT 'Checking new user creation...' as status;
SELECT 
  id,
  first_name,
  last_name,
  full_name,
  email,
  phone,
  city,
  postal_code,
  status,
  created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check user role assignment
SELECT 'Checking user role assignment...' as status;
SELECT 
  u.id,
  u.full_name,
  u.email,
  r.name as role_name,
  r.description as role_description
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
ORDER BY u.created_at DESC 
LIMIT 5;

-- 3. Check township assignment
SELECT 'Checking township assignment...' as status;
SELECT 
  u.id,
  u.full_name,
  u.email,
  a.name as township_name,
  a.postal_code,
  u.subdivision,
  u.city
FROM public.users u
LEFT JOIN public.areas a ON u.township_id = a.id
ORDER BY u.created_at DESC 
LIMIT 5;

-- 4. Check address completeness
SELECT 'Checking address completeness...' as status;
SELECT 
  CASE 
    WHEN u.township_id IS NOT NULL AND u.subdivision IS NOT NULL THEN 'Complete'
    WHEN u.suburb IS NOT NULL THEN 'Legacy'
    ELSE 'Incomplete'
  END as address_status,
  COUNT(*) as user_count
FROM public.users u
GROUP BY 
  CASE 
    WHEN u.township_id IS NOT NULL AND u.subdivision IS NOT NULL THEN 'Complete'
    WHEN u.suburb IS NOT NULL THEN 'Legacy'
    ELSE 'Incomplete'
  END;

-- 5. Check residents view
SELECT 'Checking residents view...' as status;
SELECT 
  id,
  full_name,
  email,
  township_name,
  subdivision,
  city,
  postal_code,
  address_status
FROM residents_view 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Test township dropdown functionality
SELECT 'Testing township dropdown...' as status;
SELECT 
  id,
  township_name,
  postal_code,
  city,
  array_length(subdivisions, 1) as subdivision_count
FROM township_dropdown 
WHERE township_name LIKE '%Dobsonville%'
LIMIT 1;

-- 7. Test subdivision dropdown functionality
SELECT 'Testing subdivision dropdown...' as status;
SELECT 
  area_id,
  township_name,
  subdivision,
  postal_code
FROM subdivision_dropdown 
WHERE township_name = 'Dobsonville'
ORDER BY subdivision
LIMIT 5;

-- 8. Check for any errors in user creation
SELECT 'Checking for user creation errors...' as status;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as users_with_first_name,
  COUNT(CASE WHEN last_name IS NOT NULL THEN 1 END) as users_with_last_name,
  COUNT(CASE WHEN township_id IS NOT NULL THEN 1 END) as users_with_township,
  COUNT(CASE WHEN subdivision IS NOT NULL THEN 1 END) as users_with_subdivision,
  COUNT(CASE WHEN city = 'Soweto' THEN 1 END) as users_in_soweto
FROM public.users;

-- 9. Check recent activity
SELECT 'Recent user activity...' as status;
SELECT 
  u.full_name,
  u.email,
  u.created_at,
  r.name as role,
  a.name as township
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
LEFT JOIN public.areas a ON u.township_id = a.id
WHERE u.created_at > NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC;
