"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, MapPin, Clock, Weight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type UnifiedCollection = {
  id: string;
  collection_code: string | null;
  status: string | null;
  total_value: number | null;
  total_weight_kg: number | null;
  weight_kg: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export default function Collections() {
  const navigate = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<UnifiedCollection[]>([]);
  const fetchInProgress = useRef(false);
  const lastFetchAt = useRef(0);

  const load = async () => {
    if (!user?.id || fetchInProgress.current) return;
    fetchInProgress.current = true;
    setError(null);
    if (rows.length === 0) setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('unified_collections')
        .select('id, collection_code, status, total_value, total_weight_kg, weight_kg, created_at, updated_at')
        .eq('customer_id', user.id)
        .in('status', ['approved','completed','pending'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (err) throw err;
      setRows((data as UnifiedCollection[]) || []);
      lastFetchAt.current = Date.now();
    } catch (e: any) {
      setError(e?.message || 'Failed to load collections');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`collections_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unified_collections', filter: `customer_id=eq.${user.id}` }, () => {
        if (!fetchInProgress.current) load();
      })
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, [user?.id]);

  useEffect(() => {
    const maybeRefresh = () => {
      if (document.hidden) return;
      const now = Date.now();
      if (!fetchInProgress.current && now - lastFetchAt.current > 3000) {
        load();
      }
    };
    const onVisibility = () => { if (!document.hidden) maybeRefresh(); };
    window.addEventListener('focus', maybeRefresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', maybeRefresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const type = (event && (event as any).data && (event as any).data.type) || undefined;
      if (type === 'wallet-maybe-updated' && !fetchInProgress.current) load();
    };
    try { navigator.serviceWorker?.addEventListener('message', handler as any); } catch {}
    return () => { try { navigator.serviceWorker?.removeEventListener('message', handler as any); } catch {} };
  }, []);

  const nextItem = useMemo(() => rows.find(r => {
    const d = r.created_at ? new Date(r.created_at) : null;
    return d ? d >= new Date() : false;
  }), [rows]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Collections</h1>
        </div>

        <Card className="bg-gradient-primary text-primary-foreground shadow-warm border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {nextItem ? `Next Collection: ${new Date(nextItem.created_at as any).toLocaleDateString()}` : 'Your Collections'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{nextItem ? new Date(nextItem.created_at as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Weight className="h-4 w-4" />
                <span>{nextItem ? `${Number((nextItem.total_weight_kg ?? nextItem.weight_kg ?? 0)).toFixed(1)} kg` : ''}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Recent Collections</h3>
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {loading && rows.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="p-4 text-sm text-muted-foreground">Loading...</CardContent>
            </Card>
          )}
          {(loading ? rows : rows).map((c) => {
            const isPast = c.created_at ? (new Date(c.created_at) < new Date()) : true;
            return (
              <Card key={c.id} className={`shadow-card ${!isPast ? '' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</span>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded capitalize">{c.status || 'unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Weight className="h-3 w-3" />
                          <span>{Number((c.total_weight_kg ?? c.weight_kg ?? 0)).toFixed(1)} kg</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{c.collection_code || c.id.slice(0, 6)}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => { try { window.location.href = `/collections/${c.id}` } catch {} }}
                      variant={"outline"}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {(!loading && rows.length === 0 && !error) && (
            <Card className="shadow-card">
              <CardContent className="p-4 text-sm text-muted-foreground">No collections yet</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
