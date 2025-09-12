-- Improve name display system for better user experience
-- This will create a function to properly format user names

-- 1. Create a function to format user names properly
CREATE OR REPLACE FUNCTION format_user_display_name(
    p_first_name TEXT,
    p_last_name TEXT,
    p_full_name TEXT,
    p_email TEXT
) RETURNS TEXT AS $$
BEGIN
    -- If we have both first and last name, use them
    IF p_first_name IS NOT NULL AND p_last_name IS NOT NULL AND p_first_name != '' AND p_last_name != '' THEN
        RETURN INITCAP(p_first_name) || ' ' || INITCAP(p_last_name);
    END IF;
    
    -- If we have first name only
    IF p_first_name IS NOT NULL AND p_first_name != '' THEN
        RETURN INITCAP(p_first_name);
    END IF;
    
    -- If we have last name only
    IF p_last_name IS NOT NULL AND p_last_name != '' THEN
        RETURN INITCAP(p_last_name);
    END IF;
    
    -- If we have full name
    IF p_full_name IS NOT NULL AND p_full_name != '' THEN
        RETURN INITCAP(p_full_name);
    END IF;
    
    -- Extract name from email and format it
    IF p_email IS NOT NULL AND p_email != '' THEN
        DECLARE
            email_name TEXT;
        BEGIN
            email_name := SPLIT_PART(p_email, '@', 1);
            -- Replace dots and underscores with spaces
            email_name := REPLACE(REPLACE(email_name, '.', ' '), '_', ' ');
            -- Capitalize each word
            email_name := INITCAP(email_name);
            RETURN email_name;
        END;
    END IF;
    
    -- Final fallback
    RETURN 'Unknown User';
END;
$$ LANGUAGE plpgsql;

-- 2. Test the function with current data
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    format_user_display_name(u.first_name, u.last_name, u.full_name, u.email) as formatted_display_name,
    r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id::text = r.id::text
ORDER BY u.created_at DESC;

-- 3. Update users with better name data where possible
-- For users with email-based names, try to extract better names
UPDATE public.users 
SET 
    first_name = CASE 
        WHEN first_name IS NULL OR first_name = '' THEN
            INITCAP(SPLIT_PART(SPLIT_PART(email, '@', 1), '.', 1))
        ELSE first_name
    END,
    last_name = CASE 
        WHEN last_name IS NULL AND position('.' IN SPLIT_PART(email, '@', 1)) > 0 THEN
            INITCAP(SPLIT_PART(SPLIT_PART(email, '@', 1), '.', 2))
        ELSE last_name
    END,
    updated_at = NOW()
WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL;

-- 4. Show the improved results
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    format_user_display_name(u.first_name, u.last_name, u.full_name, u.email) as formatted_display_name,
    r.name as role_name,
    u.created_at
FROM public.users u
LEFT JOIN public.roles r ON u.role_id::text = r.id::text
ORDER BY u.created_at DESC;

RAISE NOTICE 'Name display system improved successfully.';
