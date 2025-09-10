import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GreenScholarFundService } from '@/lib/greenScholarFundService';

// Type definitions for Green Scholar Fund
interface FundStats {
  total_balance: number;
  total_contributions: number;
  total_distributions: number;
  progress_percentage: number;
  remaining_amount: number;
}

interface UserBottleContributions {
  total_bottles: number;
  total_weight: number;
  total_value: number;
}

interface Donation {
  id: string;
  user_id: string;
  amount: number;
  beneficiary_type: 'school' | 'child_headed_home' | 'general';
  beneficiary_id?: string;
  is_anonymous: boolean;
  message?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

interface BottleCollection {
  id: string;
  user_id: string;
  weight_kg: number;
  bottle_count: number;
  value: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface ApplicationData {
  id: string;
  user_id: string;
  school_name: string;
  student_name: string;
  grade: string;
  amount_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const useGreenScholarFund = () => {
  const { user } = useAuth();
  const [fundStats, setFundStats] = useState<FundStats | null>(null);
  const [userBottleContributions, setUserBottleContributions] = useState<UserBottleContributions>({
    total_bottles: 0,
    total_weight: 0,
    total_value: 0
  });
  const [userDonations, setUserDonations] = useState<Donation[]>([]);
  const [userBottleCollections, setUserBottleCollections] = useState<BottleCollection[]>([]);
  const [userApplications, setUserApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch fund data
      const fundData = await GreenScholarFundService.getFundData();
      setFundStats({
        total_balance: fundData.totalBalance,
        total_contributions: fundData.totalContributions,
        total_distributions: fundData.totalDistributions,
        progress_percentage: 0, // Calculate based on your business logic
        remaining_amount: 0 // Calculate based on your business logic
      });

      // Fetch user donations
      const userDonations = await GreenScholarFundService.getUserDonations(user.id);
      setUserDonations(userDonations);

    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to fetch fund data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Submit donation
  const submitDonation = useCallback(async (donation: {
    amount: number;
    beneficiaryType: 'school' | 'child_headed_home' | 'general';
    beneficiaryId?: string;
    isAnonymous: boolean;
    message?: string;
  }) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await GreenScholarFundService.makeDonation({
        userId: user.id,
        ...donation
      });

      if (result) {
        // Update local state
        setUserDonations(prev => [result, ...prev]);
        return { success: true, data: result };
      }

      return { success: false, error: 'Failed to submit donation' };
    } catch (err) {
      console.error('Error submitting donation:', err);
      return { success: false, error: 'Failed to submit donation' };
    }
  }, [user?.id]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Calculate progress percentage
  const progressPercentage = fundStats ? fundStats.progress_percentage : 0;
  const remainingAmount = fundStats ? fundStats.remaining_amount : 0;

  // Calculate user's total contribution to the fund
  const userTotalContribution = userBottleContributions.total_value + 
    userDonations.reduce((sum, donation) => sum + donation.amount, 0);

  return {
    // State
    fundStats,
    userBottleContributions,
    userDonations,
    userBottleCollections,
    userApplications,
    loading,
    error,
    
    // Computed values
    progressPercentage,
    remainingAmount,
    userTotalContribution,
    
    // Actions
    submitDonation,
    fetchInitialData,
    
    // Utility
    refresh: fetchInitialData
  };
};
