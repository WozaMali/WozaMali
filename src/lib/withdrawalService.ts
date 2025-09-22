import { supabase } from './supabase';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branchCode: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processedBy?: string;
  processedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  processedRequests: number;
  totalAmount: number;
  pendingAmount: number;
}

export class WithdrawalService {
  /**
   * Create a withdrawal request
   */
  static async createWithdrawalRequest(request: {
    userId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    accountType: string;
    branchCode: string;
    payoutMethod?: 'wallet' | 'cash' | 'bank_transfer' | 'mobile_money';
  }): Promise<WithdrawalRequest> {
    try {
      console.log('WithdrawalService: Creating withdrawal request:', request);

      // Check if user has sufficient balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', request.userId)
        .single();

      if (walletError) {
        console.error('Error fetching user wallet:', walletError);
        throw walletError;
      }

      if (!wallet || wallet.balance < request.amount) {
        throw new Error('Insufficient balance for withdrawal');
      }

      // Check minimum withdrawal amount
      const minWithdrawalAmount = 50.00; // R50 minimum
      if (request.amount < minWithdrawalAmount) {
        throw new Error(`Minimum withdrawal amount is R${minWithdrawalAmount}`);
      }

      // Create withdrawal request
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: request.userId,
          amount: request.amount,
          bank_name: request.bankName,
          account_number: request.accountNumber,
          owner_name: request.accountHolderName,
          account_type: request.accountType,
          branch_code: request.branchCode,
          status: 'pending',
          payout_method: request.payoutMethod || 'wallet'
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error('Error creating withdrawal request:', withdrawalError);
        throw withdrawalError;
      }

      const result: WithdrawalRequest = {
        id: withdrawal.id,
        userId: withdrawal.user_id,
        amount: withdrawal.amount,
        bankName: withdrawal.bank_name,
        accountNumber: withdrawal.account_number,
        accountHolderName: withdrawal.owner_name,
        branchCode: withdrawal.branch_code,
        status: withdrawal.status,
        processedBy: withdrawal.processed_by,
        processedAt: withdrawal.processed_at,
        notes: withdrawal.notes,
        createdAt: withdrawal.created_at,
        updatedAt: withdrawal.updated_at
      };

      console.log('WithdrawalService: Withdrawal request created successfully:', result);

      // Record a pending transaction so History shows it immediately
      try {
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: request.userId,
            source_type: 'payout',
            source_id: result.id,
            amount: 0,
            points: 0,
            description: `Withdrawal requested (${request.payoutMethod || 'wallet'})`
          });
      } catch (e) {
        console.warn('Warning: could not insert pending withdrawal transaction', e);
      }

      return result;

    } catch (error) {
      console.error('WithdrawalService: Error creating withdrawal request:', error);
      throw error;
    }
  }

  /**
   * Get user's withdrawal requests
   */
  static async getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user withdrawals:', error);
        throw error;
      }

      return data?.map(withdrawal => ({
        id: withdrawal.id,
        userId: withdrawal.user_id,
        amount: withdrawal.amount,
        bankName: withdrawal.bank_name,
        accountNumber: withdrawal.account_number,
        accountHolderName: withdrawal.owner_name,
        branchCode: withdrawal.branch_code,
        status: withdrawal.status,
        processedBy: withdrawal.processed_by,
        processedAt: withdrawal.processed_at,
        notes: withdrawal.notes,
        createdAt: withdrawal.created_at,
        updatedAt: withdrawal.updated_at
      })) || [];

    } catch (error) {
      console.error('WithdrawalService: Error fetching user withdrawals:', error);
      throw error;
    }
  }

  /**
   * Get all withdrawal requests (admin function)
   */
  static async getAllWithdrawals(status?: string): Promise<WithdrawalRequest[]> {
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all withdrawals:', error);
        throw error;
      }

      return data?.map(withdrawal => ({
        id: withdrawal.id,
        userId: withdrawal.user_id,
        amount: withdrawal.amount,
        bankName: withdrawal.bank_name,
        accountNumber: withdrawal.account_number,
        accountHolderName: withdrawal.owner_name,
        branchCode: withdrawal.branch_code,
        status: withdrawal.status,
        processedBy: withdrawal.processed_by,
        processedAt: withdrawal.processed_at,
        notes: withdrawal.notes,
        createdAt: withdrawal.created_at,
        updatedAt: withdrawal.updated_at
      })) || [];

    } catch (error) {
      console.error('WithdrawalService: Error fetching all withdrawals:', error);
      throw error;
    }
  }

  /**
   * Update withdrawal status (admin function)
   */
  static async updateWithdrawalStatus(
    withdrawalId: string,
    status: 'pending' | 'approved' | 'rejected' | 'processed',
    processedBy: string,
    notes?: string
  ): Promise<WithdrawalRequest> {
    try {
      console.log('WithdrawalService: Updating withdrawal status:', { withdrawalId, status, processedBy });

      const updateData: any = {
        status,
        processed_by: processedBy,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (status === 'processed') {
        updateData.processed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', withdrawalId)
        .select()
        .single();

      if (error) {
        console.error('Error updating withdrawal status:', error);
        throw error;
      }

      // If approved, deduct amount from user's wallet
      if (status === 'approved') {
        const { data: withdrawal, error: fetchError } = await supabase
          .from('withdrawal_requests')
          .select('user_id, amount')
          .eq('id', withdrawalId)
          .single();

        if (fetchError) {
          console.error('Error fetching withdrawal details:', fetchError);
          throw fetchError;
        }

        // Deduct amount from wallet
        const { data: currentWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', withdrawal.user_id)
          .single();

        const newBalance = Math.max(0, Number(currentWallet?.balance || 0) - Number(withdrawal.amount || 0));

        const { error: walletError } = await supabase
          .from('wallets')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', withdrawal.user_id);

        if (walletError) {
          console.error('Error updating wallet balance:', walletError);
          throw walletError;
        }

        // Create wallet transaction record
        const { error: transactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id: withdrawal.user_id,
            source_type: 'payout',
            source_id: withdrawalId,
            amount: -withdrawal.amount, // Negative amount (deduction)
            points: 0,
            description: `Withdrawal request approved: R${withdrawal.amount}`
          });

        if (transactionError) {
          console.error('Error creating wallet transaction:', transactionError);
          throw transactionError;
        }
      }

      const result: WithdrawalRequest = {
        id: data.id,
        userId: data.user_id,
        amount: data.amount,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        accountHolderName: data.account_holder_name,
        branchCode: data.branch_code,
        status: data.status,
        processedBy: data.processed_by,
        processedAt: data.processed_at,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      console.log('WithdrawalService: Withdrawal status updated successfully:', result);
      return result;

    } catch (error) {
      console.error('WithdrawalService: Error updating withdrawal status:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal statistics (admin function)
   */
  static async getWithdrawalStats(): Promise<WithdrawalStats> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('status, amount');

      if (error) {
        console.error('Error fetching withdrawal stats:', error);
        throw error;
      }

      const stats = data?.reduce((acc, withdrawal) => {
        acc.totalRequests++;
        acc.totalAmount += withdrawal.amount;

        switch (withdrawal.status) {
          case 'pending':
            acc.pendingRequests++;
            acc.pendingAmount += withdrawal.amount;
            break;
          case 'approved':
            acc.approvedRequests++;
            break;
          case 'rejected':
            acc.rejectedRequests++;
            break;
          case 'processed':
            acc.processedRequests++;
            break;
        }

        return acc;
      }, {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        processedRequests: 0,
        totalAmount: 0,
        pendingAmount: 0
      }) || {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        processedRequests: 0,
        totalAmount: 0,
        pendingAmount: 0
      };

      return stats;

    } catch (error) {
      console.error('WithdrawalService: Error fetching withdrawal stats:', error);
      throw error;
    }
  }

  /**
   * Cancel a withdrawal request (user function)
   */
  static async cancelWithdrawalRequest(withdrawalId: string, userId: string): Promise<WithdrawalRequest> {
    try {
      console.log('WithdrawalService: Cancelling withdrawal request:', { withdrawalId, userId });

      // Check if withdrawal exists and belongs to user
      const { data: withdrawal, error: fetchError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('id', withdrawalId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching withdrawal:', fetchError);
        throw fetchError;
      }

      if (withdrawal.status !== 'pending') {
        throw new Error('Only pending withdrawal requests can be cancelled');
      }

      // Update status to rejected with cancellation note
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          notes: 'Cancelled by user',
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling withdrawal:', error);
        throw error;
      }

      const result: WithdrawalRequest = {
        id: data.id,
        userId: data.user_id,
        amount: data.amount,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        accountHolderName: data.account_holder_name,
        branchCode: data.branch_code,
        status: data.status,
        processedBy: data.processed_by,
        processedAt: data.processed_at,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      console.log('WithdrawalService: Withdrawal request cancelled successfully:', result);
      return result;

    } catch (error) {
      console.error('WithdrawalService: Error cancelling withdrawal request:', error);
      throw error;
    }
  }
}
