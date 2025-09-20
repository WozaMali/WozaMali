"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useConnectivity } from "@/hooks/useConnectivity";

export default function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  const { isOnline, checkNow } = useConnectivity();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-screen-sm px-3 py-2 bg-red-600 text-white rounded-b-lg shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-xs font-semibold">You're offline. Some data may be missing.</span>
        </div>
        <button
          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded flex items-center space-x-1"
          onClick={() => {
            const online = checkNow();
            if (online && onRetry) onRetry();
          }}
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
}


