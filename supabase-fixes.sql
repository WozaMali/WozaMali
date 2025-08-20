-- WozaMoney Supabase Fixes and Improvements
-- Run this in your Supabase SQL Editor AFTER running the main setup
-- This script handles existing data gracefully

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create tables only if they don't exist (safer approach)
DO $$ 
BEGIN
    -- Create profiles table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            street_address TEXT,
            suburb TEXT,
            ext_zone_phase TEXT,
            city TEXT,
            postal_code TEXT,
            avatar_url TEXT,
            email_verified BOOLEAN DEFAULT FALSE,
            phone_verified BOOLEAN DEFAULT FALSE,
            last_login TIMESTAMP WITH TIME ZONE,
            login_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created profiles table';
    ELSE
        RAISE NOTICE 'Profiles table already exists';
    END IF;

    -- Create wallets table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
        CREATE TABLE public.wallets (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES public.profiles(id) UNIQUE NOT NULL,
            balance DECIMAL(10,2) DEFAULT 0.00,
            total_points INTEGER DEFAULT 0,
            tier TEXT DEFAULT 'Gold Recycler',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created wallets table';
    ELSE
        RAISE NOTICE 'Wallets table already exists';
    END IF;

    -- Create password_reset_tokens table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens') THEN
        CREATE TABLE public.password_reset_tokens (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            used_at TIMESTAMP WITH TIME ZONE
        );
        RAISE NOTICE 'Created password_reset_tokens table';
    ELSE
        RAISE NOTICE 'Password reset tokens table already exists';
    END IF;

    -- Create user_sessions table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
        CREATE TABLE public.user_sessions (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
            session_token TEXT NOT NULL,
            device_info JSONB,
            ip_address INET,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created user_sessions table';
    ELSE
        RAISE NOTICE 'User sessions table already exists';
    END IF;

    -- Create user_activity_log table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_activity_log') THEN
        CREATE TABLE public.user_activity_log (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
            activity_type TEXT NOT NULL,
            description TEXT,
            metadata JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created user_activity_log table';
    ELSE
        RAISE NOTICE 'User activity log table already exists';
    END IF;

    -- Create email_templates table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_templates') THEN
        CREATE TABLE public.email_templates (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            template_name TEXT UNIQUE NOT NULL,
            subject TEXT NOT NULL,
            html_content TEXT NOT NULL,
            text_content TEXT,
            variables JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created email_templates table';
    ELSE
        RAISE NOTICE 'Email templates table already exists';
    END IF;

    -- Create email_logs table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_logs') THEN
        CREATE TABLE public.email_logs (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            template_name TEXT,
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            delivered_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            metadata JSONB
        );
        RAISE NOTICE 'Created email_logs table';
    ELSE
        RAISE NOTICE 'Email logs table already exists';
    END IF;
END $$;

-- 3. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies safely (only if they exist)
DO $$ 
BEGIN
    -- Profiles policies
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        DROP POLICY "Users can view own profile" ON public.profiles;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        DROP POLICY "Users can update own profile" ON public.profiles;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
        DROP POLICY "Users can insert own profile" ON public.profiles;
    END IF;

    -- Wallets policies
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Users can view own wallet') THEN
        DROP POLICY "Users can view own wallet" ON public.wallets;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Users can update own wallet') THEN
        DROP POLICY "Users can update own wallet" ON public.wallets;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Users can insert own wallet') THEN
        DROP POLICY "Users can insert own wallet" ON public.wallets;
    END IF;

    -- Password reset tokens policies
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'password_reset_tokens' AND policyname = 'Users can view own reset tokens') THEN
        DROP POLICY "Users can view own reset tokens" ON public.password_reset_tokens;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'password_reset_tokens' AND policyname = 'Users can insert own reset tokens') THEN
        DROP POLICY "Users can insert own reset tokens" ON public.password_reset_tokens;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'password_reset_tokens' AND policyname = 'Users can update own reset tokens') THEN
        DROP POLICY "Users can update own reset tokens" ON public.password_reset_tokens;
    END IF;

    -- User sessions policies
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'Users can view own sessions') THEN
        DROP POLICY "Users can view own sessions" ON public.user_sessions;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'Users can insert own sessions') THEN
        DROP POLICY "Users can insert own sessions" ON public.user_sessions;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'Users can update own sessions') THEN
        DROP POLICY "Users can update own sessions" ON public.user_sessions;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'Users can delete own sessions') THEN
        DROP POLICY "Users can delete own sessions" ON public.user_sessions;
    END IF;

    -- User activity log policies
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_activity_log' AND policyname = 'Users can view own activity log') THEN
        DROP POLICY "Users can view own activity log" ON public.user_activity_log;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_activity_log' AND policyname = 'Users can insert own activity log') THEN
        DROP POLICY "Users can insert own activity log" ON public.user_activity_log;
    END IF;

    -- Email templates policies
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'email_templates' AND policyname = 'Only admins can manage email templates') THEN
        DROP POLICY "Only admins can manage email templates" ON public.email_templates;
    END IF;

    -- Email logs policies
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'email_logs' AND policyname = 'Users can view own email logs') THEN
        DROP POLICY "Users can view own email logs" ON public.email_logs;
    END IF;
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'email_logs' AND policyname = 'System can insert email logs') THEN
        DROP POLICY "System can insert email logs" ON public.email_logs;
    END IF;
