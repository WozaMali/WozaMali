import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Shield, Settings, LogOut, Edit3, Star, Recycle, Award, ChevronRight, Bell, BookOpen, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const userProfile = {
    name: "Thabo Mthembu",
    phone: "+27 82 123 4567",
    kycStatus: "verified",
    memberSince: "March 2024",
    totalRecycled: 127.5,
    level: "Gold Recycler",
    nextLevel: "Platinum",
    pointsToNext: 23,
  };

  const achievements = [
    { title: "First Recycle", icon: Recycle, earned: true },
    { title: "100kg Milestone", icon: Award, earned: true },
    { title: "Community Helper", icon: Star, earned: true },
    { title: "Eco Warrior", icon: Shield, earned: false },
  ];

  const settings = [
    { title: "Edit Personal Details", icon: Edit3, description: "Update name and contact info" },
    { title: "MTN MoMo Settings", icon: Phone, description: "Manage linked mobile money account" },
    { title: "Notification Preferences", icon: Settings, description: "Control alerts and updates" },
    { title: "Security & Privacy", icon: Shield, description: "Manage account security" },
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
                style={{ width: '77%' }}
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
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-4 w-4 mr-3" />
            Notifications
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/guides')}
          >
            <BookOpen className="h-4 w-4 mr-3" />
            Recycling Guides
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/leaderboard')}
          >
            <TrendingUp className="h-4 w-4 mr-3" />
            Leaderboard
          </Button>
        </CardContent>
      </Card>

      {/* Original Settings */}
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
      <Button variant="destructive" className="w-full h-12">
        <LogOut className="h-5 w-5 mr-2" />
        Logout
      </Button>
    </div>
  );
};

export default Profile;