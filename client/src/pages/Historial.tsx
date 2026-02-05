import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/SearchInput";
import { listRutas, listClientesHistorial, listTodasLasVentas, getMovimientosRuta, type HistorialCliente, type HistorialVenta, type Ruta } from "@/services/historial";
import { apiClient } from "@/lib/api";
import { TicketModal, ReportModal } from "@/components/TicketPrint";
import { PrinterIcon, ChevronRightIcon, CalendarIcon, FileTextIcon, DownloadIcon } from "lucide-react";
import { exportReporteCompleto, exportVentasPorRutaToExcel } from "@/utils/exportExcel";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/store";

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
  const { state } = useAppStore();
  const userRol = state.session?.rol;
  const canExport = userRol === "admin" || userRol === "auditor";

  const [rutas, setRutas] = React.useState<Ruta[]>([]);
  const [rutaId, setRutaId] = React.useState<string>("");
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<HistorialCliente[]>([]);
    const [loadingExport, setLoadingExport] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [activeCliente, setActiveCliente] = React.useState<HistorialCliente | null>(null);
  const [activeVenta, setActiveVenta] = React.useState<HistorialVenta | null>(null);
  const [ticketVenta, setTicketVenta] = React.useState<HistorialVenta | null>(null);
  const [fechaDesde, setFechaDesde] = React.useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [fechaHasta, setFechaHasta] = React.useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [showReport, setShowReport] = React.useState(false);

  function setPresetFecha(preset: "hoy" | "semana" | "mes" | "todas") {
    const today = new Date();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    if (preset === "hoy") {
      setFechaDesde(fmt(today));
      setFechaHasta(fmt(today));
    } else if (preset === "semana") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setFechaDesde(fmt(weekAgo));
      setFechaHasta(fmt(today));
    } else if (preset === "mes") {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      setFechaDesde(fmt(monthAgo));
      setFechaHasta(fmt(today));
    } else {
      setFechaDesde("");
      setFechaHasta("");
    }
  }

  async function loadRutas() {
    const data = await listRutas();
    // Sort numerically by extracting number from name (Ruta 1, Ruta 2, ..., Ruta 10)
    data.sort((a, b) => {
      const numA = parseInt(a.nombre.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.nombre.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    setRutas(data);
    // Don't preselect any route - user should choose
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

  // Helper function to check if a sale is within date range
  const isVentaInDateRange = (venta: HistorialVenta) => {
    const d = new Date(venta.fecha_iso);
    const fechaVenta = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    if (fechaDesde && fechaHasta) {
      return fechaVenta >= fechaDesde && fechaVenta <= fechaHasta;
    } else if (fechaDesde) {
      return fechaVenta >= fechaDesde;
    } else if (fechaHasta) {
      return fechaVenta <= fechaHasta;
    }
    return true;
  };

  // Clients filtered by search AND with sales in date range
  const clientesFiltrados = React.useMemo(() => {
    return filtered.map(c => ({
      ...c,
      ventasFiltradas: c.ventas.filter(isVentaInDateRange)
    })).filter(c => c.ventasFiltradas.length > 0);
  }, [filtered, fechaDesde, fechaHasta]);

  const ventasFiltradas = React.useMemo(() => {
    const ventas: HistorialVenta[] = [];
    for (const cliente of filtered) {
      for (const venta of cliente.ventas) {
        if (isVentaInDateRange(venta)) {
          // Asegurar que cada venta tenga el nombre del cliente
          ventas.push({
            ...venta,
            cliente_nombre: venta.cliente_nombre || cliente.cliente_nombre || "",
            cliente_id: venta.cliente_id || cliente.cliente_id || "",
          });
        }
      }
    }
    return ventas.sort((a, b) => new Date(b.fecha_iso).getTime() - new Date(a.fecha_iso).getTime());
  }, [filtered, fechaDesde, fechaHasta]);

  const rutaNombre = rutas.find((r) => r.id === rutaId)?.nombre || "";

  async function exportarTodasLasRutas() {
    if (!canExport || rutas.length === 0) return;
    setLoadingExport(true);
    try {
      const allVentas = await listTodasLasVentas({ 
        fechaDesde: fechaDesde || undefined, 
        fechaHasta: fechaHasta || undefined 
      });
      
      // Obtener movimientos e inventario de todas las rutas
      const allMovimientos: any[] = [];
      const allInventario: any[] = [];
      
      for (const r of rutas) {
        const movs = await getMovimientosRuta(Number(r.id), fechaDesde || undefined, fechaHasta || undefined);
        allMovimientos.push(...movs);
        
        // Obtener inventario actual de la ruta
        const token = localStorage.getItem("auth_token");
        try {
          const invRes = await fetch(`/api/inventario/ruta/${r.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (invRes.ok) {
            const invData = await invRes.json();
            // Procesar inventario MIXTO
            for (const inv of (invData.inventarioMixto || [])) {
              allInventario.push({
                rutaNombre: r.nombre,
                productoId: inv.productoId,
                productoNombre: inv.productoNombre || "",
                piezas: Number(inv.cantidadPiezas) || 0,
                kg: Number(inv.cantidadKg) || 0,
                unidad: "MIXTO",
              });
            }
            // Procesar inventario normal (no MIXTO)
            for (const inv of (invData.inventario || [])) {
              const prod = (invData.productos || []).find((p: any) => p.id === inv.productoId);
              const unidad = prod?.unidad || inv.productoUnidad || "PIEZA";
              if (unidad !== "MIXTO") {
                allInventario.push({
                  rutaNombre: r.nombre,
                  productoId: inv.productoId,
                  productoNombre: inv.productoNombre || "",
                  piezas: unidad === "KG" ? 0 : Number(inv.cantidad) || 0,
                  kg: unidad === "KG" ? Number(inv.cantidad) || 0 : 0,
                  unidad: unidad,
                });
              }
            }
          }
        } catch (e) {
          console.error("Error fetching inventario ruta:", e);
        }
      }
      
      const rangoLabel = fechaDesde && fechaHasta 
        ? (fechaDesde === fechaHasta ? fechaDesde : `${fechaDesde}_a_${fechaHasta}`)
        : "todas";
      
      // Obtener productos y reglas de descuento
      const [{ productos: productosApi }, { rules: reglasApi }] = await Promise.all([
        apiClient.getProductos(),
        apiClient.getDescuentos(),
      ]);
      const productosConPrecio = (productosApi || []).map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio) || 0,
        unidad: p.unidad || "PIEZA",
      }));
      const reglasDescuento = (reglasApi || []).map((r: any) => ({
        productoId: r.productoId,
        tiers: (r.tiers || []).map((t: any) => ({
          volumenDesde: Number(t.volumenDesde) || 0,
          descuentoMonto: Number(t.descuentoMonto) || 0,
        })),
      }));
      exportVentasPorRutaToExcel(allVentas, `ventas_todas_rutas_${rangoLabel}`, allMovimientos, productosConPrecio, reglasDescuento, allInventario);
    } finally {
      setLoadingExport(false);
    }
  }

  return (
    <AppShell title="Rutas · Historial">
      <div className="grid gap-4">
        <Card className="p-4 rounded-3xl border-none shadow-sm bg-card/60">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground" data-testid="text-historial-header">
                  Selecciona una ruta {canExport && <span className="ml-2 text-green-500">(Admin)</span>}
                </div>
                <div className="text-sm font-bold" data-testid="text-historial-route-selected">
                  {rutaNombre || "—"}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {canExport && (
                  <>
                    <Button 
                      variant="default" 
                      className="h-10 rounded-2xl font-black uppercase text-[10px] gap-1 bg-green-600 hover:bg-green-700" 
                      onClick={exportarTodasLasRutas}
                      disabled={loadingExport || rutas.length === 0}
                      data-testid="button-exportar-todas-rutas"
                    >
                      <DownloadIcon className="h-4 w-4" /> {loadingExport ? "Cargando..." : "Excel Todas"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10 rounded-2xl font-black uppercase text-[10px] gap-1" 
                      onClick={async () => {
                        const rangoLabel = fechaDesde && fechaHasta 
                          ? (fechaDesde === fechaHasta ? fechaDesde : `${fechaDesde}_a_${fechaHasta}`)
                          : "todas";
                        // Convertir ventasFiltradas al formato VentaConRuta
                        const ventasConRuta = ventasFiltradas.map(v => ({
                          id: String(v.id),
                          folio: String(v.id),
                          fecha_iso: v.fecha_iso,
                          ruta_nombre: rutaNombre,
                          cliente_id: String(v.cliente_id),
                          cliente_nombre: v.cliente_nombre,
                          vendedor_id: "",
                          vendedor_nombre: "",
                          tipo_pago: v.tipo_pago,
                          total: Number(v.total) || 0,
                          descuentos: Number(v.descuentos) || 0,
                          abono: Number(v.abono) || 0,
                          items: (v.items || []).map(i => {
                            const unidadStr = ((i as any).unidad || i.tipo_venta || "PIEZA").toUpperCase();
                            const cantidadNum = Number(i.cantidad) || 0;
                            const isMixto = unidadStr === "MIXTO";
                            const isKg = unidadStr === "KG";
                            return {
                              productoId: Number((i as any).productoId) || Number((i as any).producto_id) || 0,
                              producto_id: Number((i as any).productoId) || Number((i as any).producto_id) || 0,
                              producto: i.producto || "",
                              unidad: unidadStr,
                              tipo_venta: unidadStr,
                              cantidad: cantidadNum,
                              piezas: isMixto ? Number((i as any).piezas) || 0 : (isKg ? 0 : cantidadNum),
                              kilos: isMixto ? Number(i.kilos) || 0 : (isKg ? cantidadNum : 0),
                              precio_unitario: Number(i.precio_unitario) || 0,
                              precioUnitario: Number(i.precio_unitario) || 0,
                              descuento_unitario: Number(i.descuento_unitario) || 0,
                              descuentoUnitario: Number(i.descuento_unitario) || 0,
                              subtotal: Number(i.subtotal) || 0,
                            };
                          }),
                        }));
                        
                        // Obtener movimientos de la ruta
                        const movs = rutaId ? await getMovimientosRuta(Number(rutaId), fechaDesde || undefined, fechaHasta || undefined) : [];
                        
                        // Obtener productos y reglas de descuento
                        const [{ productos: productosApi }, { rules: reglasApi }] = await Promise.all([
                          apiClient.getProductos(),
                          apiClient.getDescuentos(),
                        ]);
                        const productosConPrecio = (productosApi || []).map((p: any) => ({
                          id: p.id,
                          nombre: p.nombre,
                          precio: Number(p.precio) || 0,
                          unidad: p.unidad || "PIEZA",
                        }));
                        const reglasDescuento = (reglasApi || []).map((r: any) => ({
                          productoId: r.productoId,
                          tiers: (r.tiers || []).map((t: any) => ({
                            volumenDesde: Number(t.volumenDesde) || 0,
                            descuentoMonto: Number(t.descuentoMonto) || 0,
                          })),
                        }));
                        exportVentasPorRutaToExcel(ventasConRuta, `ventas_${rutaNombre}_${rangoLabel}`, movs, productosConPrecio, reglasDescuento);
                      }}
                      disabled={ventasFiltradas.length === 0}
                      data-testid="button-exportar-excel"
                    >
                      <DownloadIcon className="h-4 w-4" /> Excel Ruta
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  className="h-10 rounded-2xl font-black uppercase text-[10px] gap-1" 
                  onClick={() => setShowReport(true)}
                  disabled={ventasFiltradas.length === 0}
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
              <SelectContent className="rounded-2xl max-h-[300px]">
                {rutas.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="font-bold" data-testid={`option-ruta-${r.id}`}>
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente..." testId="search-historial-clientes" />
            
            <div className="flex flex-wrap gap-1">
              <Button variant={fechaDesde === fechaHasta && fechaDesde !== "" ? "default" : "outline"} size="sm" className="text-[10px] h-7 rounded-lg font-bold" onClick={() => setPresetFecha("hoy")}>Hoy</Button>
              <Button variant="outline" size="sm" className="text-[10px] h-7 rounded-lg font-bold" onClick={() => setPresetFecha("semana")}>7 días</Button>
              <Button variant="outline" size="sm" className="text-[10px] h-7 rounded-lg font-bold" onClick={() => setPresetFecha("mes")}>30 días</Button>
              <Button variant={!fechaDesde && !fechaHasta ? "default" : "outline"} size="sm" className="text-[10px] h-7 rounded-lg font-bold" onClick={() => setPresetFecha("todas")}>Todas</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">Desde</span>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="h-10 pl-14 rounded-2xl bg-muted/30 border-none font-bold text-sm"
                  data-testid="input-fecha-desde"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">Hasta</span>
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="h-10 pl-14 rounded-2xl bg-muted/30 border-none font-bold text-sm"
                  data-testid="input-fecha-hasta"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-muted-foreground">
                Ventas encontradas: <span className="text-primary">{ventasFiltradas.length}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-2">
          {!rutaId ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="no-ruta-selected">
              <div className="text-sm font-bold">Selecciona una ruta</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">Elige una ruta del menú para ver el historial de clientes.</div>
            </Card>
          ) : loading ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="loading-historial">
              <div className="text-xs font-bold text-muted-foreground uppercase">Cargando…</div>
            </Card>
          ) : clientesFiltrados.length === 0 ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="empty-historial">
              <div className="text-sm font-bold">Sin ventas</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">No hay ventas en el rango de fechas seleccionado.</div>
            </Card>
          ) : (
            clientesFiltrados.map((c) => (
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
                      {c.ventasFiltradas.length} ventas · Saldo: {c.saldo_actual != null ? money(c.saldo_actual) : "—"}
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
              {((activeCliente as any)?.ventasFiltradas || activeCliente?.ventas || []).map((v: HistorialVenta) => (
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
                        const displayQty = it.unidad === "MIXTO"
                          ? `${it.piezas || it.cantidad} PZ + ${it.kilos.toFixed(2)} KG`
                          : it.tipo_venta === "peso" || it.unidad === "KG" 
                          ? `${it.kilos.toFixed(2)} KG`
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
          ventas={ventasFiltradas}
          fecha={fechaDesde && fechaHasta ? (fechaDesde === fechaHasta ? fechaDesde : `${fechaDesde} a ${fechaHasta}`) : "Todas las fechas"}
          rutaNombre={rutaNombre}
          open={showReport}
          onClose={() => setShowReport(false)}
        />
      </div>
    </AppShell>
  );
}
