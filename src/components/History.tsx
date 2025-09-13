import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Recycle, Gift, Heart, Calendar, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UnifiedWalletService } from "@/lib/unifiedWalletService";
import { WorkingWalletService } from "@/lib/workingWalletService";

const History = () => {
  const [filter, setFilter] = useState<'all' | 'earnings' | 'rewards' | 'withdrawals'>('all');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        // Use the new WorkingWalletService to get transaction history from approved collections
        const tx = await WorkingWalletService.getTransactionHistory(user.id);
        setTransactions(tx || []);
      } catch (error) {
        console.error('Error loading transaction history:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const mapType = (t: any) => {
    const tt = (t.transaction_type || t.source_type || '').toLowerCase();
    if (tt.includes('withdraw') || tt.includes('payout')) return 'withdrawal';
    if (tt.includes('reward')) return 'reward';
    if (tt.includes('donation')) return 'donation';
    if (tt.includes('collection')) return 'earning';
    return (Number(t.amount) || 0) >= 0 ? 'earning' : 'withdrawal';
  };

  const filteredTransactions = transactions.filter(t => {
    const type = mapType(t);
    return filter === 'all' ||
      (filter === 'earnings' && type === 'earning') ||
      (filter === 'rewards' && type === 'reward') ||
      (filter === 'withdrawals' && type === 'withdrawal');
  });

  const totalEarnings = filteredTransactions
    .filter(t => mapType(t) === 'earning')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalSpent = filteredTransactions
    .filter(t => mapType(t) !== 'earning')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

  // Calculate net balance (earnings minus spending)
  const netBalance = totalEarnings - totalSpent;

  const getTransactionIcon = (t: any) => {
    const type = mapType(t);
    const Wrapper = ({ children }: any) => (
      <div className={`p-2 rounded-lg ${
        type === 'earning' ? 'bg-success/20' :
        type === 'reward' ? 'bg-primary/20' :
        type === 'donation' ? 'bg-accent/20' : 'bg-primary/10'
      }`}>{children}</div>
    );
    if (type === 'earning') return <Wrapper><Recycle className="h-5 w-5 text-success" /></Wrapper>;
    if (type === 'reward') return <Wrapper><Gift className="h-5 w-5 text-primary" /></Wrapper>;
    if (type === 'donation') return <Wrapper><Heart className="h-5 w-5 text-accent" /></Wrapper>;
    return <Wrapper><ArrowDownRight className="h-5 w-5 text-primary" /></Wrapper>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  };
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="pb-20 p-4 space-y-6 bg-gradient-warm min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground">Track your recycling journey and impact</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <ArrowUpRight className="h-6 w-6 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-lg font-bold text-success">R {netBalance.toFixed(2)}</p>
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

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Recycle className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-lg font-bold text-blue-600">R {totalEarnings.toFixed(2)}</p>
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
          <div className="grid grid-cols-5 gap-2">
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
              variant={filter === 'withdrawals' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('withdrawals')}
              className="text-xs"
            >
              Withdrawals
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-3">
        {!loading && filteredTransactions.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No transactions to show yet.
            </CardContent>
          </Card>
        )}
        {(loading ? [] : filteredTransactions).map((transaction) => {
          const collectionId = transaction.reference || transaction.id;
          return (
          <Card key={transaction.id} className="shadow-card">
            <CardContent className="p-4" onClick={() => {
              if (collectionId) {
                try {
                  window.location.href = `/collections/${collectionId}`;
                } catch {}
              }
            }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getTransactionIcon(transaction)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">{(transaction.description || transaction.transaction_type || transaction.source_type || 'Transaction')}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          mapType(transaction) === 'earning' ? 'border-success text-success' :
                          mapType(transaction) === 'reward' ? 'border-primary text-primary' :
                          mapType(transaction) === 'donation' ? 'border-accent text-accent' : 'border-primary text-primary'
                        }`}
                      >
                        {mapType(transaction) === 'earning' ? 'Earning' :
                         mapType(transaction) === 'reward' ? 'Reward' :
                         mapType(transaction) === 'donation' ? 'Donation' : 'Withdrawal'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {transaction.material_type ? `${transaction.material_type}` : ''}
                      {transaction.kgs ? `${transaction.material_type ? ' • ' : ''}${Number(transaction.kgs).toFixed(1)} kg` : ''}
                      {transaction.amount && transaction.kgs ? ` • R${(Number(transaction.amount) / Number(transaction.kgs)).toFixed(2)}/kg` : ''}
                    </p>
                    {(transaction.reference_code || transaction.reference) && (
                      <p className="text-xs text-muted-foreground break-all">
                        {transaction.reference_code ? `Collection ${transaction.reference_code}` : `Collection ID ${transaction.reference}`}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold ${
                    (Number(transaction.amount) || 0) > 0 ? 'text-success' : 'text-foreground'
                  }`}>
                    {(Number(transaction.amount) || 0) > 0 ? '+' : ''}R {Math.abs(Number(transaction.amount) || 0).toFixed(2)}
                  </p>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(transaction.approved_at || transaction.created_at)}</span>
                    <span>{formatTime(transaction.approved_at || transaction.created_at)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );})}
      </div>

      {/* Load More */}
      <Card className="shadow-card border-dashed border-muted-foreground/30">
        <CardContent className="p-4 text-center">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading transactions...</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default History;