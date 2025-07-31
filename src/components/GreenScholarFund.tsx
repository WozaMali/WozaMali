import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, GraduationCap, Users, Target, TrendingUp, BookOpen, Shirt, Apple } from "lucide-react";
import { useState } from "react";

const GreenScholarFund = () => {
  const [donationAmount, setDonationAmount] = useState<number>(0);
  
  const fundStats = {
    totalRaised: 42750.50,
    monthlyGoal: 50000,
    beneficiaries: 156,
    thisMonthDonations: 8940.25
  };

  const quickAmounts = [10, 25, 50, 100];
  
  const supportCategories = [
    {
      title: "School Uniforms",
      description: "Provide school uniforms for learners in need",
      cost: 350,
      icon: Shirt,
      funded: 23,
      needed: 12
    },
    {
      title: "Stationery Packs",
      description: "Essential school supplies for students",
      cost: 120,
      icon: BookOpen,
      funded: 45,
      needed: 20
    },
    {
      title: "Nutritional Support",
      description: "Weekly food parcels for child-headed households",
      cost: 200,
      icon: Apple,
      funded: 18,
      needed: 25
    }
  ];

  const progressPercentage = (fundStats.totalRaised / fundStats.monthlyGoal) * 100;

  return (
    <div className="pb-20 p-4 space-y-6 bg-gradient-warm min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl font-bold text-foreground">Green Scholar Fund</h1>
        <p className="text-muted-foreground">Supporting education through community impact</p>
      </div>

      {/* Fund Overview */}
      <Card className="bg-gradient-impact text-success-foreground shadow-warm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Fund Balance</p>
              <p className="text-3xl font-bold">R {fundStats.totalRaised.toLocaleString()}</p>
            </div>
            <GraduationCap className="h-12 w-12 opacity-80" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="opacity-75">This Month</p>
              <p className="font-semibold">R {fundStats.thisMonthDonations.toLocaleString()}</p>
            </div>
            <div>
              <p className="opacity-75">Beneficiaries</p>
              <p className="font-semibold">{fundStats.beneficiaries} learners</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goal Progress */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Monthly Goal Progress</CardTitle>
            <Badge variant="outline">{progressPercentage.toFixed(0)}%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">R {fundStats.totalRaised.toLocaleString()}</span>
              <span className="font-medium">R {fundStats.monthlyGoal.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Donation */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Heart className="h-5 w-5 text-primary" />
            <span>Make a Donation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant={donationAmount === amount ? "default" : "outline"}
                size="sm"
                onClick={() => setDonationAmount(amount)}
                className="text-xs"
              >
                R{amount}
              </Button>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Custom amount"
              value={donationAmount || ''}
              onChange={(e) => setDonationAmount(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
            />
            <Button variant="gradient" disabled={!donationAmount}>
              Donate R{donationAmount}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Donations can be made from your Sebenza Cash wallet or MTN MoMo
          </p>
        </CardContent>
      </Card>

      {/* Support Categories */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">How Your Donation Helps</h3>
        
        {supportCategories.map((category, index) => {
          const Icon = category.icon;
          const totalNeeded = category.funded + category.needed;
          const fundedPercentage = (category.funded / totalNeeded) * 100;
          
          return (
            <Card key={index} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{category.title}</h4>
                      <span className="text-sm font-bold text-primary">R{category.cost}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                    
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-impact h-2 rounded-full transition-all duration-500"
                          style={{ width: `${fundedPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-success">{category.funded} funded</span>
                        <span className="text-muted-foreground">{category.needed} still needed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Application CTA */}
      <Card className="shadow-card border-secondary/20 bg-secondary/10">
        <CardContent className="p-4 text-center">
          <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
          <h4 className="font-medium text-foreground mb-1">Need Support?</h4>
          <p className="text-sm text-muted-foreground mb-3">
            If you're a learner or support a child-headed household, apply for assistance
          </p>
          <Button variant="secondary" size="sm">
            Apply for Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GreenScholarFund;