"use client";

import { useEffect, useMemo, useState } from "react";
import { Reward, getActiveRewards } from "@/lib/rewardsService";

interface NewRewardModalProps {
  storageKey?: string;
}

export default function NewRewardModal({ storageKey = "wm:new-reward:lastSeenId" }: NewRewardModalProps) {
  const [open, setOpen] = useState(false);
  const [latest, setLatest] = useState<Reward | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await getActiveRewards();
        if (cancelled) return;
        const sorted = (data || []).slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const newest = sorted[0] || null;
        setLatest(newest || null);
        if (newest) {
          const lastSeenId = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
          if (!lastSeenId || lastSeenId !== newest.id) {
            setOpen(true);
          }
        }
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [storageKey]);

  const hasRedeem = useMemo(() => typeof (latest as any)?.redeem_url === 'string' && ((latest as any)?.redeem_url || '').trim().length > 0, [latest]);
  const hasOrder = useMemo(() => typeof (latest as any)?.order_url === 'string' && ((latest as any)?.order_url || '').trim().length > 0, [latest]);

  if (!open || !latest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => {
        try { if (latest?.id) window.localStorage.setItem(storageKey, latest.id); } catch {}
        setOpen(false);
      }} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[90%] max-w-sm overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            {((latest as any).logo_url) ? (
              <img src={(latest as any).logo_url as unknown as string} alt={latest.name} className="h-12 w-12 rounded object-contain bg-white" />
            ) : (
              <div className="h-12 w-12 rounded bg-yellow-500" />
            )}
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">New Reward Available</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{latest.name}</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">{latest.description || 'Check out this new reward!'}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {hasRedeem && (
              <a
                href={(latest as any).redeem_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-semibold shadow hover:from-emerald-700 hover:to-emerald-800"
                onClick={() => { try { if (latest?.id) window.localStorage.setItem(storageKey, latest.id); } catch {} }}
              >
                Redeem Now
              </a>
            )}
            {hasOrder && (
              <a
                href={(latest as any).order_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold shadow hover:from-blue-700 hover:to-blue-800"
                onClick={() => { try { if (latest?.id) window.localStorage.setItem(storageKey, latest.id); } catch {} }}
              >
                Order Now
              </a>
            )}
          </div>
          <button
            className="mt-3 w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => { try { if (latest?.id) window.localStorage.setItem(storageKey, latest.id); } catch {} ; setOpen(false); }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}


