"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type UnifiedRow = {
  id: string;
  collection_code: string | null;
  total_value: number | null;
  total_weight_kg: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type LegacyRow = {
  id: string;
  total_value?: number | null;
  total_kg?: number | null;
  weight_kg?: number | null;
  material_type?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function CollectionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    id: string;
    code?: string | null;
    status?: string | null;
    kgs?: number;
    amount?: number;
    created_at?: string | null;
    updated_at?: string | null;
    source: "unified" | "legacy";
    material_type?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Try unified_collections
        let unified: UnifiedRow | null = null;
        try {
          const { data: uc } = await supabase
            .from("unified_collections")
            .select("id, collection_code, total_value, total_weight_kg, status, created_at, updated_at")
            .eq("id", id)
            .maybeSingle();
          unified = (uc as UnifiedRow) || null;
        } catch (_e) {
          unified = null;
        }

        if (unified) {
          setData({
            id: unified.id,
            code: unified.collection_code || null,
            status: unified.status || null,
            kgs: Number(unified.total_weight_kg || 0),
            amount: Number(unified.total_value || 0),
            created_at: unified.created_at || null,
            updated_at: unified.updated_at || null,
            source: "unified",
          });
          setLoading(false);
          return;
        }

        // 2) Fallback: legacy collections
        let legacy: LegacyRow | null = null;
        try {
          const { data: c } = await supabase
            .from("collections")
            .select("id, total_value, total_kg, weight_kg, material_type, status, created_at, updated_at")
            .eq("id", id)
            .maybeSingle();
          legacy = (c as LegacyRow) || null;
        } catch (_e2) {
          legacy = null;
        }

        if (legacy) {
          const kgs = Number(
            (legacy as any).total_weight_kg ?? legacy.total_kg ?? legacy.weight_kg ?? 0
          );
          setData({
            id: legacy.id,
            code: null,
            status: legacy.status || null,
            kgs,
            amount: Number((legacy.total_value as any) || 0),
            created_at: legacy.created_at || null,
            updated_at: legacy.updated_at || null,
            source: "legacy",
            material_type: legacy.material_type || null,
          });
          setLoading(false);
          return;
        }

        // 3) Final fallback: wallet_update_queue by collection_id
        try {
          const { data: wq, error: queueError } = await supabase
            .from('wallet_update_queue')
            .select('collection_id, email, material, weight_kg, value, status, created_at')
            .eq('collection_id', id)
            .maybeSingle();
          
          // Handle case where table doesn't exist or RLS blocks access
          if (queueError && (queueError.code === '42P01' || queueError.code === '42501')) {
            console.log('Collections page: wallet_update_queue table not accessible, skipping...');
          } else if (!queueError && wq) {
            setData({
              id: wq.collection_id,
              code: null,
              status: wq.status || null,
              kgs: Number(wq.weight_kg || 0),
              amount: Number(wq.value || 0),
              created_at: wq.created_at || null,
              updated_at: wq.created_at || null,
              source: 'wallet_update_queue',
              material_type: wq.material || null,
            });
            setLoading(false);
            return;
          }
        } catch (_e3) {
          console.log('Collections page: Error accessing wallet_update_queue, skipping...');
        }

        setError("Collection not found");
      } catch (e: any) {
        setError(e?.message || "Failed to load collection");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (!id) return null;

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => router.back()}
        className="text-sm text-primary hover:underline"
      >
        ← Back
      </button>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loading && !error && data && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline">{data.status || "unknown"}</Badge>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">ID:</span> {data.id}
              </div>
              {data.code && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Code:</span> {data.code}
                </div>
              )}
              {data.material_type && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Material:</span> {data.material_type}
                </div>
              )}
              <div className="text-sm">
                <span className="text-muted-foreground">Weight:</span> {Number(data.kgs || 0).toFixed(2)} kg
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Amount:</span> R {Number(data.amount || 0).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                <span>Source:</span> {data.source}
              </div>
              <div className="text-xs text-muted-foreground">
                <span>Created:</span> {data.created_at || "-"}
              </div>
              <div className="text-xs text-muted-foreground">
                <span>Updated:</span> {data.updated_at || "-"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


