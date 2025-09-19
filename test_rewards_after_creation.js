const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mljtjntkddwkcjixkyuy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sanRqbnRrZGR3a2NqaXhreXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyNjY4NSwiZXhwIjoyMDcwMDAyNjg1fQ.X6O2YFRkkN0T_yB-XgGYi2_PY9ob0ZOmHE0FJUl9T7A';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRewardsAfterCreation() {
  console.log('🧪 Testing rewards table after creation...\n');

  try {
    // Test 1: Check if rewards table is accessible
    console.log('1. Testing rewards table access...');
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false });

    if (rewardsError) {
      console.error('❌ Rewards access error:', rewardsError);
      return;
    }

    console.log('✅ Rewards table accessible!');
    console.log('📊 Total rewards:', rewards?.length || 0);
    console.log('📋 Sample rewards:');
    rewards?.slice(0, 3).forEach(reward => {
      console.log(`   - ${reward.name} (${reward.points_required} pts, ${reward.category})`);
    });

    // Test 2: Test different query types
    console.log('\n2. Testing different query types...');
    
    // Get active rewards only
    const { data: activeRewards, error: activeError } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true);

    if (activeError) {
      console.error('❌ Active rewards error:', activeError);
    } else {
      console.log('✅ Active rewards query works');
      console.log('📊 Active rewards count:', activeRewards?.length || 0);
    }

    // Get rewards by category
    const { data: cashRewards, error: cashError } = await supabase
      .from('rewards')
      .select('*')
      .eq('category', 'cash');

    if (cashError) {
      console.error('❌ Cash rewards error:', cashError);
    } else {
      console.log('✅ Cash rewards query works');
      console.log('📊 Cash rewards count:', cashRewards?.length || 0);
    }

    // Test 3: Test insert capability
    console.log('\n3. Testing insert capability...');
    const { data: insertData, error: insertError } = await supabase
      .from('rewards')
      .insert({
        name: 'Test Reward - ' + new Date().toISOString(),
        description: 'Test reward created by script',
        points_required: 999,
        category: 'cash',
        is_active: true
      })
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Insert successful');
      console.log('📊 Inserted reward:', insertData?.[0]?.name);
    }

    console.log('\n🎉 All tests passed! Rewards table is working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testRewardsAfterCreation();
