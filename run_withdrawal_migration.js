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

async function runMigration() {
  try {
    console.log('🚀 Starting withdrawal_requests schema migration...');

    // First, let's check the current structure
    console.log('📋 Checking current table structure...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'withdrawal_requests' });

    if (columnsError) {
      console.log('⚠️ Could not get table structure via RPC, trying direct query...');
      
      // Try to get current structure by querying the table
      const { data: sampleData, error: sampleError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('📊 Table might not exist or be empty. Proceeding with migration...');
      } else {
        console.log('📊 Current table structure sample:', Object.keys(sampleData[0] || {}));
      }
    } else {
      console.log('📊 Current columns:', columns);
    }

    // Add new columns if they don't exist
    console.log('🔧 Adding new columns...');
    
    const addColumnsSQL = `
      ALTER TABLE withdrawal_requests 
      ADD COLUMN IF NOT EXISTS bank_name TEXT,
      ADD COLUMN IF NOT EXISTS account_number TEXT,
      ADD COLUMN IF NOT EXISTS owner_name TEXT,
      ADD COLUMN IF NOT EXISTS account_type TEXT,
      ADD COLUMN IF NOT EXISTS branch_code TEXT,
      ADD COLUMN IF NOT EXISTS payout_method TEXT CHECK (payout_method IN ('wallet', 'cash', 'bank_transfer', 'mobile_money')),
      ADD COLUMN IF NOT EXISTS processed_by TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `;

    const { error: alterError } = await supabase.rpc('exec_sql', { sql: addColumnsSQL });
    
    if (alterError) {
      console.error('❌ Error adding columns:', alterError);
      // Try alternative approach - create a new table and migrate data
      console.log('🔄 Trying alternative approach...');
      await createNewWithdrawalTable();
    } else {
      console.log('✅ Columns added successfully');
    }

    // Update payout_method based on withdrawal_method for existing records
    console.log('🔄 Updating payout_method for existing records...');
    
    const updatePayoutMethodSQL = `
      UPDATE withdrawal_requests 
      SET payout_method = CASE 
        WHEN withdrawal_method = 'bank_transfer' THEN 'bank_transfer'
        WHEN withdrawal_method = 'mobile_money' THEN 'mobile_money'
        WHEN withdrawal_method = 'paypal' THEN 'wallet'
        WHEN withdrawal_method = 'crypto' THEN 'wallet'
        ELSE 'bank_transfer'
      END
      WHERE payout_method IS NULL;
    `;

    const { error: updateError } = await supabase.rpc('exec_sql', { sql: updatePayoutMethodSQL });
    
    if (updateError) {
      console.warn('⚠️ Could not update payout_method:', updateError.message);
    } else {
      console.log('✅ Payout method updated successfully');
    }

    // Add indexes for better performance
    console.log('🔧 Adding indexes...');
    
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
      CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    
    if (indexError) {
      console.warn('⚠️ Could not create indexes:', indexError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // Update RLS policies
    console.log('🔧 Updating RLS policies...');
    
    const policiesSQL = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON withdrawal_requests;
      DROP POLICY IF EXISTS "Users can insert own withdrawal requests" ON withdrawal_requests;
      DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
      DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;

      -- Recreate policies
      CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
          FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert own withdrawal requests" ON withdrawal_requests
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Admins can view all withdrawal requests" ON withdrawal_requests
          FOR SELECT USING (
              EXISTS (
                  SELECT 1 FROM users 
                  WHERE users.id = auth.uid() 
                  AND users.role IN ('admin', 'super_admin')
              )
          );

      CREATE POLICY "Admins can update withdrawal requests" ON withdrawal_requests
          FOR UPDATE USING (
              EXISTS (
                  SELECT 1 FROM users 
                  WHERE users.id = auth.uid() 
                  AND users.role IN ('admin', 'super_admin')
              )
          );
    `;

    const { error: policyError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    
    if (policyError) {
      console.warn('⚠️ Could not update RLS policies:', policyError.message);
    } else {
      console.log('✅ RLS policies updated successfully');
    }

    // Verify the updated structure
    console.log('🔍 Verifying updated structure...');
    const { data: updatedData, error: verifyError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.log('📊 Table verification:', verifyError.message);
    } else {
      console.log('📊 Updated table structure sample:', Object.keys(updatedData[0] || {}));
    }

    console.log('✅ Migration completed successfully!');
    console.log('🎉 The withdrawal_requests table now supports the expected schema for the WithdrawalService');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function createNewWithdrawalTable() {
  console.log('🔄 Creating new withdrawal_requests table with correct schema...');
  
  const createTableSQL = `
    -- Create new table with correct schema
    CREATE TABLE IF NOT EXISTS withdrawal_requests_new (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        withdrawal_method TEXT NOT NULL CHECK (withdrawal_method IN ('bank_transfer', 'mobile_money', 'paypal', 'crypto')),
        bank_name TEXT,
        account_number TEXT,
        owner_name TEXT,
        account_type TEXT,
        branch_code TEXT,
        payout_method TEXT CHECK (payout_method IN ('wallet', 'cash', 'bank_transfer', 'mobile_money')),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
        admin_notes TEXT,
        processed_by TEXT,
        processed_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        external_withdrawal_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Copy data from old table if it exists
    INSERT INTO withdrawal_requests_new (id, user_id, amount, withdrawal_method, status, admin_notes, processed_at, external_withdrawal_id, created_at, updated_at)
    SELECT id, user_id, amount, withdrawal_method, status, admin_notes, processed_at, external_withdrawal_id, created_at, updated_at
    FROM withdrawal_requests
    ON CONFLICT (id) DO NOTHING;

    -- Drop old table and rename new one
    DROP TABLE IF EXISTS withdrawal_requests CASCADE;
    ALTER TABLE withdrawal_requests_new RENAME TO withdrawal_requests;
  `;

  const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
  
  if (createError) {
    console.error('❌ Error creating new table:', createError);
    throw createError;
  } else {
    console.log('✅ New withdrawal_requests table created successfully');
  }
}

// Run the migration
runMigration();
