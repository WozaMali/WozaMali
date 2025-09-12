const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testComputedValueFix() {
  try {
    console.log('🧪 Testing computed_value fix...');
    console.log('================================');

    // 1. Check if triggers exist
    console.log('\n1. Checking if triggers are created...');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .eq('trigger_name', 'update_collection_totals_trigger');

    if (triggerError) {
      console.error('❌ Error checking triggers:', triggerError.message);
    } else if (triggers && triggers.length > 0) {
      console.log('✅ Triggers found:', triggers.length);
      triggers.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name} (${trigger.event_manipulation}, ${trigger.action_timing})`);
      });
    } else {
      console.log('⚠️  No triggers found. You may need to run the SQL script in Supabase SQL Editor.');
    }

    // 2. Check existing collections
    console.log('\n2. Checking existing collections...');
    const { data: collections, error: collectionError } = await supabase
      .from('unified_collections')
      .select(`
        id,
        status,
        computed_value,
        total_value,
        total_weight_kg,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (collectionError) {
      console.error('❌ Error fetching collections:', collectionError.message);
    } else {
      console.log(`✅ Found ${collections.length} collections`);
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ID: ${col.id.substring(0, 8)}...`);
        console.log(`      Status: ${col.status}`);
        console.log(`      Computed Value: R${col.computed_value || 0}`);
        console.log(`      Total Value: R${col.total_value || 0}`);
        console.log(`      Weight: ${col.total_weight_kg || 0}kg`);
        console.log('');
      });
    }

    // 3. Check collection materials
    console.log('\n3. Checking collection materials...');
    const { data: materials, error: materialsError } = await supabase
      .from('collection_materials')
      .select(`
        id,
        collection_id,
        quantity,
        unit_price,
        materials(name)
      `)
      .limit(5);

    if (materialsError) {
      console.error('❌ Error fetching materials:', materialsError.message);
    } else {
      console.log(`✅ Found ${materials.length} collection materials`);
      materials.forEach((mat, index) => {
        console.log(`   ${index + 1}. Collection: ${mat.collection_id.substring(0, 8)}...`);
        console.log(`      Material: ${mat.materials?.name || 'Unknown'}`);
        console.log(`      Quantity: ${mat.quantity}kg`);
        console.log(`      Unit Price: R${mat.unit_price}`);
        console.log(`      Total: R${(mat.quantity * mat.unit_price).toFixed(2)}`);
        console.log('');
      });
    }

    // 4. Test the recalculation function
    console.log('\n4. Testing recalculation function...');
    const { data: recalculation, error: recalculationError } = await supabase
      .rpc('recalculate_all_collection_totals');

    if (recalculationError) {
      console.error('❌ Error running recalculation:', recalculationError.message);
    } else {
      console.log(`✅ Recalculation completed. Updated ${recalculation.length} collections`);
      if (recalculation.length > 0) {
        console.log('   Sample changes:');
        recalculation.slice(0, 3).forEach((change, index) => {
          console.log(`   ${index + 1}. Collection: ${change.collection_id.substring(0, 8)}...`);
          console.log(`      Old Value: R${change.old_computed_value || 0}`);
          console.log(`      New Value: R${change.new_computed_value || 0}`);
          console.log(`      Old Weight: ${change.old_total_weight || 0}kg`);
          console.log(`      New Weight: ${change.new_total_weight || 0}kg`);
          console.log('');
        });
      }
    }

    // 5. Summary
    console.log('\n📊 Summary:');
    console.log('   - Triggers: ' + (triggers && triggers.length > 0 ? '✅ Created' : '❌ Missing'));
    console.log('   - Collections: ' + (collections ? `✅ ${collections.length} found` : '❌ Error'));
    console.log('   - Materials: ' + (materials ? `✅ ${materials.length} found` : '❌ Error'));
    console.log('   - Recalculation: ' + (recalculation ? '✅ Working' : '❌ Error'));

    if (triggers && triggers.length > 0 && collections && materials) {
      console.log('\n🎉 The computed_value fix appears to be working correctly!');
      console.log('   The Pickups page should now show accurate computed values.');
    } else {
      console.log('\n⚠️  The fix may not be complete. Please run the SQL script in Supabase SQL Editor.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testComputedValueFix();
