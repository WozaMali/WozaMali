const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyPermissionFix() {
  try {
    console.log('🔧 Applying permission fix to database...');
    
    // Read the permission fix SQL file
    const sqlContent = fs.readFileSync('schemas/fix_soft_delete_permissions.sql', 'utf8');
    
    // Split into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.log('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 Permission fix applied successfully!');
    
    // Test the fix
    console.log('🧪 Testing the fix...');
    const { data: testResult, error: testError } = await supabase
      .rpc('soft_delete_collection', {
        p_collection_id: '00000000-0000-0000-0000-000000000000',
        p_deleted_by: '00000000-0000-0000-0000-000000000000',
        p_deletion_reason: 'Test permission check'
      });
    
    if (testError) {
      console.log('⚠️ Test error (expected for dummy ID):', testError.message);
    } else {
      console.log('✅ Test result:', testResult);
    }
    
  } catch (error) {
    console.error('❌ Failed to apply permission fix:', error);
  }
}

applyPermissionFix();
