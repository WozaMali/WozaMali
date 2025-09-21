// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseUrl = rawUrl?.trim();
const supabaseAnonKey = rawAnonKey?.trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
