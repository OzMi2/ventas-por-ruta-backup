import { apiClient, type SyncEvent, type VentaItem } from "@/lib/api";

function generateUUID(): string {
  return crypto.randomUUID();
}

interface VentaPayload {
  usuario_id: string | number;
  cliente_id: string | number;
  ruta_id?: string | number;
  tipo_pago: string;
  abono_pago: number;
  pago_cliente?: number;
  cambio?: number;
  folio_ticket: string | null;
  items: Array<{
    producto_id: string | number;
    cantidad: number;
    kilos: number;
    precio_unitario?: number;
    descuento_unitario?: number;
    subtotal?: number;
  }>;
}

interface PendingVenta {
  eventId: string;
  venta: VentaPayload;
  createdAt: string;
}

const PENDING_VENTAS_KEY = "vr_pending_ventas";

function getPendingVentas(): PendingVenta[] {
  try {
    const raw = localStorage.getItem(PENDING_VENTAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePendingVentas(ventas: PendingVenta[]) {
  localStorage.setItem(PENDING_VENTAS_KEY, JSON.stringify(ventas));
}

export async function registrarVenta(payload: VentaPayload) {
  const eventId = generateUUID();
  const clienteTxId = generateUUID();
  
  // Obtener rutaId de la sesión almacenada o del payload
  const session = JSON.parse(localStorage.getItem("vr_session") || "{}");
  const rutaId = payload.ruta_id ? parseInt(String(payload.ruta_id)) : (session.rutaId || 1);
  const usuarioId = parseInt(String(payload.usuario_id));
  const clienteId = parseInt(String(payload.cliente_id));
  
  const now = new Date();
  
  const items: VentaItem[] = payload.items.map(item => {
    const piezas = item.cantidad || 0;
    const kilos = item.kilos || 0;
    const cantidad = kilos > 0 ? kilos : piezas;
    const precioUnitario = item.precio_unitario || 0;
    const descuentoUnitario = item.descuento_unitario || 0;
    const subtotal = item.subtotal || (cantidad * (precioUnitario - descuentoUnitario));
    
    return {
      productoId: parseInt(String(item.producto_id)),
      cantidad: cantidad.toFixed(3),
      precioUnitario: precioUnitario.toFixed(2),
      descuentoUnitario: descuentoUnitario.toFixed(2),
      subtotal: subtotal.toFixed(2),
      piezas: piezas.toFixed(0),
      kilos: kilos.toFixed(3),
    };
  });

  const subtotal = items.reduce((acc, it) => acc + parseFloat(it.subtotal), 0);
  const total = subtotal;

  const ventaData = {
    clienteTxId,
    usuarioId,
    clienteId,
    rutaId,
    fechaVenta: now,
    subtotal: subtotal.toFixed(2),
    descuento: "0.00",
    total: total.toFixed(2),
    descuentoAplicado: null,
  };

  const syncEvent: SyncEvent = {
    eventId,
    tipo: "venta",
    venta: ventaData as any,
    items,
    abono: payload.abono_pago,
    pagoCliente: payload.pago_cliente || 0,
    cambio: payload.cambio || 0,
  };

  try {
    const response = await apiClient.syncPush([syncEvent]);
    const result = response.results[0];
    
    if (result.status === "success" || result.status === "duplicate") {
      return {
        ok: true,
        folio_ticket: result.ventaId?.toString() || clienteTxId,
        total_ticket: total,
        saldo_final: parseFloat(result.saldoFinal || "0"),
      };
    } else {
      throw new Error(result.error || "Error al registrar venta");
    }
  } catch (error: any) {
    const pending: PendingVenta = {
      eventId,
      venta: payload,
      createdAt: now.toISOString(),
    };
    
    const pendingList = getPendingVentas();
    pendingList.push(pending);
    savePendingVentas(pendingList);
    
    return {
      ok: true,
      folio_ticket: `OFFLINE-${eventId.slice(0, 8)}`,
      total_ticket: total,
      saldo_final: 0,
      offline: true,
      message: "Venta guardada localmente. Se sincronizará cuando haya conexión.",
    };
  }
}

export async function syncPendingVentas(): Promise<{ synced: number; failed: number }> {
  const pending = getPendingVentas();
  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;
  const remaining: PendingVenta[] = [];

  for (const item of pending) {
    try {
      await registrarVenta(item.venta);
      synced++;
    } catch {
      remaining.push(item);
      failed++;
    }
  }

  savePendingVentas(remaining);
  return { synced, failed };
}

export function getPendingVentasCount(): number {
  return getPendingVentas().length;
}
