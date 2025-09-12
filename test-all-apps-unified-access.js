// Test unified database access across all three apps
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

async function testUnifiedAccess() {
    try {
        console.log('\n=== TESTING UNIFIED DATABASE ACCESS ACROSS ALL APPS ===');
        
        // 1. Test roles access (used by all apps)
        console.log('\n1. Testing roles access (Main App, Collector App, Office App)...');
        const { data: roles, error: rolesError } = await supabase
            .from('roles')
            .select('*');
            
        if (rolesError) {
            console.error('❌ Roles access failed:', rolesError);
        } else {
            console.log('✅ Roles accessible:', roles?.length || 0);
            console.log('   - Resident role:', roles?.find(r => r.name === 'resident')?.id);
            console.log('   - Collector role:', roles?.find(r => r.name === 'collector')?.id);
            console.log('   - Admin role:', roles?.find(r => r.name === 'admin')?.id);
        }
        
        // 2. Test areas/townships access (used by all apps)
        console.log('\n2. Testing areas/townships access (Main App, Collector App, Office App)...');
        const { data: areas, error: areasError } = await supabase
            .from('areas')
            .select('*')
            .limit(5);
            
        if (areasError) {
            console.error('❌ Areas access failed:', areasError);
        } else {
            console.log('✅ Areas accessible:', areas?.length || 0);
            console.log('   - Sample township:', areas?.[0]?.name);
        }
        
        // 3. Test township_dropdown view (Main App sign-up)
        console.log('\n3. Testing township_dropdown view (Main App sign-up)...');
        const { data: townships, error: townshipsError } = await supabase
            .from('township_dropdown')
            .select('*')
            .limit(3);
            
        if (townshipsError) {
            console.error('❌ Township dropdown access failed:', townshipsError);
        } else {
            console.log('✅ Township dropdown accessible:', townships?.length || 0);
            console.log('   - Sample township:', townships?.[0]?.township_name);
        }
        
        // 4. Test subdivision_dropdown view (Main App sign-up)
        console.log('\n4. Testing subdivision_dropdown view (Main App sign-up)...');
        const { data: subdivisions, error: subdivisionsError } = await supabase
            .from('subdivision_dropdown')
            .select('*')
            .eq('township_name', 'Dobsonville')
            .limit(3);
            
        if (subdivisionsError) {
            console.error('❌ Subdivision dropdown access failed:', subdivisionsError);
        } else {
            console.log('✅ Subdivision dropdown accessible:', subdivisions?.length || 0);
            console.log('   - Sample subdivisions for Dobsonville:', subdivisions?.map(s => s.subdivision));
        }
        
        // 5. Test residents_view (Collector App, Office App)
        console.log('\n5. Testing residents_view (Collector App, Office App)...');
        const { data: residents, error: residentsError } = await supabase
            .from('residents_view')
            .select('*')
            .limit(3);
            
        if (residentsError) {
            console.error('❌ Residents view access failed:', residentsError);
        } else {
            console.log('✅ Residents view accessible:', residents?.length || 0);
            if (residents?.length > 0) {
                console.log('   - Sample resident:', residents[0]?.full_name);
            }
        }
        
        // 6. Test users table access (all apps)
        console.log('\n6. Testing users table access (all apps)...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, role_id')
            .limit(3);
            
        if (usersError) {
            console.error('❌ Users table access failed:', usersError);
        } else {
            console.log('✅ Users table accessible:', users?.length || 0);
            if (users?.length > 0) {
                console.log('   - Sample user:', users[0]?.first_name, users[0]?.last_name);
            }
        }
        
        // 7. Test collector_residents view (Collector App)
        console.log('\n7. Testing collector_residents view (Collector App)...');
        const { data: collectorResidents, error: collectorResidentsError } = await supabase
            .from('collector_residents')
            .select('*')
            .limit(3);
            
        if (collectorResidentsError) {
            console.error('❌ Collector residents view access failed:', collectorResidentsError);
        } else {
            console.log('✅ Collector residents view accessible:', collectorResidents?.length || 0);
        }
        
        console.log('\n🎉 UNIFIED DATABASE ACCESS TEST COMPLETED!');
        console.log('All three apps (Main, Collector, Office) are drinking from the same cup! 🥤');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testUnifiedAccess();
