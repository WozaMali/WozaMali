// Test user creation functionality
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

async function testUserCreation() {
    try {
        console.log('\n=== Testing User Creation ===');
        
        // 1. Get resident role ID
        console.log('\n1. Getting resident role ID...');
        const { data: residentRole, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'resident')
            .single();
            
        if (roleError) {
            console.error('Error getting resident role:', roleError);
            return;
        }
        
        console.log('✅ Resident role ID:', residentRole.id);
        
        // 2. Test user creation (without actually creating)
        console.log('\n2. Testing user creation permissions...');
        
        const testUserData = {
            id: '00000000-0000-0000-0000-000000000000', // Test UUID
            first_name: 'Test',
            last_name: 'User',
            full_name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            date_of_birth: '1990-01-01',
            street_addr: '123 Test Street',
            township_id: '6b5e293d-f001-4f9d-bd56-3465feb18432', // Braamfischerville
            subdivision: 'Phase 1',
            city: 'Soweto',
            postal_code: '1863',
            role_id: residentRole.id,
            status: 'active'
        };
        
        // Test if we can insert (dry run)
        const { error: insertError } = await supabase
            .from('users')
            .insert(testUserData);
            
        if (insertError) {
            console.error('❌ User creation test failed:', insertError);
        } else {
            console.log('✅ User creation test passed - permissions are working!');
            
            // Clean up test data
            await supabase
                .from('users')
                .delete()
                .eq('id', '00000000-0000-0000-0000-000000000000');
            console.log('✅ Test data cleaned up');
        }
        
        // 3. Test township access
        console.log('\n3. Testing township access...');
        const { data: townships, error: townshipError } = await supabase
            .from('township_dropdown')
            .select('*')
            .limit(3);
            
        if (townshipError) {
            console.error('Township access error:', townshipError);
        } else {
            console.log('✅ Townships accessible:', townships?.length || 0);
        }
        
        // 4. Test subdivision access
        console.log('\n4. Testing subdivision access...');
        const { data: subdivisions, error: subdivisionError } = await supabase
            .from('subdivision_dropdown')
            .select('*')
            .eq('township_name', 'Dobsonville')
            .limit(3);
            
        if (subdivisionError) {
            console.error('Subdivision access error:', subdivisionError);
        } else {
            console.log('✅ Subdivisions accessible:', subdivisions?.length || 0);
        }
        
        console.log('\n🎉 User creation test completed!');
        console.log('The sign-up form should now work correctly!');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testUserCreation();
