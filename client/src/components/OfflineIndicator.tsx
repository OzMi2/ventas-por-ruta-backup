import * as React from "react";
import { WifiIcon, WifiOffIcon, CloudIcon, Loader2Icon, CheckCircle2Icon, RefreshCwIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePendingVentas } from "@/hooks/useOffline";
import { useToast } from "@/hooks/use-toast";

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, syncNow, lastSync } = usePendingVentas();
  const { toast } = useToast();
  const [justSynced, setJustSynced] = React.useState(false);

  async function handleSync() {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No puedes sincronizar sin conexión a internet.",
        variant: "destructive",
      });
      return;
    }

    const result = await syncNow();
    if (result.synced > 0) {
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
      toast({
        title: "Sincronización completada",
        description: `${result.synced} venta(s) sincronizada(s) correctamente.`,
      });
    }
    if (result.failed > 0) {
      toast({
        title: "Error de sincronización",
        description: `${result.failed} venta(s) no pudieron sincronizarse.`,
        variant: "destructive",
      });
    }
  }

  const formatLastSync = () => {
    if (!lastSync) return null;
    try {
      const date = new Date(lastSync);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return "ahora";
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      return `${Math.floor(diffHours / 24)}d`;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex items-center gap-1.5" data-testid="offline-indicator">
      {isOnline ? (
        <Badge variant="outline" className="gap-1 text-green-600 border-green-600/30 bg-green-50 dark:bg-green-950/30 h-7">
          <WifiIcon className="h-3 w-3" />
          <span className="text-[10px] font-bold hidden sm:inline">Online</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600/30 bg-orange-50 dark:bg-orange-950/30 animate-pulse h-7">
          <WifiOffIcon className="h-3 w-3" />
          <span className="text-[10px] font-bold">Offline</span>
        </Badge>
      )}

      {pendingCount > 0 ? (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 gap-1.5 text-xs font-bold border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 animate-pulse"
          onClick={handleSync}
          disabled={isSyncing || !isOnline}
          data-testid="button-sync-pending"
        >
          {isSyncing ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CloudIcon className="h-3.5 w-3.5" />
          )}
          <span className="font-black">{pendingCount}</span>
          <span className="hidden sm:inline">pendiente{pendingCount !== 1 ? "s" : ""}</span>
        </Button>
      ) : justSynced ? (
        <Badge variant="outline" className="gap-1 text-green-600 border-green-600/30 bg-green-50 dark:bg-green-950/30 h-7">
          <CheckCircle2Icon className="h-3 w-3" />
          <span className="text-[10px] font-bold">Sincronizado</span>
        </Badge>
      ) : lastSync ? (
        <Badge 
          variant="outline" 
          className="gap-1 text-muted-foreground border-muted h-7 cursor-pointer hover:bg-muted/50"
          onClick={handleSync}
          data-testid="badge-last-sync"
        >
          <RefreshCwIcon className="h-3 w-3" />
          <span className="text-[10px] font-medium">{formatLastSync()}</span>
        </Badge>
      ) : null}
    </div>
  );
}
