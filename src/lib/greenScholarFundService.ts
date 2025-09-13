import { supabase } from './supabase';

export interface GreenScholarFundData {
  totalBalance: number;
  totalContributions: number;
  totalDistributions: number;
  recentTransactions: GreenScholarTransaction[];
  beneficiaryStats: {
    schools: number;
    childHeadedHomes: number;
    totalBeneficiaries: number;
  };
}

export interface GreenScholarTransaction {
  id: string;
  transactionType: 'contribution' | 'distribution' | 'donation';
  amount: number;
  sourceType?: string;
  sourceId?: string;
  beneficiaryType?: 'school' | 'child_headed_home' | 'general';
  beneficiaryId?: string;
  description: string;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  schoolType: 'primary' | 'secondary' | 'special_needs';
  address: string;
  city: string;
  province: string;
  postalCode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  studentCount: number;
  isActive: boolean;
}

export interface ChildHeadedHome {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  childCount: number;
  isActive: boolean;
}

export interface UserDonation {
  id: string;
  userId: string;
  amount: number;
  beneficiaryType: 'school' | 'child_headed_home' | 'general';
  beneficiaryId?: string;
  isAnonymous: boolean;
  message?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export class GreenScholarFundService {
  /**
   * Get Green Scholar Fund overview data (no fallbacks)
   */
  static async getFundData(): Promise<GreenScholarFundData> {
    const { data: balance, error: balErr } = await supabase
      .from('green_scholar_fund_balance')
      .select('total_balance, total_contributions, total_distributions, expenses_total, pet_donations_total, direct_donations_total, last_updated')
      .order('last_updated', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (balErr || !balance) {
      throw new Error(`Fund balance not available. Run green_scholar_fund_balance.sql to install and seed snapshot. (${balErr?.message || 'no row'})`);
    }

      let transactions: any[] = [];
    const { data: tx } = await supabase
      .from('green_scholar_transactions')
      .select('id, transaction_type, amount, source_type, source_id, beneficiary_type, beneficiary_id, description, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    if (Array.isArray(tx)) transactions = tx;

    return {
      totalBalance: Number(balance.total_balance || 0),
      totalContributions: Number((balance.total_contributions ?? (Number(balance.pet_donations_total || 0) + Number(balance.direct_donations_total || 0))) || 0),
      totalDistributions: Number(balance.expenses_total || balance.total_distributions || 0),
      recentTransactions: transactions.map(t => ({
          id: t.id,
          transactionType: t.transaction_type,
          amount: t.amount,
          sourceType: t.source_type,
          sourceId: t.source_id,
          beneficiaryType: t.beneficiary_type,
          beneficiaryId: t.beneficiary_id,
          description: t.description,
          createdAt: t.created_at
      })),
      beneficiaryStats: { schools: 0, childHeadedHomes: 0, totalBeneficiaries: 0 }
    };
  }

  /**
   * Get user's combined contribution totals (PET + donations)
   */
  static async getUserContributionTotals(userId: string): Promise<{
    totalPetAmount: number;
    totalDonationAmount: number;
    totalContribution: number;
  }> {
    // Compute directly from transactions (no dependency on views)
    try {
      const { data: petTx } = await supabase
        .from('green_scholar_transactions')
        .select('amount')
        .eq('transaction_type', 'pet_contribution')
        .eq('created_by', userId);
      const totalPetAmount = (petTx || []).reduce((s, r: any) => s + (Number(r.amount) || 0), 0);

      const { data: donTx } = await supabase
        .from('green_scholar_transactions')
        .select('amount, transaction_type, created_by')
        .in('transaction_type', ['donation', 'direct_donation'])
        .eq('created_by', userId);
      const totalDonationAmount = (donTx || []).reduce((s, r: any) => s + (Number(r.amount) || 0), 0);

      const totalContribution = totalPetAmount + totalDonationAmount;
      return { totalPetAmount, totalDonationAmount, totalContribution };
    } catch (_e) {
      return { totalPetAmount: 0, totalDonationAmount: 0, totalContribution: 0 };
    }
  }

  /**
   * Make a donation: deduct from user's wallet and record a donation transaction
   */
  static async makeDonation(donation: {
    userId: string;
    amount: number;
    beneficiaryType: 'school' | 'child_headed_home' | 'general';
    beneficiaryId?: string;
    isAnonymous: boolean;
    message?: string;
  }): Promise<UserDonation> {
    const amount = Number(donation.amount || 0);
    if (!donation.userId || amount <= 0) {
      throw new Error('Invalid donation request');
    }

    // 1) Deduct from wallet (cash balance)
    const { error: walletErr } = await supabase.rpc('update_wallet_simple', {
        p_user_id: donation.userId,
      p_amount: -amount, // deduct
      p_transaction_type: 'donation',
      p_weight_kg: 0,
      p_description: donation.message || 'Green Scholar Fund donation',
      p_reference_id: null
    });
    if (walletErr) {
      throw walletErr;
    }

    // 2) Insert donation transaction (direct cash donation)
    const { data: inserted, error: txErr } = await supabase
      .from('green_scholar_transactions')
      .insert({
        transaction_type: 'direct_donation',
        amount: amount,
        source_type: 'user_wallet',
        source_id: donation.userId,
        beneficiary_type: donation.beneficiaryType || 'general',
        beneficiary_id: donation.beneficiaryId || null,
        description: donation.message || 'Green Scholar Fund donation',
            created_by: donation.userId
      })
      .select('id, beneficiary_type, beneficiary_id, created_at')
      .single();
    if (txErr) {
      throw txErr;
    }

    // 3) Return normalized donation object
      return {
      id: inserted.id,
      userId: donation.userId,
      amount: amount,
      beneficiaryType: (inserted.beneficiary_type || 'general') as any,
      beneficiaryId: inserted.beneficiary_id || undefined,
      isAnonymous: donation.isAnonymous,
      message: donation.message,
      status: 'completed',
      createdAt: inserted.created_at
    };
  }

  /**
   * Get user's donation history from transactions
   */
  static async getUserDonations(userId: string): Promise<UserDonation[]> {
    const { data: tx, error } = await supabase
      .from('green_scholar_transactions')
      .select('id, amount, transaction_type, beneficiary_type, beneficiary_id, description, created_at, created_by')
      .eq('created_by', userId)
      .in('transaction_type', ['donation', 'direct_donation'])
        .order('created_at', { ascending: false });
    if (error) return [];
    return (tx || []).map(t => ({
      id: t.id,
      userId: userId,
      amount: t.amount,
      beneficiaryType: (t.beneficiary_type || 'general') as any,
      beneficiaryId: t.beneficiary_id || undefined,
      isAnonymous: false,
      message: t.description || undefined,
      status: 'completed',
      createdAt: t.created_at
    }));
  }

  static async getTransactionHistory(limit: number = 50): Promise<GreenScholarTransaction[]> {
      const { data, error } = await supabase
        .from('green_scholar_transactions')
        .select('id, transaction_type, amount, source_type, source_id, beneficiary_type, beneficiary_id, description, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) return [];
    return (data || []).map(t => ({
      id: t.id,
      transactionType: t.transaction_type,
      amount: t.amount,
      sourceType: t.source_type,
      sourceId: t.source_id,
      beneficiaryType: t.beneficiary_type,
      beneficiaryId: t.beneficiary_id,
      description: t.description,
      createdAt: t.created_at
    }));
  }
}