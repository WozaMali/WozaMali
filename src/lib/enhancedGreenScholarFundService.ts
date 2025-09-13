// Enhanced Green Scholar Fund Service
// Ensures PET Bottles revenue appears correctly on Green Scholar Fund page

import { supabase } from './supabase';

export interface PetBottlesContribution {
  user_id: string;
  user_email: string;
  total_pet_weight: number;
  total_pet_value: number;
  total_contributions: number;
  contribution_count: number;
  last_contribution_date: string;
}

export interface GreenScholarFundPetTotals {
  total_pet_contributions: number;
  total_pet_weight: number;
  total_pet_collections: number;
  total_users_contributing: number;
  average_contribution: number;
}

export interface GreenScholarFundData {
  total_balance: number;
  total_contributions: number;
  total_distributions: number;
  pet_bottles_contributions: number;
  direct_donations: number;
  progress_percentage: number;
  remaining_amount: number;
}

export class EnhancedGreenScholarFundService {
  /**
   * Get comprehensive Green Scholar Fund data including PET Bottles contributions
   */
  static async getEnhancedFundData(): Promise<GreenScholarFundData> {
    try {
      console.log('EnhancedGreenScholarFundService: Getting enhanced fund data');

      // Get PET Bottles totals
      const { data: petTotals, error: petError } = await supabase.rpc('get_green_scholar_fund_pet_totals');
      
      if (petError) {
        console.error('Error fetching PET Bottles totals:', petError);
      }

      // Get fund balance
      const { data: fundBalance, error: balanceError } = await supabase
        .from('green_scholar_fund_balance')
        .select('total_balance, pet_donations_total, direct_donations_total, expenses_total, last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (balanceError) {
        console.error('Error fetching fund balance:', balanceError);
      }

      // Get direct donations (non-PET contributions)
      const { data: directDonations, error: donationsError } = await supabase
        .from('green_scholar_transactions')
        .select('amount')
        .eq('transaction_type', 'contribution')
        .neq('source_type', 'pet_bottles_collection');

      let directDonationsTotal = 0;
      if (!donationsError && directDonations) {
        directDonationsTotal = directDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
      }

      const petContributions = petTotals?.[0]?.total_pet_contributions || 0;
      const totalBalance = fundBalance?.total_balance || 0;
      const totalContributions = (fundBalance?.pet_donations_total || 0) + (fundBalance?.direct_donations_total || 0);
      const totalDistributions = fundBalance?.expenses_total || 0;

      const result: GreenScholarFundData = {
        total_balance: totalBalance,
        total_contributions: totalContributions,
        total_distributions: totalDistributions,
        pet_bottles_contributions: petContributions,
        direct_donations: directDonationsTotal,
        progress_percentage: 0, // Calculate based on your business logic
        remaining_amount: Math.max(0, totalBalance - totalDistributions)
      };

      console.log('EnhancedGreenScholarFundService: Enhanced fund data:', result);
      return result;
    } catch (error) {
      console.error('EnhancedGreenScholarFundService: Error getting enhanced fund data:', error);
      throw error;
    }
  }

