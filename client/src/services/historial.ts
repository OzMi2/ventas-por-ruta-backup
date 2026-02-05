import { apiClient } from "@/lib/api";

export type HistorialVentaItem = {
  productoId?: number;
  producto: string;
  tipo_venta: "unidad" | "peso";
  cantidad: number;
  piezas?: number;
  kilos: number;
  precio_unitario: number;
  descuento_unitario: number;
  subtotal: number;
  unidad?: string;
};

export type MovimientoStock = {
  id: number;
  tipo: string;
  productoId: number;
  productoNombre: string;
  productoUnidad?: string;
  cantidad: string;
  rutaId: number | null;
  rutaNombre?: string;
  usuarioId: number;
  usuarioNombre: string;
  notas?: string;
  fecha: string;
};

export type HistorialVenta = {
  id: string;
  folio: string;
  fecha_iso: string;
  ruta: string;
  ruta_nombre?: string;
  cliente_id: string;
  cliente_nombre: string;
  vendedor_id: string;
  vendedor_nombre: string;
  tipo_pago: string;
  subtotal_base: number;
  descuentos: number;
  total: number;
  abono: number;
  saldo_anterior: number;
  saldo_final: number;
  pago_cliente?: number;
  cambio?: number;
  items: HistorialVentaItem[];
};

export type HistorialCliente = {
  cliente_id: string;
  cliente_nombre: string;
  saldo_actual?: number;
  ventas: HistorialVenta[];
};

export type Ruta = {
  id: string;
  nombre: string;
};

function n(v: any) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

export async function listRutas(): Promise<Ruta[]> {
  try {
    const response = await apiClient.getRutas();
    return response.rutas.map(r => ({
      id: r.id.toString(),
      nombre: r.nombre,
    }));
  } catch {
    return [];
  }
}

export async function listClientesHistorial(params: { rutaId: string }): Promise<HistorialCliente[]> {
  try {
    const rutaIdNum = parseInt(params.rutaId);
    const [clientesRes, ventasRes] = await Promise.all([
      apiClient.getClientes(rutaIdNum),
      apiClient.getVentas({ rutaId: rutaIdNum }),
    ]);

    const clientesMap: Record<string, HistorialCliente> = {};
    
    for (const cliente of clientesRes.clientes) {
      clientesMap[cliente.id.toString()] = {
        cliente_id: cliente.id.toString(),
        cliente_nombre: cliente.nombre,
        saldo_actual: parseFloat((cliente as any).saldo || "0"),
        ventas: [],
      };
    }

    for (const venta of ventasRes.ventas) {
      const clienteId = venta.clienteId.toString();
      if (clientesMap[clienteId]) {
        const mapped = mapVentaToHistorial(venta);
        // Solo usar saldo del cliente si no viene del servidor
        if (mapped.saldo_final === 0 && mapped.saldo_anterior === 0) {
          mapped.saldo_final = clientesMap[clienteId].saldo_actual || 0;
        }
        clientesMap[clienteId].ventas.push(mapped);
      }
    }

    return Object.values(clientesMap);
  } catch {
    return [];
  }
}

export async function listVentasVendedor(_params: { vendedorId: string }): Promise<HistorialVenta[]> {
  try {
    // El backend filtra por vendedor automáticamente cuando el usuario es vendedor
    const [ventasRes, clientesRes] = await Promise.all([
      apiClient.getVentas({}),
      apiClient.getClientes()
    ]);
    
    // Build cliente map for quick lookup (nombre y saldo)
    const clienteMap: Record<string, { nombre: string; saldo: number }> = {};
    for (const cliente of clientesRes.clientes) {
      clienteMap[cliente.id.toString()] = {
        nombre: cliente.nombre,
        saldo: parseFloat((cliente as any).saldo || "0"),
      };
    }
    
    return ventasRes.ventas.map(v => {
      const mapped = mapVentaToHistorial(v);
      const clienteData = clienteMap[mapped.cliente_id];
      mapped.cliente_nombre = clienteData?.nombre || `Cliente ${mapped.cliente_id}`;
      // Solo usar saldo del cliente si no viene del servidor (ventas sin saldo registrado)
      if (mapped.saldo_final === 0 && mapped.saldo_anterior === 0) {
        mapped.saldo_final = clienteData?.saldo || 0;
      }
      return mapped;
    });
  } catch (e) {
    console.error("Error loading ventas vendedor:", e);
    return [];
  }
}

