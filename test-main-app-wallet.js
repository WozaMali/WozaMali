// Test script to check if Main App can read wallet data
// Run this with: node test-main-app-wallet.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWalletIntegration() {
  console.log('🔍 Testing wallet integration...\n');

  try {
    // Test 1: Check if main_app_user_wallet view exists and has data
    console.log('1. Testing main_app_user_wallet view...');
    const { data: walletData, error: walletError } = await supabase
      .from('main_app_user_wallet')
      .select('*')
      .limit(3);

    if (walletError) {
      console.log(`❌ main_app_user_wallet error: ${walletError.message}`);
    } else {
      console.log(`✅ main_app_user_wallet: ${walletData?.length || 0} records`);
      if (walletData && walletData.length > 0) {
        console.log('   Sample data:', walletData[0]);
      }
    }

    // Test 2: Check if user_collections_summary view exists and has data
    console.log('\n2. Testing user_collections_summary view...');
    const { data: collectionsData, error: collectionsError } = await supabase
      .from('user_collections_summary')
      .select('*')
      .limit(3);

    if (collectionsError) {
      console.log(`❌ user_collections_summary error: ${collectionsError.message}`);
    } else {
      console.log(`✅ user_collections_summary: ${collectionsData?.length || 0} records`);
      if (collectionsData && collectionsData.length > 0) {
        console.log('   Sample data:', collectionsData[0]);
      }
    }

    // Test 3: Check if wallets table has data
    console.log('\n3. Testing wallets table...');
    const { data: walletsData, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .limit(3);

    if (walletsError) {
      console.log(`❌ wallets table error: ${walletsError.message}`);
    } else {
      console.log(`✅ wallets table: ${walletsData?.length || 0} records`);
      if (walletsData && walletsData.length > 0) {
        console.log('   Sample data:', walletsData[0]);
      }
    }

    console.log('\n🎉 Wallet integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWalletIntegration().catch(console.error);
