# Office App User Display Fix Guide

## Issues Identified

The office app is not displaying users due to several problems:

1. **RLS (Row Level Security) Policies**: Supabase tables have RLS enabled, blocking access
2. **Field Name Mismatches**: Code was trying to access fields that don't exist in the current schema
3. **Import Path Issues**: Some components were importing from wrong paths
4. **Error Handling**: Poor error handling made debugging difficult

## Fixes Applied

### 1. Fixed Import Paths
- Updated test-connection page to use correct Supabase import
- Fixed admin services to use proper type imports

### 2. Fixed Field Name Mismatches
- Changed `user.is_active` to `user.status === 'active'`
- Updated role filters to use correct values: `member`, `collector`, `admin`, `office_staff`
- Fixed status handling to work with `status` field instead of `is_active`

### 3. Improved Error Handling
- Added error state to UsersPage component
- Added error display with retry functionality
- Enhanced subscription error handling in admin services

### 4. Updated Admin Services
- Fixed `getUsers()` function to select all fields
- Enhanced `updateUserRole()` function with proper timestamp updates
- Added error handling to real-time subscriptions

## Required Database Changes

### Step 1: Disable RLS Temporarily
Run this SQL in your Supabase SQL Editor:

```sql
-- Temporarily disable RLS on user_profiles table
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- Test access
SELECT COUNT(*) as total_users FROM public.user_profiles;
```

### Step 2: Verify Table Structure
Ensure your `user_profiles` table has these fields:
- `id` (string)
- `email` (string)
- `full_name` (string)
- `phone` (string, nullable)
- `role` (enum: 'member', 'collector', 'admin', 'office_staff')
- `status` (enum: 'active', 'inactive', 'suspended')
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Testing the Fix

1. **Run the SQL script** to disable RLS
2. **Restart the office app** if needed
3. **Navigate to Admin Dashboard** → Users page
4. **Check browser console** for any remaining errors
5. **Test the test-connection page** to verify Supabase connectivity

## Expected Results

After applying these fixes:
- Users should display in the admin dashboard
- Real-time updates should work
- Error messages should be clear and actionable
- Role and status filters should work correctly

## Security Note

**IMPORTANT**: Disabling RLS removes security restrictions. This is a temporary fix for development. For production:

1. Implement proper RLS policies
2. Use service role keys for admin operations
3. Implement proper authentication and authorization
4. Re-enable RLS with appropriate policies

## Re-enabling RLS (When Ready)

```sql
-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Add appropriate policies
-- Example: Allow authenticated users to read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Example: Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Troubleshooting

If users still don't display:

1. **Check browser console** for JavaScript errors
2. **Verify Supabase credentials** in `.env.local`
3. **Test database connection** using the test-connection page
4. **Check RLS status** in Supabase dashboard
5. **Verify table permissions** for the anon role

## Files Modified

- `apps/office/app/test-connection/page.tsx` - Fixed import path
- `apps/office/src/components/admin/UsersPage.tsx` - Fixed field names and error handling
- `apps/office/src/lib/admin-services.ts` - Enhanced error handling and field selection
- `apps/office/app/admin/AdminDashboardClient.tsx` - Fixed dashboard field references
