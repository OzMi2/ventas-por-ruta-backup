import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { RefreshCwIcon, PackageIcon, TruckIcon } from "lucide-react";

interface Movimiento {
  id: number;
  tipo: string;
  productoId: number;
  productoNombre: string;
  cantidad: string;
  rutaId: number | null;
  rutaNombre: string | null;
  usuarioId: number;
  usuarioNombre: string;
  notas: string | null;
  fecha: string;
}

interface Producto {
  id: number;
  nombre: string;
}

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function MovimientosPage() {
  const [loading, setLoading] = React.useState(false);
  const [movimientos, setMovimientos] = React.useState<Movimiento[]>([]);
  const [productos, setProductos] = React.useState<Producto[]>([]);
  
  const [filtroProducto, setFiltroProducto] = React.useState<string>("todos");
  const [filtroFecha, setFiltroFecha] = React.useState<string>("");
  const [filtroTipo, setFiltroTipo] = React.useState<string>("todos");

  async function loadData() {
    setLoading(true);
    try {
      const [movRes, prodRes] = await Promise.all([
        apiClient.getMovimientos(),
        apiClient.getProductos(),
      ]);
      setMovimientos(movRes.movimientos || []);
      setProductos(prodRes.productos || []);
    } catch (e) {
      console.error("Error cargando movimientos:", e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
  }, []);

  const filtered = movimientos.filter((m) => {
    if (filtroProducto !== "todos" && m.productoId !== parseInt(filtroProducto)) return false;
    if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return false;
    if (filtroFecha) {
      const d = new Date(m.fecha);
      const fechaMov = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (fechaMov !== filtroFecha) return false;
    }
    return true;
  });

  return (
    <AppShell title="Movimientos de Stock">
      <div className="grid gap-4">
        <Card className="p-4 rounded-3xl border-none shadow-sm bg-card/60">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground" data-testid="text-movimientos-header">
                  Historial de movimientos
                </div>
                <div className="text-sm font-bold" data-testid="text-movimientos-count">
                  {filtered.length} movimientos
                </div>
              </div>
              <Button 
                variant="secondary" 
                className="h-10 rounded-2xl font-black uppercase text-[10px] gap-2" 
                onClick={loadData}
                disabled={loading}
                data-testid="button-refresh-movimientos"
              >
                <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? "Cargando..." : "Refrescar"}
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Tipo</label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-none font-bold text-sm" data-testid="select-filtro-tipo">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="todos" className="font-bold">Todos</SelectItem>
                    <SelectItem value="ENTRADA_BODEGA" className="font-bold">Entrada Bodega</SelectItem>
                    <SelectItem value="ENTRADA_BODEGA_MIXTO" className="font-bold">Entrada Bodega MIXTO</SelectItem>
                    <SelectItem value="SALIDA_BODEGA" className="font-bold">Salida Bodega</SelectItem>
                    <SelectItem value="SALIDA_BODEGA_MIXTO" className="font-bold">Salida Bodega MIXTO</SelectItem>
                    <SelectItem value="SALIDA_RUTA" className="font-bold">Salida a Ruta</SelectItem>
                    <SelectItem value="SALIDA_RUTA_MIXTO" className="font-bold">Salida a Ruta MIXTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Producto</label>
                <Select value={filtroProducto} onValueChange={setFiltroProducto}>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-none font-bold text-sm" data-testid="select-filtro-producto">
                    <SelectValue placeholder="Todos los productos" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    <SelectItem value="todos" className="font-bold">Todos</SelectItem>
                    {productos.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)} className="font-bold">
                        #{p.id} - {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Fecha</label>
                <Input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="h-10 rounded-xl bg-muted/30 border-none font-bold"
                  data-testid="input-filtro-fecha"
                />
              </div>
            </div>

            {(filtroProducto !== "todos" || filtroFecha || filtroTipo !== "todos") && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs font-bold"
                onClick={() => {
                  setFiltroProducto("todos");
                  setFiltroFecha("");
                  setFiltroTipo("todos");
                }}
                data-testid="button-limpiar-filtros"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </Card>

        <div className="grid gap-2">
          {loading ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="loading-movimientos">
              <div className="text-xs font-bold text-muted-foreground uppercase">Cargando…</div>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="empty-movimientos">
              <div className="text-sm font-bold">Sin movimientos</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">
                {movimientos.length > 0 ? "No hay coincidencias con los filtros aplicados." : "No hay movimientos registrados."}
              </div>
            </Card>
          ) : (
            filtered.map((m) => (
              <Card key={m.id} className="p-4 rounded-2xl border-none shadow-sm bg-card/60" data-testid={`card-movimiento-${m.id}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${m.tipo === 'ENTRADA_BODEGA' ? 'bg-green-100 text-green-700' : m.tipo === 'SALIDA_BODEGA' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {m.tipo === 'ENTRADA_BODEGA' ? <PackageIcon className="h-5 w-5" /> : <TruckIcon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant={m.tipo === 'ENTRADA_BODEGA' ? 'default' : m.tipo === 'SALIDA_BODEGA' ? 'destructive' : 'secondary'} 
                        className="h-5 text-[9px] font-black uppercase"
                        data-testid={`badge-movimiento-tipo-${m.id}`}
                      >
                        {m.tipo === 'ENTRADA_BODEGA' ? 'Entrada' : m.tipo === 'SALIDA_BODEGA' ? 'Salida Bodega' : m.tipo === 'SALIDA_RUTA' ? 'Salida a Ruta' : m.tipo}
                      </Badge>
                      <span className="text-xs font-bold text-muted-foreground" data-testid={`text-movimiento-fecha-${m.id}`}>
                        {fmtDateTime(m.fecha)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-black" data-testid={`text-movimiento-producto-${m.id}`}>
                      #{m.productoId} - {m.productoNombre}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-[11px] font-bold text-muted-foreground">
                      <span data-testid={`text-movimiento-cantidad-${m.id}`}>
                        Cantidad: <span className="text-foreground">{parseFloat(m.cantidad).toFixed(2)}</span>
                      </span>
                      {m.rutaNombre && (
                        <span data-testid={`text-movimiento-ruta-${m.id}`}>
                          Ruta: <span className="text-foreground">{m.rutaNombre}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-muted-foreground" data-testid={`text-movimiento-usuario-${m.id}`}>
                      Por: <span className="text-foreground">{m.usuarioNombre}</span>
                    </div>
                    {m.notas && (
                      <div className="mt-1 text-[11px] font-medium text-muted-foreground italic" data-testid={`text-movimiento-notas-${m.id}`}>
                        {m.notas}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
