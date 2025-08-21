-- =====================================================
-- WOZAMALI OFFICE ROLE SETUP
-- This script sets up Office users and management
-- Run this after the main schema installation
-- =====================================================

-- =====================================================
-- STEP 1: CREATE OFFICE USER ROLES
-- =====================================================

-- Function to create an office user
CREATE OR REPLACE FUNCTION create_office_user(
    p_email TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_office_id UUID,
    p_role TEXT DEFAULT 'staff'
)
RETURNS UUID AS $$
DECLARE
    v_profile_id UUID;
    v_user_id UUID;
BEGIN
    -- Create auth user (this would typically be done through Supabase Auth)
    -- For now, we'll assume the user already exists in auth.users
    
    -- Check if profile already exists
    SELECT id INTO v_profile_id 
    FROM public.profiles 
    WHERE email = p_email;
    
    IF v_profile_id IS NOT NULL THEN
        -- Update existing profile to office role
        UPDATE public.profiles 
        SET 
            role = 'office',
            office_id = p_office_id,
            updated_at = NOW()
        WHERE id = v_profile_id;
        
        -- Add to office staff
        INSERT INTO public.office_staff (office_id, profile_id, role, start_date)
        VALUES (p_office_id, v_profile_id, p_role, CURRENT_DATE)
        ON CONFLICT (office_id, profile_id) 
        DO UPDATE SET 
            role = EXCLUDED.role,
            start_date = EXCLUDED.start_date,
            updated_at = NOW();
            
        RETURN v_profile_id;
    ELSE
        RAISE EXCEPTION 'Profile not found for email: %', p_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 2: CREATE OFFICE MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to assign collector to office
CREATE OR REPLACE FUNCTION assign_collector_to_office(
    p_collector_id UUID,
    p_office_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update collector's office assignment
    UPDATE public.profiles 
    SET 
        office_id = p_office_id,
        updated_at = NOW()
    WHERE id = p_collector_id AND role = 'collector';
    
    -- Add collector to office staff if not already there
    INSERT INTO public.office_staff (office_id, profile_id, role, start_date)
    VALUES (p_office_id, p_collector_id, 'collector', CURRENT_DATE)
    ON CONFLICT (office_id, profile_id) 
    DO UPDATE SET 
        role = 'collector',
        updated_at = NOW();
        
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get office statistics
CREATE OR REPLACE FUNCTION get_office_stats(p_office_id UUID)
RETURNS TABLE(
    total_users INTEGER,
    total_collectors INTEGER,
    total_collections INTEGER,
    total_weight DECIMAL(10,2),
    active_areas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT p.id)::INTEGER as total_users,
        COUNT(DISTINCT CASE WHEN p.role = 'collector' THEN p.id END)::INTEGER as total_collectors,
        COUNT(DISTINCT cl.id)::INTEGER as total_collections,
        COALESCE(SUM(cl.total_weight_kg), 0.00) as total_weight,
        COUNT(DISTINCT ca.id)::INTEGER as active_areas
    FROM public.offices o
    LEFT JOIN public.profiles p ON o.id = p.office_id
    LEFT JOIN public.collection_areas ca ON o.id = ca.office_id AND ca.is_active = true
    LEFT JOIN public.collection_logs cl ON o.id = cl.office_id
    WHERE o.id = p_office_id
    GROUP BY o.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 3: CREATE OFFICE VIEWS
-- =====================================================

-- View for office dashboard
CREATE OR REPLACE VIEW office_dashboard AS
SELECT 
    o.id as office_id,
    o.name as office_name,
    o.city,
    o.province,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT CASE WHEN p.role = 'collector' THEN p.id END) as total_collectors,
    COUNT(DISTINCT ca.id) as total_areas,
    COUNT(DISTINCT cr.id) as total_routes,
    COUNT(DISTINCT cl.id) as total_collections_today,
    COALESCE(SUM(CASE WHEN cl.collection_date = CURRENT_DATE THEN cl.total_weight_kg ELSE 0 END), 0.00) as weight_today
FROM public.offices o
LEFT JOIN public.profiles p ON o.id = p.office_id
LEFT JOIN public.collection_areas ca ON o.id = ca.office_id AND ca.is_active = true
LEFT JOIN public.collection_routes cr ON o.id = cr.office_id AND cr.is_active = true
LEFT JOIN public.collection_logs cl ON o.id = cl.office_id AND cl.collection_date = CURRENT_DATE
WHERE o.is_active = true
GROUP BY o.id, o.name, o.city, o.province;

-- View for office staff
CREATE OR REPLACE VIEW office_staff_view AS
SELECT 
    os.id,
    os.office_id,
    o.name as office_name,
    p.id as profile_id,
    p.full_name,
    p.email,
    p.phone,
    os.role as staff_role,
    os.start_date,
    os.end_date,
    os.is_active,
    p.status as profile_status
