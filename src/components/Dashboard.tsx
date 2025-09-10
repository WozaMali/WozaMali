"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Recycle, Leaf, TrendingUp, ArrowUpRight, Gift, Heart, Star, Calendar, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/lib/supabase";

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
    // Enhanced properties
    environmentalImpact,
    nextTierRequirements,
    totalWeightKg
  } = useWallet(user?.id);

  // Add error boundary for wallet data
  const safeWalletBalance = walletBalance || 0;
  const safeTotalPoints = totalPoints || 0;
  const safeUserTier = userTier || 'bronze';
  const safeTotalWeightKg = totalWeightKg || 0;
  const safeEnvironmentalImpact = environmentalImpact || {
    co2_saved_kg: 0,
    water_saved_liters: 0,
    landfill_saved_kg: 0
  };
  const safeNextTierRequirements = nextTierRequirements || {
    nextTier: 'silver',
    weightNeeded: 20,
    progressPercentage: 0
  };

  // Simple useEffect to refresh wallet data when user changes
  useEffect(() => {
    // Only refresh if user changes and we have a valid refresh function
    if (user?.id && refreshWallet && typeof refreshWallet === 'function') {
      // Add a small delay to prevent immediate refresh on mount
      const timer = setTimeout(() => {
        refreshWallet();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id]); // Remove refreshWallet from dependencies to prevent infinite loops
  
  const totalKgRecycled = safeTotalWeightKg || safeTotalPoints; // Use actual weight if available
  const co2Saved = safeEnvironmentalImpact?.co2_saved_kg || (totalKgRecycled * 0.5); // Use calculated impact if available

  // Collection scheduling
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const nextCollectionDate = "2025-08-12";
  const nextCollectionTime = "09:00 - 12:00";
  
  // Fetch user's address from unified users table
  const [userAddress, setUserAddress] = useState<any>(null);
  const [addressLoading, setAddressLoading] = useState(true);

  useEffect(() => {
    const fetchUserAddress = async () => {
      if (!user?.id) return;
      
      try {
        // Query all user fields including address information
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            first_name,
            last_name,
            full_name,
            phone,
            role_id,
            status,
            street_addr,
            township_id,
            subdivision,
            city,
            postal_code,
            areas!township_id (
              name
            )
          `)
          .eq('id', user.id)
          .single();

        if (userError) {
          if (userError.code === 'PGRST116') {
            // User not found in users table - this is expected for new users
            console.log('User not found in users table - using auth user data');
            setUserAddress({
              id: user.id,
              email: user.email || '',
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              full_name: user.user_metadata?.full_name || '',
              phone: user.user_metadata?.phone || '',
              role_id: null,
              status: 'active',
              street_addr: user.user_metadata?.street_address || null,
              township_id: user.user_metadata?.township_id || null,
              subdivision: user.user_metadata?.subdivision || null,
              city: user.user_metadata?.city || 'Soweto',
              postal_code: user.user_metadata?.postal_code || null
            });
          } else {
            console.error('Error fetching user data:', userError);
            setUserAddress(null);
          }
        } else {
          // User exists with address data
          console.log('User found with address data:', userData);
          setUserAddress(userData);
        }
      } catch (error) {
        console.error('Error fetching user address:', error);
        setUserAddress(null);
      } finally {
        setAddressLoading(false);
      }
    };

    fetchUserAddress();
  }, [user?.id]);

  const getUserAddress = () => {
    if (addressLoading) return "Loading address...";
    if (!userAddress) return "Address not available in current schema";
    
    const { street_addr, subdivision, city, postal_code, areas } = userAddress;
    
    if (street_addr && city) {
      const townshipName = areas?.name || 'Unknown Township';
      return `${street_addr}, ${subdivision || ''}, ${townshipName}, ${city} ${postal_code || ''}`.replace(/,\s*,/g, ',').trim();
    } else if (city) {
      return `${city}`;
    }
    
    return "Address not available in current schema";
  };

  const nextCollectionArea = getUserAddress();
  
  // Check if user has provided address information
  const hasAddress = userAddress && userAddress.street_addr && userAddress.city;

  const handleBookCollection = (date: string) => {
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    setShowBookingModal(false);
    // Here you would typically call an API to book the collection
    alert(`Collection booked for ${selectedDate}`);
  };

  // Simple balance display - use the working wallet balance
  const displayBalance = safeWalletBalance;

  // Debug logging to see what's happening
  console.log('Dashboard Debug - Wallet Values:', {
    walletBalance: safeWalletBalance,
    displayBalance,
    totalPoints: safeTotalPoints,
    tier: safeUserTier,
    totalWeightKg: safeTotalWeightKg,
    walletLoading,
    error: walletError
  });

  const handleRefreshBalance = () => {
    if (refreshWallet && typeof refreshWallet === 'function') {
      refreshWallet();
    }
  };

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
                  <button
                    onClick={() => {
                      if (refreshWallet && typeof refreshWallet === 'function') {
                        refreshWallet();
                      }
                    }}
                    className="text-xs text-blue-200 underline hover:text-blue-100 mt-1"
                  >
                    Click to retry
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold">R {displayBalance.toFixed(2)}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {displayBalance === 0 ? 'No balance yet - Complete pickups to earn real money!' : 'Available for withdrawal'}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate.push('/withdrawal')}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Withdrawal"
              >
                <ArrowUpRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate.push('/guides')}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Recycling Guide"
              >
                <Recycle className="h-5 w-5" />
              </button>
              <Wallet className="h-12 w-12 opacity-80" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recycling Level & Impact */}
      <Card className="shadow-card border-secondary/20 bg-secondary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{safeUserTier.charAt(0).toUpperCase() + safeUserTier.slice(1)} Recycler</h3>
              <p className="text-sm text-muted-foreground">{safeTotalWeightKg} kg recycled</p>
            </div>
            <div className="p-2 bg-gradient-impact rounded-lg">
              <Recycle className="h-6 w-6 text-success-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to {safeNextTierRequirements.nextTier ? `${safeNextTierRequirements.nextTier.charAt(0).toUpperCase() + safeNextTierRequirements.nextTier.slice(1)} Recycler` : 'Max Level'}</span>
              <span className="font-medium">{safeNextTierRequirements.weightNeeded} kg to go</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${safeNextTierRequirements.progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CO2 Impact & Monthly Growth */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-impact rounded-lg">
                <Leaf className="h-6 w-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                <p className="text-xl font-bold text-foreground">{co2Saved.toFixed(1)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-success/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Weight</p>
                  <p className="text-lg font-bold text-success">{safeTotalWeightKg.toFixed(1)} kg</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="gradient" 
            className="h-12"
            onClick={() => navigate.push('/withdrawal')}
          >
            <ArrowUpRight className="h-5 w-5 mr-2" />
            Withdrawal
          </Button>
          <Button 
            variant="impact" 
            className="h-12"
            onClick={() => navigate.push('/guides')}
          >
            <Recycle className="h-5 w-5 mr-2" />
            Recycling Guide
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="gradient" 
            className="h-12"
            onClick={() => navigate.push('/rewards')}
          >
            <Gift className="h-5 w-5 mr-2" />
            Redeem Reward
          </Button>
          
          <Button 
            variant="gradient" 
            className="h-12"
            onClick={() => navigate.push('/fund')}
          >
            <Heart className="h-5 w-5 mr-2" />
            Donate to Fund
          </Button>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Recycle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">Recycling Credit</p>
                <p className="text-xs text-muted-foreground">{safeTotalWeightKg.toFixed(1)} kg processed</p>
              </div>
            </div>
            <p className="text-sm font-bold text-success">+R {displayBalance.toFixed(2)}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Reward Redeemed</p>
                <p className="text-xs text-muted-foreground">No rewards yet</p>
              </div>
            </div>
            <p className="text-sm font-bold text-muted-foreground">-R 0.00</p>
          </div>
        </CardContent>
      </Card>

      {/* Collection Schedule */}
      <Card className="shadow-card border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Next Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-primary text-primary-foreground rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm opacity-90">Collection Date</p>
                <p className="text-lg font-bold">{nextCollectionDate}</p>
              </div>
              <Calendar className="h-8 w-8 opacity-80" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 opacity-80" />
                <span>{nextCollectionTime}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 opacity-80" />
                <span className="text-sm">
                  {nextCollectionArea}
                </span>
              </div>
            </div>
            
            {!hasAddress ? (
              <div className="mt-3 p-3 bg-warning/20 rounded-lg border border-warning/30">
                <p className="text-xs text-warning-foreground text-center mb-2">
                  Address information not provided
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Please complete your profile with address information to enable collection booking
                </p>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-success/20 rounded-lg border border-success/30">
                <p className="text-xs text-success-foreground text-center">
                  ✓ Collection address confirmed: {nextCollectionArea}
                </p>
              </div>
            )}
          </div>
          
          <Button 
            variant="gradient" 
            className="w-full"
            onClick={() => handleBookCollection(nextCollectionDate)}
            disabled={!hasAddress}
          >
            {hasAddress ? "Book Collection" : "Address Required"}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate.push('/collections')}
          >
            View All Dates
          </Button>
        </CardContent>
      </Card>

      {/* Booking Confirmation Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Collection Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to book a collection for {selectedDate}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 bg-secondary/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Collection Details</p>
              <p className="font-medium">Date: {selectedDate}</p>
              <p className="font-medium">Time: {nextCollectionTime}</p>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Collection Address:</p>
                  <p className="font-medium">{nextCollectionArea}</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="gradient" 
                className="flex-1"
                onClick={confirmBooking}
              >
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