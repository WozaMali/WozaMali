"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Recycle, Leaf, TrendingUp, ArrowUpRight, Gift, Heart, Star, Calendar, Clock, MapPin, Trophy, TreePine, Droplets, Mountain } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { RefreshCw } from "lucide-react";
import { SimpleWalletService, SimpleWalletData } from "@/lib/simpleWalletService";

const Dashboard = () => {
  const navigate = useRouter();
  
  // Try to use auth context, but handle the case where it might not be ready
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // AuthProvider not ready yet, show loading
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { user } = authContext;
  
  // Use the enhanced wallet hook to get comprehensive data
  const { 
    balance: walletBalance, 
    points: totalPoints,
    tier: userTier,
    totalEarnings,
    loading: walletLoading,
    error: walletError,
    refreshWallet,
    // New enhanced properties
    environmentalImpact,
    tierBenefits,
    nextTierRequirements,
    totalPickups,
    approvedPickups,
    pendingPickups,
    rejectedPickups,
    totalWeightKg,
    syncWalletBalances,
    refreshCustomerPerformance
  } = useWallet(user?.id);

  // Fetch simple wallet data directly from database
  const [simpleWallet, setSimpleWallet] = useState<SimpleWalletData | null>(null);
  const [simpleWalletLoading, setSimpleWalletLoading] = useState(true);

  useEffect(() => {
    const fetchSimpleWallet = async () => {
      if (!user?.id) return;
      
      try {
        setSimpleWalletLoading(true);
        console.log('Dashboard: Fetching simple wallet for user:', user.id);
        
        const walletData = await SimpleWalletService.getWalletData(user.id);
        console.log('Dashboard: Simple wallet data received:', walletData);
        
        setSimpleWallet(walletData);
      } catch (error) {
        console.error('Dashboard: Error fetching simple wallet:', error);
      } finally {
        setSimpleWalletLoading(false);
      }
    };

    fetchSimpleWallet();
  }, [user?.id]);
  
  const totalKgRecycled = totalWeightKg || totalPoints; // Use actual weight if available
  const co2Saved = environmentalImpact?.co2_saved_kg || (totalKgRecycled * 0.5); // Use calculated impact if available
  const waterSaved = environmentalImpact?.water_saved_liters || (totalKgRecycled * 0.1);
  const landfillSaved = environmentalImpact?.landfill_saved_kg || (totalKgRecycled * 0.3);
  const treesEquivalent = (co2Saved / 22); // Calculate trees equivalent manually

  // Collection scheduling
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const nextCollectionDate = "2025-08-12";
  const nextCollectionTime = "09:00 - 12:00";
  
  // Use user's address from signup instead of hardcoded area
  const getUserAddress = () => {
    if (!user?.user_metadata) return "Address not provided";
    
    const { street_address, suburb, city, postal_code } = user.user_metadata;
    
    // Debug logging to help troubleshoot
    console.log('User metadata:', user.user_metadata);
    console.log('Address fields:', { street_address, suburb, city, postal_code });
    
    if (street_address && suburb && city) {
      return `${street_address}, ${suburb}, ${city}${postal_code ? `, ${postal_code}` : ''}`;
    } else if (street_address && city) {
      return `${street_address}, ${city}`;
    } else if (city) {
      return city;
    }
    
    return "Address not provided";
  };

  const nextCollectionArea = getUserAddress();
  
  // Check if user has provided address information
  const hasAddress = user?.user_metadata && (
    user.user_metadata.street_address || 
    user.user_metadata.city
  );

  const handleBookCollection = (date: string) => {
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    setShowBookingModal(false);
    // Here you would typically call an API to book the collection
    alert(`Collection booked for ${selectedDate}`);
  };

  // Determine recycler tier based on wallet data
  const getTier = () => {
    const tier = simpleWallet?.tier || userTier;
    switch (tier) {
      case 'platinum': return { tier: 'Platinum Recycler', color: 'text-accent' };
      case 'gold': return { tier: 'Gold Recycler', color: 'text-yellow-500' };
      case 'silver': return { tier: 'Silver Recycler', color: 'text-gray-500' };
      default: return { tier: 'Bronze Recycler', color: 'text-amber-600' };
    }
  };

  const getNextTier = () => {
    if (nextTierRequirements.nextTier) {
      return `${nextTierRequirements.nextTier.charAt(0).toUpperCase() + nextTierRequirements.nextTier.slice(1)} Recycler`;
    }
    return 'Max Level';
  };

  const getKgToNext = () => {
    return nextTierRequirements.pointsNeeded;
  };

  const getProgressPercentage = () => {
    return nextTierRequirements.progressPercentage;
  };

  const tierInfo = getTier();

  // Handle sync operations
  const handleSyncWallet = async () => {
    try {
      await syncWalletBalances();
      await refreshCustomerPerformance();
      refreshWallet();
    } catch (error) {
      console.error('Error syncing wallet:', error);
    }
  };

  // Create real data for testing
  const handleCreateRealData = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Creating real data for user:', user.id);
      
      // Refresh simple wallet data
      const walletData = await SimpleWalletService.getWalletData(user.id);
      setSimpleWallet(walletData);
      
      // Refresh enhanced wallet data
      await refreshWallet();
      
      alert('Wallet data refreshed! Check your balance.');
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
      alert('Error refreshing wallet data. Check console for details.');
    }
  };

  // Fix wallet balance display - prioritize simple wallet data from database
  const displayBalance = simpleWalletLoading ? 0 : 
    simpleWallet?.balance || 
    (walletLoading ? 0 : walletError ? 0 : (typeof walletBalance === 'number' && walletBalance > 0 ? walletBalance : 100.00));
  
  // Debug logging to see what's happening
  console.log('Dashboard Debug - Wallet Values:', {
    simpleWallet: simpleWallet,
    originalBalance: walletBalance,
    displayBalance,
    totalPoints: simpleWallet?.total_points || totalPoints,
    tier: simpleWallet?.tier || userTier,
    simpleWalletLoading,
    walletLoading,
    error: walletError
  });

  return (
    <div className="relative pb-20 p-4 space-y-6 bg-gradient-warm min-h-screen">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="flex justify-center">
          <Logo className="h-16 w-auto" alt="Woza Mali Logo" variant="woza-mali" />
        </div>
        
        <div className="space-y-1">
          <p className="text-muted-foreground">Powered by Sebenza Nathi Waste</p>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-primary text-primary-foreground shadow-warm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Wallet Balance</p>
              {walletLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-24"></div>
                </div>
              ) : walletError ? (
                <div>
                  <p className="text-xl font-bold text-red-200">Error</p>
                  <p className="text-xs opacity-75 mt-1">Failed to load balance</p>
                </div>
              ) : (
                                  <>
                    <p className="text-3xl font-bold">R {displayBalance.toFixed(2)}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {displayBalance === 100 ? 'Demo balance - Complete pickups to earn real money!' : 'Available for withdrawal'}
                    </p>
                  </>
                )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSyncWallet}
                disabled={walletLoading}
                className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Sync wallet with latest data"
              >
                <RefreshCw className={`h-5 w-5 ${walletLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleCreateRealData}
                disabled={simpleWalletLoading}
                className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Refresh wallet data"
              >
                <RefreshCw className={`h-5 w-5 ${simpleWalletLoading ? 'animate-spin' : ''}`} />
              </button>
              <Wallet className="h-12 w-12 opacity-80" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points and Tier Card */}
      <Card className="shadow-card border-secondary/20 bg-secondary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">Impact Points</h3>
              <p className="text-sm text-muted-foreground">{simpleWallet?.total_points || totalPoints || 0} points earned</p>
            </div>
            <div className="p-2 bg-gradient-impact rounded-lg">
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Tier</span>
              <span className="font-medium">{getTier().tier}</span>
            </div>
            {nextTierRequirements.nextTier && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Next Tier</span>
                  <span className="font-medium">{getNextTier()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Points Needed</span>
                  <span className="font-medium">{getKgToNext()} points</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recycling Level & Impact */}
      <Card className="shadow-card border-secondary/20 bg-secondary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{tierInfo.tier}</h3>
              <p className="text-sm text-muted-foreground">{totalKgRecycled.toFixed(1)} kg recycled</p>
            </div>
            <div className="p-2 bg-gradient-impact rounded-lg">
              <Recycle className="h-6 w-6 text-success-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Pickups</span>
              <span className="font-medium">{totalPickups}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Approved</span>
              <span className="font-medium text-green-600">{approvedPickups}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pending</span>
              <span className="font-medium text-yellow-600">{pendingPickups}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Rejected</span>
              <span className="font-medium text-red-600">{rejectedPickups}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Impact */}
      <Card className="shadow-card border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Leaf className="h-5 w-5" />
            Environmental Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <TreePine className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">CO₂ Saved</p>
              <p className="text-lg font-bold text-green-700">{co2Saved.toFixed(1)} kg</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <Droplets className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-800">Water Saved</p>
              <p className="text-lg font-bold text-blue-700">{waterSaved.toFixed(1)} L</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <Mountain className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-800">Landfill Saved</p>
              <p className="text-lg font-bold text-gray-700">{landfillSaved.toFixed(1)} kg</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <TreePine className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">Trees Equivalent</p>
              <p className="text-lg font-bold text-green-700">{treesEquivalent.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      {tierBenefits.length > 0 && (
        <Card className="shadow-card border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Trophy className="h-5 w-5" />
              {tierInfo.tier} Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tierBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-800">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={() => navigate.push('/rewards')}
          className="h-20 bg-gradient-primary text-primary-foreground hover:bg-gradient-primary/90"
        >
          <div className="text-center">
            <Gift className="h-6 w-6 mx-auto mb-1" />
            <span className="text-sm">Rewards</span>
          </div>
        </Button>
        
        <Button 
          onClick={() => navigate.push('/history')}
          className="h-20 bg-gradient-secondary text-secondary-foreground hover:bg-gradient-secondary/90"
        >
          <div className="text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-1" />
            <span className="text-sm">History</span>
          </div>
        </Button>
      </div>

      {/* Collection Scheduling */}
      {hasAddress && (
        <Card className="shadow-card border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              Next Collection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">{nextCollectionArea}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">{nextCollectionDate} • {nextCollectionTime}</span>
            </div>
            <Button 
              onClick={() => handleBookCollection(nextCollectionDate)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Book Collection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Collection Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Collection</DialogTitle>
            <DialogDescription>
              Confirm your collection booking for {selectedDate}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Collection Details:</p>
              <div className="space-y-1 text-sm">
                <p><strong>Date:</strong> {selectedDate}</p>
                <p><strong>Time:</strong> {nextCollectionTime}</p>
                <p><strong>Location:</strong> {nextCollectionArea}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBookingModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmBooking} className="flex-1">
                Confirm Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;