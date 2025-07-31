import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Recycle, Leaf, TrendingUp, ArrowUpRight, Gift, Heart } from "lucide-react";

const Dashboard = () => {
  const walletBalance = 2450.75;
  const totalKgRecycled = 127.5;
  const co2Saved = 89.25;
  const monthlyGrowth = 23;

  return (
    <div className="pb-20 p-4 space-y-6 bg-gradient-warm min-h-screen">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="flex justify-center">
          <img src="/lovable-uploads/d6e53af1-4f80-4896-855d-42c46ca1b7e8.png" alt="Woza Mali Logo" className="h-16 w-auto" />
        </div>
        
        <p className="text-muted-foreground">Powered by Sebenza Nathi Waste</p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-primary text-primary-foreground shadow-warm border-0">
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

      {/* Impact Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-impact rounded-lg">
                <Recycle className="h-6 w-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recycled</p>
                <p className="text-xl font-bold text-foreground">{totalKgRecycled} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-impact rounded-lg">
                <Leaf className="h-6 w-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                <p className="text-xl font-bold text-foreground">{co2Saved} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Growth */}
      <Card className="shadow-card border-success/20 bg-success/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Growth</p>
                <p className="text-lg font-bold text-success">+{monthlyGrowth}%</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-success" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        
        <Button variant="gradient" className="w-full h-14 text-base">
          <ArrowUpRight className="h-5 w-5 mr-2" />
          Request Payout
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="warm" className="h-12">
            <Gift className="h-5 w-5 mr-2" />
            Redeem Reward
          </Button>
          
          <Button variant="impact" className="h-12">
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
                <p className="text-xs text-muted-foreground">5.2 kg processed</p>
              </div>
            </div>
            <p className="text-sm font-bold text-success">+R 32.50</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Reward Redeemed</p>
                <p className="text-xs text-muted-foreground">Coffee voucher</p>
              </div>
            </div>
            <p className="text-sm font-bold text-muted-foreground">-R 15.00</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;