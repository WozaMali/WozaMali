"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { User, Phone, Shield, Settings, LogOut, Edit3, Star, Recycle, Award, ChevronRight, Bell, BookOpen, TrendingUp, MapPin } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

const Profile = () => {
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
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const { user, signOut, userRole } = authContext;
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Use the same wallet hook as Dashboard for tier and progress
  const {
    tier: userTier,
    totalWeightKg,
    nextTierRequirements,
    loading: walletLoading,
    error: walletError
  } = useWallet(user?.id);

  const safeUserTier = userTier || 'bronze';
  const safeTotalWeightKg = totalWeightKg || 0;
  const safeNextTierRequirements = nextTierRequirements || {
    nextTier: 'silver',
    weightNeeded: 0,
    progressPercentage: 0
  };

  // Fetch user data from unified database
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        // Query all user fields including address information
        const { data, error } = await supabase
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
            created_at
          `)
          .eq('id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // User not found in users table - this is expected for new users
            console.log('Profile: User not found in users table - using auth user data');
            setUserData({
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
              postal_code: user.user_metadata?.postal_code || null,
              created_at: user.created_at
            });
          } else {
            console.error('Error fetching user data:', error);
          }
        } else {
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to auth user data
        setUserData({
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
          postal_code: user.user_metadata?.postal_code || null,
          created_at: user.created_at
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      console.log('Profile: Starting logout process...');
      await signOut();
      // signOut() already handles the redirect, no need to call navigate.push
    } catch (error) {
      console.error('Profile: Logout failed:', error);
      // Force redirect even if there's an error
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/sign-in';
      }
    }
  };

  // Format member since date
  const formatMemberSince = (createdAt: string | undefined) => {
    if (!createdAt) return "Recently";
    
    try {
      const date = new Date(createdAt);
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long' 
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return "Recently";
    }
  };

  const userProfile = {
    name: userData?.full_name || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || user?.user_metadata?.full_name || "User",
    phone: userData?.phone || user?.user_metadata?.phone || "No phone number",
    email: userData?.email || user?.email || "No email",
    streetAddress: userData?.street_addr || user?.user_metadata?.street_address || "No address provided",
    subdivision: userData?.subdivision || user?.user_metadata?.subdivision || "",
    township: userData?.township_name || user?.user_metadata?.township_name || "",
    city: userData?.city || user?.user_metadata?.city || "Soweto",
    postalCode: userData?.postal_code || user?.user_metadata?.postal_code || "No postal code",
    kycStatus: "verified",
    memberSince: formatMemberSince(userData?.created_at || user?.created_at),
    totalRecycled: safeTotalWeightKg,
  };


  const achievements = [
    { title: "First Recycle", icon: Recycle, earned: true },
    { title: "100kg Milestone", icon: Award, earned: true },
    { title: "Community Helper", icon: Star, earned: true },
    { title: "Eco Warrior", icon: Shield, earned: false },
  ];

  const settings = [
    { 
      title: "Edit Personal Details", 
      icon: Edit3, 
      description: "Update name and contact info",
      action: () => navigate.push('/profile/edit')
    },
    { 
      title: "Notification Preferences", 
      icon: Settings, 
      description: "Control alerts and updates",
      action: () => navigate.push('/settings')
    },
    { 
      title: "Security & Privacy", 
      icon: Shield, 
      description: "Manage account security",
      action: () => navigate.push('/profile/security')
    },
  ];

  return (
    <div className="pb-24 px-2 py-3 space-y-3 bg-gradient-warm dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header - Ultra Mobile Optimized */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Manage your account and recycling journey</p>
      </div>

      {/* User Info Card - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                <Shield className="h-2 w-2 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Sebenza Mngqi</h2>
              <div className="space-y-1">
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">{userProfile.phone}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">{userProfile.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 px-2 py-0.5 rounded-full text-xs">
                  <Shield className="h-2 w-2 mr-1" />
                  {userProfile.kycStatus === 'verified' ? 'Verified' : 'Pending'}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">Member since {userProfile.memberSince}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header p-3">
          <CardTitle className="text-sm font-bold text-white">Address Information</CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-primary/20 rounded-lg">
                <MapPin className="h-3 w-3 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Loading address...</p>
              </div>
            </div>
          ) : userProfile.streetAddress !== "No address provided" ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <MapPin className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{userProfile.streetAddress}</p>
                  <p className="text-xs text-muted-foreground">
                    {userProfile.subdivision && `${userProfile.subdivision}, `}
                    {userProfile.township && `${userProfile.township}, `}
                    {userProfile.city}
                    {userProfile.postalCode !== "No postal code" && ` ${userProfile.postalCode}`}
                  </p>
                </div>
              </div>
              
              {/* Address Details */}
              <div className="pl-8 space-y-1 text-xs">
                {userProfile.subdivision && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subdivision:</span>
                    <span className="font-medium">{userProfile.subdivision}</span>
                  </div>
                )}
                {userProfile.township && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Township:</span>
                    <span className="font-medium">{userProfile.township}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City:</span>
                  <span className="font-medium">{userProfile.city}</span>
                </div>
                {userProfile.postalCode !== "No postal code" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Postal Code:</span>
                    <span className="font-medium">{userProfile.postalCode}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="p-2 bg-muted/50 rounded-lg mb-2">
                <MapPin className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No address information provided</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Address information will be available after completing your profile
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recycling Level - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <Star className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                {safeUserTier.charAt(0).toUpperCase() + safeUserTier.slice(1)} Recycler
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold">
                {safeTotalWeightKg.toFixed(1)} kg recycled
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                Progress to {safeNextTierRequirements.nextTier ? `${safeNextTierRequirements.nextTier.charAt(0).toUpperCase() + safeNextTierRequirements.nextTier.slice(1)} Recycler` : 'Next Tier'}
              </p>
              <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                {safeNextTierRequirements.weightNeeded} kg to go
              </p>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${safeNextTierRequirements.progressPercentage}%` }}
              />
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {safeNextTierRequirements.progressPercentage.toFixed(1)}% Complete
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header p-3">
          <CardTitle className="text-sm font-bold text-white">Achievements</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg text-center transition-all duration-300 hover:scale-105 ${
                    achievement.earned 
                      ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 border-2 border-yellow-300 dark:border-yellow-600 shadow-lg' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    achievement.earned 
                      ? 'bg-yellow-500 shadow-lg' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      achievement.earned ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>
                  <p className={`text-xs font-semibold ${
                    achievement.earned ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {achievement.title}
                  </p>
                  {achievement.earned && (
                    <div className="mt-1">
                      <div className="w-1 h-1 bg-yellow-500 rounded-full mx-auto"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Access - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header p-3">
          <CardTitle className="text-sm font-bold text-white">Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2">
          <Button 
              className="h-12 justify-start bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500 transition-all duration-200"
            onClick={() => navigate.push('/settings')}
          >
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-2">
                <Settings className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">Settings</p>
                <p className="text-xs opacity-75">Account preferences</p>
              </div>
          </Button>
          
          <Button 
              className="h-12 justify-start bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500 transition-all duration-200"
            onClick={() => navigate.push('/notifications')}
          >
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg mr-2">
                <Bell className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">Notifications</p>
                <p className="text-xs opacity-75">Alerts & updates</p>
              </div>
          </Button>
          
          <Button 
              className="h-12 justify-start bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500 transition-all duration-200"
            onClick={() => navigate.push('/guides')}
          >
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-2">
                <BookOpen className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">Guides</p>
                <p className="text-xs opacity-75">Recycling tips</p>
              </div>
          </Button>
          
          <Button 
              className="h-12 justify-start bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500 transition-all duration-200"
            onClick={() => navigate.push('/leaderboard')}
          >
              <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mr-2">
                <TrendingUp className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">Leaderboard</p>
                <p className="text-xs opacity-75">Top recyclers</p>
              </div>
          </Button>
          
          {/* Collector Link - Only show for collectors, admins, and managers */}
          {(userRole === 'collector' || userRole === 'admin' || userRole === 'manager') && (
            <Button 
                className="h-12 justify-start col-span-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500 transition-all duration-200"
              onClick={() => navigate.push('/collector')}
            >
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-2">
                  <Recycle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold">Collector Dashboard</p>
                  <p className="text-xs opacity-75">Collection management</p>
                </div>
            </Button>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Settings - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardHeader className="card-modern-header p-3">
          <CardTitle className="text-sm font-bold text-white">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
          {settings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <button
                key={index}
                  className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-left group"
                onClick={setting.action}
              >
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                    <Icon className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                  </div>
                <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{setting.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{setting.description}</p>
                </div>
                  <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </button>
            );
          })}
          </div>
        </CardContent>
      </Card>

      {/* App Info - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">App Version</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Last Sync</span>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">Just now</span>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout - Ultra Mobile Optimized */}
      <Button 
        className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        <span className="text-sm">Sign Out</span>
      </Button>
    </div>
  );
};

export default Profile;