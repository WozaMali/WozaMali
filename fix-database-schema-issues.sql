-- ============================================================================
-- FIX DATABASE SCHEMA ISSUES
-- ============================================================================
-- This script fixes the database schema issues causing the console errors:
-- 1. Missing collection_date column in collections table
-- 2. Missing foreign key relationship between collections and users
-- 3. Missing member role in roles table
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING collection_date COLUMN TO collections TABLE
-- ============================================================================

-- Check if collection_date column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'collection_date'
        AND table_schema = 'public'
    ) THEN
        -- Add collection_date column
        ALTER TABLE public.collections 
        ADD COLUMN collection_date DATE DEFAULT CURRENT_DATE;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_collections_collection_date 
        ON public.collections(collection_date);
        
        RAISE NOTICE 'Added collection_date column to collections table';
    ELSE
        RAISE NOTICE 'collection_date column already exists in collections table';
    END IF;
END $$;

-- ============================================================================
-- 2. FIX FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- Check and fix user_id foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'collections_user_id_fkey'
        AND table_name = 'collections'
        AND table_schema = 'public'
    ) THEN
        -- Add foreign key constraint for user_id
        ALTER TABLE public.collections 
        ADD CONSTRAINT collections_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for collections.user_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for collections.user_id already exists';
    END IF;
END $$;

-- Check and fix collector_id foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'collections_collector_id_fkey'
        AND table_name = 'collections'
        AND table_schema = 'public'
    ) THEN
        -- Add foreign key constraint for collector_id
        ALTER TABLE public.collections 
        ADD CONSTRAINT collections_collector_id_fkey 
        FOREIGN KEY (collector_id) REFERENCES public.users(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint for collections.collector_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for collections.collector_id already exists';
    END IF;
END $$;

-- ============================================================================
-- 3. ENSURE member ROLE EXISTS IN roles TABLE
-- ============================================================================

-- Insert member role if it doesn't exist
INSERT INTO public.roles (name, description, permissions) 
VALUES (
    'member', 
    'Regular users who can submit collection requests', 
    '{"can_submit_collections": true, "can_view_own_data": true}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 4. ADD MISSING COLUMNS TO collections TABLE FOR COMPATIBILITY
-- ============================================================================

-- Add weight_kg column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'weight_kg'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.collections 
        ADD COLUMN weight_kg DECIMAL(10,2) DEFAULT 0;
        
        RAISE NOTICE 'Added weight_kg column to collections table';
    ELSE
        RAISE NOTICE 'weight_kg column already exists in collections table';
    END IF;
END $$;

-- Add notes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.collections 
        ADD COLUMN notes TEXT;
        
        RAISE NOTICE 'Added notes column to collections table';
    ELSE
        RAISE NOTICE 'notes column already exists in collections table';
    END IF;
END $$;

-- ============================================================================
-- 5. UPDATE EXISTING RECORDS TO HAVE collection_date
-- ============================================================================

-- Update existing collections to have collection_date = created_at date
UPDATE public.collections 
SET collection_date = created_at::date 
WHERE collection_date IS NULL;

-- ============================================================================
-- 6. VERIFY FIXES
-- ============================================================================

-- Check collections table structure
SELECT 
    'Collections Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'collections' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    'Foreign Key Constraints' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'collections'
AND tc.table_schema = 'public';

-- Check roles table
SELECT 
    'Available Roles' as check_type,
    name,
    description
FROM public.roles
ORDER BY name;

-- Check sample collections data
SELECT 
    'Sample Collections Data' as check_type,
    id,
    user_id,
    collector_id,
    collection_date,
    weight_kg,
    status,
    created_at
FROM public.collections
LIMIT 5;

RAISE NOTICE 'Database schema fixes completed successfully!';
