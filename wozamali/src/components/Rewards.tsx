import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, ShoppingBag, Fuel, Clock, Star, Gift, ChefHat, RefreshCw, Heart, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useState, useEffect } from "react";
import { RewardsService } from "@/lib/rewardsService";
import { RewardDefinition, UserReward, DonationCampaign } from "@/types/rewards";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const Rewards = () => {
  // Get user and wallet data
  const { user } = useAuth();
  const { 
    points: userPoints, 
    tier: userTier,
    loading: walletLoading,
    error: walletError,
    refreshWallet,
    donationCampaigns,
    userRewards,
    activeRewards
  } = useWallet(user?.id);

  // Local state for rewards and campaigns
  const [availableRewards, setAvailableRewards] = useState<RewardDefinition[]>([]);
  const [userRewardHistory, setUserRewardHistory] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<RewardDefinition | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);

  // Fetch rewards data
  useEffect(() => {
    const fetchRewardsData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const [rewards, history] = await Promise.all([
          RewardsService.getActiveRewards(),
          RewardsService.getUserRewardHistory(user.id)
        ]);
        
        setAvailableRewards(rewards);
        setUserRewardHistory(history);
      } catch (error) {
        console.error('Error fetching rewards data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewardsData();
  }, [user?.id]);

  // Handle reward redemption
  const handleRedeemReward = async (reward: RewardDefinition) => {
    if (!user?.id) return;
    
    try {
      const redeemedReward = await RewardsService.redeemReward({
        reward_definition_id: reward.id,
        user_id: user.id
      });
      
      if (redeemedReward) {
        setShowRewardModal(false);
        setSelectedReward(null);
        refreshWallet();
        // You could show a success toast here
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      // You could show an error toast here
    }
  };

  // Handle donation
  const handleDonation = async (campaign: DonationCampaign, amount: number) => {
    if (!user?.id) return;
    
    try {
      const donation = await RewardsService.createDonation({
        campaign_id: campaign.id,
        amount: amount,
        donation_type: 'monetary',
        user_id: user.id
      });
      
      if (donation) {
        setShowDonationModal(false);
        setSelectedCampaign(null);
        refreshWallet();
        // You could show a success toast here
      }
    } catch (error) {
      console.error('Error creating donation:', error);
      // You could show an error toast here
    }
  };

  // Get reward icon based on type
  const getRewardIcon = (rewardType: string) => {
    const iconMap: Record<string, any> = {
      discount: ShoppingBag,
      cashback: Gift,
      product: ChefHat,
      service: Zap,
      badge: Trophy
    };
    
    return iconMap[rewardType] || Gift;
  };

  // Get tier color
  const getTierColor = (tier: string) => {
    const colorMap: Record<string, string> = {
      bronze: 'bg-amber-600',
      silver: 'bg-gray-400',
      gold: 'bg-yellow-500',
      platinum: 'bg-purple-600'
    };
    
    return colorMap[tier] || 'bg-amber-600';
  };

  // Filter rewards by affordability
  const affordableRewards = availableRewards.filter(reward => reward.points_cost <= userPoints);
  const upcomingRewards = availableRewards.filter(reward => reward.points_cost > userPoints);

  return (
    <div className="pb-20 p-4 space-y-6 bg-gradient-warm min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl font-bold text-foreground">Rewards</h1>
        <p className="text-muted-foreground">Redeem your impact points for amazing rewards</p>
      </div>

      {/* Points Balance */}
      <Card className="bg-gradient-primary text-primary-foreground shadow-warm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Available Points</p>
              {walletLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-32"></div>
                </div>
              ) : walletError ? (
                <div>
                  <p className="text-xl font-bold text-red-200">Error</p>
                  <p className="text-xs opacity-75 mt-1">Failed to load points</p>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold">{userPoints} pts</p>
                  <p className="text-xs opacity-75 mt-1">
                    Earned from {(userPoints * 0.8).toFixed(0)} kg recycled • {userTier} tier
                  </p>
                </>
              )}
            </div>
            <div className="text-right">
              <Badge className={`${getTierColor(userTier)} text-white`}>
                {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
              </Badge>
              <p className="text-xs opacity-75 mt-1">Current Tier</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Tier Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {userTier === 'bronze' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Basic recycling rewards
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Access to standard rewards
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Monthly progress reports
                </div>
              </>
            )}
            {userTier === 'silver' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-gray-400" />
                  Enhanced recycling rewards
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-gray-400" />
                  Priority customer support
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-gray-400" />
                  Exclusive silver-tier rewards
                </div>
              </>
            )}
            {userTier === 'gold' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Premium recycling rewards
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  VIP customer support
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Early access to new features
                </div>
              </>
            )}
            {userTier === 'platinum' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-purple-500" />
                  Maximum recycling rewards
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-purple-500" />
                  Dedicated customer support
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-purple-500" />
                  Beta feature access
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Available Rewards</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {affordableRewards.map((reward) => {
              const IconComponent = getRewardIcon(reward.reward_type);
              return (
                <Card key={reward.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <IconComponent className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">
                        {RewardsService.formatRewardType(reward.reward_type)}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{reward.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {reward.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{reward.points_cost} pts</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedReward(reward);
                          setShowRewardModal(true);
                        }}
                      >
                        Redeem
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {affordableRewards.length === 0 && !loading && (
          <Card>
            <CardContent className="p-6 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No rewards available with your current points</p>
              <p className="text-sm text-muted-foreground mt-1">Keep recycling to earn more points!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Rewards */}
      {upcomingRewards.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingRewards.slice(0, 4).map((reward) => {
              const IconComponent = getRewardIcon(reward.reward_type);
              const pointsNeeded = reward.points_cost - userPoints;
              return (
                <Card key={reward.id} className="opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <IconComponent className="h-8 w-8 text-muted-foreground" />
                      <Badge variant="outline">
                        {RewardsService.formatRewardType(reward.reward_type)}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{reward.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {reward.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{reward.points_cost} pts</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Need {pointsNeeded} more pts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Donation Campaigns */}
      {donationCampaigns.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Support Causes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donationCampaigns.slice(0, 2).map((campaign) => {
              const progress = RewardsService.calculateDonationProgress(campaign);
              return (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {campaign.description || 'No description available'}
                    </p>
                    
                    {campaign.target_amount && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>R {campaign.current_amount.toFixed(2)}</span>
                          <span>R {campaign.target_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowDonationModal(true);
                      }}
                      className="w-full"
                    >
                      Donate Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Reward Redemption Modal */}
      <Dialog open={showRewardModal} onOpenChange={setShowRewardModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward for {selectedReward?.points_cost} points?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReward && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  {RewardsService.getRewardIcon(selectedReward.reward_type)}
                  <h3 className="font-semibold">{selectedReward.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedReward.description || 'No description available'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Cost: {selectedReward.points_cost} points
                  </span>
                  <span className="text-sm font-medium">
                    Value: R {selectedReward.monetary_value.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRewardModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => selectedReward && handleRedeemReward(selectedReward)}
                className="flex-1"
                disabled={!selectedReward}
              >
                Confirm Redemption
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Donation Modal */}
      <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Donation</DialogTitle>
            <DialogDescription>
              Support this cause and earn points for your contribution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCampaign && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">{selectedCampaign.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedCampaign.description || 'No description available'}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Amount:</span>
                    <span>R {selectedCampaign.current_amount.toFixed(2)}</span>
                  </div>
                  {selectedCampaign.target_amount && (
                    <div className="flex justify-between text-sm">
                      <span>Target Amount:</span>
                      <span>R {selectedCampaign.target_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <label className="text-sm font-medium">Donation Amount (R)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                className="w-full p-2 border rounded-md"
                id="donation-amount"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDonationModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const amount = parseFloat((document.getElementById('donation-amount') as HTMLInputElement)?.value || '0');
                  if (amount > 0 && selectedCampaign) {
                    handleDonation(selectedCampaign, amount);
                  }
                }}
                className="flex-1"
                disabled={!selectedCampaign}
              >
                Donate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refresh Button */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={refreshWallet}
          disabled={walletLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${walletLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default Rewards;