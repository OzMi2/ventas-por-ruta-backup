import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/SearchInput";
import { ShoppingCartIcon } from "lucide-react";
import { fetchProductos } from "@/services/productos";
import { fetchDiscounts, findApplicableDiscount, type DiscountRule } from "@/services/discounts";
import { useAppStore } from "@/store/store";
import type { Producto } from "@/store/types";

function n(v: any) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function mapProducto(raw: any, idx: number): Producto {
  const id = raw?.id ?? raw?.producto_id ?? idx;
  const tipo = raw?.tipo_venta === "peso" ? "peso" : "unidad";
  const requiere = Boolean(raw?.requiere_piezas);
  const precio_aplicado = raw?.precio_aplicado != null ? n(raw.precio_aplicado) : n(raw?.precio_base);

  return {
    id: String(id),
    nombre: String(raw?.nombre ?? raw?.producto ?? `Producto ${idx + 1}`),
    tipo_venta: tipo,
    requiere_piezas: requiere,
    stock_piezas: raw?.stock_piezas != null ? n(raw.stock_piezas) : undefined,
    stock_kg: raw?.stock_kg != null ? n(raw.stock_kg) : undefined,
    precio_base: n(raw?.precio_base),
    descuento_aplicado: raw?.descuento_aplicado != null ? n(raw.descuento_aplicado) : undefined,
    precio_aplicado,
    fuente_descuento: raw?.fuente_descuento || "ninguno",
  };
}

function subtotalFor(p: Producto, cantidad?: number, kilos?: number, discounts: DiscountRule[] = [], clienteId?: string) {
  const chargedQty = p.tipo_venta === "unidad" ? n(cantidad) : n(kilos);
  const clienteIdNum = clienteId ? parseInt(clienteId) : 0;
  const productoIdNum = parseInt(p.id);
  const disc = clienteIdNum ? findApplicableDiscount(discounts, clienteIdNum, productoIdNum, chargedQty) : null;
  const price = disc ? Math.max(n(p.precio_base) - disc.discountAmount, 0) : n(p.precio_aplicado);
  
  if (p.tipo_venta === "unidad") return n(cantidad) * price;
  return n(kilos) * price;
}

