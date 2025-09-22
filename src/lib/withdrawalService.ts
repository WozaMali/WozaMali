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
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    accountType?: string;
    branchCode?: string;
    payoutMethod?: 'bank_transfer' | 'cash';
  }): Promise<WithdrawalRequest> {
    try {
      console.log('WithdrawalService: Creating withdrawal request via API:', request);

      // Use the API endpoint instead of direct Supabase calls
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: request.userId,
          amount: request.amount,
          bankName: request.bankName,
          accountNumber: request.accountNumber,
          accountHolderName: request.accountHolderName,
          accountType: request.accountType,
          branchCode: request.branchCode,
          payoutMethod: request.payoutMethod || 'bank_transfer'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('WithdrawalService: Withdrawal request created successfully via API:', result);

      // Convert API response to WithdrawalRequest format
      const withdrawalRequest: WithdrawalRequest = {
        id: result.withdrawal.id,
        userId: request.userId,
        amount: result.withdrawal.amount,
        bankName: request.bankName || '',
        accountNumber: request.accountNumber || '',
        accountHolderName: request.accountHolderName || '',
        branchCode: request.branchCode || '',
        status: result.withdrawal.status,
        processedBy: undefined,
        processedAt: undefined,
        notes: undefined,
        createdAt: result.withdrawal.createdAt,
        updatedAt: result.withdrawal.createdAt
      };

      return withdrawalRequest;

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
      const response = await fetch(`/api/withdrawals?userId=${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      return result.withdrawals?.map((withdrawal: any) => ({
        id: withdrawal.id,
        userId: withdrawal.user_id,
        amount: withdrawal.amount,
        bankName: withdrawal.bank_name || '',
        accountNumber: withdrawal.account_number || '',
        accountHolderName: withdrawal.owner_name || '',
        branchCode: withdrawal.branch_code || '',
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