function mapVentaToHistorial(venta: any): HistorialVenta {
  const items: HistorialVentaItem[] = (venta.items || []).map((item: any) => {
    const unidad = (item.productoUnidad || item.unidad || "PIEZA").toUpperCase();
    const isPeso = unidad === "KG";
    const isMixto = unidad === "MIXTO";
    const cantidadRaw = n(item.cantidad);
    
    // Usar campos piezas y kilos del servidor si existen
    let piezas = 0;
    let kilos = 0;
    
    if (isMixto) {
      // Para MIXTO: usar piezas y kilos del servidor
      piezas = n(item.piezas);
      kilos = n(item.kilos);
      // Fallback para ventas antiguas sin campos separados
      if (piezas === 0 && kilos === 0 && cantidadRaw > 0) {
        kilos = cantidadRaw;
      }
    } else if (isPeso) {
      kilos = n(item.kilos) || cantidadRaw;
      piezas = 0;
    } else {
      piezas = cantidadRaw;
      kilos = 0;
    }
    
    return {
      productoId: item.productoId || 0,
      producto: item.productoNombre || `Producto ${item.productoId}`,
      tipo_venta: isPeso || isMixto ? "peso" as const : "unidad" as const,
      cantidad: piezas,
      kilos: kilos,
      piezas: piezas,
      precio_unitario: n(item.precioUnitario),
      descuento_unitario: n(item.descuento || 0),
      subtotal: n(item.subtotal),
      unidad,
    };
  });

  const subtotalBase = n(venta.subtotal);
  const descuentos = n(venta.descuento);
  const total = n(venta.total);
  const abono = n(venta.abono);
  
  // Determinar tipo de pago desde el servidor o calcular
  let tipoPago = venta.tipoPago || "";
  if (!tipoPago) {
    // Calcular tipo de pago si no viene del servidor (ventas antiguas)
    if (abono === 0) {
      tipoPago = "credito";
    } else if (abono < total) {
      tipoPago = "parcial";
    } else {
      tipoPago = "contado";
    }
  }

  return {
    id: venta.id?.toString() || venta.clienteTxId,
    folio: venta.id?.toString() || venta.clienteTxId?.slice(0, 8) || "—",
    fecha_iso: venta.fechaVenta instanceof Date 
      ? venta.fechaVenta.toISOString() 
      : String(venta.fechaVenta),
    ruta: venta.rutaId?.toString() || "",
    ruta_nombre: venta.rutaNombre || "",
    cliente_id: venta.clienteId?.toString() || "",
    cliente_nombre: "",
    vendedor_id: venta.usuarioId?.toString() || "",
    vendedor_nombre: venta.vendedorNombre || "",
    tipo_pago: tipoPago,
    subtotal_base: subtotalBase,
    descuentos,
    total,
    abono,
    saldo_anterior: n(venta.saldoAnterior),
    saldo_final: n(venta.saldoFinal),
    pago_cliente: n(venta.pagoCliente),
    cambio: n(venta.cambio),
    items,
  };
}

export type VentaConRuta = {
  id: string;
  folio: string;
  fecha_iso: string;
  ruta_nombre: string;
  cliente_id: string;
  cliente_nombre: string;
  vendedor_id: string;
  vendedor_nombre: string;
  tipo_pago: string;
  saldo_anterior?: number;
  saldo_final?: number;
  pago_cliente?: number;
  cambio?: number;
  total: number;
  descuentos: number;
  abono?: number;
  items: HistorialVentaItem[];
};

export async function listTodasLasVentas(params: { fechaDesde?: string; fechaHasta?: string }): Promise<VentaConRuta[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.fechaDesde) queryParams.set("fechaDesde", params.fechaDesde);
    if (params.fechaHasta) queryParams.set("fechaHasta", params.fechaHasta);
    
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/ventas/todas?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const response = await res.json();
    const ventas = response?.ventas || [];
    
    return ventas.map((v: any) => ({
      id: String(v.id),
      folio: String(v.id),
      fecha_iso: v.fechaIso || v.fechaVenta || "",
      ruta_nombre: v.ruta_nombre || "",
      cliente_id: String(v.clienteId),
      cliente_nombre: v.cliente_nombre || "",
      vendedor_id: String(v.usuarioId),
      vendedor_nombre: v.vendedorNombre || "",
      tipo_pago: v.tipoPago === "contado" || v.tipoPago === "credito" || v.tipoPago === "parcial" || v.tipoPago === "abono" ? v.tipoPago : "contado",
      saldo_anterior: n(v.saldoAnterior),
      saldo_final: n(v.saldoFinal),
      pago_cliente: n(v.pagoCliente),
      cambio: n(v.cambio),
      total: n(v.total),
      descuentos: n(v.descuentos),
      abono: n(v.abono),
      items: (v.items || []).map((i: any) => {
        const unidad = (i.unidad || i.productoUnidad || "PIEZA").toUpperCase();
        const cantidad = n(i.cantidad);
        const isMixto = unidad === "MIXTO";
        const isKg = unidad === "KG";
        return {
          productoId: i.productoId || 0,
          producto: i.productoNombre || "",
          productoNombre: i.productoNombre || "",
          unidad: unidad,
          tipo_venta: unidad,
          cantidad: cantidad,
          piezas: isMixto ? n(i.piezas) : (isKg ? 0 : cantidad),
          kilos: isKg ? cantidad : (isMixto ? n(i.kilos) : 0),
          precio_unitario: n(i.precioUnitario),
          precioUnitario: n(i.precioUnitario),
          descuento_unitario: n(i.descuentoUnitario) || 0,
          descuentoUnitario: n(i.descuentoUnitario) || 0,
          subtotal: n(i.subtotal),
        };
      }),
    }));
  } catch (error) {
    console.error("Error fetching todas las ventas:", error);
    return [];
  }
}

// Obtener movimientos de stock por ruta y fecha
export async function getMovimientosRuta(
  rutaId: number,
  fechaDesde?: string,
  fechaHasta?: string
): Promise<MovimientoStock[]> {
  try {
    const response = await apiClient.getMovimientosRuta(rutaId, fechaDesde, fechaHasta);
    return (response.movimientos || []).map(m => ({
      id: m.id,
      tipo: m.tipo,
      productoId: m.productoId,
      productoNombre: m.productoNombre || `Producto #${m.productoId}`,
      productoUnidad: m.productoUnidad || "PIEZA",
      cantidad: m.cantidad,
      rutaId: m.rutaId,
      rutaNombre: m.rutaNombre,
      usuarioId: m.usuarioId,
      usuarioNombre: m.usuarioNombre || "",
      notas: m.notas,
      fecha: m.fecha,
    }));
  } catch (error) {
    console.error("Error fetching movimientos ruta:", error);
    return [];
  }
}
