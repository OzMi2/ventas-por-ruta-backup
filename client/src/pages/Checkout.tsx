import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/store";
import { registrarVenta } from "@/services/ventas";
import { TicketModal } from "@/components/TicketPrint";
import type { HistorialVenta } from "@/services/historial";
import { Trash2Icon, PrinterIcon } from "lucide-react";

function n(v: any) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function subtotal(it: any) {
  const price = n(it.precio_aplicado);
  if (it.tipo_venta === "unidad") return n(it.cantidad) * price;
  return n(it.kilos) * price;
}

function lineDiscount(it: any) {
  const chargedQty = it.tipo_venta === "unidad" ? n(it.cantidad) : n(it.kilos);
  return n(it.discount_unit) * chargedQty;
}

export default function CheckoutPage() {
  const { state, dispatch } = useAppStore();
  const { toast } = useToast();

  const tipoPago = "efectivo";
  const [abono, setAbono] = React.useState("0");
  const [pagoCon, setPagoCon] = React.useState("");
  const [soloAbono, setSoloAbono] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<any | null>(null);
  const [lastTicket, setLastTicket] = React.useState<HistorialVenta | null>(null);
  const [showTicket, setShowTicket] = React.useState(false);
  const [creditWarning, setCreditWarning] = React.useState<{ faltante: number } | null>(null);
  const [showReviewConfirm, setShowReviewConfirm] = React.useState(false);

  const total = state.cart.reduce((acc, it) => acc + subtotal(it), 0);
  const totalDiscount = state.cart.reduce((acc, it) => acc + lineDiscount(it), 0);
  const subtotalBase = total + totalDiscount;
  const saldoAnterior = state.selectedClient?.saldo ?? null;
  const saldoAnteriorNum = n(saldoAnterior);
  const totalConSaldo = total + saldoAnteriorNum;
  const maximoAbono = totalConSaldo;
  const pagoConNum = n(pagoCon);
  const abonoNum = n(abono);
  // Cambio: cliente pagó más de lo que abona
  const cambio = pagoConNum > abonoNum ? pagoConNum - abonoNum : 0;

  function handleEnviarClick() {
    setError(null);
    if (!state.session) { setError("No hay sesión."); return; }
    if (!state.selectedClient) { setError("Selecciona un cliente."); return; }
    if (!soloAbono && state.cart.length === 0) { setError("El carrito está vacío."); return; }

    const abonoPago = n(abono);
    if (abonoPago < 0) { setError("El abono no puede ser negativo."); return; }
    
    // Validar que el abono no exceda el máximo (compra + saldo pendiente)
    if (abonoPago > maximoAbono) {
      setError(`El abono no puede ser mayor a $${maximoAbono.toFixed(2)} (compra + saldo pendiente).`);
      return;
    }

    // Mostrar confirmación de revisión del carrito
    setShowReviewConfirm(true);
  }

  function checkCreditAndSubmit() {
    setShowReviewConfirm(false);
    const abonoPago = n(abono);

    // Si hay productos en el carrito y el abono no cubre el total, mostrar advertencia
    if (!soloAbono && abonoPago < total) {
      const faltante = total - abonoPago;
      setCreditWarning({ faltante });
      return;
    }

    doSubmit();
  }

  async function doSubmit() {
    setCreditWarning(null);
    setError(null);
    if (!state.session) { setError("No hay sesión."); return; }
    if (!state.selectedClient) { setError("Selecciona un cliente."); return; }
    if (!soloAbono && state.cart.length === 0) { setError("El carrito está vacío."); return; }

    const abonoPago = n(abono);
    if (abonoPago < 0) { setError("El abono no puede ser negativo."); return; }

    const pagoConActual = n(pagoCon);
    const cambioActual = pagoConActual > abonoPago ? pagoConActual - abonoPago : 0;
    
    const payload = {
      usuario_id: state.session.usuario_id,
      cliente_id: state.selectedClient.id,
      ruta_id: state.session.rutaId,
      tipo_pago: tipoPago,
      abono_pago: abonoPago,
      pago_cliente: pagoConActual,
      cambio: cambioActual,
      folio_ticket: null,
      items: soloAbono ? [] : state.cart.map((it) => ({
        producto_id: it.producto_id,
        cantidad: it.cantidad ?? 0,
        kilos: it.kilos ?? 0,
        precio_unitario: n(it.precio_base),
        descuento_unitario: n(it.discount_unit),
        subtotal: subtotal(it),
      })),
    };

    setLoading(true);
    try {
      const res: any = await registrarVenta(payload);
      setConfirm(res);

      // Ticket: construimos un ticket imprimible (venta o solo abono)
      const fecha_iso = new Date().toISOString();
      
      if (soloAbono) {
        // Ticket de solo abono (sin productos)
        const rutaId = state.session.rutaId || (state.selectedClient as any)?.rutaId || "";
        const ticket: HistorialVenta = {
          id: `ticket_abono_${Date.now()}`,
          folio: String(res?.folio_ticket || "—"),
          fecha_iso,
          ruta: String(rutaId),
          ruta_nombre: String(rutaId),
          cliente_id: String(state.selectedClient?.id || ""),
          cliente_nombre: String(state.selectedClient?.nombre || ""),
          vendedor_id: String(state.session.usuario_id),
          vendedor_nombre: String(state.session.nombre || ""),
          tipo_pago: "abono",
          subtotal_base: 0,
          descuentos: 0,
          total: 0,
          abono: n(abonoPago),
          saldo_anterior: n(res?.saldo_anterior ?? saldoAnterior),
          saldo_final: n(res?.saldo_final),
          items: [{
            producto: "ABONO",
            tipo_venta: "unidad",
            cantidad: 1,
            kilos: 0,
            precio_unitario: n(abonoPago),
            descuento_unitario: 0,
            subtotal: n(abonoPago),
          }],
        };
        setLastTicket(ticket);
        setShowTicket(true);
      } else {
        const items = state.cart.map((it) => {
          const isMixto = it.requiere_piezas;
          const qty = it.tipo_venta === "unidad" ? n(it.cantidad) : n(it.kilos);
          const precio_unitario = n(it.precio_base);
          const descuento_unitario = n(it.discount_unit);
          const precio_final = Math.max(precio_unitario - descuento_unitario, 0);
          return {
            producto: it.nombre,
            tipo_venta: it.tipo_venta,
            unidad: isMixto ? "MIXTO" : (it.tipo_venta === "unidad" ? "PIEZA" : "KG"),
            cantidad: n(it.cantidad),
            piezas: isMixto ? n(it.cantidad) : (it.tipo_venta === "unidad" ? n(it.cantidad) : 0),
            kilos: n(it.kilos),
            precio_unitario,
            descuento_unitario,
            subtotal: qty * precio_final,
          };
        });

        const subtotal_base_calc = items.reduce((acc: number, it: any) => {
          const q = it.tipo_venta === "unidad" ? n(it.cantidad) : n(it.kilos);
          return acc + q * n(it.precio_unitario);
        }, 0);
        const descuentos_calc = items.reduce((acc: number, it: any) => {
          const q = it.tipo_venta === "unidad" ? n(it.cantidad) : n(it.kilos);
          return acc + q * n(it.descuento_unitario);
        }, 0);
        const total_calc = subtotal_base_calc - descuentos_calc;

        const rutaIdVenta = state.session.rutaId || (state.selectedClient as any)?.rutaId || "";
        const ticket: HistorialVenta = {
          id: `ticket_${Date.now()}`,
          folio: String(res?.folio_ticket || "—"),
          fecha_iso,
          ruta: String(rutaIdVenta),
          ruta_nombre: String(rutaIdVenta),
          cliente_id: String(state.selectedClient?.id || ""),
          cliente_nombre: String(state.selectedClient?.nombre || ""),
          vendedor_id: String(state.session.usuario_id),
          vendedor_nombre: String(state.session.nombre || ""),
          tipo_pago: String(tipoPago),
          subtotal_base: n(subtotal_base_calc),
          descuentos: n(descuentos_calc),
          total: n(total_calc),
          abono: n(abonoPago),
          saldo_anterior: n(res?.saldo_anterior ?? saldoAnterior),
          saldo_final: n(res?.saldo_final),
          pago_cliente: pagoConNum,
          cambio: cambio,
          items,
        };

        setLastTicket(ticket);
      }

      toast({ title: "Enviado", description: "Venta registrada." });
      dispatch({ type: "CART_CLEAR" });
      dispatch({ type: "CLIENT_SET", client: null });
    } catch (e: any) {
      setError(e?.message || "Error al registrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Checkout">
      <div className="grid gap-4 pb-24">
        {!state.selectedClient && (
          <Alert variant="destructive" className="rounded-2xl border-none bg-destructive/10 text-destructive">
            <AlertDescription className="font-bold">Selecciona un cliente para continuar.</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="rounded-2xl border-none bg-destructive/10 text-destructive">
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Productos</h2>
              <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "CART_CLEAR" })} disabled={state.cart.length === 0} className="h-7 text-[10px] font-black uppercase">Vaciar</Button>
            </div>

            <div className="grid gap-2">
              {state.cart.length === 0 ? (
                <Card className="p-8 text-center rounded-3xl bg-muted/20 border-dashed">
                  <div className="text-xs font-bold text-muted-foreground uppercase">Tu carrito está vacío</div>
                </Card>
              ) : (
                state.cart.map((it, idx) => (
                  <Card key={`${it.producto_id}-${idx}`} className="p-3 shadow-sm border-none bg-card/60 rounded-2xl" data-testid={`card-cart-item-${idx}`}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{it.nombre}</div>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] font-bold">
                          {n(it.discount_unit) > 0 && (
                            <span className="text-muted-foreground line-through decoration-destructive/50">
                              ${n(it.precio_base).toFixed(2)}
                            </span>
                          )}
                          <span className="text-primary">
                            ${n(it.precio_aplicado).toFixed(2)} {it.tipo_venta === 'unidad' ? 'PZ' : 'KG'}
                          </span>
                          {n(it.discount_unit) > 0 && (
                            <Badge variant="secondary" className="h-4 text-[8px] bg-primary/10 text-primary border-none px-1 uppercase">
                              -${n(it.discount_unit)} DTO
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => dispatch({ type: "CART_REMOVE", index: idx })}>
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {it.tipo_venta === "unidad" ? (
                        <Input
                          className="h-9 rounded-xl bg-background border-none text-center font-bold text-sm"
                          inputMode="numeric"
                          value={String(it.cantidad ?? 0)}
                          onChange={(e) => dispatch({ type: "CART_UPDATE", index: idx, patch: { cantidad: n(e.target.value) } })}
                        />
                      ) : (
                        <div className="flex flex-1 gap-2">
                          <Input
                            className="h-9 rounded-xl bg-background border-none text-center font-bold text-sm"
                            inputMode="decimal"
                            value={String(it.kilos ?? 0)}
                            onChange={(e) => dispatch({ type: "CART_UPDATE", index: idx, patch: { kilos: n(e.target.value) } })}
                          />
                          {it.requiere_piezas && (
                            <Input
                              className="h-9 rounded-xl bg-background border-none text-center font-bold text-sm"
                              inputMode="numeric"
                              value={String(it.cantidad ?? 0)}
                              onChange={(e) => dispatch({ type: "CART_UPDATE", index: idx, patch: { cantidad: n(e.target.value) } })}
                            />
                          )}
                        </div>
                      )}
                      <div className="min-w-[60px] text-right text-sm font-black text-primary">
                        ${subtotal(it).toFixed(2)}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section className="grid gap-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Resumen y Pago</h2>
            <Card className="p-4 shadow-xl border-none bg-card rounded-3xl">
              <div className="grid gap-3">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Base</span>
                  <span className="text-sm font-bold">${subtotalBase.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <>
                    <div className="flex justify-between items-center text-primary">
                      <span className="text-[10px] font-black uppercase tracking-widest">Descuentos</span>
                      <span className="text-sm font-bold">-${totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-2xl bg-green-500/10 border border-green-500/30">
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Total con Descuentos</span>
                      <span className="text-lg font-black text-green-600">${total.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-[10px] font-black uppercase tracking-widest">Saldo Anterior</span>
                  <span className="text-sm font-bold">{saldoAnteriorNum > 0 ? `$${saldoAnteriorNum.toFixed(2)}` : "—"}</span>
                </div>
                
                {saldoAnteriorNum > 0 && (
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Total con Saldo</span>
                    <span className="text-lg font-black text-amber-600">${totalConSaldo.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-b border-dashed pb-3"></div>

                <div className="grid gap-4 mt-2">
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Abono del Cliente (máx: ${maximoAbono.toFixed(2)})</Label>
                    <Input className="h-12 rounded-2xl bg-muted/30 border-none text-lg font-black text-center" inputMode="decimal" value={abono} onChange={(e) => setAbono(e.target.value)} />
                  </div>
                  
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cliente pagó con</Label>
                    <Input className="h-12 rounded-2xl bg-muted/30 border-none text-lg font-black text-center" inputMode="decimal" placeholder="$0.00" value={pagoCon} onChange={(e) => setPagoCon(e.target.value)} />
                  </div>
                  
                  {cambio > 0 && (
                    <div className="flex justify-between items-center p-3 rounded-2xl bg-green-500/10 border border-green-500/30">
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Cambio</span>
                      <span className="text-xl font-black text-green-600">${cambio.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Método de Pago</Label>
                    <div className="h-12 rounded-2xl bg-muted/30 border-none font-bold uppercase text-xs tracking-widest flex items-center justify-center">
                      EFECTIVO
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-muted">
                    <div className="grid">
                      <span className="text-[10px] font-black uppercase tracking-tighter">Solo Abono</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Sin compra</span>
                    </div>
                    <Button
                      variant={soloAbono ? "default" : "secondary"}
                      size="sm"
                      className="rounded-full font-black uppercase text-[10px] h-7"
                      onClick={() => setSoloAbono(!soloAbono)}
                    >
                      {soloAbono ? "SÍ" : "NO"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center p-4 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <div className="grid">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Total a Cobrar</span>
                    <span className="text-2xl font-black tracking-tighter">${total.toFixed(2)}</span>
                  </div>
                  <Button onClick={handleEnviarClick} disabled={loading} className="rounded-xl h-12 bg-white text-primary hover:bg-white/90 font-black uppercase px-6">
                    {loading ? "..." : "Enviar"}
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        </div>

        <Dialog open={showReviewConfirm} onOpenChange={(v) => !v && setShowReviewConfirm(false)}>
          <DialogContent className="max-w-[90%] rounded-3xl" data-testid="modal-review-confirm">
            <DialogHeader>
              <DialogTitle className="text-center font-black uppercase text-primary">Confirmar Venta</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div className="text-center text-lg font-bold">
                ¿Has revisado el carrito?
              </div>
              <div className="text-center text-sm text-muted-foreground mb-2">
                {state.cart.length} producto(s) · Total: ${total.toFixed(2)}
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-muted/30">
                {state.cart.map((it, idx) => {
                  const tipoVenta = it.tipo_venta || "unidad";
                  let cantidadStr = "";
                  // MIXTO: requiere_piezas=true y tiene kilos
                  if (it.requiere_piezas && it.kilos) {
                    const pzs = it.cantidad || 0;
                    const kgs = it.kilos || 0;
                    cantidadStr = `${pzs} Pzas / ${kgs.toFixed(2)} Kg`;
                  } else if (tipoVenta === "peso") {
                    cantidadStr = `${(it.kilos || 0).toFixed(2)} Kg`;
                  } else {
                    cantidadStr = `${it.cantidad || 0} Pzas`;
                  }
                  return (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span className="font-medium">{it.nombre || "Producto"}</span>
                      <span className="text-muted-foreground">{cantidadStr} · ${subtotal(it).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <DialogFooter className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="rounded-2xl font-black uppercase" onClick={() => setShowReviewConfirm(false)} data-testid="button-review-no">
                No, revisar
              </Button>
              <Button className="rounded-2xl font-black uppercase" onClick={checkCreditAndSubmit} data-testid="button-review-yes">
                Sí, enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!creditWarning} onOpenChange={(v) => !v && setCreditWarning(null)}>
          <DialogContent className="max-w-[90%] rounded-3xl" data-testid="modal-credit-warning">
            <DialogHeader>
              <DialogTitle className="text-center font-black uppercase text-destructive">Advertencia</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div className="text-center text-sm font-bold">
                El cliente le falta por pagar:
              </div>
              <div className="text-center text-2xl font-black text-destructive">
                ${creditWarning?.faltante.toFixed(2)}
              </div>
              <div className="text-center text-xs font-bold text-muted-foreground">
                ¿Agregar este monto a crédito?
              </div>
            </div>
            <DialogFooter className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="rounded-2xl font-black uppercase" onClick={() => setCreditWarning(null)} data-testid="button-cancel-credit">
                Cancelar
              </Button>
              <Button variant="destructive" className="rounded-2xl font-black uppercase" onClick={doSubmit} data-testid="button-confirm-credit">
                Sí, a crédito
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
          <DialogContent className="max-w-[90%] rounded-3xl" data-testid="modal-confirmacion">
            <DialogHeader>
              <DialogTitle className="text-center font-black uppercase">¡Registro Exitoso!</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tighter text-muted-foreground border-b border-dashed pb-2">
                <span>Folio</span>
                <span className="text-foreground">{confirm?.folio_ticket || '—'}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black uppercase">
                <span>Total</span>
                <span className="text-primary">${n(confirm?.total_ticket).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold uppercase text-muted-foreground">
                <span>Saldo Final</span>
                <span className="text-foreground">${n(confirm?.saldo_final).toFixed(2)}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                variant="secondary"
                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest gap-2"
                disabled={!lastTicket}
                onClick={() => { setShowTicket(true); setConfirm(null); }}
                data-testid="button-print-last-ticket"
              >
                <PrinterIcon className="h-4 w-4" /> Imprimir ticket
              </Button>
              <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest" onClick={() => setConfirm(null)} data-testid="button-close-confirm">Entendido</Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <TicketModal 
          venta={lastTicket} 
          open={showTicket} 
          onClose={() => setShowTicket(false)}
          isAbono={lastTicket?.tipo_pago === "abono"}
          onVolver={() => {
            setShowTicket(false);
            window.location.href = "/";
          }}
        />
      </div>
    </AppShell>
  );
}
