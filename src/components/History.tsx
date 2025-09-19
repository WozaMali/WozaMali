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
    <div className="pb-24 px-2 py-3 space-y-3 bg-gradient-warm dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header - Ultra Mobile Optimized */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
          Transaction History
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Track your recycling journey and impact</p>
      </div>

      {/* Summary Cards - Ultra Mobile Optimized */}
      <div className="grid grid-cols-3 gap-1">
        <Card className="card-modern">
          <CardContent className="p-2">
            <div className="text-center">
              <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-lg flex items-center justify-center mx-auto mb-1">
                <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Balance</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">R {netBalance.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-2">
            <div className="text-center">
              <div className="w-6 h-6 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-lg flex items-center justify-center mx-auto mb-1">
                <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Used</p>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">R {totalSpent.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="p-2">
            <div className="text-center">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Recycle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Earned</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">R {totalEarnings.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons - Ultra Mobile Optimized */}
      <Card className="card-modern">
        <CardContent className="p-3">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 rounded-lg">
              <Filter className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Filter Transactions</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={`h-8 text-xs ${filter === 'all' ? 'btn-primary-yellow' : 'btn-outline-modern'}`}
            >
              <Recycle className="h-3 w-3 mr-1" />
              All
            </Button>
            <Button
              variant={filter === 'earnings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('earnings')}
              className={`h-8 text-xs ${filter === 'earnings' ? 'btn-primary-yellow' : 'btn-outline-modern'}`}
            >
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Earnings
            </Button>
            <Button
              variant={filter === 'rewards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('rewards')}
              className={`h-8 text-xs ${filter === 'rewards' ? 'btn-primary-yellow' : 'btn-outline-modern'}`}
            >
              <Gift className="h-3 w-3 mr-1" />
              Rewards
            </Button>
            <Button
              variant={filter === 'withdrawals' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('withdrawals')}
              className={`h-8 text-xs ${filter === 'withdrawals' ? 'btn-primary-yellow' : 'btn-outline-modern'}`}
            >
              <ArrowDownRight className="h-3 w-3 mr-1" />
              Withdrawals
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List - Ultra Mobile Optimized */}
      <div className="space-y-2">
        {!loading && filteredTransactions.length === 0 && (
          <Card className="card-modern">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <Recycle className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No Transactions Yet</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Your transaction history will appear here</p>
            </CardContent>
          </Card>
        )}
        {(loading ? [] : filteredTransactions).map((transaction) => {
          const collectionId = transaction.reference || transaction.id;
          const type = mapType(transaction);
          return (
          <Card key={transaction.id} className="card-modern hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => {
            if (collectionId) {
              try {
                window.location.href = `/collections/${collectionId}`;
              } catch {}
            }
          }}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${
                    type === 'earning' ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40' :
                    type === 'reward' ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40' :
                    type === 'donation' ? 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40' : 
                    'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40'
                  }`}>
                    {type === 'earning' && <Recycle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    {type === 'reward' && <Gift className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    {type === 'donation' && <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                    {type === 'withdrawal' && <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {(transaction.description || transaction.transaction_type || transaction.source_type || 'Transaction')}
                      </h4>
                      <Badge 
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          type === 'earning' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                          type === 'reward' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                          type === 'donation' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' : 
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                        }`}
                      >
                        {type === 'earning' ? 'Earning' :
                         type === 'reward' ? 'Reward' :
                         type === 'donation' ? 'Donation' : 'Withdrawal'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-0.5">
                      {transaction.material_type && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Material:</span> {transaction.material_type}
                        </p>
                      )}
                      {transaction.kgs && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Weight:</span> {Number(transaction.kgs).toFixed(1)} kg
                        </p>
                      )}
                      {transaction.amount && transaction.kgs && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Rate:</span> R{(Number(transaction.amount) / Number(transaction.kgs)).toFixed(2)}/kg
                        </p>
                      )}
                      {(transaction.reference_code || transaction.reference) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.reference_code ? `Collection ${transaction.reference_code}` : `Collection ID ${transaction.reference}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    (Number(transaction.amount) || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(Number(transaction.amount) || 0) > 0 ? '+' : ''}R {Math.abs(Number(transaction.amount) || 0).toFixed(2)}
                  </p>
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(transaction.approved_at || transaction.created_at)}</span>
                    <span>•</span>
                    <span>{formatTime(transaction.approved_at || transaction.created_at)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );})}
      </div>

      {/* Load More - Ultra Mobile Optimized */}
      <Card className="card-modern border-dashed border-gray-300 dark:border-gray-600">
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          {loading ? (
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Loading Transactions...</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Please wait while we fetch your data</p>
            </div>
          ) : (
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transaction Summary</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default History;