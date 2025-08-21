import { useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Recycle, 
  Calendar,
  MapPin,
  Target,
  Award,
  Activity,
  Globe,
  Zap,
  Leaf
} from "lucide-react";
import { computeTotalImpact, formatImpactValue, getImpactDescription } from "@/lib/impact-config";

// Mock analytics data with detailed recycling breakdown
const mockAnalytics = {
  timeRange: "30d",
  totalUsers: 1247,
  activeUsers: 892,
  totalRecycled: 2847.5,
  monthlyGrowth: 23.5,
  topRegions: [
    { name: "Cape Town", petKg: 456.2, cansKg: 89.3, users: 234, growth: 18.2 },
    { name: "Johannesburg", petKg: 398.7, cansKg: 76.8, users: 189, growth: 25.1 },
    { name: "Durban", petKg: 312.4, cansKg: 61.2, users: 156, growth: 15.8 },
    { name: "Pretoria", petKg: 289.1, cansKg: 56.7, users: 142, growth: 22.3 },
    { name: "Port Elizabeth", petKg: 267.8, cansKg: 52.4, users: 128, growth: 19.7 }
  ],
  recyclingTrends: [
    { month: "Jan", pet: 245, cans: 48, glass: 189, paper: 312, metal: 156 },
    { month: "Feb", pet: 267, cans: 52, glass: 198, paper: 334, metal: 167 },
    { month: "Mar", pet: 289, cans: 57, glass: 212, paper: 356, metal: 178 },
    { month: "Apr", pet: 312, cans: 61, glass: 234, paper: 378, metal: 189 },
    { month: "May", pet: 334, cans: 66, glass: 256, paper: 400, metal: 200 },
    { month: "Jun", pet: 356, cans: 70, glass: 278, paper: 422, metal: 211 }
  ],
  userEngagement: {
    dailyActive: 67,
    weeklyActive: 78,
    monthlyActive: 89,
    retentionRate: 84.2
  },
  rewardsDistribution: {
    totalIssued: 45678,
    totalRedeemed: 38945,
    activeBalance: 6733,
    averagePerUser: 36.7
  }
};

