-- Test Withdrawal System for Office App
-- This script tests if the withdrawal system is properly set up and can receive requests

-- 1. Check if withdrawal tables exist
SELECT 
    'Withdrawal Tables Check' as test_name,
    tablename,
    CASE 
        WHEN tablename IS NOT NULL THEN 'EXISTS ✅'
        ELSE 'MISSING ❌'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('withdrawal_requests', 'withdrawal_status_history', 'bank_reference', 'account_type_reference');

-- 2. Check table permissions
SELECT 
    'Table Permissions Check' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = false THEN 'RLS DISABLED ✅'
        ELSE 'RLS ENABLED ❌'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('withdrawal_requests', 'withdrawal_status_history', 'bank_reference', 'account_type_reference');

-- 3. Check if we have any users to test with
SELECT 
    'Available Users for Testing' as test_name,
    COUNT(*) as user_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'USERS AVAILABLE ✅'
        ELSE 'NO USERS ❌'
    END as status
FROM public.user_profiles;

-- 4. Show sample users for testing
SELECT 
    'Sample Users' as test_name,
    id,
    full_name,
    email,
    role,
    status
FROM public.user_profiles 
LIMIT 5;

-- 5. Check bank reference data
SELECT 
    'Bank Reference Data' as test_name,
    COUNT(*) as bank_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'BANKS AVAILABLE ✅'
        ELSE 'NO BANKS ❌'
    END as status
FROM public.bank_reference;

-- 6. Show available banks
SELECT 
    'Available Banks' as test_name,
    bank_name,
    bank_code,
    swift_code
FROM public.bank_reference 
ORDER BY bank_name;

-- 7. Check account types
SELECT 
    'Account Types' as test_name,
    COUNT(*) as type_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'TYPES AVAILABLE ✅'
        ELSE 'NO TYPES ❌'
    END as status
FROM public.account_type_reference;

-- 8. Show available account types
SELECT 
    'Available Account Types' as test_name,
    type_name,
    description
FROM public.account_type_reference 
ORDER BY type_name;

-- 9. Test creating a sample withdrawal request (if users exist)
DO $$
DECLARE
    test_user_id UUID;
    test_withdrawal_id UUID;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id 
    FROM public.user_profiles 
    WHERE role = 'member' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Create a test withdrawal request
        INSERT INTO public.withdrawal_requests (
            user_id,
            owner_name,
            bank_name,
            account_number,
            account_type,
            branch_code,
            amount,
            status
        ) VALUES (
            test_user_id,
            'Test User',
            'ABSA Bank',
            '1234567890',
            'Savings Account',
            '123456',
            500.00,
            'pending'
        ) RETURNING id INTO test_withdrawal_id;
        
        RAISE NOTICE '✅ Test withdrawal request created with ID: %', test_withdrawal_id;
        
        -- Show the created request
        RAISE NOTICE 'Test withdrawal details:';
        RAISE NOTICE 'User ID: %', test_user_id;
        RAISE NOTICE 'Amount: R500.00';
        RAISE NOTICE 'Status: pending';
        
    ELSE
        RAISE NOTICE '❌ No test users available to create withdrawal request';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating test withdrawal: %', SQLERRM;
END $$;

-- 10. Show any existing withdrawal requests
SELECT 
    'Existing Withdrawal Requests' as test_name,
    COUNT(*) as request_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'REQUESTS EXIST ✅'
        ELSE 'NO REQUESTS YET'
    END as status
FROM public.withdrawal_requests;

-- 11. Display withdrawal requests if any exist
SELECT 
    'Withdrawal Request Details' as test_name,
    wr.id,
    wr.owner_name,
    wr.bank_name,
    wr.amount,
    wr.status,
    wr.created_at,
    up.full_name as user_name,
    up.email as user_email
FROM public.withdrawal_requests wr
LEFT JOIN public.user_profiles up ON wr.user_id = up.id
ORDER BY wr.created_at DESC;

-- 12. Test withdrawal system summary
SELECT 
    '🎯 WITHDRAWAL SYSTEM TEST SUMMARY' as summary_header,
    'All tests completed' as status,
    'Check results above for any issues' as note,
    'If all tests pass, the office app can receive withdrawal requests' as result;
