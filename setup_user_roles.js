const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupUserRoles() {
  try {
    console.log('🔧 Setting up user roles system...');
    
    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%user%');
    
    if (tablesError) {
      console.error('❌ Error getting tables:', tablesError);
    } else {
      console.log('📋 User-related tables found:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
    // Create user_roles table if it doesn't exist
    const createUserRolesTable = `
      CREATE TABLE IF NOT EXISTS public.user_roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        role text NOT NULL CHECK (role IN ('admin', 'office', 'super_admin', 'collector', 'user')),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(user_id, role)
      );
    `;
    
    console.log('⚡ Creating user_roles table...');
    const { data: createResult, error: createError } = await supabase
      .rpc('exec_sql', { sql: createUserRolesTable });
    
    if (createError) {
      console.error('❌ Error creating user_roles table:', createError);
      // Try alternative approach
      console.log('🔄 Trying alternative approach...');
      
      // Let's try to create the table using a different method
      const { data: altResult, error: altError } = await supabase
        .from('user_roles')
        .select('id')
        .limit(1);
      
      if (altError && altError.code === 'PGRST205') {
        console.log('❌ user_roles table does not exist and cannot be created via RPC');
        console.log('📝 Please create the table manually in Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'office', 'super_admin', 'collector', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Insert admin role for the first user
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' 
FROM public.users 
ORDER BY created_at ASC 
LIMIT 1;
        `);
        return;
      }
    } else {
      console.log('✅ user_roles table created successfully!');
    }
    
    // Get the first user (most recent)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }
    
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\n🔧 Assigning 'admin' role to: ${firstUser.email}`);
      
      // Insert admin role for the first user
      const { data: newRole, error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: firstUser.id,
          role: 'admin'
        })
        .select();
      
      if (insertError) {
        console.error('❌ Error inserting admin role:', insertError);
      } else {
        console.log('✅ Admin role assigned successfully!');
        console.log('📋 New role:', newRole[0]);
      }
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

setupUserRoles();
