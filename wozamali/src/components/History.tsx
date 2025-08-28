import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Recycle, Gift, Heart, Calendar, Filter } from "lucide-react";
import { useState } from "react";

const History = () => {
  const [filter, setFilter] = useState<'all' | 'earnings' | 'rewards' | 'donations'>('all');
  
  const transactions = [
    {
      id: 1,
      type: 'earning',
      title: 'Recycling Credit',
      description: '5.2 kg plastic bottles processed',
      amount: 0.00,
      date: '2024-01-30',
      time: '14:30',
      icon: Recycle,
      impact: '0.0 kg CO₂ saved'
    },
    {
      id: 2,
      type: 'reward',
      title: 'Coffee Voucher Redeemed',
      description: 'Bean There - Free coffee',
      amount: 0.00,
      date: '2024-01-29',
      time: '09:15',
      icon: Gift,
      points: 0
    },
    {
      id: 3,
      type: 'donation',
      title: 'Green Scholar Fund Donation',
      description: 'Supporting school uniforms',
      amount: 0.00,
      date: '2024-01-28',
      time: '16:45',
      icon: Heart,
      beneficiaries: 0
    },
    {
      id: 4,
      type: 'earning',
      title: 'Recycling Credit',
      description: '8.1 kg mixed recyclables',
      amount: 0.00,
      date: '2024-01-27',
      time: '11:20',
      icon: Recycle,
      impact: '0.0 kg CO₂ saved'
    },
    {
      id: 5,
      type: 'earning',
      title: 'Bonus Credit',
      description: 'Weekly recycling goal achieved',
      amount: 0.00,
      date: '2024-01-26',
      time: '18:00',
      icon: Recycle,
      impact: 'Bonus reward'
    },
    {
      id: 6,
      type: 'reward',
      title: 'Woolworths Discount Used',
      description: '10% off grocery purchase',
      amount: 0.00,
      date: '2024-01-25',
      time: '13:10',
      icon: Gift,
      points: 0
    },
  ];

  const filteredTransactions = transactions.filter(transaction => 
    filter === 'all' || 
    (filter === 'earnings' && transaction.type === 'earning') ||
    (filter === 'rewards' && transaction.type === 'reward') ||
    (filter === 'donations' && transaction.type === 'donation')
  );

  const totalEarnings = transactions
    .filter(t => t.type === 'earning')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter(t => t.type !== 'earning')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const getTransactionIcon = (transaction: any) => {
    const Icon = transaction.icon;
    const isPositive = transaction.amount > 0;
    
    return (
      <div className={`p-2 rounded-lg ${
        transaction.type === 'earning' ? 'bg-success/20' :
        transaction.type === 'reward' ? 'bg-primary/20' :
        'bg-accent/20'
      }`}>
        <Icon className={`h-5 w-5 ${
          transaction.type === 'earning' ? 'text-success' :
          transaction.type === 'reward' ? 'text-primary' :
          'text-accent'
        }`} />
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="pb-20 p-4 space-y-6 bg-gradient-warm min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground">Track your recycling journey and impact</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <ArrowUpRight className="h-6 w-6 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-lg font-bold text-success">R {totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <ArrowDownRight className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Used</p>
                <p className="text-lg font-bold text-primary">R {totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by type:</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs"
            >
              All
            </Button>
            <Button
              variant={filter === 'earnings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('earnings')}
              className="text-xs"
            >
              Earnings
            </Button>
            <Button
              variant={filter === 'rewards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('rewards')}
              className="text-xs"
            >
              Rewards
            </Button>
            <Button
              variant={filter === 'donations' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('donations')}
              className="text-xs"
            >
              Donations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.id} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getTransactionIcon(transaction)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">{transaction.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          transaction.type === 'earning' ? 'border-success text-success' :
                          transaction.type === 'reward' ? 'border-primary text-primary' :
                          'border-accent text-accent'
                        }`}
                      >
                        {transaction.type === 'earning' ? 'Earning' :
                         transaction.type === 'reward' ? 'Reward' : 'Donation'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{transaction.description}</p>
                    
                    {transaction.impact && (
                      <p className="text-xs text-success font-medium">{transaction.impact}</p>
                    )}
                    {transaction.points && (
                      <p className="text-xs text-primary font-medium">{transaction.points} points used</p>
                    )}
                    {transaction.beneficiaries && (
                      <p className="text-xs text-accent font-medium">Helped {transaction.beneficiaries} learner(s)</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.amount > 0 ? 'text-success' : 'text-foreground'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}R {Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(transaction.date)}</span>
                    <span>{transaction.time}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <Card className="shadow-card border-dashed border-muted-foreground/30">
        <CardContent className="p-4 text-center">
          <Button variant="outline" size="sm">
            Load More Transactions
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Showing {filteredTransactions.length} of 47 transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default History;