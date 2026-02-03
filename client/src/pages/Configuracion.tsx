import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/store";

function normalize(url: string) {
  return url.trim().replace(/\/+$/, "");
}

export default function ConfiguracionPage() {
  const { state, dispatch } = useAppStore();
  const { toast } = useToast();
  const [value, setValue] = React.useState(state.apiBaseUrl || "");

  const envUrl = ((import.meta as any).env?.VITE_API_BASE_URL || "").trim();

  return (
    <AppShell title="Configuración">
      <div className="grid gap-4">
        <Card className="shadow-sm rounded-3xl border-none bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">API Red Local</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="text-xs font-medium text-muted-foreground leading-relaxed">
              Configura la IP y el puerto de tu servidor en la LAN.
            </div>

            <div className="grid gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1" htmlFor="apiBaseUrl">
                URL del Servidor
              </label>
              <Input
                id="apiBaseUrl"
                className="h-12 rounded-2xl bg-background border-none font-bold"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="http://192.168.1.XX:8080"
                data-testid="input-api-base-url"
              />
              <div className="text-[10px] font-bold text-primary px-1">
                ACTUAL: {state.apiBaseUrl || "SIN CONFIGURAR"}
              </div>
            </div>

            {envUrl && (
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary uppercase">
                Vía Entorno: {envUrl}
              </div>
            )}

            <div className="grid gap-2">
              <Button
                className="h-12 rounded-2xl font-black uppercase tracking-tighter"
                onClick={() => {
                  const normalized = normalize(value);
                  dispatch({ type: "API_BASE_URL_SET", apiBaseUrl: normalized });
                  toast({ title: "Guardado", description: "Configuración actualizada." });
                }}
                data-testid="button-save-api-base-url"
              >
                Guardar Cambios
              </Button>
              <Button
                variant="secondary"
                className="h-12 rounded-2xl font-bold text-xs uppercase opacity-70"
                onClick={() => {
                  dispatch({ type: "API_BASE_URL_SET", apiBaseUrl: "" });
                  setValue("");
                  toast({ title: "Restaurado", description: "Usando valor de entorno." });
                }}
                data-testid="button-clear-api-base-url"
              >
                Limpiar Custom URL
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-3xl border-none bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Mantenimiento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-xs font-medium text-muted-foreground">Limpia el estado local si experimentas errores tras un cambio de API.</p>
            <Button
              variant="destructive"
              className="h-12 rounded-2xl font-black uppercase tracking-tighter bg-destructive/10 text-destructive hover:bg-destructive/20 border-none shadow-none"
              onClick={() => {
                dispatch({ type: "CLIENT_SET", client: null });
                dispatch({ type: "CART_CLEAR" });
                toast({ title: "Limpiado", description: "Estado reseteado." });
              }}
              data-testid="button-clear-client-cart"
            >
              Resetear Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
