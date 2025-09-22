const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
  try {
    console.log('🔍 Checking withdrawal_requests table...');

    // Try to get a sample record to see the current structure
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error querying table:', error);
      
      // Check if table exists by trying to get table info
      const { data: tableInfo, error: tableError } = await supabase
        .from('withdrawal_requests')
        .select('id')
        .limit(0);
        
      if (tableError) {
        console.log('📊 Table might not exist or have different structure');
        console.log('🔧 We need to create the table with the correct schema');
        return false;
      }
    } else {
      console.log('📊 Current table structure sample:', data.length > 0 ? Object.keys(data[0]) : 'Table is empty');
      if (data.length > 0) {
        console.log('📋 Sample record:', data[0]);
      }
      return true;
    }

  } catch (error) {
    console.error('❌ Error checking table:', error);
    return false;
  }
}

// Run the check
checkTable();
