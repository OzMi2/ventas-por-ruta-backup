import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/SearchInput";
import { useAppStore } from "@/store/store";
import { listVentasVendedor, type HistorialVenta } from "@/services/historial";
import { TicketModal, ReportModal } from "@/components/TicketPrint";
import { PrinterIcon, CalendarIcon, FileTextIcon, DownloadIcon } from "lucide-react";
import { exportVentasToExcel } from "@/utils/exportExcel";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TipoVentaFiltro = "general" | "contado" | "credito" | "parcial";

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

export default function MiHistorialPage() {
  const { state } = useAppStore();
  const vendedorId = state.session?.usuario_id || "";
  const userRol = state.session?.rol;
  const canExport = userRol === "admin" || userRol === "auditor";

  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<HistorialVenta[]>([]);
  const [filtroFecha, setFiltroFecha] = React.useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [filtroTipo, setFiltroTipo] = React.useState<TipoVentaFiltro>("general");
  const [ticketVenta, setTicketVenta] = React.useState<HistorialVenta | null>(null);
  const [showReport, setShowReport] = React.useState(false);

  async function load() {
    if (!vendedorId) return;
    setLoading(true);
    try {
      const data = await listVentasVendedor({ vendedorId });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [vendedorId]);

  const filtered = rows.filter((v) => {
    const matchesSearch = `${v.folio} ${v.cliente_nombre}`.toLowerCase().includes(q.trim().toLowerCase());
    
    // Filtro por fecha
    let matchesFecha = true;
    if (filtroFecha) {
      const d = new Date(v.fecha_iso);
      const fechaVenta = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      matchesFecha = fechaVenta === filtroFecha;
    }
    
    // Filtro por tipo de pago
    let matchesTipo = true;
    if (filtroTipo !== "general") {
      matchesTipo = v.tipo_pago === filtroTipo;
    }
    
    return matchesSearch && matchesFecha && matchesTipo;
  });

  return (
    <AppShell title="Mi Historial">
      <div className="grid gap-4">
        <Card className="p-4 rounded-3xl border-none shadow-sm bg-card/60">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground" data-testid="text-mi-historial-header">
                  Ventas del vendedor
                </div>
                <div className="text-sm font-bold" data-testid="text-mi-historial-vendedor">ID {vendedorId}</div>
              </div>
              <div className="flex gap-2">
                {canExport && (
                  <Button 
                    variant="outline" 
                    className="h-10 rounded-2xl font-black uppercase text-[10px] gap-1" 
                    onClick={() => exportVentasToExcel(filtered, "mis_ventas")}
                    disabled={filtered.length === 0}
                    data-testid="button-exportar-excel"
                  >
                    <DownloadIcon className="h-4 w-4" /> Excel
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="h-10 rounded-2xl font-black uppercase text-[10px] gap-1" 
                  onClick={() => setShowReport(true)}
                  disabled={filtered.length === 0}
                  data-testid="button-generar-reporte"
                >
                  <FileTextIcon className="h-4 w-4" /> Reporte
                </Button>
                <Button variant="secondary" className="h-10 rounded-2xl font-black uppercase text-[10px]" onClick={load} data-testid="button-refresh-mi-historial">
                  Refrescar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SearchInput value={q} onChange={setQ} placeholder="Buscar por folio o cliente..." testId="search-mi-historial" />
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
            <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as TipoVentaFiltro)}>
              <SelectTrigger className="h-10 rounded-2xl bg-muted/30 border-none font-bold text-sm" data-testid="select-filtro-tipo">
                <SelectValue placeholder="Tipo de venta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General (todas)</SelectItem>
                <SelectItem value="contado">Contado</SelectItem>
                <SelectItem value="credito">Credito</SelectItem>
                <SelectItem value="parcial">Contado y credito (parcial)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-muted-foreground">
                Ventas mostradas: <span className="text-primary">{filtered.length}</span>
              </div>
              {(filtroFecha || filtroTipo !== "general") && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs font-bold"
                  onClick={() => { setFiltroFecha(""); setFiltroTipo("general"); }}
                  data-testid="button-limpiar-filtros"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-2">
          {loading ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="loading-mi-historial">
              <div className="text-xs font-bold text-muted-foreground uppercase">Cargando…</div>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="empty-mi-historial">
              <div className="text-sm font-bold">Sin ventas</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">No hay datos para mostrar.</div>
            </Card>
          ) : (
            filtered.map((v) => (
              <Card key={v.id} className="p-4 rounded-2xl border-none shadow-sm bg-card/60" data-testid={`card-mi-historial-venta-${v.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="h-5 text-[9px] font-black uppercase" data-testid={`badge-mi-historial-venta-${v.id}`}>
                        {v.tipo_pago}
                      </Badge>
                      <div className="text-xs font-black" data-testid={`text-mi-historial-folio-${v.id}`}>{v.folio}</div>
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-muted-foreground" data-testid={`text-mi-historial-fecha-${v.id}`}>{fmtDateTime(v.fecha_iso)}</div>
                    <div className="mt-2 text-[11px] font-bold" data-testid={`text-mi-historial-cliente-${v.id}`}>
                      <span className="text-muted-foreground">Cliente:</span> {v.cliente_nombre}
                    </div>
                    <div className="mt-1 text-[11px] font-bold" data-testid={`text-mi-historial-total-${v.id}`}>
                      <span className="text-muted-foreground">Total:</span> <span className="text-primary">{money(v.total)}</span>
                      {v.descuentos > 0 ? <span className="text-muted-foreground"> (dto -{money(v.descuentos)})</span> : null}
                    </div>
                    {(n(v.saldo_anterior) !== 0 || n(v.saldo_final) !== 0) && (
                      <div className="mt-1 text-[10px] font-bold" data-testid={`text-mi-historial-saldo-${v.id}`}>
                        <span className="text-muted-foreground">Saldo:</span>{" "}
                        <span className={n(v.saldo_anterior) > 0 ? "text-red-500" : "text-green-600"}>{money(v.saldo_anterior)}</span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className={n(v.saldo_final) > 0 ? "text-red-500" : "text-green-600"}>{money(v.saldo_final)}</span>
                      </div>
                    )}
                    {v.vendedor_nombre && (
                      <div className="mt-1 text-[10px] font-bold text-muted-foreground" data-testid={`text-mi-historial-vendedor-${v.id}`}>
                        Vendedor: <span className="text-foreground">{v.vendedor_nombre}</span>
                      </div>
                    )}
                    {v.items.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-muted/30">
                        <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Productos</div>
                        <div className="grid gap-1">
                          {v.items.map((item, idx) => {
                            const displayQty = item.tipo_venta === "peso" || item.unidad === "KG" 
                              ? `${item.kilos.toFixed(2)} kg`
                              : item.unidad === "MIXTO"
                              ? `${item.cantidad} pz + ${item.kilos.toFixed(2)} kg`
                              : `${item.cantidad} pz`;
                            return (
                              <div key={idx} className="flex items-center justify-between text-[11px] font-bold" data-testid={`item-${v.id}-${idx}`}>
                                <span className="truncate flex-1">{item.producto}</span>
                                <span className="text-muted-foreground mx-2">{displayQty}</span>
                                <span className="text-primary">{money(item.subtotal)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 rounded-xl font-black uppercase text-[10px] gap-2"
                    onClick={() => setTicketVenta(v)}
                    data-testid={`button-print-mi-historial-${v.id}`}
                  >
                    <PrinterIcon className="h-4 w-4" /> Imprimir
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <TicketModal 
        venta={ticketVenta} 
        open={!!ticketVenta} 
        onClose={() => setTicketVenta(null)} 
      />
      
      <ReportModal
        ventas={filtered}
        fecha={filtroFecha}
        open={showReport}
        onClose={() => setShowReport(false)}
      />
    </AppShell>
  );
}
