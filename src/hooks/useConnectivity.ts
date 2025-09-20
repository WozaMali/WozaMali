"use client";

import { useCallback, useEffect, useState } from 'react';

export interface ConnectivityState {
  isOnline: boolean;
  lastChangeAt: number;
  checkNow: () => boolean;
}

export function useConnectivity(): ConnectivityState {
  const initialOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [isOnline, setIsOnline] = useState<boolean>(initialOnline);
  const [lastChangeAt, setLastChangeAt] = useState<number>(Date.now());

  const updateState = useCallback((online: boolean) => {
    setIsOnline(online);
    setLastChangeAt(Date.now());
  }, []);

  useEffect(() => {
    const onOnline = () => updateState(true);
    const onOffline = () => updateState(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [updateState]);

  const checkNow = useCallback(() => {
    if (typeof navigator === 'undefined') return true;
    const online = navigator.onLine;
    updateState(online);
    return online;
  }, [updateState]);

  return { isOnline, lastChangeAt, checkNow };
}


