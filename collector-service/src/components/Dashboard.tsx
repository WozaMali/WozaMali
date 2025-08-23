"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Recycle, Leaf, TrendingUp, ArrowUpRight, Gift, Heart, Star, Calendar, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import ErrorBoundary from "./ErrorBoundary";

const DashboardContent = () => {
  const navigate = useRouter();
  
  // Try to use auth context, but handle the case where it might not be ready
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // AuthProvider not ready yet, show loading
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { user } = authContext;
  
  const walletBalance = 0;
  const totalKgRecycled = 0;
  const co2Saved = 0;
  const monthlyGrowth = 0;

  // Collection scheduling
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const nextCollectionDate = "2025-08-12";
  const nextCollectionTime = "09:00 - 12:00";
  
  // Use user's address from signup instead of hardcoded area
  const getNextTier = () => {
    if (totalKgRecycled >= 1000) return 'Diamond Recycler';
    if (totalKgRecycled >= 500) return 'Platinum Recycler';
    if (totalKgRecycled >= 100) return 'Gold Recycler';
    if (totalKgRecycled >= 50) return 'Silver Recycler';
    return 'Bronze Recycler';
  };

  const getKgToNext = () => {
    if (totalKgRecycled >= 1000) return 0;
    if (totalKgRecycled >= 500) return 1000 - totalKgRecycled;
    return 500 - totalKgRecycled;
  };

  const getProgressPercentage = () => {
    if (totalKgRecycled >= 1000) return 100;
    if (totalKgRecycled >= 500) return ((totalKgRecycled - 500) / 500) * 100;
    return (totalKgRecycled / 500) * 100;
  };

  const tierInfo = getNextTier();

  return (
    <div className="relative pb-20 p-4 space-y-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">WM</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">Welcome back!</h1>
          <p className="text-gray-600">Powered by Sebenza Nathi Waste</p>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Wallet Balance</p>
              <p className="text-3xl font-bold">R {walletBalance.toFixed(2)}</p>
            </div>
            <Wallet className="h-12 w-12 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Recycling Level & Impact */}
      <Card className="shadow-lg border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Recycle className="h-5 w-5 text-green-600" />
            Recycling Level
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Tier</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {tierInfo}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress to next tier</span>
              <span className="text-gray-800">{getKgToNext()} kg</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white shadow-lg border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <p className="text-2xl font-bold text-gray-800">{totalKgRecycled}</p>
              <p className="text-sm text-gray-600">Total KG Recycled</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-lg border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <p className="text-2xl font-bold text-gray-800">{co2Saved}</p>
              <p className="text-sm text-gray-600">CO₂ Saved (kg)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Collection */}
      <Card className="bg-white shadow-lg border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Next Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-800">{nextCollectionDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-semibold text-gray-800">{nextCollectionTime}</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowBookingModal(true)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Collection
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white shadow-lg border-gray-200">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <Gift className="h-6 w-6 text-green-600" />
            <span className="text-sm">Rewards</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <Heart className="h-6 w-6 text-red-600" />
            <span className="text-sm">Donate</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <Star className="h-6 w-6 text-yellow-600" />
            <span className="text-sm">Leaderboard</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex-col space-y-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            <span className="text-sm">Locations</span>
          </Button>
        </CardContent>
      </Card>

      {/* Collection Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Collection</DialogTitle>
            <DialogDescription>
              Choose a date for your next recycling collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowBookingModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Handle booking logic here
                  setShowBookingModal(false);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!selectedDate}
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

const Dashboard = () => {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
};

export default Dashboard;
