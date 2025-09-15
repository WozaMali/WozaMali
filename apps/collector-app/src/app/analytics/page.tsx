"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp,
  Calendar,
  Package,
  DollarSign,
  Leaf,
  Target,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Users,
  Settings
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function CollectorAnalyticsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalKg: 0,
    totalPoints: 0,
    totalEarnings: 0,
    monthlyCollections: 0,
    monthlyKg: 0,
    monthlyPoints: 0,
    monthlyEarnings: 0,
    weeklyCollections: 0,
    weeklyKg: 0,
    weeklyPoints: 0,
    weeklyEarnings: 0
  });

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, timeRange]);

  // Realtime refresh: listen on unified_collections for this collector
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('realtime-unified-collections-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unified_collections', filter: `collector_id=eq.${user.id}` }, () => {
        loadAnalyticsData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unified_collections', filter: `created_by=eq.${user.id}` }, () => {
        loadAnalyticsData();
      })
      .subscribe();

    return () => {
      try { channel.unsubscribe(); } catch {}
    };
  }, [user?.id, timeRange]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
    }
  }, [user]);

  // Redirect non-collectors to unauthorized page
  useEffect(() => {
    if (user && user.role && 
        user.role !== 'collector' && user.role !== 'admin' &&
        user.role !== 'COLLECTOR' && user.role !== 'ADMIN') {
      window.location.href = '/unauthorized';
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      if (!user) return;
      
      // Get real analytics data from unified collections
      const { data: collections, error } = await supabase
        .from('unified_collections')
        .select('*')
        .or(`collector_id.eq.${user.id},and(collector_id.is.null,created_by.eq.${user.id})`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching collections:', error);
        return;
      }

      // Calculate real statistics
      const now = new Date();
      const currentWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalCollections = collections.filter(c => c.status === 'approved' || c.status === 'completed').length;
      const totalKg = collections
        .filter(c => c.status === 'approved' || c.status === 'completed')
        .reduce((sum, c) => sum + (c.total_weight_kg || 0), 0);
      const totalEarnings = totalKg * 5; // R5 per kg

      const monthlyCollections = collections.filter(c => 
        new Date(c.created_at) >= currentMonth && 
        (c.status === 'approved' || c.status === 'completed')
      ).length;
      const monthlyKg = collections
        .filter(c => new Date(c.created_at) >= currentMonth && (c.status === 'approved' || c.status === 'completed'))
        .reduce((sum, c) => sum + (c.total_weight_kg || 0), 0);
      const monthlyEarnings = monthlyKg * 5;

      const weeklyCollections = collections.filter(c => 
        new Date(c.created_at) >= currentWeek && 
        (c.status === 'approved' || c.status === 'completed')
      ).length;
      const weeklyKg = collections
        .filter(c => new Date(c.created_at) >= currentWeek && (c.status === 'approved' || c.status === 'completed'))
        .reduce((sum, c) => sum + (c.total_weight_kg || 0), 0);
      const weeklyEarnings = weeklyKg * 5;

      const realStats = {
        totalCollections,
        totalKg,
        totalPoints: totalKg, // 1kg = 1 point
        totalEarnings,
        monthlyCollections,
        monthlyKg,
        monthlyPoints: monthlyKg, // 1kg = 1 point
        monthlyEarnings,
        weeklyCollections,
        weeklyKg,
        weeklyPoints: weeklyKg, // 1kg = 1 point
        weeklyEarnings
      };

      setStats(realStats);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStats = () => {
    switch (timeRange) {
      case 'week':
        return {
          collections: Math.floor(stats.weeklyCollections),
          kg: Math.floor(stats.weeklyKg),
          points: Math.floor(stats.weeklyPoints),
          earnings: Math.floor(stats.weeklyEarnings)
        };
      case 'month':
        return {
          collections: stats.monthlyCollections,
          kg: stats.monthlyKg,
          points: stats.monthlyPoints,
          earnings: stats.monthlyEarnings
        };
      case 'year':
        return {
          collections: stats.totalCollections,
          kg: stats.totalKg,
          points: stats.totalPoints,
          earnings: stats.totalEarnings
        };
      default:
        return {
          collections: stats.monthlyCollections,
          kg: stats.monthlyKg,
          points: stats.monthlyPoints,
          earnings: stats.monthlyEarnings
        };
    }
  };

  const currentStats = getCurrentStats();

  // Show loading while checking authentication
  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-gray-300">Track your collection performance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadAnalyticsData} className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Collections</CardTitle>
            <Package className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{currentStats.collections}</div>
            <p className="text-xs text-gray-400">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Weight Collected</CardTitle>
            <Target className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{currentStats.kg.toFixed(1)} kg</div>
            <p className="text-xs text-gray-400">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Points Earned</CardTitle>
            <Leaf className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{currentStats.points}</div>
            <p className="text-xs text-gray-400">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">98%</div>
            <p className="text-xs text-gray-400">
              {timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'Total'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              Performance Trends
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your collection performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Daily Average Collections</span>
                <span className="text-sm text-gray-400">
                  {timeRange === 'week' ? (stats.weeklyCollections / 7).toFixed(1) : 
                   timeRange === 'month' ? (stats.monthlyCollections / 30).toFixed(1) : 
                   (stats.totalCollections / 365).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Daily Average Weight</span>
                <span className="text-sm text-gray-400">
                  {timeRange === 'week' ? (stats.weeklyKg / 7).toFixed(1) : 
                   timeRange === 'month' ? (stats.monthlyKg / 30).toFixed(1) : 
                   (stats.totalKg / 365).toFixed(1)} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Efficiency Rate</span>
                <span className="text-sm text-gray-400">
                  {((currentStats.collections / Math.max(currentStats.collections, 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-yellow-400" />
              Environmental Impact
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your contribution to sustainability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">CO₂ Saved</span>
                <span className="text-sm text-gray-400">
                  {(currentStats.kg * 2.5).toFixed(1)} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Water Saved</span>
                <span className="text-sm text-gray-400">
                  {(currentStats.kg * 3.5).toFixed(1)} liters
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Trees Equivalent</span>
                <span className="text-sm text-gray-400">
                  {(currentStats.kg / 22).toFixed(1)} trees
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-800 border-gray-700 text-white hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-orange-400" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your latest collection activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Collection completed</span>
              </div>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">New customer added</span>
              </div>
              <span className="text-sm text-gray-400">1 day ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Pickup scheduled</span>
              </div>
              <span className="text-sm text-gray-400">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Navigation />
    </div>
  );
}
