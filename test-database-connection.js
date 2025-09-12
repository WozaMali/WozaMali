// Test script to verify database connection and data
const { createClient } = require('@supabase/supabase-js');

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔌 Testing database connection...');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase
      .from('roles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
      return;
    }
    console.log('✅ Connection successful');

    // Test 2: Check roles table
    console.log('\n2. Testing roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*');
    
    if (rolesError) {
      console.error('❌ Roles query failed:', rolesError);
    } else {
      console.log('✅ Roles loaded:', roles.length);
      console.log('Roles:', roles.map(r => r.name));
    }

    // Test 3: Check areas table
    console.log('\n3. Testing areas table...');
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('*');
    
    if (areasError) {
      console.error('❌ Areas query failed:', areasError);
    } else {
      console.log('✅ Areas loaded:', areas.length);
      console.log('Sample areas:', areas.slice(0, 3).map(a => a.name));
    }

    // Test 4: Check township dropdown view
    console.log('\n4. Testing township dropdown view...');
    const { data: townships, error: townshipsError } = await supabase
      .from('township_dropdown')
      .select('*')
      .limit(5);
    
    if (townshipsError) {
      console.error('❌ Township dropdown query failed:', townshipsError);
    } else {
      console.log('✅ Township dropdown loaded:', townships.length);
      console.log('Sample townships:', townships.map(t => t.township_name));
    }

    // Test 5: Check subdivision dropdown view
    console.log('\n5. Testing subdivision dropdown view...');
    const { data: subdivisions, error: subdivisionsError } = await supabase
      .from('subdivision_dropdown')
      .select('*')
      .limit(5);
    
    if (subdivisionsError) {
      console.error('❌ Subdivision dropdown query failed:', subdivisionsError);
    } else {
      console.log('✅ Subdivision dropdown loaded:', subdivisions.length);
      console.log('Sample subdivisions:', subdivisions.map(s => s.subdivision));
    }

    // Test 6: Check users table
    console.log('\n6. Testing users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users query failed:', usersError);
    } else {
      console.log('✅ Users loaded:', users.length);
      if (users.length > 0) {
        console.log('Sample user:', {
          id: users[0].id,
          full_name: users[0].full_name,
          email: users[0].email,
          role_id: users[0].role_id
        });
      }
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection();