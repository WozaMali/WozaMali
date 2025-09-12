-- ============================================================================
-- IMMEDIATE FIX - RUN THIS NOW
-- ============================================================================
-- This will fix the "member role not found" error immediately
-- ============================================================================

-- Insert the member role
INSERT INTO public.roles (name, description, permissions) 
VALUES ('member', 'Regular users who can submit collection requests', '{"can_submit_collections": true, "can_view_own_data": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Verify it was inserted
SELECT 'SUCCESS: Member role inserted' as status, name, id FROM public.roles WHERE name = 'member';
