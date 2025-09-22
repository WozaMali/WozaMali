// Test the withdrawal API directly
require('dotenv').config();

async function testWithdrawalAPI() {
  console.log('🔍 Testing withdrawal API...');
  
  const testData = {
    userId: '00000000-0000-0000-0000-000000000000',
    amount: 50.00,
    payoutMethod: 'cash'
  };
  
  try {
    const response = await fetch('http://localhost:8080/api/withdrawals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', result);
    
    if (response.ok) {
      console.log('✅ Withdrawal API test successful!');
    } else {
      console.log('❌ Withdrawal API test failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing withdrawal API:', error);
  }
}

testWithdrawalAPI();
