import * as React from "react";
import type { HistorialVenta } from "@/services/historial";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrinterIcon, XIcon } from "lucide-react";

function n(v: any) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function fmtMoney(v: any) {
  return `$${n(v).toFixed(2)}`;
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export function TicketPrint({ venta }: { venta: HistorialVenta }) {
  const chargedQty = (it: any) => (it.tipo_venta === "unidad" ? n(it.cantidad) : n(it.kilos));

  return (
    <div className="ticket" data-testid="ticket-root">
      <div className="ticket__center ticket__title" data-testid="ticket-title">VENTAS POR RUTA</div>
      <div className="ticket__center ticket__muted" data-testid="ticket-subtitle">Ticket de venta</div>

      <div className="ticket__hr" />

      <div className="ticket__row" data-testid="ticket-row-folio">
        <span>Folio</span>
        <span className="ticket__strong">{venta.folio || "—"}</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-fecha">
        <span>Fecha</span>
        <span>{fmtDate(venta.fecha_iso)}</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-cliente">
        <span>Cliente</span>
        <span className="ticket__right ticket__strong">{venta.cliente_nombre}</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-vendedor">
        <span>Vendedor</span>
        <span className="ticket__right">{venta.vendedor_nombre}</span>
      </div>

      <div className="ticket__hr" />

      <div className="ticket__muted" data-testid="ticket-items-title">DETALLE</div>
      <div className="ticket__items" data-testid="ticket-items">
        {venta.items.map((it, idx) => {
          const qty = chargedQty(it);
          const unit = it.tipo_venta === "unidad" ? "PZ" : "KG";
          const priceBase = n(it.precio_unitario);
          const dto = n(it.descuento_unitario);
          const priceFinal = Math.max(priceBase - dto, 0);
          const lineTotal = qty * priceFinal;

          return (
            <div className="ticket__item" key={idx} data-testid={`ticket-item-${idx}`}>
              <div className="ticket__item-name">{it.producto}</div>
              <div className="ticket__item-meta">
                <span>{qty.toFixed(it.tipo_venta === "unidad" ? 0 : 3)} {unit}</span>
                <span>
                  {dto > 0 ? (
                    <>
                      <span className="ticket__strike">{fmtMoney(priceBase)}</span> {fmtMoney(priceFinal)}
                    </>
                  ) : (
                    <>{fmtMoney(priceBase)}</>
                  )}
                </span>
              </div>
              {dto > 0 ? (
                <div className="ticket__item-meta ticket__muted">
                  <span>DTO</span>
                  <span>-{fmtMoney(dto * qty)}</span>
                </div>
              ) : null}
              <div className="ticket__item-total">{fmtMoney(lineTotal)}</div>
            </div>
          );
        })}
      </div>

      <div className="ticket__hr" />

      <div className="ticket__row" data-testid="ticket-row-subtotal">
        <span>Subtotal</span>
        <span>{fmtMoney(venta.subtotal_base)}</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-descuentos">
        <span>Descuentos</span>
        <span>-{fmtMoney(venta.descuentos)}</span>
      </div>
      <div className="ticket__row ticket__total" data-testid="ticket-row-total">
        <span>TOTAL</span>
        <span>{fmtMoney(venta.total)}</span>
      </div>

      <div className="ticket__hr" />

      <div className="ticket__row" data-testid="ticket-row-tipo-pago">
        <span>Pago</span>
        <span className="ticket__right">{venta.tipo_pago.toUpperCase()}</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-abono">
        <span>Abono</span>
        <span className="ticket__right">{fmtMoney(venta.abono)}</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-saldo-anterior">
        <span>Saldo ant.</span>
        <span className="ticket__right">{fmtMoney(venta.saldo_anterior)}</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-saldo-final">
        <span>Saldo final</span>
        <span className="ticket__right ticket__strong">{fmtMoney(venta.saldo_final)}</span>
      </div>

      <div className="ticket__hr" />

      <div className="ticket__center ticket__muted" data-testid="ticket-footer">
        Gracias por su compra
      </div>
    </div>
  );
}

export function openTicketPrintWindow(venta: HistorialVenta) {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  const doc = w.document;
  doc.open();
  doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ticket ${String(venta.folio || "")}</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; padding: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background: #fff; color: #111; }
    /* 58mm approx: 220px @ 96dpi (varies). We'll use 280px for safer readability. */
    .page { width: 280px; margin: 0 auto; padding: 10px 10px 16px; }
    .ticket { font-size: 12px; line-height: 1.25; }
    .ticket__title { font-size: 14px; letter-spacing: 0.08em; font-weight: 800; }
    .ticket__center { text-align: center; }
    .ticket__right { text-align: right; }
    .ticket__muted { color: #555; }
    .ticket__strong { font-weight: 800; }
    .ticket__hr { border-top: 1px dashed #999; margin: 10px 0; }
    .ticket__row { display: flex; justify-content: space-between; gap: 10px; }
    .ticket__items { display: grid; gap: 10px; }
    .ticket__item { border-bottom: 1px dotted #ddd; padding-bottom: 8px; }
    .ticket__item-name { font-weight: 800; }
    .ticket__item-meta { display: flex; justify-content: space-between; gap: 10px; }
    .ticket__item-total { text-align: right; font-weight: 900; margin-top: 4px; }
    .ticket__total { font-size: 14px; font-weight: 900; }
    .ticket__strike { text-decoration: line-through; opacity: 0.75; }

    @media print {
      body { background: #fff; }
      .page { width: 58mm; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div id="root"></div>
  </div>
  <script>
    window.__VENTA__ = ${JSON.stringify(venta)};
  </script>
</body>
</html>`);
  doc.close();

  const root = doc.getElementById("root");
  if (!root) return;

  // Render minimal HTML (no React in print window)
  const v = (w as any).__VENTA__;

  function esc(s: unknown) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function num(x: unknown) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }

  function money(x: unknown) {
    return "$" + num(x).toFixed(2);
  }

  function fmt(iso: unknown) {
    try {
      return new Date(String(iso)).toLocaleString();
    } catch {
      return String(iso);
    }
  }

  function qty(it: any) {
    return it.tipo_venta === "unidad" ? num(it.cantidad) : num(it.kilos);
  }

  const itemsHtml = (v.items || []).map((it: any) => {
    const q = qty(it);
    const unit = it.tipo_venta === "unidad" ? "PZ" : "KG";
    const base = num(it.precio_unitario);
    const dto = num(it.descuento_unitario);
    const final = Math.max(base - dto, 0);
    const lineTotal = q * final;

    return `
      <div class="ticket__item">
        <div class="ticket__item-name">${esc(it.producto)}</div>
        <div class="ticket__item-meta"><span>${q.toFixed(it.tipo_venta === "unidad" ? 0 : 3)} ${unit}</span><span>${dto > 0 ? `<span class=\"ticket__strike\">${money(base)}</span> ${money(final)}` : money(base)}</span></div>
        ${dto > 0 ? `<div class=\"ticket__item-meta ticket__muted\"><span>DTO</span><span>-${money(dto * q)}</span></div>` : ""}
        <div class="ticket__item-total">${money(lineTotal)}</div>
      </div>
    `;
  }).join("");

  root.innerHTML = `
    <div class="ticket">
      <div class="ticket__center ticket__title">VENTAS POR RUTA</div>
      <div class="ticket__center ticket__muted">Ticket de venta</div>
      <div class="ticket__hr"></div>

      <div class="ticket__row"><span>Folio</span><span class="ticket__strong">${esc(v.folio || "—")}</span></div>
      <div class="ticket__row"><span>Fecha</span><span>${esc(fmt(v.fecha_iso))}</span></div>
      <div class="ticket__row"><span>Cliente</span><span class="ticket__right ticket__strong">${esc(v.cliente_nombre || "")}</span></div>
      <div class="ticket__row"><span>Vendedor</span><span class="ticket__right">${esc(v.vendedor_nombre || "")}</span></div>

      <div class="ticket__hr"></div>
      <div class="ticket__muted">DETALLE</div>
      <div class="ticket__items">${itemsHtml}</div>

      <div class="ticket__hr"></div>
      <div class="ticket__row"><span>Subtotal</span><span>${money(v.subtotal_base)}</span></div>
      <div class="ticket__row"><span>Descuentos</span><span>-${money(v.descuentos)}</span></div>
      <div class="ticket__row ticket__total"><span>TOTAL</span><span>${money(v.total)}</span></div>

      <div class="ticket__hr"></div>
      <div class="ticket__row"><span>Pago</span><span class="ticket__right">${esc(String(v.tipo_pago || "").toUpperCase())}</span></div>
      <div class="ticket__row"><span>Abono</span><span class="ticket__right">${money(v.abono)}</span></div>
      <div class="ticket__row"><span>Saldo ant.</span><span class="ticket__right">${money(v.saldo_anterior)}</span></div>
      <div class="ticket__row"><span>Saldo final</span><span class="ticket__right ticket__strong">${money(v.saldo_final)}</span></div>

      <div class="ticket__hr"></div>
      <div class="ticket__center ticket__muted">Gracias por su compra</div>
    </div>
  `;

  w.focus();
  setTimeout(() => w.print(), 250);
}

// Modal version for Android compatibility
interface TicketModalProps {
  venta: HistorialVenta | null;
  open: boolean;
  onClose: () => void;
}

export function TicketModal({ venta, open, onClose }: TicketModalProps) {
  const ticketRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!ticketRef.current) return;
    
    const printContent = ticketRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Ticket</title>
          <style>
            body { margin: 0; padding: 10px; font-family: monospace; font-size: 12px; }
            .ticket-modal-content { width: 58mm; margin: 0 auto; }
            .ticket__title { font-size: 14px; font-weight: 800; text-align: center; }
            .ticket__center { text-align: center; }
            .ticket__muted { color: #666; }
            .ticket__strong { font-weight: 800; }
            .ticket__hr { border-top: 1px dashed #999; margin: 8px 0; }
            .ticket__row { display: flex; justify-content: space-between; margin: 4px 0; }
            .ticket__right { text-align: right; }
            .ticket__items { margin: 8px 0; }
            .ticket__item { border-bottom: 1px dotted #ddd; padding-bottom: 6px; margin-bottom: 6px; }
            .ticket__item-name { font-weight: 800; }
            .ticket__item-meta { display: flex; justify-content: space-between; }
            .ticket__item-total { text-align: right; font-weight: 900; }
            .ticket__total { font-size: 14px; font-weight: 900; }
            .ticket__strike { text-decoration: line-through; opacity: 0.7; }
            @media print { body { padding: 0; } .ticket-modal-content { width: 58mm; } }
          </style>
        </head>
        <body>
          <div class="ticket-modal-content">${printContent}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  if (!venta) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[340px] max-h-[90vh] overflow-y-auto rounded-3xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-center">
            Ticket de Venta
          </DialogTitle>
          <DialogDescription className="sr-only">Vista previa del ticket para imprimir</DialogDescription>
        </DialogHeader>
        
        <div className="px-4 pb-4">
          <div 
            ref={ticketRef}
            className="bg-white text-black p-3 rounded-xl text-xs font-mono leading-tight"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
          >
            <div className="ticket__center ticket__title">VENTAS POR RUTA</div>
            <div className="ticket__center ticket__muted text-[10px]">Ticket de venta</div>
            
            <div className="ticket__hr" />
            
            <div className="ticket__row"><span>Folio</span><span className="ticket__strong">{venta.folio || "—"}</span></div>
            <div className="ticket__row"><span>Fecha</span><span>{fmtDate(venta.fecha_iso)}</span></div>
            <div className="ticket__row"><span>Cliente</span><span className="ticket__right ticket__strong">{venta.cliente_nombre}</span></div>
            <div className="ticket__row"><span>Vendedor</span><span className="ticket__right">{venta.vendedor_nombre}</span></div>
            
            <div className="ticket__hr" />
            
            <div className="ticket__muted text-[10px] mb-1">DETALLE</div>
            <div className="ticket__items">
              {venta.items.map((it, idx) => {
                const qty = it.tipo_venta === "unidad" ? n(it.cantidad) : n(it.kilos);
                const unit = it.tipo_venta === "unidad" ? "PZ" : "KG";
                const priceBase = n(it.precio_unitario);
                const dto = n(it.descuento_unitario);
                const priceFinal = Math.max(priceBase - dto, 0);
                const lineTotal = qty * priceFinal;
                
                return (
                  <div key={idx} className="ticket__item">
                    <div className="ticket__item-name">{it.producto}</div>
                    <div className="ticket__item-meta">
                      <span>{qty.toFixed(it.tipo_venta === "unidad" ? 0 : 2)} {unit}</span>
                      <span>
                        {dto > 0 ? (
                          <><span className="ticket__strike">{fmtMoney(priceBase)}</span> {fmtMoney(priceFinal)}</>
                        ) : fmtMoney(priceBase)}
                      </span>
                    </div>
                    {dto > 0 && (
                      <div className="ticket__item-meta ticket__muted">
                        <span>DTO</span><span>-{fmtMoney(dto * qty)}</span>
                      </div>
                    )}
                    <div className="ticket__item-total">{fmtMoney(lineTotal)}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="ticket__hr" />
            
            <div className="ticket__row"><span>Subtotal</span><span>{fmtMoney(venta.subtotal_base)}</span></div>
            <div className="ticket__row"><span>Descuentos</span><span>-{fmtMoney(venta.descuentos)}</span></div>
            <div className="ticket__row ticket__total"><span>TOTAL</span><span>{fmtMoney(venta.total)}</span></div>
            
            <div className="ticket__hr" />
            
            <div className="ticket__row"><span>Pago</span><span className="ticket__right">{venta.tipo_pago.toUpperCase()}</span></div>
            <div className="ticket__row"><span>Abono</span><span className="ticket__right">{fmtMoney(venta.abono)}</span></div>
            <div className="ticket__row"><span>Saldo ant.</span><span className="ticket__right">{fmtMoney(venta.saldo_anterior)}</span></div>
            <div className="ticket__row"><span>Saldo final</span><span className="ticket__right ticket__strong">{fmtMoney(venta.saldo_final)}</span></div>
            
            <div className="ticket__hr" />
            
            <div className="ticket__center ticket__muted text-[10px]">Gracias por su compra</div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              variant="secondary" 
              className="flex-1 h-12 rounded-2xl font-black uppercase text-xs gap-2"
              onClick={onClose}
              data-testid="button-close-ticket"
            >
              <XIcon className="h-4 w-4" /> Cerrar
            </Button>
            <Button 
              className="flex-1 h-12 rounded-2xl font-black uppercase text-xs gap-2"
              onClick={handlePrint}
              data-testid="button-print-ticket"
            >
              <PrinterIcon className="h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function openDailyReportPrintWindow(ventas: HistorialVenta[], fecha: string, rutaNombre?: string) {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  const doc = w.document;
  doc.open();
  
  const fechaDisplay = fecha ? new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Hoy";
  
  const totalVentas = ventas.reduce((sum, v) => sum + n(v.total), 0);
  const totalDescuentos = ventas.reduce((sum, v) => sum + n(v.descuentos), 0);
  const totalAbonos = ventas.reduce((sum, v) => sum + n(v.abono), 0);
  const ventasContado = ventas.filter(v => v.tipo_pago === "contado").length;
  const ventasCredito = ventas.filter(v => v.tipo_pago === "credito").length;
  const ventasParciales = ventas.filter(v => v.tipo_pago === "parcial").length;

  function esc(s: unknown) {
    return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  function money(x: unknown) {
    const num = Number(x);
    return "$" + (Number.isFinite(num) ? num : 0).toFixed(2);
  }

  function fmtTime(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  const ventasHtml = ventas.map((v) => `
    <tr>
      <td style="padding:4px;border-bottom:1px solid #eee;font-size:11px;">${esc(fmtTime(v.fecha_iso))}</td>
      <td style="padding:4px;border-bottom:1px solid #eee;font-size:11px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(v.cliente_nombre)}</td>
      <td style="padding:4px;border-bottom:1px solid #eee;font-size:11px;text-align:center;">${esc(v.tipo_pago.charAt(0).toUpperCase())}</td>
      <td style="padding:4px;border-bottom:1px solid #eee;font-size:11px;text-align:right;font-weight:700;">${money(v.total)}</td>
    </tr>
  `).join("");

  doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reporte ${fecha}</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; padding: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background: #fff; color: #111; }
    .page { width: 280px; margin: 0 auto; padding: 10px 10px 16px; }
    .title { font-size: 14px; letter-spacing: 0.08em; font-weight: 800; text-align: center; }
    .subtitle { font-size: 11px; text-align: center; color: #555; margin-top: 2px; }
    .hr { border-top: 1px dashed #999; margin: 10px 0; }
    .row { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; margin: 4px 0; }
    .row-bold { font-weight: 800; }
    .total-row { font-size: 14px; font-weight: 900; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 4px; font-size: 10px; text-align: left; border-bottom: 2px solid #333; font-weight: 800; }
    .footer { text-align: center; font-size: 10px; color: #555; margin-top: 10px; }
    @media print {
      body { background: #fff; }
      .page { width: 58mm; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="title">REPORTE DEL DIA</div>
    <div class="subtitle">${esc(fechaDisplay)}</div>
    ${rutaNombre ? `<div class="subtitle">${esc(rutaNombre)}</div>` : ""}
    
    <div class="hr"></div>
    
    <div class="row row-bold"><span>Total ventas:</span><span>${ventas.length}</span></div>
    <div class="row"><span>Contado:</span><span>${ventasContado}</span></div>
    <div class="row"><span>Credito:</span><span>${ventasCredito}</span></div>
    <div class="row"><span>Parcial:</span><span>${ventasParciales}</span></div>
    
    <div class="hr"></div>
    
    <div class="row"><span>Subtotal:</span><span>${money(totalVentas + totalDescuentos)}</span></div>
    <div class="row"><span>Descuentos:</span><span>-${money(totalDescuentos)}</span></div>
    <div class="row"><span>Total vendido:</span><span>${money(totalVentas)}</span></div>
    
    <div class="hr"></div>
    
    <div class="row" style="color:#16a34a;"><span>Cobrado (efectivo):</span><span>${money(totalAbonos)}</span></div>
    <div class="row" style="color:#ef4444;"><span>Pendiente (credito):</span><span>${money(totalVentas - totalAbonos)}</span></div>
    <div class="row total-row"><span>DINERO RECIBIDO:</span><span>${money(totalAbonos)}</span></div>
    
    <div class="hr"></div>
    
    <table>
      <thead>
        <tr>
          <th>Hora</th>
          <th>Cliente</th>
          <th>Tipo</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${ventasHtml}
      </tbody>
    </table>
    
    <div class="hr"></div>
    <div class="footer">Generado: ${new Date().toLocaleString("es-MX")}</div>
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`);
  doc.close();
}

export function ReportModal({ 
  ventas, 
  fecha, 
  rutaNombre,
  open, 
  onClose 
}: { 
  ventas: HistorialVenta[]; 
  fecha: string;
  rutaNombre?: string;
  open: boolean; 
  onClose: () => void;
}) {
  const totalVentas = ventas.reduce((sum, v) => sum + n(v.total), 0);
  const totalDescuentos = ventas.reduce((sum, v) => sum + n(v.descuentos), 0);
  const totalAbonos = ventas.reduce((sum, v) => sum + n(v.abono), 0);
  const ventasContado = ventas.filter(v => v.tipo_pago === "contado").length;
  const ventasCredito = ventas.filter(v => v.tipo_pago === "credito").length;
  const ventasParciales = ventas.filter(v => v.tipo_pago === "parcial").length;
  
  const fechaDisplay = fecha ? new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Hoy";

  function handlePrint() {
    openDailyReportPrintWindow(ventas, fecha, rutaNombre);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95%] sm:max-w-[400px] rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-center" data-testid="text-report-title">
            Reporte del Dia
          </DialogTitle>
          <DialogDescription className="text-center text-xs font-medium">
            {fechaDisplay}
            {rutaNombre && <span className="block text-primary">{rutaNombre}</span>}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-muted/30 rounded-2xl p-4 grid gap-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Total ventas:</span>
              <span>{ventas.length}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Contado:</span>
              <span>{ventasContado}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Credito:</span>
              <span>{ventasCredito}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Parcial (contado+credito):</span>
              <span>{ventasParciales}</span>
            </div>
            
            <div className="border-t border-muted my-2" />
            
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>{fmtMoney(totalVentas + totalDescuentos)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Descuentos:</span>
              <span>-{fmtMoney(totalDescuentos)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Total vendido:</span>
              <span>{fmtMoney(totalVentas)}</span>
            </div>
            
            <div className="border-t border-muted my-2" />
            
            <div className="flex justify-between text-xs text-green-600">
              <span>Cobrado (efectivo):</span>
              <span>{fmtMoney(totalAbonos)}</span>
            </div>
            <div className="flex justify-between text-xs text-red-500">
              <span>Pendiente (credito):</span>
              <span>{fmtMoney(totalVentas - totalAbonos)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-primary">
              <span>DINERO RECIBIDO:</span>
              <span>{fmtMoney(totalAbonos)}</span>
            </div>
          </div>
          
          <div className="mt-4 grid gap-2 max-h-[200px] overflow-y-auto">
            {ventas.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-xs bg-card/60 rounded-xl p-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{v.cliente_nombre}</div>
                  <div className="text-[10px] text-muted-foreground">{fmtDate(v.fecha_iso)}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-primary">{fmtMoney(v.total)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{v.tipo_pago}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              variant="secondary" 
              className="flex-1 h-12 rounded-2xl font-black uppercase text-xs gap-2"
              onClick={onClose}
              data-testid="button-close-report"
            >
              <XIcon className="h-4 w-4" /> Cerrar
            </Button>
            <Button 
              className="flex-1 h-12 rounded-2xl font-black uppercase text-xs gap-2"
              onClick={handlePrint}
              data-testid="button-print-report"
            >
              <PrinterIcon className="h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
