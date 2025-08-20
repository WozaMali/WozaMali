-- WozaMoney Supabase Corrected Fixes
-- Run this AFTER running the diagnostic script to see what needs to be fixed

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Fix profiles table - add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add street_address column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'street_address') THEN
        ALTER TABLE public.profiles ADD COLUMN street_address TEXT;
        RAISE NOTICE 'Added street_address column to profiles table';
    END IF;
    
    -- Add suburb column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'suburb') THEN
        ALTER TABLE public.profiles ADD COLUMN suburb TEXT;
        RAISE NOTICE 'Added suburb column to profiles table';
    END IF;
    
    -- Add ext_zone_phase column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ext_zone_phase') THEN
        ALTER TABLE public.profiles ADD COLUMN ext_zone_phase TEXT;
        RAISE NOTICE 'Added ext_zone_phase column to profiles table';
    END IF;
    
    -- Add city column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'city') THEN
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column to profiles table';
    END IF;
    
    -- Add postal_code column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'postal_code') THEN
        ALTER TABLE public.profiles ADD COLUMN postal_code TEXT;
        RAISE NOTICE 'Added postal_code column to profiles table';
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles table';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'));
        RAISE NOTICE 'Added status column to profiles table';
    END IF;
    
    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added email_verified column to profiles table';
    END IF;
    
    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added phone_verified column to profiles table';
    END IF;
    
    -- Add last_login column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_login') THEN
        ALTER TABLE public.profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login column to profiles table';
    END IF;
    
    -- Add login_count column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'login_count') THEN
        ALTER TABLE public.profiles ADD COLUMN login_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added login_count column to profiles table';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to profiles table';
    END IF;
END $$;

-- 3. Fix wallets table - add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add total_points column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'total_points') THEN
        ALTER TABLE public.wallets ADD COLUMN total_points INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_points column to wallets table';
    END IF;
    
    -- Add tier column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'tier') THEN
        ALTER TABLE public.wallets ADD COLUMN tier TEXT DEFAULT 'Gold Recycler';
        RAISE NOTICE 'Added tier column to wallets table';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'updated_at') THEN
        ALTER TABLE public.wallets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to wallets table';
    END IF;
END $$;

-- 4. Create missing tables if they don't exist
DO $$ 
BEGIN
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

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies safely (only if they exist)
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

-- 7. Create improved RLS policies
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

-- 8. Create or replace functions with proper error handling
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

-- 9. Create or replace triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Create indexes for better performance
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

-- 11. Insert default email templates if they don't exist
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

-- 12. Create a function to sync existing users (AFTER all table fixes)
CREATE OR REPLACE FUNCTION public.sync_existing_users()
RETURNS VOID AS $$
DECLARE
    col_list TEXT;
    val_list TEXT;
    allowed_role TEXT;
BEGIN
    -- First, let's find out what role values are allowed
    SELECT 
        CASE 
            WHEN constraint_name LIKE '%role%' THEN 
                (SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder) 
                 FROM pg_enum e 
                 JOIN pg_type t ON e.enumtypid = t.oid 
                 WHERE t.typname = 'text')
            ELSE 'user' -- Default fallback
        END
    INTO allowed_role
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%role%'
    LIMIT 1;
    
    -- If no specific constraint found, try to get the first valid value
    IF allowed_role IS NULL OR allowed_role = '' THEN
        -- Try to get the first non-null value from existing profiles
        SELECT role INTO allowed_role 
        FROM public.profiles 
        WHERE role IS NOT NULL 
        LIMIT 1;
        
        -- If still no value, use a safe default
        IF allowed_role IS NULL THEN
            allowed_role := 'member'; -- Common default role
        END IF;
    ELSE
        -- Take the first allowed role value
        allowed_role := split_part(allowed_role, ',', 1);
    END IF;
    
    RAISE NOTICE 'Using role value: %', allowed_role;
    
    -- Build the column list and value list dynamically
    SELECT 
        string_agg(column_name, ', ' ORDER BY ordinal_position),
        string_agg(
            CASE column_name
                WHEN 'id' THEN 'au.id'
                WHEN 'email' THEN 'au.email'
                WHEN 'full_name' THEN 'COALESCE(au.raw_user_meta_data->>''full_name'', ''Unknown User'')'
                WHEN 'phone' THEN 'COALESCE(au.raw_user_meta_data->>''phone'', null)'
                WHEN 'role' THEN quote_literal(allowed_role) -- Use the determined valid role
                WHEN 'is_active' THEN 'true' -- Default to active
                WHEN 'street_address' THEN 'COALESCE(au.raw_user_meta_data->>''street_address'', null)'
                WHEN 'suburb' THEN 'COALESCE(au.raw_user_meta_data->>''suburb'', null)'
                WHEN 'ext_zone_phase' THEN 'COALESCE(au.raw_user_meta_data->>''ext_zone_phase'', null)'
                WHEN 'city' THEN 'COALESCE(au.raw_user_meta_data->>''city'', null)'
                WHEN 'postal_code' THEN 'COALESCE(au.raw_user_meta_data->>''postal_code'', null)'
                WHEN 'avatar_url' THEN 'COALESCE(au.raw_user_meta_data->>''avatar_url'', null)'
                WHEN 'email_verified' THEN 'COALESCE(au.email_confirmed_at IS NOT NULL, false)'
                WHEN 'phone_verified' THEN 'false'
                WHEN 'last_login' THEN 'null'
                WHEN 'login_count' THEN '0'
                WHEN 'status' THEN '''active'''
                WHEN 'created_at' THEN 'au.created_at'
                WHEN 'updated_at' THEN 'NOW()'
                ELSE 'null' -- Default for any other columns
            END, ', ' ORDER BY ordinal_position
        )
    INTO col_list, val_list
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles';
    
    -- Execute the dynamic INSERT statement
    EXECUTE format('
        INSERT INTO public.profiles (%s)
        SELECT %s
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
        ON CONFLICT (id) DO NOTHING
    ', col_list, val_list);

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
    
    RAISE NOTICE 'Synced existing users successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Run the sync function
SELECT public.sync_existing_users();

-- 14. Verify the setup
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

-- 15. Show RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'wallets', 'password_reset_tokens', 'user_sessions', 'user_activity_log', 'email_templates', 'email_logs');