// Calculate real environmental impact using the impact config
const totalPet = mockAnalytics.topRegions.reduce((sum, r) => sum + r.petKg, 0);
const totalCans = mockAnalytics.topRegions.reduce((sum, r) => sum + r.cansKg, 0);
const realImpact = computeTotalImpact(
  mockAnalytics.topRegions.map(r => ({ petKg: r.petKg, cansKg: r.cansKg }))
);

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("recycling");

  const getGrowthColor = (growth: number) => {
    if (growth >= 20) return "text-success";
    if (growth >= 10) return "text-warning";
    return "text-destructive";
  };

  const getGrowthIcon = (growth: number) => {
    if (growth >= 0) return <TrendingUp className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4 rotate-180" />;
  };

  return (
    <AdminLayout currentPage="analytics">
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track performance, trends, and impact of your recycling program
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recycling">Recycling Metrics</SelectItem>
                <SelectItem value="users">User Analytics</SelectItem>
                <SelectItem value="environmental">Environmental Impact</SelectItem>
                <SelectItem value="rewards">Rewards & Engagement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{mockAnalytics.totalUsers.toLocaleString()}</div>
                  <p className="text-sm opacity-90">Total Users</p>
                </div>
                <Users className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-success text-success-foreground">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{mockAnalytics.totalRecycled.toFixed(1)} kg</div>
                  <p className="text-sm opacity-90">Total Recycled</p>
                </div>
                <Recycle className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-accent text-accent-foreground">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{mockAnalytics.monthlyGrowth}%</div>
                  <p className="text-sm opacity-90">Monthly Growth</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-info text-info-foreground">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{mockAnalytics.activeUsers.toLocaleString()}</div>
                  <p className="text-sm opacity-90">Active Users</p>
                </div>
                <Activity className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regional Performance */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-primary" />
              <span>Regional Performance</span>
            </CardTitle>
            <CardDescription>
              Top performing regions by recycling volume and user engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.topRegions.map((region, index) => (
                <div key={region.name} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                                         <div>
                       <h3 className="font-semibold text-foreground">{region.name}</h3>
                       <p className="text-sm text-muted-foreground">
                         {region.users} users • {region.petKg.toFixed(1)} kg PET • {region.cansKg.toFixed(1)} kg cans
                       </p>
                     </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getGrowthColor(region.growth)}>
                      {getGrowthIcon(region.growth)}
                      <span className="ml-1">{region.growth}%</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Engagement Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-primary" />
                <span>User Engagement</span>
              </CardTitle>
              <CardDescription>
                User activity and retention metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daily Active Users</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${mockAnalytics.userEngagement.dailyActive}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{mockAnalytics.userEngagement.dailyActive}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Weekly Active Users</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${mockAnalytics.userEngagement.weeklyActive}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{mockAnalytics.userEngagement.weeklyActive}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Active Users</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${mockAnalytics.userEngagement.monthlyActive}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{mockAnalytics.userEngagement.monthlyActive}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Retention Rate</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-success h-2 rounded-full" 
                        style={{ width: `${mockAnalytics.userEngagement.retentionRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{mockAnalytics.userEngagement.retentionRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-6 w-6 text-primary" />
                <span>Rewards & Engagement</span>
              </CardTitle>
              <CardDescription>
                Rewards distribution and user motivation metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Rewards Issued</span>
                  <span className="font-medium">{mockAnalytics.rewardsDistribution.totalIssued.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Rewards Redeemed</span>
                  <span className="font-medium">{mockAnalytics.rewardsDistribution.totalRedeemed.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Balance</span>
                  <span className="font-medium">{mockAnalytics.rewardsDistribution.activeBalance.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average per User</span>
                  <span className="font-medium">R {mockAnalytics.rewardsDistribution.averagePerUser}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

                {/* Environmental Impact */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Leaf className="h-6 w-6 text-success" />
              <span>Environmental Impact</span>
            </CardTitle>
            <CardDescription>
              Quantified environmental benefits of your recycling program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-success/10">
                <div className="text-2xl font-bold text-success mb-2">
                  {formatImpactValue(realImpact.co2Saved, 'kg')}
                </div>
                <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                <p className="text-xs text-success mt-1">{getImpactDescription('co2')}</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <div className="text-2xl font-bold text-primary mb-2">
                  R {realImpact.fundR.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">Fund Generated</p>
                <p className="text-xs text-primary mt-1">From recycling</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-info/10">
                <div className="text-2xl font-bold text-info mb-2">
                  {formatImpactValue(realImpact.waterSavedL, 'L')}
                </div>
                <p className="text-sm text-muted-foreground">Water Saved</p>
                <p className="text-xs text-info mt-1">{getImpactDescription('water')}</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-warning/10">
                <div className="text-2xl font-bold text-warning mb-2">
                  {formatImpactValue(realImpact.landfillL, 'L')}
                </div>
                <p className="text-sm text-muted-foreground">Landfill Saved</p>
                <p className="text-xs text-warning mt-1">{getImpactDescription('landfill')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recycling Breakdown */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Recycle className="h-6 w-6 text-primary" />
              <span>Recycling Breakdown</span>
            </CardTitle>
            <CardDescription>
              Detailed breakdown of materials recycled and their impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Material Quantities</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                    <div className="flex items-center space-x-2">
                      <Recycle className="h-5 w-5 text-success" />
                      <span className="text-sm font-medium">PET Plastic</span>
                    </div>
                    <span className="font-bold text-success">{totalPet.toFixed(1)} kg</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-5 w-5 text-warning" />
                      <span className="text-sm font-medium">Aluminum Cans</span>
                    </div>
                    <span className="font-bold text-warning">{totalCans.toFixed(1)} kg</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Total Recycled</span>
                    </div>
                    <span className="font-bold text-primary">{(totalPet + totalCans).toFixed(1)} kg</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Impact Calculations</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <span className="text-sm text-muted-foreground">Fund Value</span>
                    <span className="font-bold text-foreground">R {realImpact.fundR.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <span className="text-sm text-muted-foreground">Points Earned</span>
                    <span className="font-bold text-foreground">{realImpact.points.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <span className="text-sm text-muted-foreground">CO₂ Saved</span>
                    <span className="font-bold text-foreground">{realImpact.co2Saved.toFixed(1)} kg</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <span className="text-sm text-muted-foreground">Water Saved</span>
                    <span className="font-bold text-foreground">{formatImpactValue(realImpact.waterSavedL, 'L')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recycling Trends Chart Placeholder */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span>Recycling Trends</span>
            </CardTitle>
            <CardDescription>
              Monthly recycling volume by material type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted mx-auto mb-2" />
                <p className="text-muted-foreground">Chart visualization coming soon</p>
                <p className="text-sm text-muted-foreground">
                  {mockAnalytics.recyclingTrends.length} months of data available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Generate reports and export analytics data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Set Goals
              </Button>
              <Button variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Performance Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