export default function ProductosPage() {
  const { state, dispatch } = useAppStore();
  const vendedorId = state.session?.usuario_id;
  const clienteId = state.selectedClient?.id;
  const clientName = state.selectedClient?.nombre;

  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Producto[]>([]);
  const [discountRules, setDiscountRules] = React.useState<DiscountRule[]>([]);

  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Producto | null>(null);
  const [cantidad, setCantidad] = React.useState<string>("");
  const [kilos, setKilos] = React.useState<string>("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [pData, dData]: any = await Promise.all([
        fetchProductos({ vendedor_id: vendedorId, cliente_id: clienteId }),
        fetchDiscounts()
      ]);
      
      const pList = Array.isArray(pData) ? pData : Array.isArray(pData?.data) ? pData.data : [];
      setRows(pList.map(mapProducto));
      setDiscountRules(Array.isArray(dData) ? dData : []);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los datos.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [vendedorId, clienteId, clientName]);

  const filtered = rows.filter((p) => p.nombre.toLowerCase().includes(q.trim().toLowerCase()));

  function openAdd(p: Producto) {
    setSelected(p);
    setCantidad("");
    setKilos("");
    setStockError(null);
    setOpen(true);
  }

  const [stockError, setStockError] = React.useState<string | null>(null);

  function addToCart() {
    if (!selected) return;
    setStockError(null);

    const tipo = selected.tipo_venta;
    const reqP = selected.requiere_piezas;

    const c = cantidad.trim() ? Number(cantidad) : undefined;
    const k = kilos.trim() ? Number(kilos) : undefined;

    if (tipo === "unidad") {
      if (!c || c <= 0) return;
      // Validar stock para PIEZA
      const stockDisponible = n(selected.stock_piezas);
      if (stockDisponible < c) {
        setStockError(`Sin stock suficiente. Disponible: ${stockDisponible} piezas`);
        return;
      }
    } else {
      if (!k || k <= 0) return;
      if (reqP && (!c || c <= 0)) return;
      // Validar stock para KG o MIXTO
      const stockKgDisponible = n(selected.stock_kg);
      if (stockKgDisponible < k) {
        setStockError(`Sin stock suficiente. Disponible: ${stockKgDisponible.toFixed(3)} kg`);
        return;
      }
      // Para MIXTO también validar piezas si aplica
      if (reqP && c) {
        const stockPzDisponible = n(selected.stock_piezas);
        if (stockPzDisponible < c) {
          setStockError(`Sin stock suficiente. Disponible: ${stockPzDisponible} piezas`);
          return;
        }
      }
    }

    const chargedQty = tipo === "unidad" ? n(c) : n(k);
    const clienteIdNum = clienteId ? parseInt(clienteId) : 0;
    const productoIdNum = parseInt(selected.id);
    const disc = clienteIdNum ? findApplicableDiscount(discountRules, clienteIdNum, productoIdNum, chargedQty) : null;
    const finalPrice = disc ? Math.max(n(selected.precio_base) - disc.discountAmount, 0) : selected.precio_aplicado;

    dispatch({
      type: "CART_ADD",
      item: {
        producto_id: selected.id,
        nombre: selected.nombre,
        tipo_venta: selected.tipo_venta,
        requiere_piezas: selected.requiere_piezas,
        precio_base: selected.precio_base,
        precio_aplicado: finalPrice,
        discount_unit: disc?.discountAmount || 0,
        cantidad: tipo === "unidad" ? c : reqP ? c : undefined,
        kilos: tipo === "peso" ? k : undefined,
      },
    });

    setOpen(false);
  }

  const previewSubtotal = selected
    ? subtotalFor(
        selected,
        cantidad.trim() ? Number(cantidad) : undefined,
        kilos.trim() ? Number(kilos) : undefined,
        discountRules,
        clienteId
      )
    : 0;

  return (
    <AppShell title="Inventario">
      <div className="grid gap-4">
        {!state.selectedClient ? (
          <Alert variant="destructive" className="rounded-2xl shadow-sm border-none bg-destructive/10 text-destructive" data-testid="alert-no-client">
            <AlertTitle className="text-xs font-black uppercase">Atención</AlertTitle>
            <AlertDescription className="text-xs font-bold">
              Selecciona un cliente antes de cargar productos.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar producto..." testId="search-productos" />
          </div>
          <Button onClick={load} variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-xl" data-testid="button-refresh-productos">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive" className="rounded-2xl" data-testid="alert-productos-error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription data-testid="text-productos-error">{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="grid gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-4 rounded-2xl" data-testid={`card-producto-skeleton-${i}`}>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center rounded-3xl bg-muted/20 border-dashed" data-testid="empty-productos">
            <div className="text-sm font-bold">Sin productos</div>
            <div className="mt-1 text-xs text-muted-foreground font-medium">
              No hay coincidencias.
            </div>
          </Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map((p) => (
              <Card
                key={p.id}
                className="p-3 shadow-sm active:scale-[0.98] transition-transform border-none bg-card/60 rounded-2xl"
                data-testid={`card-producto-${p.id}`}
                onClick={() => openAdd(p)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="truncate text-sm font-bold" data-testid={`text-producto-nombre-${p.id}`}>
                        {p.nombre}
                      </div>
                      {p.requiere_piezas ? (
                        <Badge className="h-5 text-[9px] px-1.5 uppercase tracking-wider font-black rounded-md bg-purple-500">
                          MIXTO
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="h-5 text-[9px] px-1.5 uppercase tracking-wider font-black rounded-md">
                          {p.tipo_venta}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
                      <div data-testid={`text-precio-aplicado-${p.id}`} className="text-primary">
                        ${p.precio_aplicado.toFixed(2)}
                      </div>
                      <div data-testid={`text-stock-piezas-${p.id}`} className="bg-muted/50 px-1.5 py-0.5 rounded text-[9px]">
                        {p.requiere_piezas 
                          ? `${p.stock_piezas ?? 0} PZS / ${(p.stock_kg ?? 0).toFixed(2)} KG`
                          : p.tipo_venta === "unidad" 
                            ? `${p.stock_piezas ?? 0} PZS` 
                            : `${(p.stock_kg ?? 0).toFixed(3)} KG`}
                      </div>
                    </div>
                  </div>

                  <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full shrink-0 bg-background shadow-sm border-none" data-testid={`button-add-producto-${p.id}`}>
                    <ShoppingCartIcon className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[90%] rounded-3xl" data-testid="modal-add-to-cart">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase">Agregar Item</DialogTitle>
            </DialogHeader>

            {selected ? (
              <div className="grid gap-4">
                <div>
                  <div className="text-base font-black" data-testid="text-modal-product-name">
                    {selected.nombre}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-tight" data-testid="text-modal-product-meta">
                    {selected.tipo_venta} · ${selected.precio_aplicado.toFixed(2)} / {selected.tipo_venta === 'unidad' ? 'pz' : 'kg'}
                  </div>
                </div>

                {selected.tipo_venta === "unidad" ? (
                  <div className="grid gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground" htmlFor="cantidad">
                      Cantidad (piezas)
                    </label>
                    <Input
                      id="cantidad"
                      className="h-12 text-lg font-bold rounded-2xl bg-muted/30 border-none text-center"
                      inputMode="numeric"
                      value={cantidad}
                      onChange={(e) => setQtyVal(e.target.value)}
                      placeholder="0"
                      data-testid="input-cantidad"
                    />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground" htmlFor="kilos">
                        Kilos
                      </label>
                      <Input
                        id="kilos"
                        className="h-12 text-lg font-bold rounded-2xl bg-muted/30 border-none text-center"
                        inputMode="decimal"
                        value={kilos}
                        onChange={(e) => setKilosVal(e.target.value)}
                        placeholder="0.00"
                        data-testid="input-kilos"
                      />
                    </div>

                    {selected.requiere_piezas ? (
                      <div className="grid gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground" htmlFor="cantidad2">
                          Piezas
                        </label>
                        <Input
                          id="cantidad2"
                          className="h-12 text-lg font-bold rounded-2xl bg-muted/30 border-none text-center"
                          inputMode="numeric"
                          value={cantidad}
                          onChange={(e) => setQtyVal(e.target.value)}
                          placeholder="0"
                          data-testid="input-cantidad-piezas"
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="rounded-2xl bg-primary/5 p-4 flex justify-between items-center" data-testid="text-modal-subtotal">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Subtotal</span>
                  <span className="text-xl font-black text-primary">${previewSubtotal.toFixed(2)}</span>
                </div>

                {stockError && (
                  <Alert variant="destructive" className="rounded-2xl border-none" data-testid="alert-stock-error">
                    <AlertDescription className="text-xs font-bold">{stockError}</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : null}

            <DialogFooter className="flex-row gap-2 mt-2">
              <Button variant="secondary" className="flex-1 h-12 rounded-2xl font-bold" onClick={() => setOpen(false)} data-testid="button-cancel-add">
                Cerrar
              </Button>
              <Button className="flex-1 h-12 rounded-2xl font-black uppercase tracking-tighter" onClick={addToCart} data-testid="button-confirm-add">
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );

  function setQtyVal(val: string) {
    if (/^\d*$/.test(val)) setCantidad(val);
  }
  function setKilosVal(val: string) {
    if (/^\d*\.?\d*$/.test(val)) setKilos(val);
  }
}
