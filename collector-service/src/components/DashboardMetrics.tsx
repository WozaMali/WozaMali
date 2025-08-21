import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CreditCard, 
  Recycle, 
  Leaf, 
  TrendingUp,
  AlertCircle 
} from "lucide-react";

const metrics = [
  {
    title: "Total Users",
    value: "2,847",
    change: "+12%",
    icon: Users,
    trend: "up",
    description: "Active recyclers"
  },
  {
    title: "Pending Withdrawals", 
    value: "23",
    change: "5 urgent",
    icon: CreditCard,
    trend: "alert",
    description: "Awaiting approval"
  },
  {
    title: "Total KG Recycled",
    value: "15,420",
    change: "+8.2%",
    icon: Recycle,
    trend: "up", 
    description: "This month"
  },
  {
    title: "CO₂ Saved",
    value: "8.7 tons",
    change: "+15%",
    icon: Leaf,
    trend: "up",
    description: "Environmental impact"
  }
];

const fundMetrics = [
  {
    label: "Total Fund Pool",
    value: "R 45,280",
    type: "total"
  },
  {
    label: "PET Contributions", 
    value: "R 32,150",
    type: "pet"
  },
  {
    label: "Cash Donations",
    value: "R 13,130", 
    type: "cash"
  }
];

export function DashboardMetrics() {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="shadow-elegant hover:shadow-primary transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${
                  metric.trend === 'up' ? 'bg-success/10' :
                  metric.trend === 'alert' ? 'bg-warning/10' : 'bg-primary/10'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    metric.trend === 'up' ? 'text-success' :
                    metric.trend === 'alert' ? 'text-warning' : 'text-primary'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {metric.value}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                  <Badge variant={metric.trend === 'alert' ? 'destructive' : 'default'} className="text-xs">
                    {metric.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {metric.trend === 'alert' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {metric.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Green Scholar Fund Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-success rounded-lg">
                <Leaf className="h-5 w-5 text-success-foreground" />
              </div>
              <span>Green Scholar Fund Pool</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {fundMetrics.map((fund) => (
                <div key={fund.label} className="text-center p-4 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {fund.value}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {fund.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">New Diamond user</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-warning rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Withdrawal request</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Fund contribution</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}