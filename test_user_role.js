const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUserRole() {
  try {
    console.log('🔍 Testing user role and permissions...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Error getting user:', userError);
      return;
    }
    
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }
    
    console.log('✅ User ID:', user.id);
    console.log('✅ User Email:', user.email);
    
    // Check user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    if (rolesError) {
      console.error('❌ Error getting roles:', rolesError);
    } else {
      console.log('✅ User roles:', roles.map(r => r.role));
    }
    
    // Test the has_any_role function directly
    const { data: roleTest, error: roleTestError } = await supabase
      .rpc('has_any_role', { roles: ['admin', 'office', 'super_admin'] });
    
    if (roleTestError) {
      console.error('❌ Error testing has_any_role:', roleTestError);
    } else {
      console.log('✅ has_any_role result:', roleTest);
    }
    
    // Test soft delete function with a dummy ID
    const { data: softDeleteTest, error: softDeleteError } = await supabase
      .rpc('soft_delete_collection', {
        p_collection_id: '00000000-0000-0000-0000-000000000000',
        p_deleted_by: user.id,
        p_deletion_reason: 'Test permission check'
      });
    
    if (softDeleteError) {
      console.log('⚠️ Soft delete test error (expected for dummy ID):', softDeleteError.message);
    } else {
      console.log('✅ Soft delete test result:', softDeleteTest);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUserRole();
