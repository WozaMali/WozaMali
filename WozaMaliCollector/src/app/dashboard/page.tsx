"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import { 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign,
  Calendar,
  MapPin
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const displayName = useMemo(() => {
    const anyUser = user as unknown as { first_name?: string; user_metadata?: { first_name?: string } ; email?: string } | null;
    return (
      anyUser?.first_name || anyUser?.user_metadata?.first_name || anyUser?.email?.split('@')[0] || 'User'
    );
  }, [user]);
  const [recentPickups, setRecentPickups] = useState<Array<{
    id: string;
    customer: string;
    address: string;
    time: string;
    status: string;
    totalKg?: number;
  }>>([]);

  const [stats, setStats] = useState({
    todayPickups: 0,
    totalCustomers: 0,
    collectionRate: 0
  });

  const [loading, setLoading] = useState(true);

  const formatTime = (isoOrTime?: string | null) => {
    if (!isoOrTime) return "";
    try {
      // If only time provided (HH:mm:ss), show HH:mm
      if (/^\d{2}:\d{2}/.test(isoOrTime)) {
        return isoOrTime.slice(0, 5);
      }
      const d = new Date(isoOrTime);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const statsData = useMemo(() => ([
    {
      title: "Today's Pickups",
      value: stats.todayPickups.toString(),
      change: "",
      icon: Package,
      color: "text-blue-500"
    },
    {
      title: "Active Users",
      value: stats.totalCustomers.toString(),
      change: "",
      icon: Users,
      color: "text-green-500"
    },
    {
      title: "Collection Rate",
      value: `${stats.collectionRate.toFixed(1)}%`,
      change: "",
      icon: TrendingUp,
      color: "text-purple-500"
    }
  ]), [stats]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      
      try {
        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Fetch stats data
        const [
          { data: todayPickupsData, error: todayPickupsError },
          { data: totalCustomersData, error: totalCustomersError },
          { data: recentPickupsData, error: recentPickupsError }
        ] = await Promise.all([
          // Today's pickups count
          supabase
            .from('unified_collections')
            .select('id', { count: 'exact' })
            .gte('created_at', startOfDay.toISOString())
            .lt('created_at', endOfDay.toISOString())
            .eq('collector_id', user.id),
          
          // Total customers count - active users only
          supabase
            .from('users')
            .select('id, first_name, last_name, email, phone, role_id, status, created_at')
            .eq('role_id', '8d5db8bb-52a3-4865-bb18-e1805249c4a2') // resident role
            .eq('status', 'active'), // only active users
          
          // Recent pickups
          supabase
            .from('unified_collections')
            .select('id, customer_name, pickup_address, actual_time, status, total_weight_kg, created_at, collector_id, created_by')
            .eq('collector_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        if (!isMounted) return;

        // Calculate stats
        const todayPickups = todayPickupsData?.length || 0;
        const totalCustomers = totalCustomersData?.length || 0;
        
        // Calculate collection rate based on recent activities (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: recentActivitiesData } = await supabase
          .from('unified_collections')
          .select('status')
          .eq('collector_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString());
        
        const totalRecent = recentActivitiesData?.length || 0;
        const completedRecent = recentActivitiesData?.filter(item => item.status === 'completed').length || 0;
        const collectionRate = totalRecent > 0 ? (completedRecent / totalRecent) * 100 : 0;

        setStats({
          todayPickups,
          totalCustomers,
          collectionRate
        });

        // Map recent pickups
        const mapped = (recentPickupsData || []).map((row) => ({
          id: row.id,
          customer: row.customer_name || 'Customer',
          address: row.pickup_address || '',
          time: formatTime(row.actual_time || row.created_at),
          status: (row.status || '').replace('_', ' ').replace(/^./, (s: string) => s.toUpperCase()),
          totalKg: typeof row.total_weight_kg === 'number' ? row.total_weight_kg : (row.total_weight_kg ? Number(row.total_weight_kg) : undefined),
        }));
        setRecentPickups(mapped);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    // Subscribe to realtime changes to keep list fresh
    const channel = supabase.channel('unified_collections_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unified_collections' }, () => {
        load();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/w%20yellow.png" 
              alt="WozaMali Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {displayName}!</p>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            <span className="text-gray-300 text-sm">
              {(user as any)?.areas?.name ?? "Area not assigned"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">
                      {loading ? (
                        <div className="animate-pulse bg-gray-600 h-8 w-16 rounded"></div>
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="text-green-400 text-xs">{stat.change}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Pickups */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Recent Pickups</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {recentPickups.map((pickup) => (
              <div key={pickup.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{pickup.customer}</p>
                  <p className="text-gray-400 text-sm">{pickup.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-300 text-sm">{pickup.time}</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    pickup.status.toLowerCase().includes('complete')
                      ? 'bg-green-100 text-green-800'
                      : pickup.status.toLowerCase().includes('progress')
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {pickup.status}
                  </span>
                  {typeof pickup.totalKg === 'number' && (
                    <p className="text-blue-400 text-sm mt-1 font-medium">{pickup.totalKg.toFixed(2)} kg</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
}
