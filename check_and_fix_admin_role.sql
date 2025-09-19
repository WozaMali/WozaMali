-- Check and fix admin role assignment
-- This script ensures the current user has admin role for soft delete functionality

-- 1. Check current user roles
SELECT 
  u.id as user_id,
  u.email,
  array_agg(ur.role) as roles,
  bool_or(ur.role IN ('admin', 'super_admin')) as has_admin_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = auth.uid()
GROUP BY u.id, u.email;

-- 2. Assign admin role to current user if not already assigned
INSERT INTO public.user_roles (user_id, role) 
SELECT auth.uid(), 'admin'
WHERE auth.uid() IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );

-- 3. Verify the assignment
SELECT 
  u.id as user_id,
  u.email,
  array_agg(ur.role) as roles,
  bool_or(ur.role IN ('admin', 'super_admin')) as has_admin_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = auth.uid()
GROUP BY u.id, u.email;

-- 4. Test the has_any_role function
SELECT public.has_any_role(ARRAY['admin', 'super_admin']) as can_soft_delete;

SELECT 'Admin role check and assignment completed!' as result;
