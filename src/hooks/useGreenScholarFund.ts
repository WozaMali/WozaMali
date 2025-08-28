import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import greenScholarFundService, {
  BottleCollection,
  Donation,
  FundStats,
  UserBottleContributions,
  ApplicationData
} from '@/lib/greenScholarFundService';

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

      // Fetch fund stats
      const stats = await greenScholarFundService.getCurrentFundStats();
      if (stats) setFundStats(stats);

      // Fetch user contributions
      const contributions = await greenScholarFundService.getUserBottleContributions(user.id);
      setUserBottleContributions(contributions);

      // Fetch user donations
      const donationsResult = await greenScholarFundService.getUserDonations(user.id);
      if (donationsResult.success && donationsResult.data) {
        setUserDonations(donationsResult.data);
      }

      // Fetch user bottle collections
      const collectionsResult = await greenScholarFundService.getUserBottleCollections(user.id);
      if (collectionsResult.success && collectionsResult.data) {
        setUserBottleCollections(collectionsResult.data);
      }

      // Fetch user applications
      const applicationsResult = await greenScholarFundService.getUserApplications(user.id);
      if (applicationsResult.success && applicationsResult.data) {
        setUserApplications(applicationsResult.data);
      }

    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to fetch fund data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Submit bottle collection
  const submitBottleCollection = useCallback(async (collection: Omit<BottleCollection, 'user_id' | 'status'>) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await greenScholarFundService.submitBottleCollection({
        ...collection,
        user_id: user.id,
        status: 'pending'
      });

      if (result.success) {
        // Update local state
        setUserBottleCollections(prev => [result.data, ...prev]);
        
        // Recalculate user contributions
        const contributions = await greenScholarFundService.getUserBottleContributions(user.id);
        setUserBottleContributions(contributions);
      }

      return result;
    } catch (err) {
      console.error('Error submitting bottle collection:', err);
      return { success: false, error: 'Failed to submit bottle collection' };
    }
  }, [user?.id]);

  // Submit donation
  const submitDonation = useCallback(async (donation: Omit<Donation, 'user_id' | 'status'>) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await greenScholarFundService.submitDonation({
        ...donation,
        user_id: user.id,
        status: 'completed'
      });

      if (result.success) {
        // Update local state
        setUserDonations(prev => [result.data, ...prev]);
      }

      return result;
    } catch (err) {
      console.error('Error submitting donation:', err);
      return { success: false, error: 'Failed to submit donation' };
    }
  }, [user?.id]);

  // Submit application
  const submitApplication = useCallback(async (application: Omit<ApplicationData, 'user_id' | 'status'>) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const result = await greenScholarFundService.submitApplication({
        ...application,
        user_id: user.id,
        status: 'pending'
      });

      if (result.success) {
        // Update local state
        setUserApplications(prev => [result.data, ...prev]);
      }

      return result;
    } catch (err) {
      console.error('Error submitting application:', err);
      return { success: false, error: 'Failed to submit application' };
    }
  }, [user?.id]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to fund stats changes
    const fundStatsSubscription = greenScholarFundService.subscribeToFundStats((stats) => {
      setFundStats(stats);
    });

    // Subscribe to user bottle collections changes
    const bottleCollectionsSubscription = greenScholarFundService.subscribeToBottleCollections(
      user.id,
      (collections) => {
        setUserBottleCollections(collections);
      }
    );

    // Subscribe to user donations changes
    const donationsSubscription = greenScholarFundService.subscribeToDonations(
      user.id,
      (donations) => {
        setUserDonations(donations);
      }
    );

    // Fetch initial data
    fetchInitialData();

    // Cleanup subscriptions
    return () => {
      fundStatsSubscription.unsubscribe();
      bottleCollectionsSubscription.unsubscribe();
      donationsSubscription.unsubscribe();
    };
  }, [user?.id, fetchInitialData]);

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
    submitBottleCollection,
    submitDonation,
    submitApplication,
    fetchInitialData,
    
    // Utility
    refresh: fetchInitialData
  };
};
