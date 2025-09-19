const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mljtjntkddwkcjixkyuy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sanRqbnRrZGR3a2NqaXhreXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyNjY4NSwiZXhwIjoyMDcwMDAyNjg1fQ.X6O2YFRkkN0T_yB-XgGYi2_PY9ob0ZOmHE0FJUl9T7A';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testServiceRoleAccess() {
  console.log('🔍 Testing service role access...\n');

  try {
    // Test 1: Check if we can access the rewards table with service role
    console.log('1. Testing rewards table access with service role...');
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .limit(5);

    if (rewardsError) {
      console.error('❌ Rewards access error:', rewardsError);
    } else {
      console.log('✅ Rewards accessible with service role');
      console.log('📊 Rewards data:', rewards);
    }

    // Test 2: Check if we can access other tables
    console.log('\n2. Testing other table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(3);

    if (usersError) {
      console.error('❌ Users access error:', usersError);
    } else {
      console.log('✅ Users accessible with service role');
      console.log('📊 Users count:', users?.length || 0);
    }

    // Test 3: Check roles table
    console.log('\n3. Testing roles table access...');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .limit(5);

    if (rolesError) {
      console.error('❌ Roles access error:', rolesError);
    } else {
      console.log('✅ Roles accessible with service role');
      console.log('📊 Roles data:', roles);
    }

    // Test 4: Try to create a simple test record
    console.log('\n4. Testing insert capability...');
    const { data: insertData, error: insertError } = await supabase
      .from('rewards')
      .insert({
        name: 'Test Reward',
        description: 'Test reward for debugging',
        points_required: 100,
        category: 'cash',
        is_active: true
      })
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Insert successful');
      console.log('📊 Inserted data:', insertData);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testServiceRoleAccess();
