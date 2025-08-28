import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface BottleCollection {
  id?: string;
  user_id: string;
  bottle_count: number;
  weight_kg: number;
  bottle_type: 'PET' | 'HDPE' | 'Other';
  collection_date: string;
  status: 'pending' | 'verified' | 'processed';
  notes?: string;
}

export interface Donation {
  id?: string;
  user_id: string;
  amount: number;
  payment_method: 'wallet' | 'mtn-momo' | 'cash';
  status: 'pending' | 'completed' | 'failed';
  transaction_reference?: string;
}

export interface FundStats {
  month_year: string;
  monthly_goal: number;
  total_donations: number;
  total_bottle_value: number;
  total_fund: number;
  progress_percentage: number;
  remaining_amount: number;
  beneficiaries_count: number;
}

export interface UserBottleContributions {
  total_bottles: number;
  total_weight: number;
  total_value: number;
}

export interface ApplicationData {
  id?: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  email?: string;
  id_number?: string;
  school_name: string;
  grade: string;
  student_number?: string;
  academic_performance: string;
  household_income: string;
  household_size: string;
  employment_status?: string;
  other_income_sources?: string;
  support_type: string[];
  urgent_needs?: string;
  previous_support?: string;
  has_id_document: boolean;
  has_school_report: boolean;
  has_income_proof: boolean;
  has_bank_statement: boolean;
  special_circumstances?: string;
  community_involvement?: string;
  references_info?: string;
  status?: 'pending' | 'under_review' | 'approved' | 'rejected';
}

class GreenScholarFundService {
  // Submit a bottle collection
  async submitBottleCollection(collection: BottleCollection) {
    try {
      const { data, error } = await supabase
        .from('green_scholar_fund_bottles')
        .insert([collection])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting bottle collection:', error);
      return { success: false, error };
    }
  }

  // Get user's bottle collections
  async getUserBottleCollections(userId: string) {
    try {
      const { data, error } = await supabase
        .from('green_scholar_fund_bottles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user bottle collections:', error);
      return { success: false, error };
    }
  }

  // Get user's total bottle contributions
  async getUserBottleContributions(userId: string): Promise<UserBottleContributions> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_bottle_contributions', { user_uuid: userId });

      if (error) throw error;
      return data[0] || { total_bottles: 0, total_weight: 0, total_value: 0 };
    } catch (error) {
      console.error('Error fetching user bottle contributions:', error);
      return { total_bottles: 0, total_weight: 0, total_value: 0 };
    }
  }

  // Submit a donation
  async submitDonation(donation: Donation) {
    try {
      const { data, error } = await supabase
        .from('green_scholar_fund_donations')
        .insert([donation])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting donation:', error);
      return { success: false, error };
    }
  }

  // Get user's donations
  async getUserDonations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('green_scholar_fund_donations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user donations:', error);
      return { success: false, error };
    }
  }

  // Get current fund statistics
  async getCurrentFundStats(): Promise<FundStats | null> {
    try {
      const { data, error } = await supabase
        .from('current_fund_status')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching fund stats:', error);
      return null;
    }
  }

  // Get fund statistics for a specific month
  async getFundStatsForMonth(monthYear: string): Promise<FundStats | null> {
    try {
      const { data, error } = await supabase
        .from('green_scholar_fund_stats')
        .select('*')
        .eq('month_year', monthYear)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching fund stats for month:', error);
      return null;
    }
  }

  // Submit an application
  async submitApplication(application: ApplicationData) {
    try {
      const { data, error } = await supabase
        .from('green_scholar_fund_applications')
        .insert([application])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting application:', error);
      return { success: false, error };
    }
  }

  // Get user's applications
  async getUserApplications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('green_scholar_fund_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user applications:', error);
      return { success: false, error };
    }
  }

  // Get all pending applications (for admin review)
  async getPendingApplications() {
    try {
      const { data, error } = await supabase
        .from('green_scholar_fund_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      return { success: false, error };
    }
  }

  // Update application status
  async updateApplicationStatus(applicationId: string, status: string, reviewNotes?: string) {
    try {
      const { data, error } = await supabase
        .from('green_scholar_fund_applications')
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating application status:', error);
      return { success: false, error };
    }
  }

  // Subscribe to real-time fund statistics updates
  subscribeToFundStats(callback: (stats: FundStats) => void) {
    return supabase
      .channel('fund_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'green_scholar_fund_stats'
        },
        async () => {
          const stats = await this.getCurrentFundStats();
          if (stats) callback(stats);
        }
      )
      .subscribe();
  }

  // Subscribe to real-time bottle collection updates
  subscribeToBottleCollections(userId: string, callback: (collections: BottleCollection[]) => void) {
    return supabase
      .channel(`bottle_collections_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'green_scholar_fund_bottles',
          filter: `user_id=eq.${userId}`
        },
        async () => {
          const result = await this.getUserBottleCollections(userId);
          if (result.success && result.data) callback(result.data);
        }
      )
      .subscribe();
  }

  // Subscribe to real-time donation updates
  subscribeToDonations(userId: string, callback: (donations: Donation[]) => void) {
    return supabase
      .channel(`donations_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'green_scholar_fund_donations',
          filter: `user_id=eq.${userId}`
        },
        async () => {
          const result = await this.getUserDonations(userId);
          if (result.success && result.data) callback(result.data);
        }
      )
      .subscribe();
  }
}

export const greenScholarFundService = new GreenScholarFundService();
export default greenScholarFundService;