FROM public.office_staff os
JOIN public.offices o ON os.office_id = o.id
JOIN public.profiles p ON os.profile_id = p.id
WHERE os.is_active = true AND p.status = 'active';

-- View for collection performance by office
CREATE OR REPLACE VIEW office_collection_performance AS
SELECT 
    o.id as office_id,
    o.name as office_name,
    DATE_TRUNC('week', cl.collection_date) as week_start,
    COUNT(DISTINCT cl.id) as total_collections,
    COUNT(DISTINCT cl.collector_id) as active_collectors,
    SUM(cl.households_collected) as total_households,
    SUM(cl.total_weight_kg) as total_weight,
    AVG(cl.total_weight_kg) as avg_weight_per_collection
FROM public.offices o
JOIN public.collection_logs cl ON o.id = cl.office_id
WHERE cl.status = 'completed'
GROUP BY o.id, o.name, DATE_TRUNC('week', cl.collection_date)
ORDER BY o.name, week_start DESC;

-- =====================================================
-- STEP 4: INSERT SAMPLE OFFICE DATA
-- =====================================================

-- Insert additional offices if needed
INSERT INTO public.offices (name, address, city, province, phone, email) VALUES
('WozaMali Soweto East', '456 East Street, Soweto', 'Soweto', 'Gauteng', '+27 11 123 4568', 'east@wozamali.com'),
('WozaMali Soweto West', '789 West Avenue, Soweto', 'Soweto', 'Gauteng', '+27 11 123 4569', 'west@wozamali.com'),
('WozaMali Johannesburg Central', '321 Central Road, Johannesburg', 'Johannesburg', 'Gauteng', '+27 11 123 4570', 'central@wozamali.com')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 5: CREATE OFFICE NOTIFICATION SYSTEM
-- =====================================================

-- Table for office notifications
CREATE TABLE IF NOT EXISTS public.office_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('info', 'warning', 'error', 'success')),
    target_role TEXT, -- Specific role to notify (null = all office staff)
    is_read BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on notifications
ALTER TABLE public.office_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Office staff can view notifications for their office" ON public.office_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.office_staff 
            WHERE profile_id = auth.uid() 
            AND office_id = office_notifications.office_id
        )
    );

CREATE POLICY "Office managers can create notifications" ON public.office_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.office_staff 
            WHERE profile_id = auth.uid() 
            AND office_id = office_notifications.office_id
            AND role IN ('manager', 'supervisor')
        )
    );

-- =====================================================
-- STEP 6: CREATE OFFICE REPORTING FUNCTIONS
-- =====================================================

-- Function to generate daily office report
CREATE OR REPLACE FUNCTION generate_office_daily_report(p_office_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    report_date DATE,
    office_name TEXT,
    total_collections INTEGER,
    total_weight DECIMAL(10,2),
    total_households INTEGER,
    active_collectors INTEGER,
    collection_areas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_date as report_date,
        o.name as office_name,
        COUNT(DISTINCT cl.id)::INTEGER as total_collections,
        COALESCE(SUM(cl.total_weight_kg), 0.00) as total_weight,
        COALESCE(SUM(cl.households_collected), 0)::INTEGER as total_households,
        COUNT(DISTINCT cl.collector_id)::INTEGER as active_collectors,
        COUNT(DISTINCT cl.area_id)::INTEGER as collection_areas
    FROM public.offices o
    LEFT JOIN public.collection_logs cl ON o.id = cl.office_id 
        AND cl.collection_date = p_date 
        AND cl.status = 'completed'
    WHERE o.id = p_office_id
    GROUP BY o.id, o.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: VERIFICATION QUERIES
-- =====================================================

-- Verify office setup
SELECT 
    'Office setup complete' as status,
    COUNT(*) as total_offices,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_offices
FROM public.offices;

-- Show office staff distribution
SELECT 
    o.name as office_name,
    os.role as staff_role,
    COUNT(*) as staff_count
FROM public.offices o
JOIN public.office_staff os ON o.id = os.office_id
WHERE os.is_active = true
GROUP BY o.name, os.role
ORDER BY o.name, os.role;

-- Show office collection areas
SELECT 
    o.name as office_name,
    COUNT(ca.id) as total_areas,
    COUNT(CASE WHEN ca.is_active = true THEN 1 END) as active_areas
FROM public.offices o
LEFT JOIN public.collection_areas ca ON o.id = ca.office_id
GROUP BY o.id, o.name
ORDER BY o.name;

-- =====================================================
-- STEP 8: COMPLETION NOTICE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Office role setup complete! You can now create office users and manage collections by office.';
END $$;
