import { useState, useEffect, useCallback, useRef } from "react";
import { syncPendingVentas, getPendingVentasCount } from "@/services/ventas";
import { getLastSyncTime, clearBootstrapCache } from "@/services/offlineCache";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wasOffline = useRef(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      if (wasOffline.current) {
        wasOffline.current = false;
        window.dispatchEvent(new CustomEvent('app:reconnected'));
      }
    }
    function handleOffline() {
      setIsOnline(false);
      wasOffline.current = true;
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function useReconnectRefresh(onReconnect: () => void) {
  useEffect(() => {
    const handler = () => {
      clearBootstrapCache();
      onReconnect();
    };
    window.addEventListener('app:reconnected', handler);
    return () => window.removeEventListener('app:reconnected', handler);
  }, [onReconnect]);
}

export function usePendingVentas() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const refreshCount = useCallback(() => {
    setPendingCount(getPendingVentasCount());
    setLastSync(getLastSyncTime());
  }, []);

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 5000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  const syncNow = useCallback(async () => {
    if (isSyncing || !isOnline) return { synced: 0, failed: 0 };
    
    setIsSyncing(true);
    try {
      const result = await syncPendingVentas();
      refreshCount();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, refreshCount]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      syncNow();
    }
  }, [isOnline, pendingCount, isSyncing, syncNow]);

  return {
    pendingCount,
    isSyncing,
    syncNow,
    lastSync,
    isOnline,
  };
}
