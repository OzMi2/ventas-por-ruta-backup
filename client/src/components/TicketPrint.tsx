import * as React from "react";
import type { HistorialVenta } from "@/services/historial";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrinterIcon, XIcon, ShareIcon, HomeIcon, MessageCircleIcon } from "lucide-react";
import html2canvas from "html2canvas";

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

function fmtDateTicket(iso: string) {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  } catch {
    return iso;
  }
}

function getTipoPagoLabel(tipo: string) {
  const t = tipo?.toLowerCase() || "";
  if (t === "contado") return "Venta a Contado";
  if (t === "credito") return "Venta a Crédito";
  if (t === "parcial" || t === "mixto") return "Venta Mixta";
  if (t === "abono") return "ABONO";
  return tipo?.toUpperCase() || "";
}

export function TicketPrint({ venta }: { venta: HistorialVenta }) {
  const chargedQty = (it: any) => (it.tipo_venta === "unidad" ? n(it.cantidad) : n(it.kilos));
  const isAbono = venta.tipo_pago?.toLowerCase() === "abono";

  return (
    <div className="ticket" data-testid="ticket-root">
      <div className="ticket__center ticket__title" data-testid="ticket-title">Garlo Alimentos</div>
      <div className="ticket__center ticket__muted text-[9px]" data-testid="ticket-address">
        Filemon Valenzuela #410, Col. Industrial Ladrillera. CP. 34289
      </div>
      <div className="ticket__center ticket__muted" data-testid="ticket-phone">Telefono: 618-1359-407</div>

      <div className="ticket__hr" />

      <div className="ticket__row" data-testid="ticket-row-ruta">
        <span className="ticket__strong">Ruta "{(venta as any).ruta_nombre || "—"}"</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-vendedor">
        <span>Le atendió:</span>
        <span className="ticket__right">{venta.vendedor_nombre}</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-cliente">
        <span>Cliente:</span>
        <span className="ticket__right ticket__strong">{venta.cliente_id} – {venta.cliente_nombre}</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-fecha">
        <span>{isAbono ? "Abono:" : "Venta:"}</span>
        <span>{fmtDateTicket(venta.fecha_iso)}</span>
      </div>
      <div className="ticket__row" data-testid="ticket-row-tipo-pago">
        <span className="ticket__strong">{getTipoPagoLabel(venta.tipo_pago)}</span>
      </div>

      <div className="ticket__hr" />

      {isAbono ? (
        <>
          <div className="ticket__center ticket__strong" data-testid="ticket-abono-title">RECIBO DE ABONO</div>
          <div className="ticket__hr" />
          <div className="ticket__row ticket__strong" data-testid="ticket-abono-monto">
            <span>Monto abonado:</span>
            <span>{fmtMoney(venta.abono)}</span>
          </div>
          <div className="ticket__row" data-testid="ticket-row-saldo-anterior">
            <span>Saldo anterior:</span>
            <span>{fmtMoney(venta.saldo_anterior)}</span>
          </div>
          <div className="ticket__row ticket__strong" data-testid="ticket-row-saldo-actual">
            <span>Saldo actual:</span>
            <span>{fmtMoney(venta.saldo_final)}</span>
          </div>
          {n((venta as any).pago_cliente) > 0 && (
            <>
              <div className="ticket__hr" />
              <div className="ticket__row" data-testid="ticket-row-pago-cliente">
                <span>Pago:</span>
                <span>{fmtMoney((venta as any).pago_cliente)}</span>
              </div>
              {n((venta as any).cambio) > 0 && (
                <div className="ticket__row ticket__strong" data-testid="ticket-row-cambio">
                  <span>Cambio:</span>
                  <span>{fmtMoney((venta as any).cambio)}</span>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="ticket__center ticket__strong" data-testid="ticket-items-title">NOTA DE VENTA</div>
          <table className="ticket__table" data-testid="ticket-items">
            <thead>
              <tr>
                <th className="text-left">DESCRIPCION</th>
                <th>UDM</th>
                <th>PZ</th>
                <th>CANT KG</th>
                <th>PRECIO</th>
                <th className="text-right">SUBTO</th>
              </tr>
            </thead>
            <tbody>
              {venta.items.map((it, idx) => {
                const isMixto = (it as any).unidad === "MIXTO";
                const qty = chargedQty(it);
                const unit = isMixto ? "KG" : (it.tipo_venta === "unidad" ? "PZ" : "KG");
                const descuentoUnit = n((it as any).descuento_unitario || (it as any).discount_unit || 0);
                const precioFinal = n(it.precio_unitario);
                // Precio base = precio final + descuento (el descuento se resta del base para obtener el final)
                const precioBase = precioFinal + descuentoUnit;
                const lineSubtotal = qty * precioFinal;
                const piezas = isMixto ? n((it as any).piezas) : (it.tipo_venta === "unidad" ? qty : 0);
                const kilos = isMixto ? n(it.kilos) : (it.tipo_venta === "unidad" ? 0 : qty);
                const hasDiscount = descuentoUnit > 0;

                return (
                  <React.Fragment key={idx}>
                    <tr data-testid={`ticket-item-${idx}`}>
                      <td className="text-left">{it.producto}</td>
                      <td>{unit}</td>
                      <td>{n(piezas).toFixed(0)}</td>
                      <td>{kilos > 0 ? kilos.toFixed(3) : "-"}</td>
                      <td>{fmtMoney(precioFinal)}</td>
                      <td className="text-right">{fmtMoney(lineSubtotal)}</td>
                    </tr>
                    {hasDiscount && (
                      <tr className="ticket__discount-row">
                        <td colSpan={6} className="text-left" style={{ fontSize: '8px', color: '#666', paddingTop: 0 }}>
                          &nbsp;&nbsp;↳ Desc: -{fmtMoney(descuentoUnit)}/{unit.toLowerCase()} (Base: {fmtMoney(precioBase)})
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          <div className="ticket__hr-double" />

          <div className="ticket__center ticket__strong" style={{ marginBottom: '4px' }}>TOTAL:</div>
          <div className="ticket__row" data-testid="ticket-row-subtotal">
            <span>SUBTOTAL:</span>
            <span>{fmtMoney(venta.subtotal_base)}</span>
          </div>
          {n(venta.descuentos) > 0 && (
            <div className="ticket__row" data-testid="ticket-row-descuentos">
              <span>Descuento:</span>
              <span>-{fmtMoney(venta.descuentos)}</span>
            </div>
          )}
          <div className="ticket__row ticket__strong" data-testid="ticket-row-total">
            <span>Total:</span>
            <span>{fmtMoney(venta.total)}</span>
          </div>
          <div className="ticket__row" data-testid="ticket-row-saldo-anterior">
            <span>Saldo anterior:</span>
            <span>{fmtMoney(venta.saldo_anterior)}</span>
          </div>
          <div className="ticket__row ticket__strong" data-testid="ticket-row-saldo-actual">
            <span>Saldo actual:</span>
            <span>{fmtMoney(venta.saldo_final)}</span>
          </div>
          {n((venta as any).pago_cliente) > 0 && (
            <>
              <div className="ticket__hr" />
              <div className="ticket__row" data-testid="ticket-row-pago-cliente-venta">
                <span>Pago:</span>
                <span>{fmtMoney((venta as any).pago_cliente)}</span>
              </div>
              {n((venta as any).cambio) > 0 && (
                <div className="ticket__row ticket__strong" data-testid="ticket-row-cambio-venta">
                  <span>Cambio:</span>
                  <span>{fmtMoney((venta as any).cambio)}</span>
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="ticket__hr" />

      <div className="ticket__center ticket__muted" style={{ marginTop: '20px' }}>
        <div>Firma: ___________________</div>
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
    .page { width: 280px; margin: 0 auto; padding: 10px 10px 16px; }
    .ticket { font-size: 11px; line-height: 1.3; }
    .ticket__title { font-size: 14px; letter-spacing: 0.05em; font-weight: 800; }
    .ticket__address { font-size: 9px; }
    .ticket__center { text-align: center; }
    .ticket__right { text-align: right; }
    .ticket__muted { color: #555; font-size: 10px; }
    .ticket__strong { font-weight: 800; }
    .ticket__hr { border-top: 1px dashed #999; margin: 8px 0; }
    .ticket__hr-double { border-top: 2px solid #333; margin: 8px 0; }
    .ticket__row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
    .ticket__total { font-size: 13px; font-weight: 900; }
    .ticket__table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 9px; }
    .ticket__table th { font-weight: 700; border-bottom: 1px solid #333; padding: 2px 1px; text-align: center; }
    .ticket__table td { padding: 2px 1px; text-align: center; border-bottom: 1px dotted #ccc; }
    .ticket__table td:first-child, .ticket__table th:first-child { text-align: left; }
    .ticket__table td:last-child, .ticket__table th:last-child { text-align: right; }
    .ticket__firma { margin-top: 20px; text-align: center; }

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

  function fmtTicket(iso: unknown) {
    try {
      const d = new Date(String(iso));
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
    } catch {
      return String(iso);
    }
  }

  function tipoPagoLabel(tipo: string) {
    const t = (tipo || "").toLowerCase();
    if (t === "contado") return "Venta a Contado";
    if (t === "credito") return "Venta a Crédito";
    if (t === "parcial" || t === "mixto") return "Venta Mixta";
    if (t === "abono") return "ABONO";
    return (tipo || "").toUpperCase();
  }

  const isAbonoPrint = (v.tipo_pago || "").toLowerCase() === "abono";

  const itemsHtml = (v.items || []).map((it: any) => {
    const q = qty(it);
    const unidad = (it.unidad || "").toUpperCase();
    const isMixto = unidad === "MIXTO";
    const unit = it.tipo_venta === "unidad" ? "PZ" : (isMixto ? "MIXTO" : "KG");
    const descuentoUnit = num(it.descuento_unitario || it.discount_unit || 0);
    const precioFinal = num(it.precio_unitario);
    // Precio base = precio final + descuento (el descuento se resta del base para obtener el final)
    const precioBase = precioFinal + descuentoUnit;
    const lineSubtotal = q * precioFinal;
    const piezas = isMixto ? num(it.piezas) : (it.tipo_venta === "unidad" ? q : 0);
    const kilos = isMixto ? num(it.kilos) : (it.tipo_venta === "unidad" ? 0 : q);
    const hasDiscount = descuentoUnit > 0;

    let row = `<tr>
      <td>${esc(it.producto)}</td>
      <td>${unit}</td>
      <td>${num(piezas).toFixed(0)}</td>
      <td>${kilos > 0 ? kilos.toFixed(3) : "-"}</td>
      <td>${money(precioFinal)}</td>
      <td>${money(lineSubtotal)}</td>
    </tr>`;
    
    if (hasDiscount) {
      row += `<tr style="font-size:8px;color:#666;">
        <td colspan="6" style="padding-top:0;">&nbsp;&nbsp;↳ Desc: -${money(descuentoUnit)}/${unit.toLowerCase()} (Base: ${money(precioBase)})</td>
      </tr>`;
    }
    
    return row;
  }).join("");

  const pagoClienteNum = num((v as any).pago_cliente);
  const cambioNum = num((v as any).cambio);
  const pagoHtml = pagoClienteNum > 0 ? `
    <div class="ticket__hr"></div>
    <div class="ticket__row"><span>Pago:</span><span>${money(pagoClienteNum)}</span></div>
    ${cambioNum > 0 ? `<div class="ticket__row ticket__strong"><span>Cambio:</span><span>${money(cambioNum)}</span></div>` : ""}
  ` : "";
  
  const creditoHtml = (v.tipo_pago === "credito" || v.tipo_pago === "parcial") ? `
    <div class="ticket__hr"></div>
    <div class="ticket__row"><span>Abono:</span><span>${money(v.abono)}</span></div>
    <div class="ticket__row"><span>Saldo anterior:</span><span>${money(v.saldo_anterior)}</span></div>
    <div class="ticket__row ticket__strong"><span>Saldo final:</span><span>${money(v.saldo_final)}</span></div>
    ${pagoHtml}
  ` : (pagoClienteNum > 0 ? `
    <div class="ticket__hr"></div>
    <div class="ticket__row"><span>Pago:</span><span>${money(pagoClienteNum)}</span></div>
    ${cambioNum > 0 ? `<div class="ticket__row ticket__strong"><span>Cambio:</span><span>${money(cambioNum)}</span></div>` : ""}
  ` : "");

  const abonoHtml = isAbonoPrint ? `
    <div class="ticket">
      <div class="ticket__center ticket__title">Garlo Alimentos</div>
      <div class="ticket__center ticket__address ticket__muted">Filemon Valenzuela #410, Col. Industrial Ladrillera. CP. 34289</div>
      <div class="ticket__center ticket__muted">Tel: 618-1359-407</div>
      <div class="ticket__hr"></div>

      <div class="ticket__row"><span class="ticket__strong">Ruta "${esc(v.ruta_nombre || "—")}"</span></div>
      <div class="ticket__row"><span>Le atendió:</span><span>${esc(v.vendedor_nombre || "")}</span></div>
      <div class="ticket__row"><span>Cliente:</span><span class="ticket__strong">${esc(v.cliente_id || "")} – ${esc(v.cliente_nombre || "")}</span></div>
      <div class="ticket__row"><span>Abono:</span><span>${fmtTicket(v.fecha_iso)}</span></div>
      <div class="ticket__row"><span class="ticket__strong">${tipoPagoLabel(v.tipo_pago)}</span></div>

      <div class="ticket__hr"></div>
      <div class="ticket__center ticket__strong">RECIBO DE ABONO</div>
      <div class="ticket__hr"></div>
      <div class="ticket__row ticket__strong"><span>Monto abonado:</span><span>${money(v.abono)}</span></div>
      <div class="ticket__row"><span>Saldo anterior:</span><span>${money(v.saldo_anterior)}</span></div>
      <div class="ticket__row ticket__strong"><span>Saldo actual:</span><span>${money(v.saldo_final)}</span></div>

      <div class="ticket__hr"></div>
      <div class="ticket__firma">Firma: ___________________</div>
      <div class="ticket__center ticket__muted" style="margin-top:12px;">Gracias por su pago</div>
    </div>
  ` : `
    <div class="ticket">
      <div class="ticket__center ticket__title">Garlo Alimentos</div>
      <div class="ticket__center ticket__address ticket__muted">Filemon Valenzuela #410, Col. Industrial Ladrillera. CP. 34289</div>
      <div class="ticket__center ticket__muted">Tel: 618-1359-407</div>
      <div class="ticket__hr"></div>

      <div class="ticket__row"><span class="ticket__strong">Ruta "${esc(v.ruta_nombre || "—")}"</span></div>
      <div class="ticket__row"><span>Le atendió:</span><span>${esc(v.vendedor_nombre || "")}</span></div>
      <div class="ticket__row"><span>Cliente:</span><span class="ticket__strong">${esc(v.cliente_id || "")} – ${esc(v.cliente_nombre || "")}</span></div>
      <div class="ticket__row"><span>Venta:</span><span>${fmtTicket(v.fecha_iso)}</span></div>
      <div class="ticket__row"><span class="ticket__strong">${tipoPagoLabel(v.tipo_pago)}</span></div>

      <div class="ticket__hr"></div>
      <div class="ticket__center ticket__strong">NOTA DE VENTA</div>
      <table class="ticket__table">
        <thead>
          <tr><th>DESC</th><th>UDM</th><th>PZ</th><th>KG</th><th>PRECIO</th><th>SUBTO</th></tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div class="ticket__hr-double"></div>
      <div class="ticket__row"><span>SUBTOTAL:</span><span>${money(v.subtotal_base)}</span></div>
      ${num(v.descuentos) > 0 ? `<div class="ticket__row"><span>Descuento:</span><span>-${money(v.descuentos)}</span></div>` : ""}
      <div class="ticket__row ticket__total"><span>TOTAL:</span><span>${money(v.total)}</span></div>

      ${creditoHtml}

      <div class="ticket__hr"></div>
      <div class="ticket__firma">Firma: ___________________</div>
      <div class="ticket__center ticket__muted" style="margin-top:12px;">Gracias por su compra</div>
    </div>
  `;

  root.innerHTML = abonoHtml;

  w.focus();
  setTimeout(() => w.print(), 250);
}

// Modal version for Android compatibility
interface TicketModalProps {
  venta: HistorialVenta | null;
  open: boolean;
  onClose: () => void;
  isAbono?: boolean;
  onVolver?: () => void;
}

export function TicketModal({ venta, open, onClose, isAbono, onVolver }: TicketModalProps) {
  const ticketRef = React.useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = React.useState(false);

  const handleShare = async () => {
    if (!ticketRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSharing(false);
          return;
        }
        
        const file = new File([blob], `ticket_${isAbono ? 'abono' : 'venta'}_${Date.now()}.png`, { type: "image/png" });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: isAbono ? "Ticket de Abono" : "Ticket de Venta",
              text: `Ticket ${isAbono ? 'de abono' : 'de venta'} - Garlo Alimentos`,
            });
          } catch (err) {
            console.log("Share cancelled or failed:", err);
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `ticket_${isAbono ? 'abono' : 'venta'}_${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        setSharing(false);
      }, "image/png");
    } catch (err) {
      console.error("Error sharing:", err);
      setSharing(false);
    }
  };

  const generateTicketText = () => {
    if (!venta) return "";
    
    const lines: string[] = [];
    lines.push("🧾 *GARLO ALIMENTOS*");
    lines.push("Filemon Valenzuela #410");
    lines.push("Tel: 618-1359-407");
    lines.push("─────────────────");
    lines.push(`📍 Ruta: ${(venta as any).ruta_nombre || "—"}`);
    lines.push(`👤 Cliente: ${venta.cliente_nombre}`);
    lines.push(`📅 Fecha: ${fmtDateTicket(venta.fecha_iso)}`);
    lines.push(`💳 ${getTipoPagoLabel(venta.tipo_pago)}`);
    lines.push("─────────────────");
    
    if (isAbono) {
      lines.push("*RECIBO DE ABONO*");
      lines.push(`Monto: *${fmtMoney(venta.abono)}*`);
      lines.push(`Saldo anterior: ${fmtMoney(venta.saldo_anterior)}`);
      lines.push(`Saldo actual: *${fmtMoney(venta.saldo_final)}*`);
    } else {
      lines.push("*NOTA DE VENTA*");
      venta.items.forEach((it) => {
        const qty = it.tipo_venta === "unidad" ? n(it.cantidad) : n(it.kilos);
        const unit = it.tipo_venta === "unidad" ? "pz" : "kg";
        const descuentoUnit = n((it as any).descuento_unitario || (it as any).discount_unit || 0);
        const precioFinal = n(it.precio_unitario);
        // Precio base = precio final + descuento (el descuento se resta del base para obtener el final)
        const precioBase = precioFinal + descuentoUnit;
        const subtotal = qty * precioFinal;
        lines.push(`• ${it.producto}`);
        lines.push(`  ${qty.toFixed(it.tipo_venta === "unidad" ? 0 : 3)}${unit} x ${fmtMoney(precioFinal)} = ${fmtMoney(subtotal)}`);
        if (descuentoUnit > 0) {
          lines.push(`  💰 Desc: -${fmtMoney(descuentoUnit)}/${unit} (Base: ${fmtMoney(precioBase)})`);
        }
      });
      lines.push("─────────────────");
      lines.push(`Subtotal: ${fmtMoney(venta.subtotal_base)}`);
      if (n(venta.descuentos) > 0) {
        lines.push(`Descuento total: -${fmtMoney(venta.descuentos)}`);
      }
      lines.push(`*TOTAL: ${fmtMoney(venta.total)}*`);
      lines.push(`Saldo anterior: ${fmtMoney(venta.saldo_anterior)}`);
      lines.push(`Saldo actual: *${fmtMoney(venta.saldo_final)}*`);
    }
    
    lines.push("─────────────────");
    lines.push("¡Gracias por su compra! 🙏");
    
    return lines.join("\n");
  };

  const handleWhatsAppShare = async () => {
    const ticketText = generateTicketText();
    const encodedText = encodeURIComponent(ticketText);
    
    const clientPhone = (venta as any)?.cliente_telefono?.replace(/\D/g, "");
    
    let whatsappUrl: string;
    if (clientPhone && clientPhone.length >= 10) {
      const phoneWithCode = clientPhone.startsWith("52") ? clientPhone : `52${clientPhone}`;
      whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodedText}`;
    } else {
      whatsappUrl = `https://wa.me/?text=${encodedText}`;
    }
    
    window.open(whatsappUrl, "_blank");
  };

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
            {isAbono ? "Ticket de Abono" : "Ticket de Venta"}
          </DialogTitle>
          <DialogDescription className="sr-only">Vista previa del ticket para {isAbono ? "abono" : "imprimir"}</DialogDescription>
        </DialogHeader>
        
        <div className="px-4 pb-4">
          <div 
            ref={ticketRef}
            className="bg-white text-black p-3 rounded-xl text-xs font-mono leading-tight"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
          >
            {/* Encabezado */}
            <div className="ticket__center font-bold text-sm">Garlo Alimentos</div>
            <div className="ticket__center ticket__muted text-[8px]">Filemon Valenzuela #410, Col. Industrial Ladrillera. CP. 34289</div>
            <div className="ticket__center ticket__muted text-[9px]">Telefono: 618-1359-407</div>
            
            <div className="ticket__hr" />
            
            {/* Información de la venta */}
            <div className="ticket__row"><span className="font-bold">Ruta "{(venta as any).ruta_nombre || "—"}"</span></div>
            <div className="ticket__row"><span>Le atendió:</span><span>{venta.vendedor_nombre}</span></div>
            <div className="ticket__row"><span>Cliente:</span><span className="font-bold">{venta.cliente_id} – {venta.cliente_nombre}</span></div>
            <div className="ticket__row"><span>{isAbono ? "Abono:" : "Venta:"}</span><span>{fmtDateTicket(venta.fecha_iso)}</span></div>
            <div className="ticket__row"><span className="font-bold">{getTipoPagoLabel(venta.tipo_pago)}</span></div>
            
            {isAbono ? (
              <>
                <div className="ticket__center font-bold text-[10px] my-2">RECIBO DE ABONO</div>
                <div className="ticket__hr" />
                <div className="ticket__row font-bold"><span>Monto abonado:</span><span>{fmtMoney(venta.abono)}</span></div>
                <div className="ticket__row"><span>Saldo anterior:</span><span>{fmtMoney(venta.saldo_anterior)}</span></div>
                <div className="ticket__row font-bold"><span>Saldo actual:</span><span>{fmtMoney(venta.saldo_final)}</span></div>
              </>
            ) : (
              <>
                {/* NOTA DE VENTA - Tabla de productos */}
                <div className="ticket__center font-bold text-[10px] my-2">NOTA DE VENTA</div>
                <table className="w-full text-[8px] border-collapse">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="text-left py-0.5">DESCRIPCION</th>
                      <th className="py-0.5">UDM</th>
                      <th className="py-0.5">PZ</th>
                      <th className="py-0.5">CANT KG</th>
                      <th className="py-0.5">PRECIO</th>
                      <th className="text-right py-0.5">SUBTO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venta.items.map((it, idx) => {
                      const qty = it.tipo_venta === "unidad" ? n(it.cantidad) : n(it.kilos);
                      const unit = it.tipo_venta === "unidad" ? "PZ" : "KG";
                      const priceBase = n(it.precio_unitario);
                      const lineSubtotal = qty * priceBase;
                      const piezas = it.tipo_venta === "unidad" ? qty : ((it as any).piezas || 0);
                      const kilos = it.tipo_venta === "unidad" ? 0 : qty;
                      
                      return (
                        <tr key={idx} className="border-b border-dotted border-gray-300">
                          <td className="text-left py-0.5">{it.producto}</td>
                          <td className="text-center py-0.5">{unit}</td>
                          <td className="text-center py-0.5">{n(piezas).toFixed(0)}</td>
                          <td className="text-center py-0.5">{kilos > 0 ? kilos.toFixed(3) : "-"}</td>
                          <td className="text-center py-0.5">{fmtMoney(priceBase)}</td>
                          <td className="text-right py-0.5">{fmtMoney(lineSubtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Línea separadora y sección TOTAL */}
                <div className="border-t-2 border-black my-2" />
                
                <div className="ticket__center font-bold text-[10px] mb-1">TOTAL:</div>
                <div className="ticket__row"><span>SUBTOTAL:</span><span>{fmtMoney(venta.subtotal_base)}</span></div>
                {n(venta.descuentos) > 0 && (
                  <div className="ticket__row"><span>Descuento:</span><span>-{fmtMoney(venta.descuentos)}</span></div>
                )}
                <div className="ticket__row font-bold"><span>Total:</span><span>{fmtMoney(venta.total)}</span></div>
                <div className="ticket__row"><span>Saldo anterior:</span><span>{fmtMoney(venta.saldo_anterior)}</span></div>
                <div className="ticket__row font-bold"><span>Saldo actual:</span><span>{fmtMoney(venta.saldo_final)}</span></div>
                {n(venta.pago_cliente) > 0 && (
                  <>
                    <div className="border-t border-dotted border-gray-400 my-1" />
                    <div className="ticket__row"><span>Pago:</span><span>{fmtMoney(venta.pago_cliente)}</span></div>
                    {n(venta.cambio) > 0 && (
                      <div className="ticket__row font-bold"><span>Cambio:</span><span>{fmtMoney(venta.cambio)}</span></div>
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Firma */}
            <div className="ticket__hr" />
            <div className="ticket__center ticket__muted mt-4">Firma: ___________________</div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Button 
              variant="outline" 
              className="h-11 rounded-2xl font-black uppercase text-[10px] gap-1 px-2"
              onClick={handleShare}
              disabled={sharing}
              data-testid="button-share-ticket"
            >
              <ShareIcon className="h-4 w-4" /> {sharing ? "..." : "Imagen"}
            </Button>
            <Button 
              variant="outline"
              className="h-11 rounded-2xl font-black uppercase text-[10px] gap-1 px-2 bg-green-50 border-green-500 text-green-700 hover:bg-green-100"
              onClick={handleWhatsAppShare}
              data-testid="button-whatsapp-ticket"
            >
              <MessageCircleIcon className="h-4 w-4" /> WhatsApp
            </Button>
            <Button 
              className="h-11 rounded-2xl font-black uppercase text-[10px] gap-1 px-2"
              onClick={handlePrint}
              data-testid="button-print-ticket"
            >
              <PrinterIcon className="h-4 w-4" /> Imprimir
            </Button>
          </div>
          <Button 
            variant="secondary" 
            className="w-full h-12 rounded-2xl font-black uppercase text-xs gap-2 mt-2"
            onClick={onVolver || onClose}
            data-testid="button-volver-ticket"
          >
            <HomeIcon className="h-4 w-4" /> Volver
          </Button>
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
