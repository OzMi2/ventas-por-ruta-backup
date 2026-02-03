import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/SearchInput";
import { listRutas, listClientesHistorial, type HistorialCliente, type HistorialVenta, type Ruta } from "@/services/historial";
import { TicketModal, ReportModal } from "@/components/TicketPrint";
import { PrinterIcon, ChevronRightIcon, CalendarIcon, FileTextIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

function n(v: any) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function money(v: any) {
  return `$${n(v).toFixed(2)}`;
}

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function HistorialPage() {
  const [rutas, setRutas] = React.useState<Ruta[]>([]);
  const [rutaId, setRutaId] = React.useState<string>("");
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<HistorialCliente[]>([]);

  const [open, setOpen] = React.useState(false);
  const [activeCliente, setActiveCliente] = React.useState<HistorialCliente | null>(null);
  const [activeVenta, setActiveVenta] = React.useState<HistorialVenta | null>(null);
  const [ticketVenta, setTicketVenta] = React.useState<HistorialVenta | null>(null);
  const [filtroFecha, setFiltroFecha] = React.useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [showReport, setShowReport] = React.useState(false);

  async function loadRutas() {
    const data = await listRutas();
    setRutas(data);
    if (!rutaId && data[0]) setRutaId(data[0].id);
  }

  async function load() {
    if (!rutaId) return;
    setLoading(true);
    try {
      const data = await listClientesHistorial({ rutaId });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadRutas();
  }, []);

  React.useEffect(() => {
    load();
  }, [rutaId]);

  const filtered = rows.filter((c) => c.cliente_nombre.toLowerCase().includes(q.trim().toLowerCase()));

  const allVentasDelDia = React.useMemo(() => {
    const ventas: HistorialVenta[] = [];
    for (const cliente of filtered) {
      for (const venta of cliente.ventas) {
        if (filtroFecha) {
          const d = new Date(venta.fecha_iso);
          const fechaVenta = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (fechaVenta === filtroFecha) {
            ventas.push(venta);
          }
        } else {
          ventas.push(venta);
        }
      }
    }
    return ventas.sort((a, b) => new Date(b.fecha_iso).getTime() - new Date(a.fecha_iso).getTime());
  }, [filtered, filtroFecha]);

  const rutaNombre = rutas.find((r) => r.id === rutaId)?.nombre || "";

  return (
    <AppShell title="Rutas · Historial">
      <div className="grid gap-4">
        <Card className="p-4 rounded-3xl border-none shadow-sm bg-card/60">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground" data-testid="text-historial-header">
                  Selecciona una ruta
                </div>
                <div className="text-sm font-bold" data-testid="text-historial-route-selected">
                  {rutaNombre || "—"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="h-10 rounded-2xl font-black uppercase text-[10px] gap-1" 
                  onClick={() => setShowReport(true)}
                  disabled={allVentasDelDia.length === 0}
                  data-testid="button-generar-reporte"
                >
                  <FileTextIcon className="h-4 w-4" /> Reporte
                </Button>
                <Button variant="secondary" className="h-10 rounded-2xl font-black uppercase text-[10px]" onClick={load} data-testid="button-refresh-historial">
                  Refrescar
                </Button>
              </div>
            </div>

            <Select value={rutaId} onValueChange={setRutaId}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-ruta">
                <SelectValue placeholder="Seleccionar ruta..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {rutas.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="font-bold" data-testid={`option-ruta-${r.id}`}>
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente..." testId="search-historial-clientes" />
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="h-10 pl-10 rounded-2xl bg-muted/30 border-none font-bold text-sm"
                  data-testid="input-filtro-fecha"
                />
              </div>
            </div>
            {filtroFecha && (
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-muted-foreground">
                  Ventas del día: <span className="text-primary">{allVentasDelDia.length}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs font-bold"
                  onClick={() => setFiltroFecha("")}
                >
                  Ver todas las fechas
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-2">
          {loading ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="loading-historial">
              <div className="text-xs font-bold text-muted-foreground uppercase">Cargando…</div>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="empty-historial">
              <div className="text-sm font-bold">Sin clientes</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">No hay coincidencias para esta ruta.</div>
            </Card>
          ) : (
            filtered.map((c) => (
              <Card
                key={c.cliente_id}
                className="p-4 rounded-2xl border-none shadow-sm bg-card/60 active:scale-[0.99] transition"
                data-testid={`card-historial-cliente-${c.cliente_id}`}
                onClick={() => {
                  setActiveCliente(c);
                  setOpen(true);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-black truncate" data-testid={`text-historial-cliente-nombre-${c.cliente_id}`}>{c.cliente_nombre}</div>
                    <div className="mt-1 text-[11px] font-bold text-muted-foreground" data-testid={`text-historial-cliente-meta-${c.cliente_id}`}>
                      {c.ventas.length} ventas · Saldo: {c.saldo_actual != null ? money(c.saldo_actual) : "—"}
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            ))
          )}
        </div>

        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setActiveVenta(null);
              setActiveCliente(null);
            }
          }}
        >
          <DialogContent className="max-w-[95%] sm:max-w-[520px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-black uppercase tracking-widest text-center" data-testid="text-historial-cliente-dialog-title">
                {activeCliente?.cliente_nombre || "Cliente"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-3 max-h-[70vh] overflow-y-auto px-1">
              {(activeCliente?.ventas || []).map((v) => (
                <Card
                  key={v.id}
                  className="p-3 rounded-2xl border-none shadow-sm bg-muted/20"
                  data-testid={`card-historial-venta-${v.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="h-5 text-[9px] font-black uppercase" data-testid={`badge-historial-venta-${v.id}`}>
                          {v.tipo_pago}
                        </Badge>
                        <div className="text-xs font-black" data-testid={`text-historial-venta-folio-${v.id}`}>{v.folio}</div>
                      </div>
                      <div className="mt-1 text-[11px] font-bold text-muted-foreground" data-testid={`text-historial-venta-fecha-${v.id}`}>{fmtDateTime(v.fecha_iso)}</div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] font-bold" data-testid={`text-historial-venta-total-${v.id}`}>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="text-primary">{money(v.total)}</span>
                        {v.descuentos > 0 ? <span className="text-muted-foreground">(dto -{money(v.descuentos)})</span> : null}
                      </div>
                      {v.vendedor_nombre && (
                        <div className="mt-1 text-[10px] font-bold text-muted-foreground" data-testid={`text-historial-venta-vendedor-${v.id}`}>
                          Vendedor: <span className="text-foreground">{v.vendedor_nombre}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 rounded-xl font-black uppercase text-[10px] gap-2"
                        onClick={() => setTicketVenta(v)}
                        data-testid={`button-print-venta-${v.id}`}
                      >
                        <PrinterIcon className="h-4 w-4" /> Imprimir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-xl font-black uppercase text-[10px]"
                        onClick={() => setActiveVenta(v)}
                        data-testid={`button-ver-detalle-venta-${v.id}`}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>

                  {activeVenta?.id === v.id ? (
                    <div className="mt-3 grid gap-2" data-testid={`panel-venta-detalle-${v.id}`}>
                      {(v.items || []).map((it, idx) => {
                        const displayQty = it.tipo_venta === "peso" || it.unidad === "KG" 
                          ? `${it.kilos.toFixed(2)} KG`
                          : it.unidad === "MIXTO"
                          ? `${it.cantidad} PZ + ${it.kilos.toFixed(2)} KG`
                          : `${it.cantidad} PZ`;
                        return (
                          <div key={idx} className="flex justify-between text-[11px] font-bold" data-testid={`row-venta-item-${v.id}-${idx}`}>
                            <span className="truncate max-w-[220px]">{it.producto}</span>
                            <span className="text-muted-foreground">{displayQty}</span>
                            <span className="text-primary">{money(it.subtotal)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        
        <TicketModal 
          venta={ticketVenta} 
          open={!!ticketVenta} 
          onClose={() => setTicketVenta(null)} 
        />
        
        <ReportModal
          ventas={allVentasDelDia}
          fecha={filtroFecha}
          rutaNombre={rutaNombre}
          open={showReport}
          onClose={() => setShowReport(false)}
        />
      </div>
    </AppShell>
  );
}
