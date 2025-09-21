import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const renderActionButtons = (reward: Reward) => {
    const hasRedeem = typeof (reward as any).redeem_url === 'string' && (reward as any).redeem_url.trim().length > 0;
    const hasOrder = typeof (reward as any).order_url === 'string' && (reward as any).order_url.trim().length > 0;
    if (!hasRedeem && !hasOrder) return null;
    return (
      <div className="mt-4 flex flex-wrap gap-3">
        {hasRedeem && (
          <a
            href={(reward as any).redeem_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium shadow hover:from-emerald-700 hover:to-emerald-800"
          >
            Redeem Now
          </a>
        )}
        {hasOrder && (
          <a
            href={(reward as any).order_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium shadow hover:from-blue-700 hover:to-blue-800"
          >
            Order Now
          </a>
        )}
      </div>
    );
  };



  return (
    <div className="pb-20 px-2 py-3 space-y-3 bg-gradient-warm dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header - Ultra Mobile Optimized */}
      <div className="text-center space-y-1 pt-2">
        <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
          Rewards
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Redeem your impact points for amazing rewards</p>
      </div>

      {/* Points Balance Card - Ultra Mobile Optimized */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 text-white shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all duration-300">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Star className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs opacity-90 font-medium">Your Impact Points</p>
                  <p className="text-xs opacity-75">Earned through recycling</p>
                </div>
              </div>
              
              {walletLoading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-white/20 rounded-lg mb-1"></div>
                  <div className="h-2 bg-white/20 rounded w-20"></div>
                </div>
              ) : (
                 <>
                  <p className="text-2xl font-bold mb-1">{userPoints || 0}</p>
                  <p className="text-xs opacity-90 font-semibold">Points Available</p>
                 </>
               )}
            </div>
            
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shadow-lg">
              <Gift className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header p-3">
          <CardTitle className="text-sm font-bold text-white flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-white" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg border border-green-200 dark:border-green-700">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
                <Star className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">{userPoints || 0}</p>
              <p className="text-xs text-green-700 dark:text-green-300 font-medium">Points</p>
            </div>
            
            <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1">
                <Gift className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {rewards.filter(r => (userPoints || 0) >= r.points_required).length}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Available</p>
            </div>
            
            <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-1">
                <Heart className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {Math.round(((userPoints || 0) / Math.max(...rewards.map(r => r.points_required))) * 100) || 0}%
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards - Ultra Mobile Optimized */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Available Rewards</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-center space-y-1">
              <div className="w-5 h-5 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Loading rewards...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <div className="text-red-600 dark:text-red-400 mb-1 text-xs">⚠️ {error}</div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              size="sm"
              className="text-xs h-8"
            >
              Try Again
            </Button>
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-gray-600 dark:text-gray-400 mb-1 text-xs">No rewards available</div>
            <p className="text-xs text-gray-500 dark:text-gray-500">Check back later for new rewards!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rewards.map((reward) => {
              const Icon = getCategoryIcon(reward.category);
              const canRedeem = userPoints >= reward.points_required;
              const pointsNeeded = reward.points_required - (userPoints || 0);
            
            return (
              <Card key={reward.id} className="card-modern hover:scale-105 transition-all duration-300">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                      {((reward as any).logo_url) ? (
                        <img
                          src={(reward as any).logo_url as unknown as string}
                          alt={reward.name}
                          className="h-8 w-8 rounded object-contain bg-white"
                        />
                      ) : (
                        <div className={`p-2 rounded-lg ${canRedeem ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <Icon className={`h-4 w-4 ${canRedeem ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`} />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{reward.name}</h4>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${canRedeem ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {reward.points_required} pts
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                        {canRedeem ? 'Available' : `${pointsNeeded} more pts needed`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {reward.description || 'No description available'}
                    </p>
                    
                    {(() => {
                      const hasRedeem = typeof (reward as any).redeem_url === 'string' && (reward as any).redeem_url.trim().length > 0;
                      const hasOrder = typeof (reward as any).order_url === 'string' && (reward as any).order_url.trim().length > 0;
                      if (hasRedeem || hasOrder) {
                        return (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {hasRedeem && (
                              <a
                                href={(reward as any).redeem_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-semibold shadow hover:from-emerald-700 hover:to-emerald-800"
                              >
                                Redeem Now
                              </a>
                            )}
                            {hasOrder && (
                              <a
                                href={(reward as any).order_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold shadow hover:from-blue-700 hover:to-blue-800"
                              >
                                Order Now
                              </a>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}
      </div>

      {/* Rewards Summary - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header p-3">
          <CardTitle className="text-sm font-bold text-white flex items-center">
            <Gift className="h-4 w-4 mr-2 text-white" />
            Rewards Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-1">
                <Star className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{userPoints || 0}</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Your Points</p>
            </div>
            
            <div className="text-center p-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg border border-green-200 dark:border-green-700">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
                <Gift className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                {rewards.filter(r => (userPoints || 0) >= r.points_required).length} of {rewards.length}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 font-medium">Available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon - Ultra Mobile Optimized */}
      <Card className="card-modern border-dashed border-gray-300 dark:border-gray-600">
        <CardContent className="p-3 text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <Gift className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">More Rewards Coming Soon!</h4>
          <p className="text-xs text-gray-600 dark:text-gray-300">Keep recycling to unlock exclusive offers and amazing rewards</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Rewards;