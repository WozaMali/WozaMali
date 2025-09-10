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
   * Get Green Scholar Fund overview data
   */
  static async getFundData(): Promise<GreenScholarFundData> {
    try {
      console.log('GreenScholarFundService: Fetching fund data...');

      // Get fund balance (be resilient to schema differences)
      let fundBalance: any = null;
      let balanceError: any = null;
      try {
        const resp = await supabase
          .from('green_scholar_fund_balance')
          .select('*')
          .single();
        fundBalance = resp.data;
        balanceError = resp.error;
      } catch (e: any) {
        balanceError = e;
      }

      if (balanceError) {
        console.error('Error fetching fund balance:', balanceError);
        throw balanceError;
      }

      // Get recent transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('green_scholar_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        throw transactionsError;
      }

      // Get beneficiary statistics
      const [schoolsResult, homesResult] = await Promise.all([
        supabase.from('schools').select('id').eq('is_active', true),
        supabase.from('child_headed_homes').select('id').eq('is_active', true)
      ]);

      const schoolsCount = schoolsResult.data?.length || 0;
      const homesCount = homesResult.data?.length || 0;

      const result: GreenScholarFundData = {
        totalBalance: Number(fundBalance?.total_balance) || 0,
        totalContributions: Number(fundBalance?.total_contributions ?? fundBalance?.contributions) || 0,
        totalDistributions: Number(fundBalance?.total_distributions ?? fundBalance?.distributions) || 0,
        recentTransactions: transactions?.map(t => ({
          id: t.id,
          transactionType: t.transaction_type,
          amount: t.amount,
          sourceType: t.source_type,
          sourceId: t.source_id,
          beneficiaryType: t.beneficiary_type,
          beneficiaryId: t.beneficiary_id,
          description: t.description,
          createdAt: t.created_at
        })) || [],
        beneficiaryStats: {
          schools: schoolsCount,
          childHeadedHomes: homesCount,
          totalBeneficiaries: schoolsCount + homesCount
        }
      };

      console.log('GreenScholarFundService: Fund data retrieved successfully:', result);
      return result;

    } catch (error) {
      console.error('GreenScholarFundService: Error fetching fund data:', error);
      throw error;
    }
  }

  /**
   * Get all active schools
   */
  static async getSchools(): Promise<School[]> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching schools:', error);
        throw error;
      }

      return data?.map(school => ({
        id: school.id,
        name: school.name,
        schoolType: school.school_type,
        address: school.address,
        city: school.city,
        province: school.province,
        postalCode: school.postal_code,
        contactPerson: school.contact_person,
        contactPhone: school.contact_phone,
        contactEmail: school.contact_email,
        studentCount: school.student_count,
        isActive: school.is_active
      })) || [];

    } catch (error) {
      console.error('GreenScholarFundService: Error fetching schools:', error);
      throw error;
    }
  }

  /**
   * Get all active child-headed homes
   */
  static async getChildHeadedHomes(): Promise<ChildHeadedHome[]> {
    try {
      const { data, error } = await supabase
        .from('child_headed_homes')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching child-headed homes:', error);
        throw error;
      }

      return data?.map(home => ({
        id: home.id,
        name: home.name,
        address: home.address,
        city: home.city,
        province: home.province,
        postalCode: home.postal_code,
        contactPerson: home.contact_person,
        contactPhone: home.contact_phone,
        contactEmail: home.contact_email,
        childCount: home.child_count,
        isActive: home.is_active
      })) || [];

    } catch (error) {
      console.error('GreenScholarFundService: Error fetching child-headed homes:', error);
      throw error;
    }
  }

  /**
   * Make a donation to the Green Scholar Fund
   */
  static async makeDonation(donation: {
    userId: string;
    amount: number;
    beneficiaryType: 'school' | 'child_headed_home' | 'general';
    beneficiaryId?: string;
    isAnonymous: boolean;
    message?: string;
  }): Promise<UserDonation> {
    try {
      console.log('GreenScholarFundService: Making donation:', donation);

      // Create user donation record
      const { data: userDonation, error: donationError } = await supabase
        .from('user_donations')
        .insert({
          user_id: donation.userId,
          amount: donation.amount,
          beneficiary_type: donation.beneficiaryType,
          beneficiary_id: donation.beneficiaryId,
          is_anonymous: donation.isAnonymous,
          message: donation.message,
          status: 'completed'
        })
        .select()
        .single();

      if (donationError) {
        console.error('Error creating user donation:', donationError);
        throw donationError;
      }

      // Create Green Scholar Fund transaction
      const { error: transactionError } = await supabase
        .from('green_scholar_transactions')
        .insert({
          transaction_type: 'donation',
          amount: donation.amount,
          source_type: 'user_donation',
          source_id: userDonation.id,
          beneficiary_type: donation.beneficiaryType,
          beneficiary_id: donation.beneficiaryId,
          description: `Donation from ${donation.isAnonymous ? 'Anonymous' : 'User'}: ${donation.message || 'Supporting education'}`,
          created_by: donation.userId
        });

      if (transactionError) {
        console.error('Error creating fund transaction:', transactionError);
        throw transactionError;
      }

      // Update fund balance
      const { error: balanceError } = await supabase
        .from('green_scholar_fund_balance')
        .update({
          total_balance: supabase.sql`total_balance + ${donation.amount}`,
          total_contributions: supabase.sql`total_contributions + ${donation.amount}`,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (balanceError) {
        console.error('Error updating fund balance:', balanceError);
        throw balanceError;
      }

      const result: UserDonation = {
        id: userDonation.id,
        userId: userDonation.user_id,
        amount: userDonation.amount,
        beneficiaryType: userDonation.beneficiary_type,
        beneficiaryId: userDonation.beneficiary_id,
        isAnonymous: userDonation.is_anonymous,
        message: userDonation.message,
        status: userDonation.status,
        createdAt: userDonation.created_at
      };

      console.log('GreenScholarFundService: Donation completed successfully:', result);
      return result;

    } catch (error) {
      console.error('GreenScholarFundService: Error making donation:', error);
      throw error;
    }
  }

  /**
   * Get user's donation history
   */
  static async getUserDonations(userId: string): Promise<UserDonation[]> {
    try {
      const { data, error } = await supabase
        .from('user_donations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user donations:', error);
        throw error;
      }

      return data?.map(donation => ({
        id: donation.id,
        userId: donation.user_id,
        amount: donation.amount,
        beneficiaryType: donation.beneficiary_type,
        beneficiaryId: donation.beneficiary_id,
        isAnonymous: donation.is_anonymous,
        message: donation.message,
        status: donation.status,
        createdAt: donation.created_at
      })) || [];

    } catch (error) {
      console.error('GreenScholarFundService: Error fetching user donations:', error);
      throw error;
    }
  }

  /**
   * Get fund transaction history
   */
  static async getTransactionHistory(limit: number = 50): Promise<GreenScholarTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('green_scholar_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transaction history:', error);
        throw error;
      }

      return data?.map(transaction => ({
        id: transaction.id,
        transactionType: transaction.transaction_type,
        amount: transaction.amount,
        sourceType: transaction.source_type,
        sourceId: transaction.source_id,
        beneficiaryType: transaction.beneficiary_type,
        beneficiaryId: transaction.beneficiary_id,
        description: transaction.description,
        createdAt: transaction.created_at
      })) || [];

    } catch (error) {
      console.error('GreenScholarFundService: Error fetching transaction history:', error);
      throw error;
    }
  }
}