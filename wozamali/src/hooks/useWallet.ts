import { useState, useEffect } from 'react';
import { WalletService, WalletData, WalletBalanceView } from '@/lib/walletService';
import { RewardsService } from '@/lib/rewardsService';
import { 
  EnhancedWallet, 
  CustomerWalletBalanceView, 
  CustomerMetricsView,
  CustomerDashboardView,
  CustomerPerformanceSummary,
  UserReward,
  DonationCampaign,
  UserDonation,
  WithdrawalRequest
} from '@/types/rewards';

export const useWallet = (userId: string | undefined) => {
  // Legacy state for backward compatibility
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalanceView | null>(null);
  
  // New enhanced state
  const [enhancedWallet, setEnhancedWallet] = useState<EnhancedWallet | null>(null);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetricsView | null>(null);
  const [customerDashboard, setCustomerDashboard] = useState<CustomerDashboardView[]>([]);
  const [customerPerformance, setCustomerPerformance] = useState<CustomerPerformanceSummary[]>([]);
  
  // Rewards and related data
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [activeRewards, setActiveRewards] = useState<UserReward[]>([]);
  const [donationCampaigns, setDonationCampaigns] = useState<DonationCampaign[]>([]);
  const [userDonations, setUserDonations] = useState<UserDonation[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<WithdrawalRequest[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch enhanced wallet data
        const enhancedWalletData = await WalletService.getEnhancedWallet(userId);
        setEnhancedWallet(enhancedWalletData);

        // Fetch legacy wallet data for backward compatibility
        const walletData = await WalletService.getWallet(userId);
        setWallet(walletData);

        // Fetch detailed wallet balance view
        const balanceData = await WalletService.getWalletBalanceView(userId);
        setWalletBalance(balanceData);

        // Fetch customer metrics
        const metricsData = await WalletService.getCustomerMetrics(userId);
        setCustomerMetrics(metricsData);

        // Fetch customer dashboard data
        const dashboardData = await WalletService.getCustomerDashboard(userId);
        setCustomerDashboard(dashboardData);

        // Fetch customer performance summary
        const performanceData = await WalletService.getCustomerPerformanceSummary(userId);
        setCustomerPerformance(performanceData);

        // Fetch rewards data
        const rewardsData = await RewardsService.getUserRewards(userId);
        setActiveRewards(rewardsData);

        const allRewardsData = await RewardsService.getUserRewardHistory(userId);
        setUserRewards(allRewardsData);

        // Fetch donation campaigns
        const campaignsData = await RewardsService.getActiveDonationCampaigns();
        setDonationCampaigns(campaignsData);

        // Fetch user donations
        const donationsData = await RewardsService.getUserDonations(userId);
        setUserDonations(donationsData);

        // Fetch user withdrawals
        const withdrawalsData = await RewardsService.getUserWithdrawals(userId);
        setUserWithdrawals(withdrawalsData);

        // If no wallet exists, create one
        if (!enhancedWalletData && !walletData) {
          const newWallet = await WalletService.upsertEnhancedWallet({
            user_id: userId,
            balance: 0,
            total_points: 0,
            tier: 'bronze',
            sync_status: 'synced'
          });
          if (newWallet) {
            setEnhancedWallet(newWallet);
          }
        }
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // Subscribe to real-time updates
    const subscriptions = [
      // Enhanced wallet subscription
      WalletService.subscribeToEnhancedWalletChanges(userId, (updatedWallet) => {
        setEnhancedWallet(updatedWallet);
        // Also update legacy wallet for backward compatibility
        setWallet({
          id: updatedWallet.id,
          user_id: updatedWallet.user_id,
          balance: updatedWallet.balance,
          total_points: updatedWallet.total_points,
          tier: updatedWallet.tier,
          created_at: updatedWallet.created_at,
          updated_at: updatedWallet.updated_at
        });
      }),

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
        
        // Update active rewards if status changed
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

  const refreshWallet = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Refresh all data
      const enhancedWalletData = await WalletService.getEnhancedWallet(userId);
      const walletData = await WalletService.getWallet(userId);
      const balanceData = await WalletService.getWalletBalanceView(userId);
      const metricsData = await WalletService.getCustomerMetrics(userId);
      const dashboardData = await WalletService.getCustomerDashboard(userId);
      const performanceData = await WalletService.getCustomerPerformanceSummary(userId);
      const rewardsData = await RewardsService.getUserRewards(userId);
      const allRewardsData = await RewardsService.getUserRewardHistory(userId);
      const campaignsData = await RewardsService.getActiveDonationCampaigns();
      const donationsData = await RewardsService.getUserDonations(userId);
      const withdrawalsData = await RewardsService.getUserWithdrawals(userId);
      
      // Update all state
      setEnhancedWallet(enhancedWalletData);
      setWallet(walletData);
      setWalletBalance(balanceData);
      setCustomerMetrics(metricsData);
      setCustomerDashboard(dashboardData);
      setCustomerPerformance(performanceData);
      setActiveRewards(rewardsData);
      setUserRewards(allRewardsData);
      setDonationCampaigns(campaignsData);
      setUserDonations(donationsData);
      setUserWithdrawals(withdrawalsData);
      
      setError(null);
    } catch (err) {
      console.error('Error refreshing wallet:', err);
      setError('Failed to refresh wallet data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate environmental impact
  const environmentalImpact = customerDashboard.reduce((impact, item) => ({
    co2_saved_kg: impact.co2_saved_kg + (item.co2_saved_kg || 0),
    water_saved_liters: impact.water_saved_liters + (item.water_saved_liters || 0),
    landfill_saved_kg: impact.landfill_saved_kg + (item.landfill_saved_kg || 0),
    trees_equivalent: impact.trees_equivalent + ((item.co2_saved_kg || 0) / 22)
  }), {
    co2_saved_kg: 0,
    water_saved_liters: 0,
    landfill_saved_kg: 0,
    trees_equivalent: 0
  });

  // Get tier benefits
  const tierBenefits = enhancedWallet ? WalletService.getTierBenefits(enhancedWallet.tier) : [];

  // Get next tier requirements
  const nextTierRequirements = enhancedWallet ? 
    WalletService.getNextTierRequirements(enhancedWallet.tier, enhancedWallet.total_points) : 
    { nextTier: null, pointsNeeded: 0, progressPercentage: 0 };

  return {
    // Legacy properties for backward compatibility
    wallet,
    walletBalance,
    loading,
    error,
    refreshWallet,
    
    // Enhanced properties
    enhancedWallet,
    customerMetrics,
    customerDashboard,
    customerPerformance,
    userRewards,
    activeRewards,
    donationCampaigns,
    userDonations,
    userWithdrawals,
    environmentalImpact,
    tierBenefits,
    nextTierRequirements,
    
    // Convenience getters (prioritize enhanced wallet data)
    balance: enhancedWallet?.balance ?? walletBalance?.calculated_current_balance ?? wallet?.balance ?? 0,
    points: enhancedWallet?.total_points ?? wallet?.total_points ?? 0,
    tier: enhancedWallet?.tier ?? wallet?.tier ?? 'bronze',
    totalEarnings: walletBalance?.total_pickup_earnings ?? 0,
    totalWithdrawals: walletBalance?.total_withdrawals ?? 0,
    totalDonations: walletBalance?.total_donations ?? 0,
    totalRewardsRedeemed: walletBalance?.total_rewards_redeemed ?? 0,
    
    // Additional metrics
    totalPickups: customerMetrics?.total_pickups ?? 0,
    approvedPickups: customerMetrics?.approved_pickups ?? 0,
    pendingPickups: customerMetrics?.pending_pickups ?? 0,
    rejectedPickups: customerMetrics?.rejected_pickups ?? 0,
    totalWeightKg: customerMetrics?.total_weight_kg ?? 0,
    
    // Helper functions
    syncWalletBalances: () => WalletService.syncWalletBalances(),
    refreshCustomerPerformance: () => WalletService.refreshCustomerPerformance(),
    updateWalletWithSync: (balanceChange: number, pointsChange: number, description?: string) => 
      WalletService.updateWalletWithSync(userId!, balanceChange, pointsChange, description)
  };
};
