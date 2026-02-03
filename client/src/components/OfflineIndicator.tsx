import * as React from "react";
import { WifiIcon, WifiOffIcon, CloudIcon, Loader2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePendingVentas } from "@/hooks/useOffline";
import { useToast } from "@/hooks/use-toast";

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, syncNow } = usePendingVentas();
  const { toast } = useToast();

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

  return (
    <div className="flex items-center gap-2" data-testid="offline-indicator">
      {isOnline ? (
        <Badge variant="outline" className="gap-1 text-green-600 border-green-600/30 bg-green-50 dark:bg-green-950/30">
          <WifiIcon className="h-3 w-3" />
          <span className="text-[10px] font-bold">Online</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600/30 bg-orange-50 dark:bg-orange-950/30">
          <WifiOffIcon className="h-3 w-3" />
          <span className="text-[10px] font-bold">Offline</span>
        </Badge>
      )}

      {pendingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1 text-xs font-bold"
          onClick={handleSync}
          disabled={isSyncing || !isOnline}
          data-testid="button-sync-pending"
        >
          {isSyncing ? (
            <Loader2Icon className="h-3 w-3 animate-spin" />
          ) : (
            <CloudIcon className="h-3 w-3" />
          )}
          <span className="text-primary">{pendingCount}</span>
          <span className="hidden sm:inline">pendiente{pendingCount !== 1 ? "s" : ""}</span>
        </Button>
      )}
    </div>
  );
}
