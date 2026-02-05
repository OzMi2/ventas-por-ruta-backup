import * as React from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/SearchInput";
import { BoxesIcon, ArrowRightIcon } from "lucide-react";
import { fetchClientes } from "@/services/clientes";
import { useAppStore } from "@/store/store";
import type { Cliente } from "@/store/types";

function mapCliente(raw: any, idx: number): Cliente {
  const id = raw?.id ?? raw?.cliente_id ?? idx;
  return {
    id: String(id),
    nombre: String(raw?.nombre ?? raw?.razon_social ?? raw?.cliente ?? `Cliente ${idx + 1}`),
    saldo:
      raw?.saldo != null
        ? Number(raw.saldo)
        : raw?.saldo_anterior != null
          ? Number(raw.saldo_anterior)
          : undefined,
  };
}

export default function ClientesPage() {
  const [, navigate] = useLocation();
  const { state, dispatch } = useAppStore();
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Cliente[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data: any = await fetchClientes();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setRows(list.map(mapCliente));
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los clientes.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((c) => c.nombre.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <AppShell title="Seleccionar cliente">
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente..." testId="search-clientes" />
          </div>
          <Button onClick={load} variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-xl" data-testid="button-refresh-clientes">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive" className="rounded-2xl" data-testid="alert-clientes-error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription data-testid="text-clientes-error">{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="grid gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 rounded-2xl" data-testid={`card-cliente-skeleton-${i}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center rounded-3xl bg-muted/20 border-dashed" data-testid="empty-clientes">
            <div className="text-sm font-bold">Sin clientes</div>
            <div className="mt-1 text-xs text-muted-foreground font-medium">
              {rows.length === 0 ? "No llegaron datos del API." : "No hay coincidencias."}
            </div>
          </Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map((c) => (
              <Card
                key={c.id}
                className={`p-3 shadow-sm active:scale-[0.98] transition-transform border-none flex items-center justify-between gap-3 rounded-2xl ${
                  state.selectedClient?.id === c.id ? "bg-primary/10 ring-1 ring-primary" : "bg-card/60"
                }`}
                data-testid={`card-cliente-${c.id}`}
                onClick={() => {
                  if (state.selectedClient?.id === c.id) {
                    dispatch({ type: "CLIENT_SET", client: null });
                  } else {
                    dispatch({ type: "CLIENT_SET", client: c });
                  }
                }}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold" data-testid={`text-cliente-nombre-${c.id}`}>
                    {c.nombre}
                  </div>
                  <div className={`mt-0.5 text-[11px] font-bold ${c.saldo && c.saldo > 0 ? "text-destructive" : "text-muted-foreground"}`} data-testid={`text-cliente-saldo-${c.id}`}>
                    SALDO: {c.saldo != null ? `$${Number(c.saldo).toFixed(2)}` : "$0.00"}
                  </div>
                </div>
                <div className="shrink-0">
                  {state.selectedClient?.id === c.id ? (
                    <Badge className="rounded-full h-6 px-2 text-[10px] font-black uppercase tracking-tighter">LISTO</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 rounded-full text-[11px] font-black uppercase px-4 bg-background shadow-sm border-none"
                      data-testid={`button-select-cliente-${c.id}`}
                    >
                      Elegir
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {state.selectedClient ? (
          <div className="fixed bottom-[72px] sm:bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4">
            <div className="rounded-2xl shadow-xl border-primary/20 bg-primary text-primary-foreground p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Cliente</div>
                  <div className="text-sm font-bold truncate">{state.selectedClient.nombre}</div>
                </div>
                <Button
                  onClick={() => navigate("/productos")}
                  className="shrink-0 bg-white/20 hover:bg-white/30 text-white border-none h-9 px-3 rounded-xl font-bold text-xs"
                  data-testid="button-go-inventory"
                >
                  <BoxesIcon className="h-4 w-4 mr-1" />
                  Inventario
                  <ArrowRightIcon className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
