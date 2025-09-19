const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabaseFunction() {
  try {
    console.log('🔍 Testing database function permissions...');
    
    // Test the has_any_role function with service role
    const { data: roleTest, error: roleTestError } = await supabase
      .rpc('has_any_role', { roles: ['admin', 'office', 'super_admin'] });
    
    if (roleTestError) {
      console.error('❌ Error testing has_any_role:', roleTestError);
    } else {
      console.log('✅ has_any_role result:', roleTest);
    }
    
    // Check if the soft_delete_collection function exists and what it looks like
    const { data: functionInfo, error: functionError } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .eq('proname', 'soft_delete_collection');
    
    if (functionError) {
      console.error('❌ Error getting function info:', functionError);
    } else {
      console.log('✅ Function info:', functionInfo);
    }
    
    // Test with a real user ID (you'll need to replace this with an actual user ID)
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { data: softDeleteTest, error: softDeleteError } = await supabase
      .rpc('soft_delete_collection', {
        p_collection_id: '00000000-0000-0000-0000-000000000000',
        p_deleted_by: testUserId,
        p_deletion_reason: 'Test permission check'
      });
    
    if (softDeleteError) {
      console.log('⚠️ Soft delete test error:', softDeleteError.message);
    } else {
      console.log('✅ Soft delete test result:', softDeleteTest);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseFunction();
