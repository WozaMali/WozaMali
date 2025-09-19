const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndFixUserRoles() {
  try {
    console.log('🔍 Checking user roles and permissions...');
    
    // First, let's see what users exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }
    
    console.log('👥 Found users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.id})`);
    });
    
    // Check user_roles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, users!inner(email)')
      .order('created_at', { ascending: false });
    
    if (rolesError) {
      console.error('❌ Error getting user roles:', rolesError);
    } else {
      console.log('\n🎭 Current user roles:');
      if (userRoles.length === 0) {
        console.log('  ⚠️  No user roles found!');
      } else {
        userRoles.forEach((userRole, index) => {
          console.log(`  ${index + 1}. ${userRole.users.email} → ${userRole.role}`);
        });
      }
    }
    
    // Check if there are any admin users
    const adminUsers = userRoles?.filter(ur => ['admin', 'office', 'super_admin'].includes(ur.role)) || [];
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️  No admin users found! Let\'s create one...');
      
      // Get the first user (most recent)
      if (users.length > 0) {
        const firstUser = users[0];
        console.log(`\n🔧 Assigning 'admin' role to: ${firstUser.email}`);
        
        // Insert admin role for the first user
        const { data: newRole, error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: firstUser.id,
            role: 'admin',
            created_at: new Date().toISOString()
          })
          .select();
        
        if (insertError) {
          console.error('❌ Error inserting admin role:', insertError);
        } else {
          console.log('✅ Admin role assigned successfully!');
          console.log('📋 New role:', newRole[0]);
        }
      } else {
        console.log('❌ No users found to assign admin role to');
      }
    } else {
      console.log('\n✅ Found admin users:');
      adminUsers.forEach(admin => {
        console.log(`  - ${admin.users.email} (${admin.role})`);
      });
    }
    
    // Test the has_any_role function
    console.log('\n🧪 Testing has_any_role function...');
    const { data: roleTest, error: roleTestError } = await supabase
      .rpc('has_any_role', { required_roles: ['admin', 'office', 'super_admin'] });
    
    if (roleTestError) {
      console.error('❌ Error testing has_any_role:', roleTestError);
    } else {
      console.log('✅ has_any_role result:', roleTest);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

checkAndFixUserRoles();
