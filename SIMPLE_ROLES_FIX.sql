-- ============================================================================
-- SIMPLE ROLES FIX - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the member role
INSERT INTO public.roles (name, description, permissions) 
VALUES ('member', 'Regular users who can submit collection requests', '{"can_submit_collections": true, "can_view_own_data": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Verify the role was created
SELECT 'SUCCESS' as status, name, id FROM public.roles WHERE name = 'member';
