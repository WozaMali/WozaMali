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

  const stats = useMemo(() => ([
    {
      title: "Today's Pickups",
      value: "-",
      change: "",
      icon: Package,
      color: "text-blue-500"
    },
    {
      title: "Total Customers",
      value: "-",
      change: "",
      icon: Users,
      color: "text-green-500"
    },
    {
      title: "Earnings Today",
      value: "-",
      change: "",
      icon: DollarSign,
      color: "text-yellow-500"
    },
    {
      title: "Collection Rate",
      value: "-",
      change: "",
      icon: TrendingUp,
      color: "text-purple-500"
    }
  ]), []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      // Fetch latest 5 collections (optionally filter by collector when available)
      const { data, error } = await supabase
        .from('unified_collections')
        .select('id, customer_name, pickup_address, actual_time, status, total_weight_kg, created_at, collector_id, created_by')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!isMounted) return;
      if (error) {
        console.warn('Recent pickups load error:', error);
        return;
      }

      const mapped = (data || []).map((row) => ({
        id: row.id,
        customer: row.customer_name || 'Customer',
        address: row.pickup_address || '',
        time: formatTime(row.actual_time || row.created_at),
        status: (row.status || '').replace('_', ' ').replace(/^./, (s: string) => s.toUpperCase()),
        totalKg: typeof row.total_weight_kg === 'number' ? row.total_weight_kg : (row.total_weight_kg ? Number(row.total_weight_kg) : undefined),
      }));
      setRecentPickups(mapped);
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
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/W yellow.png" 
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
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
