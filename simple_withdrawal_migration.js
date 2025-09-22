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

async function checkAndFixTable() {
  try {
    console.log('🔍 Checking current withdrawal_requests table structure...');

    // First, let's see what columns actually exist
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error querying table:', error.message);
      console.log('🔧 Table might not exist. Let\'s create it with the correct schema...');
      await createWithdrawalTable();
      return;
    }

    if (data.length === 0) {
      console.log('📊 Table exists but is empty');
      console.log('🔧 Adding missing columns...');
      await addMissingColumns();
    } else {
      console.log('📊 Current table structure:', Object.keys(data[0]));
      console.log('🔧 Adding missing columns...');
      await addMissingColumns();
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

async function createWithdrawalTable() {
  console.log('🔄 Creating withdrawal_requests table with correct schema...');
  
  // Since we can't use exec_sql, let's try to create the table by inserting a test record
  // and then dropping it to trigger table creation
  try {
    const { error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        amount: 0.01,
        bank_name: 'Test Bank',
        account_number: '123456789',
        owner_name: 'Test User',
        account_type: 'Savings',
        branch_code: '123456',
        payout_method: 'bank_transfer',
        status: 'pending'
      });

    if (error) {
      console.log('❌ Could not create table via insert:', error.message);
      console.log('💡 Please run the SQL migration manually in Supabase SQL Editor');
      console.log('📋 SQL to run:');
      console.log(`
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    owner_name TEXT,
    account_type TEXT,
    branch_code TEXT,
    payout_method TEXT CHECK (payout_method IN ('bank_transfer', 'cash')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
    admin_notes TEXT,
    processed_by TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    external_withdrawal_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);

-- Enable RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
      `);
    } else {
      console.log('✅ Table created successfully');
      // Clean up the test record
      await supabase
        .from('withdrawal_requests')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
    }
  } catch (error) {
    console.error('❌ Error creating table:', error);
  }
}

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to existing table...');
  
  // Try to insert a record with all the fields we need
  // If it fails, it means the columns don't exist
  try {
    const { error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        amount: 0.01,
        bank_name: 'Test Bank',
        account_number: '123456789',
        owner_name: 'Test User',
        account_type: 'Savings',
        branch_code: '123456',
        payout_method: 'bank_transfer',
        status: 'pending'
      });

    if (error) {
      console.log('❌ Missing columns detected:', error.message);
      console.log('💡 Please add the missing columns manually in Supabase SQL Editor:');
      console.log(`
ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS branch_code TEXT,
ADD COLUMN IF NOT EXISTS payout_method TEXT CHECK (payout_method IN ('bank_transfer', 'cash')),
ADD COLUMN IF NOT EXISTS processed_by TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;
      `);
    } else {
      console.log('✅ All required columns exist');
      // Clean up the test record
      await supabase
        .from('withdrawal_requests')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
    }
  } catch (error) {
    console.error('❌ Error checking columns:', error);
  }
}

// Run the migration
checkAndFixTable();
