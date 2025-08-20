-- WozaMoney Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) UNIQUE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'Gold Recycler',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password_reset_tokens table for secure password resets
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create user_sessions table for better session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activity_log table for audit trail
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_templates table for customizable email notifications
CREATE TABLE IF NOT EXISTS public.email_templates (
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

-- Create email_logs table for tracking email delivery
CREATE TABLE IF NOT EXISTS public.email_logs (
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for wallets
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for password_reset_tokens
CREATE POLICY "Users can view own reset tokens" ON public.password_reset_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reset tokens" ON public.password_reset_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reset tokens" ON public.password_reset_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view own activity log" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity log" ON public.user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for email_templates (admin only)
CREATE POLICY "Only admins can manage email templates" ON public.email_templates
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for email_logs
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);

-- Function to handle new user registration (FIXED)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user login
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last login and login count
  UPDATE public.profiles 
  SET 
    last_login = NOW(),
    login_count = login_count + 1,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  -- Log login activity
  INSERT INTO public.user_activity_log (
    user_id,
    activity_type,
    description,
    metadata
  )
  VALUES (
    NEW.id,
    'user_login',
    'User logged in successfully',
    jsonb_build_object('login_time', NOW())
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create password reset token
CREATE OR REPLACE FUNCTION public.create_password_reset_token(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_id UUID;
  reset_token TEXT;
  token_hash TEXT;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_id FROM public.profiles WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Generate secure random token
  reset_token := encode(gen_random_bytes(32), 'hex');
  token_hash := encode(sha256(reset_token::bytea), 'hex');
  
  -- Invalidate any existing tokens for this user
  UPDATE public.password_reset_tokens 
  SET used = TRUE, used_at = NOW() 
  WHERE user_id = user_id AND used = FALSE;
  
  -- Insert new token
  INSERT INTO public.password_reset_tokens (
    user_id,
    token_hash,
    expires_at
  )
  VALUES (
    user_id,
    token_hash,
    NOW() + INTERVAL '1 hour'
  );
  
  -- Log password reset request
  INSERT INTO public.user_activity_log (
    user_id,
    activity_type,
    description,
    metadata
  )
  VALUES (
    user_id,
    'password_reset_requested',
    'Password reset requested',
    jsonb_build_object('request_time', NOW())
  );
  
  RETURN reset_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify and use password reset token
CREATE OR REPLACE FUNCTION public.verify_password_reset_token(token TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Find valid, unused, non-expired token
  SELECT prt.user_id INTO user_id
  FROM public.password_reset_tokens prt
  WHERE prt.token_hash = encode(sha256(token::bytea), 'hex')
    AND prt.used = FALSE
    AND prt.expires_at > NOW();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired reset token';
  END IF;
  
  -- Mark token as used
  UPDATE public.password_reset_tokens 
  SET used = TRUE, used_at = NOW()
  WHERE token_hash = encode(sha256(token::bytea), 'hex');
  
  -- Log password reset completion
  INSERT INTO public.user_activity_log (
    user_id,
    activity_type,
    description,
    metadata
  )
  VALUES (
    user_id,
    'password_reset_completed',
    'Password reset completed successfully',
    jsonb_build_object('reset_time', NOW())
  );
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired tokens and sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS VOID AS $$
BEGIN
  -- Clean up expired password reset tokens
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < NOW() AND used = FALSE;
  
  -- Clean up expired user sessions
  DELETE FROM public.user_sessions 
  WHERE expires_at < NOW();
  
  -- Clean up old activity logs (keep last 6 months)
  DELETE FROM public.user_activity_log 
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  -- Clean up old email logs (keep last 3 months)
  DELETE FROM public.email_logs 
  WHERE sent_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile and wallet
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to handle user login
CREATE OR REPLACE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_login();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created ON public.user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- Insert default email templates
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

-- Schedule cleanup job (runs daily at 2 AM)
-- Note: pg_cron extension must be enabled first
-- If pg_cron is not available, you can use Supabase's built-in cron jobs
-- or manually run: SELECT public.cleanup_expired_data();

-- Alternative: Use Supabase's built-in cron jobs
-- Go to Dashboard > Database > Functions > Create a new cron job
-- Schedule: 0 2 * * * (daily at 2 AM)
-- Function: public.cleanup_expired_data()