  /**
   * Get PET Bottles contributions for a specific user
   */
  static async getUserPetBottlesContributions(userId: string): Promise<PetBottlesContribution | null> {
    try {
      console.log('EnhancedGreenScholarFundService: Getting user PET Bottles contributions:', userId);

      const { data, error } = await supabase.rpc('get_pet_bottles_green_scholar_contributions', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching user PET Bottles contributions:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          user_id: userId,
          user_email: '',
          total_pet_weight: 0,
          total_pet_value: 0,
          total_contributions: 0,
          contribution_count: 0,
          last_contribution_date: ''
        };
      }

      const contribution = data[0];
      console.log('EnhancedGreenScholarFundService: User PET Bottles contribution:', contribution);
      return contribution;
    } catch (error) {
      console.error('EnhancedGreenScholarFundService: Error getting user PET Bottles contributions:', error);
      return null;
    }
  }

  /**
   * Get all PET Bottles contributions (for admin view)
   */
  static async getAllPetBottlesContributions(): Promise<PetBottlesContribution[]> {
    try {
      console.log('EnhancedGreenScholarFundService: Getting all PET Bottles contributions');

      const { data, error } = await supabase.rpc('get_pet_bottles_green_scholar_contributions');

      if (error) {
        console.error('Error fetching all PET Bottles contributions:', error);
        return [];
      }

      console.log('EnhancedGreenScholarFundService: All PET Bottles contributions:', data);
      return data || [];
    } catch (error) {
      console.error('EnhancedGreenScholarFundService: Error getting all PET Bottles contributions:', error);
      return [];
    }
  }

  /**
   * Get PET Bottles totals for the fund
   */
  static async getPetBottlesTotals(): Promise<GreenScholarFundPetTotals> {
    try {
      console.log('EnhancedGreenScholarFundService: Getting PET Bottles totals');

      const { data, error } = await supabase.rpc('get_green_scholar_fund_pet_totals');

      if (error) {
        console.error('Error fetching PET Bottles totals:', error);
        return {
          total_pet_contributions: 0,
          total_pet_weight: 0,
          total_pet_collections: 0,
          total_users_contributing: 0,
          average_contribution: 0
        };
      }

      const totals = data?.[0] || {
        total_pet_contributions: 0,
        total_pet_weight: 0,
        total_pet_collections: 0,
        total_users_contributing: 0,
        average_contribution: 0
      };

      console.log('EnhancedGreenScholarFundService: PET Bottles totals:', totals);
      return totals;
    } catch (error) {
      console.error('EnhancedGreenScholarFundService: Error getting PET Bottles totals:', error);
      return {
        total_pet_contributions: 0,
        total_pet_weight: 0,
        total_pet_collections: 0,
        total_users_contributing: 0,
        average_contribution: 0
      };
    }
  }

  /**
   * Process all existing PET Bottles collections for Green Scholar Fund
   */
  static async processAllExistingPetBottlesCollections(): Promise<{ processed: number; errors: number }> {
    try {
      console.log('EnhancedGreenScholarFundService: Processing all existing PET Bottles collections');

      const { data, error } = await supabase.rpc('process_all_existing_pet_bottles_collections');

      if (error) {
        console.error('Error processing existing PET Bottles collections:', error);
        return { processed: 0, errors: 1 };
      }

      const processed = data?.filter((item: any) => item.processed === true).length || 0;
      const errors = data?.filter((item: any) => item.processed === false).length || 0;

      console.log(`EnhancedGreenScholarFundService: Processed ${processed} collections, ${errors} already processed`);
      return { processed, errors };
    } catch (error) {
      console.error('EnhancedGreenScholarFundService: Error processing existing PET Bottles collections:', error);
      return { processed: 0, errors: 1 };
    }
  }

  /**
   * Get user's comprehensive Green Scholar Fund summary
   */
  static async getUserGreenScholarSummary(userId: string): Promise<{
    petBottlesContribution: PetBottlesContribution;
    directDonations: number;
    totalContribution: number;
    fundStats: GreenScholarFundData;
  }> {
    try {
      console.log('EnhancedGreenScholarFundService: Getting user Green Scholar summary:', userId);

      const [petBottlesContribution, fundStats, directDonations] = await Promise.all([
        this.getUserPetBottlesContributions(userId),
        this.getEnhancedFundData(),
        this.getUserDirectDonations(userId)
      ]);

      const totalContribution = (petBottlesContribution?.total_contributions || 0) + directDonations;

      const summary = {
        petBottlesContribution: petBottlesContribution || {
          user_id: userId,
          user_email: '',
          total_pet_weight: 0,
          total_pet_value: 0,
          total_contributions: 0,
          contribution_count: 0,
          last_contribution_date: ''
        },
        directDonations,
        totalContribution,
        fundStats
      };

      console.log('EnhancedGreenScholarFundService: User Green Scholar summary:', summary);
      return summary;
    } catch (error) {
      console.error('EnhancedGreenScholarFundService: Error getting user Green Scholar summary:', error);
      throw error;
    }
  }

  /**
   * Get user's direct donations (non-PET contributions)
   */
  private static async getUserDirectDonations(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('green_scholar_transactions')
        .select('amount')
        .eq('transaction_type', 'contribution')
        .neq('source_type', 'pet_bottles_collection')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user direct donations:', error);
        return 0;
      }

      return (data || []).reduce((sum, d) => sum + (d.amount || 0), 0);
    } catch (error) {
      console.error('Error calculating user direct donations:', error);
      return 0;
    }
  }
}
