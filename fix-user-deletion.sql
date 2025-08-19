-- Fix User Deletion Issues in Supabase
-- Run this in your Supabase SQL Editor

-- 1. Add DELETE policies for profiles table
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE USING (auth.uid() = id);

-- 2. Add DELETE policies for wallets table  
CREATE POLICY "Users can delete own wallet" ON public.wallets
FOR DELETE USING (auth.uid() = user_id);

-- 3. Add DELETE policies for password_reset_tokens table
CREATE POLICY "Users can delete own reset tokens" ON public.password_reset_tokens
FOR DELETE USING (auth.uid() = user_id);

-- 4. Add DELETE policies for user_activity_log table
CREATE POLICY "Users can delete own activity log" ON public.user_activity_log
FOR DELETE USING (auth.uid() = user_id);

-- 5. Add DELETE policies for email_logs table
CREATE POLICY "Users can delete own email logs" ON public.email_logs
FOR DELETE USING (auth.uid() = user_id);

-- 6. Create admin role for managing all users (optional but recommended)
CREATE ROLE IF NOT EXISTS admin_role;

-- 7. Grant admin permissions to admin_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin_role;

-- 8. Create admin policies for managing all users (if you have admin users)
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage all wallets" ON public.wallets
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- 9. Create a function to safely delete users and all related data
CREATE OR REPLACE FUNCTION delete_user_completely(user_id_to_delete UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if current user is admin or the user themselves
  SELECT COALESCE(raw_user_meta_data->>'role', 'user') INTO current_user_role
  FROM auth.users 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' AND auth.uid() != user_id_to_delete THEN
    RAISE EXCEPTION 'Access denied: Only admins or the user themselves can delete accounts';
  END IF;
  
  -- Delete from all related tables first (due to foreign key constraints)
  DELETE FROM public.email_logs WHERE user_id = user_id_to_delete;
  DELETE FROM public.user_activity_log WHERE user_id = user_id_to_delete;
  DELETE FROM public.user_sessions WHERE user_id = user_id_to_delete;
  DELETE FROM public.password_reset_tokens WHERE user_id = user_id_to_delete;
  DELETE FROM public.wallets WHERE user_id = user_id_to_delete;
  DELETE FROM public.profiles WHERE id = user_id_to_delete;
  
  -- Note: auth.users deletion must be done through Supabase Auth API or Dashboard
  -- This function only deletes the public schema data
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting user: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant execute permission on the delete function
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;

-- 11. Create a view to see all users (for admin purposes)
CREATE OR REPLACE VIEW admin_users_view AS
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  au.last_sign_in_at,
  au.raw_user_meta_data,
  p.full_name,
  p.phone,
  p.city,
  p.status,
  w.balance,
  w.tier
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.wallets w ON au.id = w.user_id;

-- 12. Grant access to admin view
GRANT SELECT ON admin_users_view TO admin_role;

-- 13. Create a function to soft delete users (mark as deleted instead of hard delete)
CREATE OR REPLACE FUNCTION soft_delete_user(user_id_to_delete UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if current user is admin or the user themselves
  SELECT COALESCE(raw_user_meta_data->>'role', 'user') INTO current_user_role
  FROM auth.users 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' AND auth.uid() != user_id_to_delete THEN
    RAISE EXCEPTION 'Access denied: Only admins or the user themselves can soft delete accounts';
  END IF;
  
  -- Update profile status to deleted
  UPDATE public.profiles 
  SET status = 'deleted', updated_at = NOW()
  WHERE id = user_id_to_delete;
  
  -- Log the soft deletion
  INSERT INTO public.user_activity_log (
    user_id, 
    activity_type, 
    description, 
    metadata
  ) VALUES (
    user_id_to_delete,
    'account_soft_deleted',
    'User account marked as deleted',
    jsonb_build_object(
      'deleted_by', auth.uid(),
      'deleted_at', NOW()
    )
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error soft deleting user: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant execute permission on soft delete function
GRANT EXECUTE ON FUNCTION soft_delete_user(UUID) TO authenticated;

-- 15. Create a function to restore soft-deleted users
CREATE OR REPLACE FUNCTION restore_user(user_id_to_restore UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Only admins can restore users
  SELECT COALESCE(raw_user_meta_data->>'role', 'user') INTO current_user_role
  FROM auth.users 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can restore users';
  END IF;
  
  -- Update profile status back to active
  UPDATE public.profiles 
  SET status = 'active', updated_at = NOW()
  WHERE id = user_id_to_restore;
  
  -- Log the restoration
  INSERT INTO public.user_activity_log (
    user_id, 
    activity_type, 
    description, 
    metadata
  ) VALUES (
    user_id_to_restore,
    'account_restored',
    'User account restored from deleted status',
    jsonb_build_object(
      'restored_by', auth.uid(),
      'restored_at', NOW()
    )
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error restoring user: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Grant execute permission on restore function
GRANT EXECUTE ON FUNCTION restore_user(UUID) TO admin_role;

-- 17. Create a view to see only active users
CREATE OR REPLACE VIEW active_users_view AS
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  au.last_sign_in_at,
  au.raw_user_meta_data,
  p.full_name,
  p.phone,
  p.city,
  p.status,
  w.balance,
  w.tier
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.wallets w ON au.id = w.user_id
WHERE p.status = 'active' OR p.status IS NULL;

-- 18. Grant access to active users view
GRANT SELECT ON active_users_view TO authenticated;

-- 19. Create a view to see deleted users (admin only)
CREATE OR REPLACE VIEW deleted_users_view AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  p.full_name,
  p.phone,
  p.city,
  p.status,
  p.updated_at as deleted_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.status = 'deleted';

-- 20. Grant access to deleted users view (admin only)
GRANT SELECT ON deleted_users_view TO admin_role;

-- Summary of what this script does:
-- ✅ Adds DELETE policies for all tables
-- ✅ Creates admin role and policies
-- ✅ Provides hard delete function (delete_user_completely)
-- ✅ Provides soft delete function (soft_delete_user) 
-- ✅ Provides restore function (restore_user)
-- ✅ Creates admin views for user management
-- ✅ Handles foreign key constraints properly

-- To use these functions:
-- 1. Hard delete: SELECT delete_user_completely('user-uuid-here');
-- 2. Soft delete: SELECT soft_delete_user('user-uuid-here');
-- 3. Restore: SELECT restore_user('user-uuid-here');
-- 4. View users: SELECT * FROM admin_users_view;
-- 5. View active users: SELECT * FROM active_users_view;
-- 6. View deleted users: SELECT * FROM deleted_users_view;
