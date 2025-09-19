const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mljtjntkddwkcjixkyuy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sanRqbnRrZGR3a2NqaXhreXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyNjY4NSwiZXhwIjoyMDcwMDAyNjg1fQ.X6O2YFRkkN0T_yB-XgGYi2_PY9ob0ZOmHE0FJUl9T7A';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabaseTables() {
  console.log('🔍 Checking database tables...\n');

  const tablesToCheck = [
    'rewards',
    'roles', 
    'users',
    'collections',
    'materials',
    'areas',
    'user_profiles',
    'wallets'
  ];

  for (const tableName of tablesToCheck) {
    try {
      console.log(`Checking ${tableName}...`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: Accessible (${data?.length || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }

  // Also try to get table information from information_schema
  console.log('\n🔍 Checking information_schema...');
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', tablesToCheck);

    if (error) {
      console.log('❌ information_schema access error:', error.message);
    } else {
      console.log('✅ Available tables:', data?.map(t => t.table_name) || []);
    }
  } catch (err) {
    console.log('❌ information_schema error:', err.message);
  }
}

checkDatabaseTables();