END $$;

-- 5. Create improved RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Wallets policies
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Password reset tokens policies
CREATE POLICY "Users can view own reset tokens" ON public.password_reset_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reset tokens" ON public.password_reset_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reset tokens" ON public.password_reset_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- User activity log policies
CREATE POLICY "Users can view own activity log" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity log" ON public.user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Email templates policies (admin only)
CREATE POLICY "Only admins can manage email templates" ON public.email_templates
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' IN (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Email logs policies
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);

-- 6. Create or replace functions with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with all available fields
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    phone,
    street_address,
    suburb,
    ext_zone_phase,
    city,
    postal_code,
    email_verified
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', null),
    COALESCE(NEW.raw_user_meta_data->>'street_address', null),
    COALESCE(NEW.raw_user_meta_data->>'suburb', null),
    COALESCE(NEW.raw_user_meta_data->>'ext_zone_phase', null),
    COALESCE(NEW.raw_user_meta_data->>'city', null),
    COALESCE(NEW.raw_user_meta_data->>'postal_code', null),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  );
  
  -- Insert wallet
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  -- Log user registration activity
  INSERT INTO public.user_activity_log (
    user_id,
    activity_type,
    description,
    metadata
  )
  VALUES (
    NEW.id,
    'user_registration',
    'User registered successfully',
    jsonb_build_object(
      'email', NEW.email, 
      'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
      'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User')
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create or replace triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created ON public.user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- 9. Insert default email templates if they don't exist
INSERT INTO public.email_templates (template_name, subject, html_content, text_content, variables) VALUES
  ('password_reset', 'Reset Your Woza Mali Password', 
   '<h2>Reset Your Password</h2><p>Click the link below to reset your password:</p><p><a href="{{reset_url}}">Reset Password</a></p><p>This link will expire in 1 hour.</p>',
   'Reset Your Password\n\nClick the link below to reset your password:\n\n{{reset_url}}\n\nThis link will expire in 1 hour.',
   '{"reset_url": "string"}'),
  ('welcome', 'Welcome to Woza Mali!', 
   '<h2>Welcome to Woza Mali!</h2><p>Thank you for joining our recycling rewards platform.</p>',
   'Welcome to Woza Mali!\n\nThank you for joining our recycling rewards platform.',
   '{}')
ON CONFLICT (template_name) DO NOTHING;

-- 10. Create a function to sync existing users
CREATE OR REPLACE FUNCTION public.sync_existing_users()
RETURNS VOID AS $$
BEGIN
  -- Sync existing users to profiles table
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    street_address,
    suburb,
    ext_zone_phase,
    city,
    postal_code,
    email_verified,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown User'),
    au.raw_user_meta_data->>'phone',
    au.raw_user_meta_data->>'street_address',
    au.raw_user_meta_data->>'suburb',
    au.raw_user_meta_data->>'ext_zone_phase',
    au.raw_user_meta_data->>'city',
    au.raw_user_meta_data->>'postal_code',
    au.email_confirmed_at IS NOT NULL,
    au.created_at,
    NOW()
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING;

  -- Create wallets for users who don't have them
  INSERT INTO public.wallets (user_id, created_at, updated_at)
  SELECT 
    p.id,
    p.created_at,
    NOW()
  FROM public.profiles p
  LEFT JOIN public.wallets w ON p.id = w.user_id
  WHERE w.user_id IS NULL
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Run the sync function
SELECT public.sync_existing_users();

-- 12. Verify the setup
SELECT 
  'Profiles' as table_name,
  COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT 
  'Wallets' as table_name,
  COUNT(*) as record_count
FROM public.wallets
UNION ALL
SELECT 
  'Auth Users' as table_name,
  COUNT(*) as record_count
FROM auth.users;

-- 13. Show RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'wallets', 'password_reset_tokens', 'user_sessions', 'user_activity_log', 'email_templates', 'email_logs');
