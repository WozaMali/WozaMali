import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GreenScholarFundService } from '@/lib/greenScholarFundService';
import { supabase } from '@/lib/supabase';

// Type definitions for Green Scholar Fund
interface FundStats {
  total_balance: number;
  total_contributions: number;
  total_distributions: number;
  progress_percentage: number;
  remaining_amount: number;
  monthly_goal: number;
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
      const monthlyGoal = 50000; // Default monthly goal
      const totalFund = Number(fundData.totalBalance || 0);
      const remainingAmount = Math.max(0, monthlyGoal - totalFund);
      const progressPercentage = Math.min(100, Math.round((totalFund / monthlyGoal) * 100));

      setFundStats({
        total_balance: totalFund,
        total_contributions: Number(fundData.totalContributions || 0),
        total_distributions: Number(fundData.totalDistributions || 0),
        progress_percentage: progressPercentage,
        remaining_amount: remainingAmount,
        monthly_goal: monthlyGoal
      });

      // Fetch user donations and PET contributions
      const [userDonations, userTotals] = await Promise.all([
        GreenScholarFundService.getUserDonations(user.id),
        GreenScholarFundService.getUserContributionTotals(user.id)
      ]);
      setUserDonations(userDonations);
      setUserBottleContributions({
        total_bottles: 0,
        total_weight: 0,
        total_value: userTotals.totalPetAmount
      });

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

  // Submit application (Save to green_scholar_applications)
  const submitApplication = useCallback(async (app: any) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };
    try {
      const payload = {
        created_by: user.id,
        full_name: app.full_name || app.full_name || app.fullName,
        date_of_birth: app.date_of_birth || app.dateOfBirth || null,
        phone_number: app.phone_number || app.phoneNumber || null,
        email: app.email || null,
        id_number: app.id_number || app.idNumber || null,
        school_name: app.school_name || app.schoolName || null,
        grade: app.grade || null,
        student_number: app.student_number || app.studentNumber || null,
        academic_performance: app.academic_performance || app.academicPerformance || null,
        household_income: app.household_income || app.householdIncome || null,
        household_size: app.household_size || app.householdSize || null,
        employment_status: app.employment_status || app.employmentStatus || null,
        other_income_sources: app.other_income_sources || app.otherIncomeSources || null,
        support_type: app.support_type || app.supportType || [],
        urgent_needs: app.urgent_needs || app.urgentNeeds || null,
        previous_support: app.previous_support || app.previousSupport || null,
        has_id_document: !!(app.has_id_document ?? app.hasIdDocument),
        has_school_report: !!(app.has_school_report ?? app.hasSchoolReport),
        has_income_proof: !!(app.has_income_proof ?? app.hasIncomeProof),
        has_bank_statement: !!(app.has_bank_statement ?? app.hasBankStatement),
        special_circumstances: app.special_circumstances || app.specialCircumstances || null,
        community_involvement: app.community_involvement || app.communityInvolvement || null,
        references_info: app.references_info || null
      };

      const { data, error } = await supabase
        .from('green_scholar_applications')
        .insert(payload)
        .select('id, created_at')
        .single();
      if (error) throw error;
      return { success: true, id: data?.id };
    } catch (e: any) {
      console.error('Submit application failed:', e);
      return { success: false, error: e.message || 'Failed to submit application' };
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
    submitApplication,
    fetchInitialData,
    
    // Utility
    refresh: fetchInitialData
  };
};
