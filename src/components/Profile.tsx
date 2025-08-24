"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { User, Phone, Shield, Settings, LogOut, Edit3, Star, Recycle, Award, ChevronRight, Bell, BookOpen, TrendingUp } from "lucide-react";

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

  const handleLogout = async () => {
    try {
      console.log('Profile: Starting logout process...');
      await signOut();
      console.log('Profile: Sign out completed, redirecting to sign-in...');
      navigate.push('/auth/sign-in');
    } catch (error) {
      console.error('Profile: Logout failed:', error);
      // Force redirect even if there's an error
      navigate.push('/auth/sign-in');
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
    name: user?.user_metadata?.full_name || "User",
    phone: user?.user_metadata?.phone || "No phone number",
    email: user?.email || "No email",
    streetAddress: user?.user_metadata?.street_address || "No address",
    suburb: user?.user_metadata?.suburb || "No suburb",
    city: user?.user_metadata?.city || "No city",
    postalCode: user?.user_metadata?.postal_code || "No postal code",
    kycStatus: "verified",
    memberSince: formatMemberSince(user?.created_at),
    totalRecycled: 0,
    level: "Gold Recycler",
    nextLevel: "Platinum",
    pointsToNext: 0,
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
    <div className="pb-20 p-4 space-y-6 bg-gradient-warm min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Manage your account and recycling journey</p>
      </div>

      {/* User Info Card */}
      <Card className="bg-gradient-primary text-primary-foreground shadow-warm border-0">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              <User className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{userProfile.name}</h2>
              <p className="text-sm opacity-90">{userProfile.phone}</p>
              <p className="text-sm opacity-90">{userProfile.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  {userProfile.kycStatus === 'verified' ? 'Verified' : 'Pending'}
                </Badge>
                <span className="text-xs opacity-75">Member since {userProfile.memberSince}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Address Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {userProfile.streetAddress !== "No address" && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{userProfile.streetAddress}</p>
                <p className="text-sm text-muted-foreground">
                  {userProfile.suburb !== "No suburb" && userProfile.suburb}, {userProfile.city !== "No city" && userProfile.city}
                  {userProfile.postalCode !== "No postal code" && `, ${userProfile.postalCode}`}
                </p>
              </div>
            </div>
          )}
          {userProfile.streetAddress === "No address" && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No address information provided
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recycling Level */}
      <Card className="shadow-card border-secondary/20 bg-secondary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{userProfile.level}</h3>
              <p className="text-sm text-muted-foreground">{userProfile.totalRecycled} kg recycled</p>
            </div>
            <Star className="h-8 w-8 text-secondary" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to {userProfile.nextLevel}</span>
              <span className="font-medium">{userProfile.pointsToNext} kg to go</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                style={{ width: '0%' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border text-center ${
                    achievement.earned 
                      ? 'bg-gradient-primary text-primary-foreground border-primary' 
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-xs font-medium">{achievement.title}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate.push('/settings')}
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate.push('/notifications')}
          >
            <Bell className="h-4 w-4 mr-3" />
            Notifications
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate.push('/guides')}
          >
            <BookOpen className="h-4 w-4 mr-3" />
            Recycling Guides
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate.push('/leaderboard')}
          >
            <TrendingUp className="h-4 w-4 mr-3" />
            Leaderboard
          </Button>
          
          {/* Collector Link - Only show for collectors, admins, and managers */}
          {(userRole === 'collector' || userRole === 'admin' || userRole === 'manager') && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate.push('/collector')}
            >
              <Recycle className="h-4 w-4 mr-3" />
              Collector Dashboard
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {settings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <button
                key={index}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                onClick={setting.action}
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{setting.title}</p>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="shadow-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">App Version</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Sync</span>
            <span className="text-sm font-medium">Just now</span>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="destructive" className="w-full h-12" onClick={handleLogout}>
        <LogOut className="h-5 w-5 mr-2" />
        Logout
      </Button>
    </div>
  );
};

export default Profile;