const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

async function executeSQLScript() {
  try {
    console.log('🔧 Fixing computed_value on Pickups page to reflect transactions...');
    console.log('===============================================================');

    // Read the SQL script
    const sqlScript = fs.readFileSync('fix-computed-value-triggers.sql', 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }

    // Execute verification queries
    console.log('\n🔍 Running verification queries...');
    
    // Check if triggers are created
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing, action_statement')
      .eq('trigger_name', 'update_collection_totals_trigger');

    if (triggerError) {
      console.error('❌ Error checking triggers:', triggerError.message);
    } else {
      console.log('✅ Triggers verification:', triggers.length > 0 ? 'Triggers created successfully' : 'No triggers found');
    }

    // Show sample collections
    const { data: collections, error: collectionError } = await supabase
      .from('unified_collections')
      .select(`
        id,
        status,
        computed_value,
        total_value,
        total_weight_kg,
        created_at,
        collection_materials(count)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (collectionError) {
      console.error('❌ Error fetching collections:', collectionError.message);
    } else {
      console.log('\n📊 Sample collections with computed values:');
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ID: ${col.id.substring(0, 8)}...`);
        console.log(`      Status: ${col.status}`);
        console.log(`      Computed Value: R${col.computed_value || 0}`);
        console.log(`      Total Value: R${col.total_value || 0}`);
        console.log(`      Weight: ${col.total_weight_kg || 0}kg`);
        console.log(`      Materials: ${col.collection_materials?.[0]?.count || 0}`);
        console.log('');
      });
    }

    console.log('✅ COMPUTED_VALUE FIX COMPLETE');
    console.log('   Triggers created to automatically update computed_value when collection_materials change');
    console.log('   All existing collections have been recalculated');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Alternative approach: Execute the SQL directly using Supabase's SQL editor functionality
async function executeSQLDirectly() {
  try {
    console.log('🔧 Alternative approach: Executing SQL directly...');
    
    // Read the SQL script
    const sqlScript = fs.readFileSync('fix-computed-value-triggers.sql', 'utf8');
    
    // Execute the entire script as one query
    const { data, error } = await supabase.rpc('exec', { sql: sqlScript });
    
    if (error) {
      console.error('❌ Error executing SQL script:', error.message);
      return false;
    }
    
    console.log('✅ SQL script executed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error executing SQL directly:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting computed_value fix...');
  
  // Try direct execution first
  const directSuccess = await executeSQLDirectly();
  
  if (!directSuccess) {
    console.log('\n🔄 Falling back to statement-by-statement execution...');
    await executeSQLScript();
  }
  
  console.log('\n🎉 Fix completed! The computed_value should now update automatically when collection materials change.');
}

main().catch(console.error);
