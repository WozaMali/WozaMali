-- WozaMoney Supabase Diagnostic Script
-- Run this first to see what's actually in your database

-- 1. Check what tables exist in the public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check the structure of each table
-- Profiles table
SELECT 
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Wallets table
SELECT 
  'wallets' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'wallets'
ORDER BY ordinal_position;

-- Password reset tokens table
SELECT 
  'password_reset_tokens' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'password_reset_tokens'
ORDER BY ordinal_position;

-- User sessions table
SELECT 
  'user_sessions' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_sessions'
ORDER BY ordinal_position;

-- User activity log table
SELECT 
  'user_activity_log' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_activity_log'
ORDER BY ordinal_position;

-- Email templates table
SELECT 
  'email_templates' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'email_templates'
ORDER BY ordinal_position;

-- Email logs table
SELECT 
  'email_logs' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'email_logs'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'wallets', 'password_reset_tokens', 'user_sessions', 'user_activity_log', 'email_templates', 'email_logs');

-- 4. Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Check auth.users table structure
SELECT 
  'auth.users' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 6. Check if any data exists
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT 
  'wallets' as table_name,
  COUNT(*) as record_count
FROM public.wallets
UNION ALL
SELECT 
  'auth.users' as table_name,
  COUNT(*) as record_count
FROM auth.users;
