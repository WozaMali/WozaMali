const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as the Office App
const supabaseUrl = 'https://mljtjntkddwkcjixkyuy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sanRqbnRrZGR3a2NqaXhreXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyNjY4NSwiZXhwIjoyMDcwMDAyNjg1fQ.X6O2YFRkkN0T_yB-XgGYi2_PY9ob0ZOmHE0FJUl9T7A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRewardsAccess() {
  console.log('🔍 Testing rewards table access...\n');

  try {
    // Test 1: Check if rewards table exists and get basic info
    console.log('1. Checking rewards table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('rewards')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table access error:', tableError);
      return;
    }

    console.log('✅ Rewards table accessible');
    console.log('📊 Sample data:', tableInfo);

    // Test 2: Check current user info
    console.log('\n2. Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User error:', userError);
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
      console.log('🆔 User ID:', user.id);
    } else {
      console.log('⚠️ No authenticated user');
    }

    // Test 3: Check user role
    console.log('\n3. Checking user role...');
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role_id,
        roles!inner(name, description)
      `)
      .eq('id', user?.id)
      .single();

    if (userDataError) {
      console.error('❌ User data error:', userDataError);
    } else {
      console.log('✅ User data:', userData);
    }

    // Test 4: Try to get all rewards
    console.log('\n4. Testing rewards fetch...');
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false });

    if (rewardsError) {
      console.error('❌ Rewards fetch error:', rewardsError);
    } else {
      console.log('✅ Rewards fetched successfully');
      console.log('📊 Rewards count:', rewards?.length || 0);
      console.log('📋 First few rewards:', rewards?.slice(0, 3));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testRewardsAccess();
