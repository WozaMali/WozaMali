// Test roles table access specifically
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRolesAccess() {
    try {
        console.log('\n=== Testing Roles Table Access ===');
        
        // Test all roles
        console.log('\n1. Testing all roles...');
        const { data: allRoles, error: allRolesError } = await supabase
            .from('roles')
            .select('*');
            
        if (allRolesError) {
            console.error('All roles error:', allRolesError);
        } else {
            console.log('✅ All roles loaded:', allRoles?.length || 0);
            console.log('Roles:', allRoles);
        }
        
        // Test resident role specifically
        console.log('\n2. Testing resident role...');
        const { data: residentRole, error: residentError } = await supabase
            .from('roles')
            .select('id, name, description')
            .eq('name', 'resident')
            .single();
            
        if (residentError) {
            console.error('Resident role error:', residentError);
        } else {
            console.log('✅ Resident role loaded:', residentRole);
        }
        
        // Test collector role
        console.log('\n3. Testing collector role...');
        const { data: collectorRole, error: collectorError } = await supabase
            .from('roles')
            .select('id, name, description')
            .eq('name', 'collector')
            .single();
            
        if (collectorError) {
            console.error('Collector role error:', collectorError);
        } else {
            console.log('✅ Collector role loaded:', collectorRole);
        }
        
        // Test admin role
        console.log('\n4. Testing admin role...');
        const { data: adminRole, error: adminError } = await supabase
            .from('roles')
            .select('id, name, description')
            .eq('name', 'admin')
            .single();
            
        if (adminError) {
            console.error('Admin role error:', adminError);
        } else {
            console.log('✅ Admin role loaded:', adminRole);
        }
        
        console.log('\n🎉 Roles access test completed!');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testRolesAccess();
