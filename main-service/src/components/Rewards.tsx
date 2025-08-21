import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, ShoppingBag, Fuel, Clock, Star, Gift, ChefHat } from "lucide-react";

const Rewards = () => {
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
      website: "amapelepele.co.za"
    },
    {
      id: 2,
      title: "Free Coffee at Bean There",
      description: "Get a free coffee at any Bean There location",
      pointsRequired: 50,
      icon: Coffee,
      category: "Food & Drink",
      timeLeft: "3 days",
      partner: "Bean There",
      savings: "R 25",
    },
    {
      id: 3,
      title: "10% Off at Woolworths",
      description: "Enjoy 10% discount on your next grocery shop",
      pointsRequired: 75,
      icon: ShoppingBag,
      category: "Retail",
      timeLeft: "1 week",
      partner: "Woolworths",
      savings: "Up to R 200",
    },
    {
      id: 4,
      title: "R20 Fuel Voucher",
      description: "Get R20 off your next fuel purchase",
      pointsRequired: 60,
      icon: Fuel,
      category: "Transport",
      timeLeft: "5 days",
      partner: "Shell",
      savings: "R 20",
    },
  ];

  const userPoints = 0;

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
              <p className="text-sm opacity-90 mb-1">Available Points</p>
              <p className="text-3xl font-bold">{userPoints} pts</p>
              <p className="text-xs opacity-75 mt-1">Earned from {(userPoints * 0.8).toFixed(0)} kg recycled</p>
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
              <p className="text-sm font-medium text-foreground">Earn 1 point per kg recycled</p>
              <p className="text-xs text-muted-foreground">Points never expire • Use them for rewards</p>
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