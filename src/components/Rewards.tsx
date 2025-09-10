import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, ShoppingBag, Fuel, Clock, Star, Gift, ChefHat } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";

const Rewards = () => {
  const { user } = useAuth();
  const { totalWeightKg, loading: walletLoading } = useWallet(user?.id);
  // Points are 1:1 with total weight (1kg = 1 point)
  const userPoints = Math.round(totalWeightKg || 0);
  

  const rewards = [
    {
      id: 1,
      title: "AmaPelePele Spices for Africa",
      description: "Premium spice blends for authentic flavors",
      pointsRequired: 40,
      icon: ChefHat,
      category: "Food & Spices",
      timeLeft: "2 weeks",
      partner: "AmaPelePele",
      savings: "Free delivery",
      website: "www.amapelepele.co.za"
    },
  ];



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
               <p className="text-sm opacity-90 mb-1">1kg = 1 point</p>
              {walletLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-24"></div>
                </div>
              ) : (
                 <>
                   <p className="text-3xl font-bold">{userPoints || 0} pts</p>
                 </>
               )}
            </div>
            <Star className="h-12 w-12 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* How Points Work */}
      <Card className="shadow-card border-secondary/20 bg-secondary/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Gift className="h-6 w-6 text-secondary" />
            <div>
                             <p className="text-sm font-medium text-foreground">1kg = 1 point</p>
                             <p className="text-xs text-muted-foreground">Points never expire</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Progress */}
      <Card className="shadow-card border-success/20 bg-success/5">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Your Progress</h4>
              <Badge variant="outline" className="text-success border-success">
                {userPoints || 0} pts
              </Badge>
            </div>
            
            <div className="space-y-2">
              {rewards.map((reward) => {
                const pointsNeeded = reward.pointsRequired - (userPoints || 0);
                const canRedeem = (userPoints || 0) >= reward.pointsRequired;
                
                return (
                  <div key={reward.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{reward.title}</span>
                    {canRedeem ? (
                      <Badge variant="default" className="text-xs">Ready to Redeem!</Badge>
                    ) : (
                      <span className="text-warning-foreground">
                        Need {pointsNeeded} more pts
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Available Rewards</h3>
        
        {rewards.map((reward) => {
          const Icon = reward.icon;
          const canRedeem = userPoints >= reward.pointsRequired;
          
          return (
            <Card key={reward.id} className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${canRedeem ? 'bg-gradient-primary' : 'bg-muted'}`}>
                      <Icon className={`h-6 w-6 ${canRedeem ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{reward.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{reward.partner}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={canRedeem ? "default" : "secondary"} className="mb-1">
                      {reward.pointsRequired} pts
                    </Badge>
                    <p className="text-xs text-success font-medium">Save {reward.savings}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-foreground mb-3">{reward.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-xs">
                      {reward.category}
                    </Badge>
                    <div className="flex items-center space-x-1 text-warning">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{reward.timeLeft}</span>
                    </div>
                  </div>
                  
                  {reward.website ? (
                    <Button 
                      variant={canRedeem ? "gradient" : "outline"} 
                      size="sm"
                      disabled={!canRedeem}
                      className="min-w-[100px]"
                      onClick={() => canRedeem && window.open(`https://${reward.website}`, '_blank')}
                    >
                      {canRedeem ? "Order Now" : "Need More"}
                    </Button>
                  ) : (
                    <Button 
                      variant={canRedeem ? "gradient" : "outline"} 
                      size="sm"
                      disabled={!canRedeem}
                      className="min-w-[80px]"
                    >
                      {canRedeem ? "Redeem" : "Need More"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rewards Summary */}
      <Card className="shadow-card border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <h4 className="font-semibold text-foreground">Total Rewards Value</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
                             <div>
                 <p className="text-muted-foreground">Your Points</p>
                 <p className="text-lg font-bold text-primary">{userPoints || 0} pts</p>
               </div>
              <div>
                <p className="text-muted-foreground">Available Rewards</p>
                <p className="text-lg font-bold text-success">
                  {rewards.filter(r => (userPoints || 0) >= r.pointsRequired).length} of {rewards.length}
                </p>
                <p className="text-xs text-muted-foreground">Ready to redeem</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card className="shadow-card border-dashed border-muted-foreground/30">
        <CardContent className="p-6 text-center">
          <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">More rewards coming soon!</p>
          <p className="text-xs text-muted-foreground mt-1">Keep recycling to unlock exclusive offers</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Rewards;