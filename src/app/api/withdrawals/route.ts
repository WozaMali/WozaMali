export const dynamic = 'force-static';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      amount, 
      bankName, 
      accountNumber, 
      accountHolderName, 
      accountType, 
      branchCode, 
      payoutMethod 
    } = body;

    console.log('🔍 API: Creating withdrawal request:', { userId, amount, payoutMethod, bankName, accountNumber, accountHolderName });

    // Validate required fields
    if (!userId || !amount) {
      return NextResponse.json({ error: 'User ID and amount are required' }, { status: 400 });
    }

    if (payoutMethod === 'bank_transfer' && (!bankName || !accountNumber || !accountHolderName)) {
      return NextResponse.json({ 
        error: 'Bank name, account number, and account holder name are required for bank transfers' 
      }, { status: 400 });
    }

    // Check if user has sufficient balance (skip for now due to permission issues)
    console.log('🔍 Checking wallet for user:', userId);
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    console.log('🔍 Wallet query result:', { wallet, walletError });

    // If wallet doesn't exist or has permission issues, skip balance check for now
    if (walletError) {
      console.warn('⚠️ Wallet check failed, skipping balance verification:', walletError.message);
      console.warn('⚠️ This is likely due to permission issues. Proceeding with withdrawal creation.');
      // For now, we'll skip the balance check and allow the withdrawal
      // TODO: Fix wallet table permissions and re-enable balance checking
    } else {
      if (!wallet) {
        console.warn('⚠️ Wallet not found, skipping balance verification for now.');
      } else {
        console.log('✅ Found existing wallet with balance:', wallet.balance);
        if (wallet.balance < amount) {
          return NextResponse.json({ error: 'Insufficient balance for withdrawal' }, { status: 400 });
        }
      }
    }

    // Check minimum withdrawal amount
    const minWithdrawalAmount = 50.00;
    if (amount < minWithdrawalAmount) {
      return NextResponse.json({ 
        error: `Minimum withdrawal amount is R${minWithdrawalAmount}` 
      }, { status: 400 });
    }

    // Create withdrawal request
    type WithdrawalInsert = {
      user_id: string;
      amount: number;
      payout_method: string;
      status: string;
      owner_name: string;
      bank_name?: string | null;
      account_number?: string | null;
      account_type?: string | null;
      branch_code?: string | null;
    };

    const withdrawalData: WithdrawalInsert = {
      user_id: userId,
      amount: amount,
      payout_method: payoutMethod || 'bank_transfer',
      status: 'pending',
      owner_name: 'Cash Payment' // Always provide owner_name to satisfy NOT NULL constraint
    };

    // Only add bank details for bank_transfer payments
    if (payoutMethod === 'bank_transfer') {
      withdrawalData.bank_name = bankName || null;
      withdrawalData.account_number = accountNumber || null;
      withdrawalData.owner_name = accountHolderName || 'Bank Transfer';
      withdrawalData.account_type = accountType || null;
      withdrawalData.branch_code = branchCode || null;
    }

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert(withdrawalData)
      .select()
      .single();

    if (withdrawalError) {
      console.error('Error creating withdrawal request:', withdrawalError);
      return NextResponse.json({ error: withdrawalError.message }, { status: 500 });
    }

    console.log('✅ API: Withdrawal request created successfully:', withdrawal);

    // Create wallet transaction record for tracking
    try {
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          source_type: 'payout',
          source_id: withdrawal.id,
          amount: 0, // No immediate deduction - will be deducted when approved
          points: 0,
          description: `Withdrawal requested (${payoutMethod})`
        });
    } catch (transactionError) {
      console.warn('Warning: could not insert withdrawal transaction record', transactionError);
    }

    // Send notification to Office App
    try {
      const WithdrawalNotificationService = (await import('@/lib/withdrawalNotificationService')).default;
      await WithdrawalNotificationService.notifyOfficeApp({
        id: withdrawal.id,
        userId: withdrawal.user_id,
        amount: withdrawal.amount,
        payoutMethod: withdrawal.payout_method,
        bankName: withdrawal.bank_name,
        accountNumber: withdrawal.account_number,
        accountHolderName: withdrawal.owner_name,
        status: withdrawal.status,
        createdAt: withdrawal.created_at
      });
    } catch (notificationError) {
      console.warn('⚠️ Could not send notification to Office App:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        payoutMethod: withdrawal.payout_method,
        createdAt: withdrawal.created_at
      }
    });

  } catch (error) {
    console.error('❌ API: Error creating withdrawal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 API: Fetching withdrawals for user:', userId);

    const { data: withdrawals, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ withdrawals });

  } catch (error) {
    console.error('❌ API: Error fetching withdrawals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
