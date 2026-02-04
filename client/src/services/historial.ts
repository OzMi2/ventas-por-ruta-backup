import { apiClient } from "@/lib/api";

export type HistorialVentaItem = {
  producto: string;
  tipo_venta: "unidad" | "peso";
  cantidad: number;
  kilos: number;
  precio_unitario: number;
  descuento_unitario: number;
  subtotal: number;
  unidad?: string;
};

export type HistorialVenta = {
  id: string;
  folio: string;
  fecha_iso: string;
  ruta: string;
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
        mapped.saldo_final = clientesMap[clienteId].saldo_actual || 0;
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
      mapped.saldo_final = clienteData?.saldo || 0;
      return mapped;
    });
  } catch (e) {
    console.error("Error loading ventas vendedor:", e);
    return [];
  }
}

function mapVentaToHistorial(venta: any): HistorialVenta {
  const items: HistorialVentaItem[] = (venta.items || []).map((item: any) => {
    const unidad = item.productoUnidad || "PIEZA";
    const isPeso = unidad === "KG";
    const isMixto = unidad === "MIXTO";
    const cantidad = n(item.cantidad);
    
    return {
      producto: item.productoNombre || `Producto ${item.productoId}`,
      tipo_venta: isPeso ? "peso" as const : "unidad" as const,
      cantidad: isPeso ? 0 : cantidad,
      kilos: isPeso || isMixto ? cantidad : 0,
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
    cliente_id: venta.clienteId?.toString() || "",
    cliente_nombre: "",
    vendedor_id: venta.usuarioId?.toString() || "",
    vendedor_nombre: venta.vendedorNombre || "",
    tipo_pago: tipoPago,
    subtotal_base: subtotalBase,
    descuentos,
    total,
    abono,
    saldo_anterior: 0,
    saldo_final: 0,
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
  total: number;
  descuentos: number;
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
      tipo_pago: v.tipoPago === "contado" || v.tipoPago === "credito" ? v.tipoPago : "contado",
      total: n(v.total),
      descuentos: n(v.descuentos),
      items: (v.items || []).map((i: any) => ({
        producto: i.productoNombre || "",
        tipo_venta: i.unidad || "unidad",
        cantidad: n(i.cantidad),
        kilos: n(i.kilos),
        precio_unitario: n(i.precioUnitario),
        descuento_unitario: n(i.descuentoUnitario),
        subtotal: n(i.subtotal),
      })),
    }));
  } catch (error) {
    console.error("Error fetching todas las ventas:", error);
    return [];
  }
}
