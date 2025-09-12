// Simple test to check wallet integration
// Run this with: node simple-wallet-test.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

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

    console.log('\n🎉 Wallet integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWalletIntegration().catch(console.error);
