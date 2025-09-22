// Test script to verify wallet setup and withdrawal flow
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWalletSetup() {
  console.log('🔍 Testing wallet setup...');
  
  try {
    // Test if wallets table exists by trying to query it
    console.log('🔍 Testing wallets table...');
    const { data: walletTest, error: walletTestError } = await supabase
      .from('wallets')
      .select('id')
      .limit(1);
    
    if (walletTestError) {
      console.error('❌ Wallets table error:', walletTestError);
      if (walletTestError.code === 'PGRST116') {
        console.log('❌ Wallets table does not exist!');
        console.log('Please run the wallet schema migration first.');
        return;
      }
    } else {
      console.log('✅ Wallets table exists and is accessible');
    }
    
    // Test if withdrawal_requests table exists by trying to query it
    console.log('🔍 Testing withdrawal_requests table...');
    const { data: withdrawalTest, error: withdrawalTestError } = await supabase
      .from('withdrawal_requests')
      .select('id')
      .limit(1);
    
    if (withdrawalTestError) {
      console.error('❌ Withdrawal_requests table error:', withdrawalTestError);
      if (withdrawalTestError.code === 'PGRST116') {
        console.log('❌ Withdrawal_requests table does not exist!');
        console.log('Please run the withdrawal schema migration first.');
        return;
      }
    } else {
      console.log('✅ Withdrawal_requests table exists and is accessible');
    }
    
    // Test creating a test wallet
    const testUserId = '00000000-0000-0000-0000-000000000000';
    console.log('🔍 Testing wallet creation...');
    
    const { data: testWallet, error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: testUserId,
        balance: 100.00,
        total_points: 1000,
        tier: 'bronze'
      })
      .select()
      .single();
    
    if (walletError) {
      console.error('❌ Error creating test wallet:', walletError);
    } else {
      console.log('✅ Test wallet created successfully:', testWallet);
      
      // Clean up test wallet
      await supabase
        .from('wallets')
        .delete()
        .eq('user_id', testUserId);
      console.log('🧹 Test wallet cleaned up');
    }
    
    // Test withdrawal_requests table structure by trying to insert a test record
    console.log('🔍 Testing withdrawal_requests table structure...');
    const testWithdrawalData = {
      user_id: testUserId,
      amount: 50.00, // Use minimum withdrawal amount
      payout_method: 'cash',
      status: 'pending',
      owner_name: 'Cash Payment' // Required field
    };
    
    const { data: testWithdrawal, error: withdrawalInsertError } = await supabase
      .from('withdrawal_requests')
      .insert(testWithdrawalData)
      .select()
      .single();
    
    if (withdrawalInsertError) {
      console.error('❌ Error testing withdrawal_requests insert:', withdrawalInsertError);
    } else {
      console.log('✅ Withdrawal_requests table structure is correct');
      console.log('✅ Test withdrawal created:', testWithdrawal);
      
      // Clean up test withdrawal
      await supabase
        .from('withdrawal_requests')
        .delete()
        .eq('id', testWithdrawal.id);
      console.log('🧹 Test withdrawal cleaned up');
    }
    
    console.log('✅ Wallet setup test completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testWalletSetup();
