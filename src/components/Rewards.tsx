import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, ShoppingBag, Fuel, Clock, Star, Gift, ChefHat, TrendingUp, Heart, DollarSign, Wrench, Package, Ticket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { getActiveRewards, Reward } from "@/lib/rewardsService";
import { useState, useEffect } from "react";

const Rewards = () => {
  const { user } = useAuth();
  const { totalWeightKg, loading: walletLoading } = useWallet(user?.id);
  // Points are 1:1 with total weight (1kg = 1 point)
  const userPoints = Math.round(totalWeightKg || 0);
  
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load rewards from database
  useEffect(() => {
    const loadRewards = async () => {
      try {
        setLoading(true);
        const { data, error } = await getActiveRewards();
        
        if (error) {
          console.error('Error loading rewards:', error);
          setError('Failed to load rewards');
          return;
        }
        
        setRewards(data || []);
      } catch (err) {
        console.error('Exception loading rewards:', err);
        setError('Failed to load rewards');
      } finally {
        setLoading(false);
      }
    };

    loadRewards();
  }, []);

  // Helper function to get icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cash':
        return DollarSign;
      case 'service':
        return Wrench;
      case 'product':
        return Package;
      case 'voucher':
        return Ticket;
      default:
        return Gift;
    }
  };

  // Helper function to get category display name
  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'cash':
        return 'Cash Back';
      case 'service':
        return 'Services';
      case 'product':
        return 'Products';
      case 'voucher':
        return 'Vouchers';
      default:
        return 'Rewards';
    }
  };



  return (
    <div className="pb-20 p-4 space-y-6 bg-gradient-warm dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4 pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-1"></div>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Rewards
            </h1>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Redeem your impact points for amazing rewards</p>
          </div>
          <div className="flex justify-end flex-1">
            {/* Theme follows browser preference automatically */}
          </div>
        </div>
      </div>

      {/* Points Balance Card - Beautiful Design */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 text-white shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all duration-300">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Star className="h-8 w-8" />
                </div>
                         <div>
                  <p className="text-sm opacity-90 mb-1 font-medium">Your Impact Points</p>
                  <p className="text-xs opacity-75">Earned through recycling</p>
                </div>
              </div>
              
              {walletLoading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-white/20 rounded-xl mb-3"></div>
                  <div className="h-4 bg-white/20 rounded w-32"></div>
                </div>
              ) : (
                 <>
                  <p className="text-5xl font-bold mb-2">{userPoints || 0}</p>
                  <p className="text-lg opacity-90 font-semibold">Points Available</p>
                 </>
               )}
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white/20 rounded-2xl">
                <Gift className="h-12 w-12" />
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 font-medium">Ready to Redeem</p>
                <p className="text-xs opacity-75">Amazing rewards await</p>
          </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <TrendingUp className="h-6 w-6 mr-3 text-white" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl border border-green-200 dark:border-green-700">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{userPoints || 0}</p>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">Total Points</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl border border-blue-200 dark:border-blue-700">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {rewards.filter(r => (userPoints || 0) >= r.pointsRequired).length}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Available Rewards</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl border border-purple-200 dark:border-purple-700">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="h-6 w-6 text-white" />
                  </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(((userPoints || 0) / Math.max(...rewards.map(r => r.pointsRequired))) * 100) || 0}%
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <div className="space-y-6">
        <h3 className="section-title-modern">Available Rewards</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading rewards...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400 mb-2">⚠️ {error}</div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400 mb-2">No rewards available</div>
            <p className="text-sm text-gray-500 dark:text-gray-500">Check back later for new rewards!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rewards.map((reward) => {
              const Icon = getCategoryIcon(reward.category);
              const canRedeem = userPoints >= reward.points_required;
              const pointsNeeded = reward.points_required - (userPoints || 0);
            
            return (
              <Card key={reward.id} className="card-modern hover:scale-105 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-4 rounded-2xl ${canRedeem ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <Icon className={`h-8 w-8 ${canRedeem ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{reward.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{getCategoryDisplayName(reward.category)}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${canRedeem ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {reward.points_required} pts
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                        {canRedeem ? 'Available' : `${pointsNeeded} more pts needed`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {reward.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                          {getCategoryDisplayName(reward.category)}
                        </span>
                        <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                          <Star className="h-4 w-4" />
                          <span className="text-xs">Active</span>
                        </div>
                      </div>
                      
                      {!canRedeem && (
                        <span className="text-amber-600 dark:text-amber-400 font-medium text-sm">
                          Need {pointsNeeded} more pts
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      className={canRedeem ? 'btn-primary-yellow w-full' : 'btn-outline-modern w-full opacity-50 cursor-not-allowed'}
                      onClick={() => {
                        if (canRedeem) {
                          // TODO: Implement reward redemption
                          alert('Reward redemption coming soon!');
                        }
                      }}
                      disabled={!canRedeem}
                    >
                      <Gift className="h-5 w-5 mr-2" />
                      {canRedeem ? 'Redeem Now' : `Need ${pointsNeeded} more points`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}
      </div>

      {/* Rewards Summary */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Gift className="h-6 w-6 mr-3 text-white" />
            Rewards Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-2xl border border-yellow-200 dark:border-yellow-700">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{userPoints || 0}</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Your Points</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl border border-green-200 dark:border-green-700">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {rewards.filter(r => (userPoints || 0) >= r.points_required).length} of {rewards.length}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">Available Rewards</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card className="card-modern border-dashed border-gray-300 dark:border-gray-600">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">More Rewards Coming Soon!</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Keep recycling to unlock exclusive offers and amazing rewards</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Rewards;