import { useState, useEffect } from 'react';
import { RewardsService } from '@/lib/rewardsService';
import { 
  RewardDefinition, 
  UserReward, 
  DonationCampaign, 
  UserDonation, 
  WithdrawalRequest,
  RewardRedemptionForm,
  DonationForm,
  WithdrawalForm
} from '@/types/rewards';

export const useRewards = (userId: string | undefined) => {
  // State for rewards
  const [availableRewards, setAvailableRewards] = useState<RewardDefinition[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [activeRewards, setActiveRewards] = useState<UserReward[]>([]);
  
  // State for donations
  const [donationCampaigns, setDonationCampaigns] = useState<DonationCampaign[]>([]);
  const [userDonations, setUserDonations] = useState<UserDonation[]>([]);
  
  // State for withdrawals
  const [userWithdrawals, setUserWithdrawals] = useState<WithdrawalRequest[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all rewards data
  const fetchRewardsData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [
        rewards, 
        history, 
        campaigns, 
        donations, 
        withdrawals
      ] = await Promise.all([
        RewardsService.getActiveRewards(),
        RewardsService.getUserRewardHistory(userId),
        RewardsService.getActiveDonationCampaigns(),
        RewardsService.getUserDonations(userId),
        RewardsService.getUserWithdrawals(userId)
      ]);
      
      setAvailableRewards(rewards);
      setUserRewards(history);
      setActiveRewards(history.filter(r => r.status === 'active'));
      setDonationCampaigns(campaigns);
      setUserDonations(donations);
      setUserWithdrawals(withdrawals);
    } catch (err) {
      console.error('Error fetching rewards data:', err);
      setError('Failed to load rewards data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch rewards by type
  const fetchRewardsByType = async (rewardType: 'discount' | 'cashback' | 'product' | 'service' | 'badge') => {
    try {
      const rewards = await RewardsService.getRewardsByType(rewardType);
      return rewards;
    } catch (err) {
      console.error('Error fetching rewards by type:', err);
      return [];
    }
  };

  // Redeem a reward
  const redeemReward = async (rewardData: RewardRedemptionForm): Promise<UserReward | null> => {
    try {
      const redeemedReward = await RewardsService.redeemReward(rewardData);
      if (redeemedReward) {
        // Refresh data after redemption
        await fetchRewardsData();
      }
      return redeemedReward;
    } catch (err) {
      console.error('Error redeeming reward:', err);
      throw err;
    }
  };

  // Mark reward as redeemed
  const markRewardAsRedeemed = async (rewardId: string): Promise<boolean> => {
    try {
      const success = await RewardsService.markRewardAsRedeemed(rewardId);
      if (success) {
        // Refresh data after marking as redeemed
        await fetchRewardsData();
      }
      return success;
    } catch (err) {
      console.error('Error marking reward as redeemed:', err);
      throw err;
    }
  };

  // Create a donation
  const createDonation = async (donationData: DonationForm): Promise<UserDonation | null> => {
    try {
      const donation = await RewardsService.createDonation(donationData);
      if (donation) {
        // Refresh data after donation
        await fetchRewardsData();
      }
      return donation;
    } catch (err) {
      console.error('Error creating donation:', err);
      throw err;
    }
  };

  // Create a withdrawal request
  const createWithdrawalRequest = async (withdrawalData: WithdrawalForm): Promise<WithdrawalRequest | null> => {
    try {
      const withdrawal = await RewardsService.createWithdrawalRequest(withdrawalData);
      if (withdrawal) {
        // Refresh data after withdrawal request
        await fetchRewardsData();
      }
      return withdrawal;
    } catch (err) {
      console.error('Error creating withdrawal request:', err);
      throw err;
    }
  };

  // Cancel a withdrawal request
  const cancelWithdrawalRequest = async (withdrawalId: string): Promise<boolean> => {
    try {
      const success = await RewardsService.cancelWithdrawalRequest(withdrawalId);
      if (success) {
        // Refresh data after cancellation
        await fetchRewardsData();
      }
      return success;
    } catch (err) {
      console.error('Error cancelling withdrawal request:', err);
      throw err;
    }
  };

  // Get affordable rewards (rewards user can afford)
  const getAffordableRewards = (userPoints: number) => {
    return availableRewards.filter(reward => reward.points_cost <= userPoints);
  };

  // Get upcoming rewards (rewards user can't afford yet)
  const getUpcomingRewards = (userPoints: number) => {
    return availableRewards.filter(reward => reward.points_cost > userPoints);
  };

  // Get rewards by category
  const getRewardsByCategory = (category: 'discount' | 'cashback' | 'product' | 'service' | 'badge') => {
    return availableRewards.filter(reward => reward.reward_type === category);
  };

  // Get user's reward statistics
  const getUserRewardStats = () => {
    const totalRewards = userRewards.length;
    const activeRewards = userRewards.filter(r => r.status === 'active').length;
    const redeemedRewards = userRewards.filter(r => r.status === 'redeemed').length;
    const expiredRewards = userRewards.filter(r => r.status === 'expired').length;
    const totalPointsSpent = userRewards.reduce((sum, r) => sum + r.points_spent, 0);
    const totalValue = userRewards.reduce((sum, r) => sum + r.monetary_value, 0);

    return {
      totalRewards,
      activeRewards,
      redeemedRewards,
      expiredRewards,
      totalPointsSpent,
      totalValue
    };
  };

  // Get donation statistics
  const getDonationStats = () => {
    const totalDonations = userDonations.length;
    const confirmedDonations = userDonations.filter(d => d.status === 'confirmed').length;
    const totalAmount = userDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalPointsEarned = userDonations.reduce((sum, d) => sum + d.points_earned, 0);

    return {
      totalDonations,
      confirmedDonations,
      totalAmount,
      totalPointsEarned
    };
  };

  // Get withdrawal statistics
  const getWithdrawalStats = () => {
    const totalWithdrawals = userWithdrawals.length;
    const pendingWithdrawals = userWithdrawals.filter(w => w.status === 'pending').length;
    const completedWithdrawals = userWithdrawals.filter(w => w.status === 'completed').length;
    const totalAmount = userWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    return {
      totalWithdrawals,
      pendingWithdrawals,
      completedWithdrawals,
      totalAmount
    };
  };

  // Initialize data
  useEffect(() => {
    fetchRewardsData();
  }, [userId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const subscriptions = [
      // Rewards subscription
      RewardsService.subscribeToRewardChanges(userId, (updatedReward) => {
        setUserRewards(prev => {
          const index = prev.findIndex(r => r.id === updatedReward.id);
          if (index >= 0) {
            const newRewards = [...prev];
            newRewards[index] = updatedReward;
            return newRewards;
          }
          return [...prev, updatedReward];
        });
        
        // Update active rewards
        if (updatedReward.status === 'active') {
          setActiveRewards(prev => {
            const index = prev.findIndex(r => r.id === updatedReward.id);
            if (index >= 0) {
              const newRewards = [...prev];
              newRewards[index] = updatedReward;
              return newRewards;
            }
            return [...prev, updatedReward];
          });
        } else {
          setActiveRewards(prev => prev.filter(r => r.id !== updatedReward.id));
        }
      }),

      // Donations subscription
      RewardsService.subscribeToDonationChanges(userId, (updatedDonation) => {
        setUserDonations(prev => {
          const index = prev.findIndex(d => d.id === updatedDonation.id);
          if (index >= 0) {
            const newDonations = [...prev];
            newDonations[index] = updatedDonation;
            return newDonations;
          }
          return [...prev, updatedDonation];
        });
      }),

      // Withdrawals subscription
      RewardsService.subscribeToWithdrawalChanges(userId, (updatedWithdrawal) => {
        setUserWithdrawals(prev => {
          const index = prev.findIndex(w => w.id === updatedWithdrawal.id);
          if (index >= 0) {
            const newWithdrawals = [...prev];
            newWithdrawals[index] = updatedWithdrawal;
            return newWithdrawals;
          }
          return [...prev, updatedWithdrawal];
        });
      })
    ];

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [userId]);

  return {
    // Data
    availableRewards,
    userRewards,
    activeRewards,
    donationCampaigns,
    userDonations,
    userWithdrawals,
    
    // Loading and error states
    loading,
    error,
    
    // Actions
    redeemReward,
    markRewardAsRedeemed,
    createDonation,
    createWithdrawalRequest,
    cancelWithdrawalRequest,
    
    // Utility functions
    fetchRewardsData,
    fetchRewardsByType,
    getAffordableRewards,
    getUpcomingRewards,
    getRewardsByCategory,
    getUserRewardStats,
    getDonationStats,
    getWithdrawalStats,
    
    // Helper functions from RewardsService
    calculateDonationProgress: RewardsService.calculateDonationProgress,
    formatRewardType: RewardsService.formatRewardType,
    formatWithdrawalMethod: RewardsService.formatWithdrawalMethod,
    getRewardIcon: RewardsService.getRewardIcon,
    getWithdrawalMethodIcon: RewardsService.getWithdrawalMethodIcon
  };
};
