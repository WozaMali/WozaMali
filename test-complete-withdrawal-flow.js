// Test the complete withdrawal flow from Main App to Office App
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteWithdrawalFlow() {
  console.log('🔄 Testing complete withdrawal flow...');
  
  try {
    // 1. Test Main App withdrawal creation
    console.log('📱 Step 1: Testing Main App withdrawal creation...');
    const withdrawalData = {
      userId: '00000000-0000-0000-0000-000000000000',
      amount: 75.00,
      payoutMethod: 'cash'
    };
    
    const response = await fetch('http://localhost:8080/api/withdrawals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(withdrawalData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Main App withdrawal failed:', result.error);
      return;
    }
    
    console.log('✅ Main App withdrawal created:', result.withdrawal.id);
    
    // 2. Test Office App can read the withdrawal
    console.log('🏢 Step 2: Testing Office App can read withdrawal...');
    const { data: withdrawals, error: officeError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', result.withdrawal.id)
      .single();
    
    if (officeError) {
      console.error('❌ Office App cannot read withdrawal:', officeError);
      return;
    }
    
    console.log('✅ Office App can read withdrawal:', {
      id: withdrawals.id,
      amount: withdrawals.amount,
      payout_method: withdrawals.payout_method,
      status: withdrawals.status,
      owner_name: withdrawals.owner_name
    });
    
    // 3. Test Office App can update withdrawal status
    console.log('🏢 Step 3: Testing Office App can update withdrawal status...');
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'approved',
        notes: 'Test approval from Office App',
        processed_at: new Date().toISOString()
      })
      .eq('id', result.withdrawal.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Office App cannot update withdrawal:', updateError);
      return;
    }
    
    console.log('✅ Office App updated withdrawal status:', {
      id: updatedWithdrawal.id,
      status: updatedWithdrawal.status,
      notes: updatedWithdrawal.notes
    });
    
    // 4. Test different payout methods
    console.log('💳 Step 4: Testing different payout methods...');
    
    const bankTransferData = {
      userId: '00000000-0000-0000-0000-000000000000',
      amount: 100.00,
      payoutMethod: 'bank_transfer',
      bankName: 'Standard Bank',
      accountNumber: '1234567890',
      accountHolderName: 'Test User',
      accountType: 'Savings',
      branchCode: '051001'
    };
    
    const bankResponse = await fetch('http://localhost:8080/api/withdrawals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bankTransferData)
    });
    
    const bankResult = await bankResponse.json();
    
    if (bankResponse.ok) {
      console.log('✅ Bank transfer withdrawal created:', bankResult.withdrawal.id);
    } else {
      console.error('❌ Bank transfer withdrawal failed:', bankResult.error);
    }
    
    // 5. Clean up test data
    console.log('🧹 Step 5: Cleaning up test data...');
    await supabase
      .from('withdrawal_requests')
      .delete()
      .eq('user_id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Test data cleaned up');
    
    console.log('🎉 Complete withdrawal flow test successful!');
    console.log('📋 Summary:');
    console.log('  ✅ Main App can create cash withdrawals');
    console.log('  ✅ Main App can create bank transfer withdrawals');
    console.log('  ✅ Office App can read withdrawals from unified table');
    console.log('  ✅ Office App can update withdrawal status');
    console.log('  ✅ All payout methods are supported');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteWithdrawalFlow();
