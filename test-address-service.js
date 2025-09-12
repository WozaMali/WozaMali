// Test the address service connection
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

async function testAddressService() {
    try {
        console.log('\n=== Testing Address Service ===');
        
        // Test township_dropdown view
        console.log('\n1. Testing township_dropdown view...');
        const { data: townships, error: townshipError } = await supabase
            .from('township_dropdown')
            .select('*')
            .limit(5);
            
        if (townshipError) {
            console.error('Township error:', townshipError);
        } else {
            console.log('✅ Townships loaded:', townships?.length || 0);
            console.log('Sample township:', townships?.[0]);
        }
        
        // Test subdivision_dropdown view
        console.log('\n2. Testing subdivision_dropdown view...');
        const { data: subdivisions, error: subdivisionError } = await supabase
            .from('subdivision_dropdown')
            .select('*')
            .eq('township_name', 'Dobsonville')
            .limit(5);
            
        if (subdivisionError) {
            console.error('Subdivision error:', subdivisionError);
        } else {
            console.log('✅ Subdivisions loaded:', subdivisions?.length || 0);
            console.log('Sample subdivisions for Dobsonville:', subdivisions);
        }
        
        // Test residents_view
        console.log('\n3. Testing residents_view...');
        const { data: residents, error: residentsError } = await supabase
            .from('residents_view')
            .select('*')
            .limit(3);
            
        if (residentsError) {
            console.error('Residents error:', residentsError);
        } else {
            console.log('✅ Residents loaded:', residents?.length || 0);
            console.log('Sample resident:', residents?.[0]);
        }
        
        console.log('\n🎉 Address service test completed!');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAddressService();
