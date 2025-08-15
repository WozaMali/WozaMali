import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Medal, Award, TrendingUp, Crown, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LeaderboardPage = () => {
  const navigate = useNavigate();

  const weeklyLeaders = [
    {
      rank: 1,
      name: "Thandiwe M.",
      location: "Mitchells Plain",
      kg: 45.2,
      points: 1128,
      avatar: "/WozaMali-uploads/f6006743-2187-4d7a-8b7c-c77f6b6feda8.png",
      tier: "Diamond",
      badge: "🏆"
    },
    {
      rank: 2,
      name: "John K.",
      location: "Khayelitsha",
      kg: 38.7,
      points: 967,
      avatar: "/WozaMali-uploads/d6e53af1-4f80-4896-855d-42c46ca1b7e8.png",
      tier: "Platinum",
      badge: "🥈"
    },
    {
      rank: 3,
      name: "Sarah L.",
      location: "Gugulethu", 
      kg: 32.1,
      points: 802,
      avatar: "/WozaMali-uploads/9c12d890-c6b5-4b95-a3af-15175c504d86.png",
      tier: "Gold",
      badge: "🥉"
    },
    {
      rank: 4,
      name: "You",
      location: "Mitchells Plain",
      kg: 28.5,
      points: 712,
      avatar: "/WozaMali-uploads/f6006743-2187-4d7a-8b7c-c77f6b6feda8.png",
      tier: "Gold",
      badge: "",
      isCurrentUser: true
    },
    {
      rank: 5,
      name: "Mike P.",
      location: "Langa",
      kg: 25.3,
      points: 632,
      avatar: "/WozaMali-uploads/d6e53af1-4f80-4896-855d-42c46ca1b7e8.png",
      tier: "Gold",
      badge: ""
    }
  ];

  const monthlyLeaders = [
    {
      rank: 1,
      name: "Peter N.",
      location: "Nyanga",
      kg: 187.4,
      points: 4685,
      avatar: "/WozaMali-uploads/9c12d890-c6b5-4b95-a3af-15175c504d86.png",
      tier: "Diamond",
      badge: "👑"
    },
    {
      rank: 2,
      name: "Lisa M.",
      location: "Mitchells Plain",
      kg: 165.2,
      points: 4130,
      avatar: "/WozaMali-uploads/f6006743-2187-4d7a-8b7c-c77f6b6feda8.png",
      tier: "Diamond",
      badge: "⭐"
    },
    {
      rank: 3,
      name: "David K.",
      location: "Khayelitsha",
      kg: 142.8,
      points: 3570,
      avatar: "/WozaMali-uploads/d6e53af1-4f80-4896-855d-42c46ca1b7e8.png",
      tier: "Platinum",
      badge: "💎"
    }
  ];

  const achievements = [
    {
      title: "Weekly Champion",
      description: "Top recycler for the week",
      requirement: "Rank #1 weekly",
      icon: Trophy,
      unlocked: false
    },
    {
      title: "Consistency King",
      description: "Recycled every day this week",
      requirement: "7 days streak",
      icon: Medal,
      unlocked: true
    },
    {
      title: "Community Leader",
      description: "Top 10 in your area",
      requirement: "Local top 10",
      icon: Award,
      unlocked: true
    }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-warning" />;
      case 2:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 3:
        return <Award className="h-5 w-5 text-accent" />;
      default:
        return <span className="text-muted-foreground font-bold">#{rank}</span>;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Diamond":
        return "text-accent";
      case "Platinum":
        return "text-muted-foreground";
      case "Gold":
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Leaderboard</h1>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="weekly" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">This Week's Top Recyclers</h2>
              <p className="text-muted-foreground">See who's leading the recycling challenge</p>
            </div>

            {/* Top 3 Podium */}
            <Card className="shadow-card bg-gradient-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {weeklyLeaders.slice(0, 3).map((leader, index) => (
                    <div key={leader.rank} className={`${index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'}`}>
                      <div className="text-2xl mb-2">{leader.badge}</div>
                      <Avatar className={`mx-auto mb-2 ${index === 0 ? 'h-16 w-16' : 'h-12 w-12'} border-2 border-primary-foreground`}>
                        <AvatarImage src={leader.avatar} />
                        <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className={`font-bold ${index === 0 ? 'text-lg' : 'text-sm'}`}>{leader.name}</p>
                      <p className="text-xs opacity-80">{leader.kg} kg</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Full Leaderboard */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-primary" />
                  Full Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weeklyLeaders.map((leader) => (
                  <div 
                    key={leader.rank}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      leader.isCurrentUser ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-8 text-center">
                      {getRankIcon(leader.rank)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={leader.avatar} />
                      <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${leader.isCurrentUser ? 'text-primary' : ''}`}>
                          {leader.name}
                        </p>
                        <Badge variant="secondary" className={getTierColor(leader.tier)}>
                          {leader.tier}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{leader.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{leader.kg} kg</p>
                      <p className="text-sm text-muted-foreground">{leader.points} pts</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Monthly Champions</h2>
              <p className="text-muted-foreground">This month's recycling heroes</p>
            </div>

            <Card className="shadow-card">
              <CardContent className="p-4 space-y-3">
                {monthlyLeaders.map((leader) => (
                  <div key={leader.rank} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <div className="text-2xl">{leader.badge}</div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={leader.avatar} />
                      <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{leader.name}</p>
                        <Badge variant="secondary" className={getTierColor(leader.tier)}>
                          {leader.tier}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{leader.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{leader.kg} kg</p>
                      <p className="text-sm text-muted-foreground">{leader.points} pts</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-card border-warning/20 bg-warning/5">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-warning mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Your Progress</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    You're currently ranked #15 this month. Keep recycling to climb higher!
                  </p>
                  <Button 
                    variant="warm" 
                    size="sm"
                    onClick={() => navigate('/collections')}
                  >
                    Schedule Collection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Your Achievements</h2>
              <p className="text-muted-foreground">Unlock badges by reaching recycling milestones</p>
            </div>

            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <Card key={index} className={`shadow-card ${achievement.unlocked ? 'border-success/20 bg-success/5' : 'border-muted/20'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-success/20' : 'bg-muted/20'}`}>
                        <Icon className={`h-5 w-5 ${achievement.unlocked ? 'text-success' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold">{achievement.title}</h3>
                          {achievement.unlocked ? (
                            <Badge variant="default" className="bg-success text-success-foreground">
                              <Star className="h-3 w-3 mr-1" />
                              Unlocked
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Locked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground">{achievement.requirement}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LeaderboardPage;
