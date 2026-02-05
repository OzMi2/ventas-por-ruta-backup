import * as XLSX from "xlsx";

interface VentaExport {
  folio: string;
  fecha: string;
  cliente: string;
  vendedor?: string;
  tipo_pago: string;
  total: number;
  descuentos: number;
  productos: string;
}

interface AbonoExport {
  fecha: string;
  cliente: string;
  monto: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  notas?: string;
  registrado_por: string;
}

interface InventarioExport {
  producto: string;
  tipo: string;
  stock_piezas: number;
  stock_kg: number;
  precio_pieza: number;
  precio_kg: number;
}

export function exportVentasToExcel(ventas: any[], filename: string = "ventas") {
  const data: VentaExport[] = ventas.map((v) => ({
    folio: v.folio || "",
    fecha: formatDate(v.fecha_iso || v.fecha),
    cliente: v.cliente_nombre || "",
    vendedor: v.vendedor_nombre || "",
    tipo_pago: v.tipo_pago || "",
    total: Number(v.total) || 0,
    descuentos: Number(v.descuentos) || 0,
    productos: (v.items || []).map((i: any) => `${i.producto} (${i.cantidad || 0}pz/${i.kilos || 0}kg)`).join(", "),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventas");

  ws["!cols"] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 25 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 50 },
  ];

  XLSX.writeFile(wb, `${filename}_${formatDateForFile(new Date())}.xlsx`);
}

export function exportAbonosToExcel(abonos: any[], clienteNombre: string = "cliente") {
  const data: AbonoExport[] = abonos.map((a) => ({
    fecha: formatDate(a.fecha),
    cliente: clienteNombre,
    monto: Number(a.monto) || 0,
    saldo_anterior: Number(a.saldoAnterior) || 0,
    saldo_nuevo: Number(a.saldoNuevo) || 0,
    notas: a.notas || "",
    registrado_por: a.usuarioNombre || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Abonos");

  ws["!cols"] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 30 },
    { wch: 20 },
  ];

  XLSX.writeFile(wb, `abonos_${sanitizeFilename(clienteNombre)}_${formatDateForFile(new Date())}.xlsx`);
}

export function exportInventarioToExcel(inventario: any[], rutaNombre: string = "ruta") {
  const data: InventarioExport[] = inventario.map((i) => ({
    producto: i.nombre || i.producto_nombre || "",
    tipo: i.tipo_venta || "",
    stock_piezas: Number(i.stock_piezas) || 0,
    stock_kg: Number(i.stock_kg) || 0,
    precio_pieza: Number(i.precio_pieza) || 0,
    precio_kg: Number(i.precio_kg) || 0,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario");

  ws["!cols"] = [
    { wch: 30 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.writeFile(wb, `inventario_${sanitizeFilename(rutaNombre)}_${formatDateForFile(new Date())}.xlsx`);
}

function formatDateOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return "";
  }
}

function calcCantidad(items: any[]): { kg: number; pzas: number; tipo: string } {
  let totalKg = 0;
  let totalPzas = 0;
  for (const it of items || []) {
    const unidad = (it.unidad || it.tipo_venta || "").toUpperCase();
    if (unidad === "KG" || unidad === "PESO") {
      totalKg += Number(it.kilos) || Number(it.cantidad) || 0;
    } else if (unidad === "MIXTO") {
      // Para MIXTO: usar campos piezas y kilos si existen
      const piezas = Number(it.piezas) || 0;
      const kilos = Number(it.kilos) || 0;
      if (piezas > 0 || kilos > 0) {
        totalPzas += piezas;
        totalKg += kilos;
      } else {
        // Ventas antiguas: cantidad representa kg
        totalKg += Number(it.cantidad) || 0;
      }
    } else {
      totalPzas += Number(it.cantidad) || 0;
    }
  }
  let tipo = "PIEZA";
  if (totalKg > 0 && totalPzas > 0) tipo = "MIXTO";
  else if (totalKg > 0) tipo = "KG";
  return { kg: totalKg, pzas: totalPzas, tipo };
}

export function exportReporteCompleto(
  ventas: any[],
  rutaNombre: string,
  fecha: string
) {
  const wb = XLSX.utils.book_new();

  const ventasData = ventas.map((v) => {
    const { kg, pzas, tipo } = calcCantidad(v.items);
    let cantidadStr = "";
    if (tipo === "MIXTO") cantidadStr = `${pzas} Pz + ${kg.toFixed(2)} Kg`;
    else if (tipo === "KG") cantidadStr = `${kg.toFixed(2)} Kg`;
    else cantidadStr = `${pzas} Pz`;
    
    return {
      Folio: v.folio || "",
      Fecha: formatDateOnly(v.fecha_iso || v.fecha),
      Hora: formatTime(v.fecha_iso || v.fecha),
      Cliente: v.cliente_nombre || "",
      "Cantidad Compra": cantidadStr,
      "Tipo Pago": (v.tipo_pago || "").toUpperCase(),
      Subtotal: Number(v.subtotal_base) || Number(v.total) + Number(v.descuentos) || 0,
      Descuentos: Number(v.descuentos) || 0,
      Total: Number(v.total) || 0,
    };
  });

  const wsVentas = XLSX.utils.json_to_sheet(ventasData);
  wsVentas["!cols"] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 25 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas del Día");

  const totalVentas = ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
  const totalDescuentos = ventas.reduce((sum, v) => sum + (Number(v.descuentos) || 0), 0);
  const ventasContado = ventas.filter((v) => v.tipo_pago === "contado");
  const ventasCredito = ventas.filter((v) => v.tipo_pago === "credito");

  const resumenData = [
    { Concepto: "Total Ventas", Valor: ventas.length },
    { Concepto: "Ventas Contado", Valor: ventasContado.length },
    { Concepto: "Ventas Crédito", Valor: ventasCredito.length },
    { Concepto: "Total Cobrado", Valor: `$${totalVentas.toFixed(2)}` },
    { Concepto: "Total Descuentos", Valor: `$${totalDescuentos.toFixed(2)}` },
    { Concepto: "Contado", Valor: `$${ventasContado.reduce((s, v) => s + Number(v.total), 0).toFixed(2)}` },
    { Concepto: "Crédito", Valor: `$${ventasCredito.reduce((s, v) => s + Number(v.total), 0).toFixed(2)}` },
  ];

  const wsResumen = XLSX.utils.json_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  XLSX.writeFile(wb, `reporte_${sanitizeFilename(rutaNombre)}_${fecha || formatDateForFile(new Date())}.xlsx`);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDateForFile(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
}

interface VentaConRuta {
  id?: number | string;
  ruta_nombre: string;
  folio: string;
  fecha_iso?: string;
  fecha?: string;
  cliente_id?: number | string;
  cliente_nombre: string;
  vendedor_nombre?: string;
  tipo_pago: string;
  total: number | string;
  descuentos?: number | string;
  abono?: number | string;
  items?: any[];
}

function getDateKey(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  } catch {
    return "";
  }
}

interface MovimientoExport {
  productoId: number;
  productoNombre: string;
  cantidad: string;
  cantidadPiezas?: string;
  cantidadKg?: string;
  unidad?: string;
  fecha: string;
  rutaNombre?: string;
  tipo?: string;
}

interface ProductoPrecios {
  id: number;
  nombre: string;
  precio: number;
  unidad: string;
}

interface DescuentoTier {
  volumenDesde: number;
  descuentoMonto: number;
}

interface ReglaDescuento {
  productoId: number;
  tiers: DescuentoTier[];
}

interface InventarioRutaExport {
  rutaNombre: string;
  productoId: number;
  productoNombre: string;
  piezas: number;
  kg: number;
  unidad: string;
}

export function exportVentasPorRutaToExcel(
  ventas: VentaConRuta[],
  filename: string = "ventas_por_ruta",
  movimientos: MovimientoExport[] = [],
  productos: ProductoPrecios[] = [],
  reglasDescuento: ReglaDescuento[] = [],
  inventarioRutas: InventarioRutaExport[] = []
) {
  const wb = XLSX.utils.book_new();
  
  // Mapa de precios base por producto (del catálogo de productos)
  const preciosBase: Record<number, number> = {};
  for (const p of productos) {
    preciosBase[p.id] = Number(p.precio) || 0;
  }
  
  // Mapa de reglas de descuento por producto (de la sección de descuentos)
  const descuentosPorProducto: Record<number, DescuentoTier[]> = {};
  for (const regla of reglasDescuento) {
    descuentosPorProducto[regla.productoId] = regla.tiers.sort((a, b) => b.volumenDesde - a.volumenDesde);
  }
  
  // Calcula descuento unitario según cantidad vendida
  function calcularDescuentoUnitario(productoId: number, cantidadVendida: number): number {
    const tiers = descuentosPorProducto[productoId];
    if (!tiers || tiers.length === 0) return 0;
    for (const tier of tiers) {
      if (cantidadVendida >= tier.volumenDesde) {
        return tier.descuentoMonto;
      }
    }
    return 0;
  }
  
  // Agrupar movimientos por ruta (solo SALIDA_RUTA como cargas)
  const tiposCarga = ["SALIDA_RUTA", "SALIDA_RUTA_MIXTO", "carga"];
  const movimientosPorRuta: Record<string, MovimientoExport[]> = {};
  for (const m of movimientos) {
    const tipo = (m.tipo || "").toUpperCase();
    if (!tiposCarga.some(t => tipo.includes(t.toUpperCase()))) continue;
    const rutaNombre = m.rutaNombre || "Sin Ruta";
    if (!movimientosPorRuta[rutaNombre]) movimientosPorRuta[rutaNombre] = [];
    movimientosPorRuta[rutaNombre].push(m);
  }

  // Agrupar ventas por ruta
  const ventasPorRuta: Record<string, VentaConRuta[]> = {};
  for (const v of ventas) {
    const rutaNombre = v.ruta_nombre || "Sin Ruta";
    if (!ventasPorRuta[rutaNombre]) ventasPorRuta[rutaNombre] = [];
    ventasPorRuta[rutaNombre].push(v);
  }

  const rutasOrdenadas = Object.keys(ventasPorRuta).sort();
  
  for (const rutaNombre of rutasOrdenadas) {
    const ventasRuta = ventasPorRuta[rutaNombre];
    const movimientosRuta = movimientosPorRuta[rutaNombre] || [];
    
    // Ordenar ventas por fecha descendente (más reciente primero)
    ventasRuta.sort((a, b) => new Date(b.fecha_iso || b.fecha || 0).getTime() - new Date(a.fecha_iso || a.fecha || 0).getTime());
    
    // ============================================
    // CALCULAR EXISTENCIAS POR PRODUCTO Y FECHA
    // ============================================
    type ExistenciaInfo = { 
      cargoDia: number; 
      existenciaAnterior: number; 
      existenciaActual: number;
      unidad: string;
      cargaMostrada: boolean; // Para mostrar cargo solo en primera fila del día
    };
    const existenciasPorProductoFecha: Record<number, Record<string, ExistenciaInfo>> = {};
    
    // Obtener fechas únicas ordenadas de más antigua a más reciente
    const todasLasFechas = new Set<string>();
    for (const v of ventasRuta) {
      const fechaKey = getDateKey(v.fecha_iso || v.fecha || "");
      if (fechaKey) todasLasFechas.add(fechaKey);
    }
    for (const m of movimientosRuta) {
      const fechaKey = getDateKey(m.fecha);
      if (fechaKey) todasLasFechas.add(fechaKey);
    }
    const fechasOrdenadas = Array.from(todasLasFechas).sort((a, b) => a.localeCompare(b));
    
    // Obtener productos únicos
    const todosLosProductos = new Map<number, string>();
    for (const v of ventasRuta) {
      for (const item of (v.items || [])) {
        const prodId = Number(item.productoId) || Number(item.producto_id) || 0;
        if (prodId > 0) todosLosProductos.set(prodId, item.productoNombre || item.producto || "");
      }
    }
    for (const m of movimientosRuta) {
      if (m.productoId > 0) todosLosProductos.set(m.productoId, m.productoNombre);
    }
    
    // Calcular existencias día por día por producto
    for (const prodId of Array.from(todosLosProductos.keys())) {
      existenciasPorProductoFecha[prodId] = {};
      let existenciaAcumulada = 0;
      
      for (const fechaKey of fechasOrdenadas) {
        const cargasDia = movimientosRuta.filter(m => 
          m.productoId === prodId && getDateKey(m.fecha) === fechaKey
        );
        
        let cargoDia = 0;
        let unidadProducto = "PIEZA";
        for (const m of cargasDia) {
          const unidad = ((m as any).productoUnidad || (m as any).unidad || "PIEZA").toUpperCase();
          if (unidad === "MIXTO" || unidad === "KG") unidadProducto = unidad;
          cargoDia += Number(m.cantidad) || 0;
        }
        
        // Ventas del día para este producto
        let ventaDia = 0;
        for (const v of ventasRuta) {
          if (getDateKey(v.fecha_iso || v.fecha || "") !== fechaKey) continue;
          for (const item of (v.items || [])) {
            const itemProdId = Number(item.productoId) || Number(item.producto_id) || 0;
            if (itemProdId === prodId) {
              const unidad = (item.unidad || item.tipo_venta || "PIEZA").toUpperCase();
              if (unidad === "MIXTO" || unidad === "KG") {
                ventaDia += Number(item.kilos) || Number(item.cantidad) || 0;
              } else {
                ventaDia += Number(item.cantidad) || 0;
              }
            }
          }
        }
        
        const existenciaAnterior = existenciaAcumulada;
        const existenciaActual = existenciaAnterior + cargoDia - ventaDia;
        
        existenciasPorProductoFecha[prodId][fechaKey] = {
          cargoDia,
          existenciaAnterior,
          existenciaActual,
          unidad: unidadProducto,
          cargaMostrada: false, // Se pone true después de mostrar
        };
        
        existenciaAcumulada = existenciaActual;
      }
    }
    
    // Inventario actual de esta ruta (para mostrar existencia real)
    const inventarioEstaRuta = inventarioRutas.filter(i => i.rutaNombre === rutaNombre);
    const stockActualPorProducto: Record<number, { piezas: number; kg: number; unidad: string }> = {};
    for (const inv of inventarioEstaRuta) {
      stockActualPorProducto[inv.productoId] = {
        piezas: inv.piezas,
        kg: inv.kg,
        unidad: inv.unidad,
      };
    }
    
    // Usar saldos directamente de los datos de la venta (no calcular)
    const ventasConSaldos: any[] = [];
    for (const v of ventasRuta) {
      const tipoPago = (v.tipo_pago || "").toLowerCase();
      
      // Compro = lo que debe pagar (total de la venta)
      const compro = Number(v.total) || 0;
      
      // Pago = lo que pagó en efectivo
      let pago = 0;
      if (tipoPago === "contado") {
        pago = compro;
      } else if (tipoPago === "parcial") {
        pago = Number(v.abono) || 0;
      }
      // crédito = pago 0
      
      // Pendiente = Compro - Pago
      const totalPendiente = compro - pago;
      
      // Usar saldos directamente de los datos de la venta
      const saldoPendiente = Number((v as any).saldo_anterior) || 0;
      const saldoActual = Number((v as any).saldo_final) || 0;
      
      ventasConSaldos.push({
        ...v,
        compro,
        pago,
        total_pendiente: totalPendiente,
        saldo_pendiente: saldoPendiente,
        saldo_actual: saldoActual,
      });
    }
    
    // Ya están ordenadas por fecha descendente (más reciente primero)
    
    // Agrupar por fecha para el Excel
    const ventasPorFecha: Record<string, any[]> = {};
    for (const v of ventasConSaldos) {
      const key = getDateKey(v.fecha_iso || v.fecha || "");
      if (!ventasPorFecha[key]) ventasPorFecha[key] = [];
      ventasPorFecha[key].push(v);
    }
    
    const fechasDescendentes = Object.keys(ventasPorFecha).sort((a, b) => b.localeCompare(a));
    
    // Para controlar cuándo mostrar cargo (solo primera vez por producto por día)
    const cargoMostrado: Record<string, Record<number, boolean>> = {};
    
    const data: any[] = [];
    for (let fi = 0; fi < fechasDescendentes.length; fi++) {
      const fechaKey = fechasDescendentes[fi];
      const ventasDia = ventasPorFecha[fechaKey];
      if (!cargoMostrado[fechaKey]) cargoMostrado[fechaKey] = {};
      
      for (const v of ventasDia) {
        const items = v.items || [];
        
        if (items.length > 0) {
          for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
            const item = items[itemIdx];
            const unidad = (item.unidad || item.tipo_venta || "PIEZA").toUpperCase();
            const cantidadNum = Number(item.cantidad) || 0;
            const kilosNum = Number(item.kilos) || 0;
            const piezasNum = Number(item.piezas) || 0;
            
            // Formato de cantidad
            let cantidadStr = "";
            if (unidad === "MIXTO") {
              if (piezasNum > 0 && kilosNum > 0) {
                cantidadStr = `${piezasNum} Pzas / ${kilosNum.toFixed(2)} Kg`;
              } else if (piezasNum > 0) {
                cantidadStr = `${piezasNum} Pzas`;
              } else if (kilosNum > 0) {
                cantidadStr = `${kilosNum.toFixed(2)} Kg`;
              } else {
                cantidadStr = `${cantidadNum.toFixed(2)} Kg`;
              }
            } else if (unidad === "KG") {
              cantidadStr = `${(kilosNum || cantidadNum).toFixed(2)} Kg`;
            } else {
              cantidadStr = `${cantidadNum} Pzas`;
            }
            
            const prodId = Number(item.productoId) || Number(item.producto_id) || 0;
            
            // Precio base del catálogo de productos
            const precioBase = preciosBase[prodId] || Number(item.precioUnitario) || Number(item.precio_unitario) || 0;
            
            // Calcular descuento
            const cantidadParaDescuento = (unidad === "MIXTO" || unidad === "KG") 
              ? (kilosNum || cantidadNum) 
              : cantidadNum;
            const descuentoUnitario = calcularDescuentoUnitario(prodId, cantidadParaDescuento);
            const descuentoTotal = descuentoUnitario * cantidadParaDescuento;
            
            // Compro (subtotal del item)
            const subtotalItem = Number(item.subtotal) || 0;
            
            // Existencias - usando datos reales
            const existInfo = existenciasPorProductoFecha[prodId]?.[fechaKey];
            const stockActual = stockActualPorProducto[prodId];
            let cargoStr = "0";
            let existAntStr = "0";
            let existActStr = "0";
            
            // Cargo: solo primera fila del día para este producto
            if (existInfo && !cargoMostrado[fechaKey][prodId]) {
              const unidadProd = existInfo.unidad || stockActual?.unidad || "PIEZA";
              cargoStr = unidadProd === "KG" || unidadProd === "MIXTO"
                ? (existInfo.cargoDia > 0 ? existInfo.cargoDia.toFixed(2) : "0")
                : (existInfo.cargoDia > 0 ? String(Math.round(existInfo.cargoDia)) : "0");
              cargoMostrado[fechaKey][prodId] = true;
              
              // Existencia anterior: lo que tenía antes de la carga del día
              existAntStr = unidadProd === "KG" || unidadProd === "MIXTO"
                ? existInfo.existenciaAnterior.toFixed(2)
                : String(Math.round(existInfo.existenciaAnterior));
            }
            
            // Existencia actual: stock real de la ruta (directo del inventario)
            if (stockActual) {
              if (stockActual.unidad === "MIXTO") {
                const partes: string[] = [];
                if (stockActual.piezas > 0) partes.push(`${Math.round(stockActual.piezas)} Pz`);
                if (stockActual.kg > 0) partes.push(`${stockActual.kg.toFixed(2)} Kg`);
                existActStr = partes.length > 0 ? partes.join(" / ") : "0";
              } else if (stockActual.unidad === "KG") {
                existActStr = stockActual.kg > 0 ? stockActual.kg.toFixed(2) : "0";
              } else {
                existActStr = stockActual.piezas > 0 ? String(Math.round(stockActual.piezas)) : "0";
              }
            }
            
            const row: any = {
              Folio: v.folio || v.id || "",
              Id: v.cliente_id || "",
              Fecha: formatDateOnly(v.fecha_iso || v.fecha || ""),
              Hora: formatTime(v.fecha_iso || v.fecha || ""),
              Cliente: v.cliente_nombre || "",
              Producto: item.producto || item.productoNombre || item.producto_nombre || "",
              Precio: precioBase,
              Descuentos: descuentoTotal > 0 ? descuentoTotal.toFixed(2) : 0,
              "Cantidad Compra": cantidadStr,
              "Tipo Pago": (v.tipo_pago || "").toUpperCase(),
              Compro: itemIdx === 0 ? v.compro : "",
              Pago: itemIdx === 0 ? v.pago : "",
              Pendiente: itemIdx === 0 ? v.total_pendiente : "",
              "Saldo Pendiente": itemIdx === 0 ? v.saldo_pendiente : "",
              "Saldo Actual": itemIdx === 0 ? v.saldo_actual : "",
              Cargo: cargoStr,
              "Existencia Anterior": existAntStr,
              "Existencia Actual": existActStr,
            };
            data.push(row);
          }
        } else {
          // Abono o transacción sin productos
          const esAbono = (v.tipo_pago || "").toLowerCase() === "abono";
          data.push({
            Folio: v.folio || v.id || "",
            Id: v.cliente_id || "",
            Fecha: formatDateOnly(v.fecha_iso || v.fecha || ""),
            Hora: formatTime(v.fecha_iso || v.fecha || ""),
            Cliente: v.cliente_nombre || "",
            Producto: esAbono ? "ABONO" : "-",
            Precio: 0,
            Descuentos: 0,
            "Cantidad Compra": "-",
            "Tipo Pago": (v.tipo_pago || "").toUpperCase(),
            Compro: esAbono ? 0 : v.compro,
            Pago: v.pago,
            Pendiente: v.total_pendiente,
            "Saldo Pendiente": v.saldo_pendiente,
            "Saldo Actual": v.saldo_actual,
            Cargo: "0",
            "Existencia Anterior": "",
            "Existencia Actual": "",
          });
        }
      }
      
      // Fila vacía entre fechas
      if (fi < fechasDescendentes.length - 1) {
        data.push({
          Folio: "", Id: "", Fecha: "", Hora: "", Cliente: "", Producto: "",
          Precio: "", Descuentos: "", "Cantidad Compra": "", "Tipo Pago": "",
          Compro: "", Pago: "", Pendiente: "", "Saldo Pendiente": "",
          "Saldo Actual": "", Cargo: "", "Existencia Anterior": "", "Existencia Actual": "",
        });
      }
    }

    const totalRuta = ventasRuta.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    data.push({
      Folio: "", Id: "", Fecha: "", Hora: "", Cliente: "", Producto: "",
      Precio: "", Descuentos: "", "Cantidad Compra": "", "Tipo Pago": "",
      Compro: "TOTAL:", Pago: "", Pendiente: totalRuta,
      "Saldo Pendiente": "", "Saldo Actual": "",
      Cargo: "", "Existencia Anterior": "", "Existencia Actual": "",
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 8 },  // Folio
      { wch: 6 },  // Id
      { wch: 12 }, // Fecha
      { wch: 8 },  // Hora
      { wch: 25 }, // Cliente
      { wch: 15 }, // Producto
      { wch: 10 }, // Precio
      { wch: 12 }, // Descuentos
      { wch: 18 }, // Cantidad Compra
      { wch: 10 }, // Tipo Pago
      { wch: 12 }, // Compro
      { wch: 12 }, // Pago
      { wch: 12 }, // Pendiente
      { wch: 14 }, // Saldo Pendiente
      { wch: 12 }, // Saldo Actual
      { wch: 12 }, // Cargo
      { wch: 16 }, // Existencia Anterior
      { wch: 14 }, // Existencia Actual
    ];

    const sheetName = rutaNombre.substring(0, 31).replace(/[\\/*?:[\]]/g, "");
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const resumenData = rutasOrdenadas.map((rutaNombre) => {
    const ventasRuta = ventasPorRuta[rutaNombre];
    const totalVentas = ventasRuta.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const contado = ventasRuta.filter((v) => v.tipo_pago === "contado");
    const credito = ventasRuta.filter((v) => v.tipo_pago === "credito");
    return {
      Ruta: rutaNombre,
      "Num. Ventas": ventasRuta.length,
      "Contado ($)": contado.reduce((s, v) => s + Number(v.total), 0),
      "Crédito ($)": credito.reduce((s, v) => s + Number(v.total), 0),
      "Total ($)": totalVentas,
    };
  });

  const granTotal = ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
  resumenData.push({
    Ruta: "TOTAL GENERAL",
    "Num. Ventas": ventas.length,
    "Contado ($)": ventas.filter((v) => v.tipo_pago === "contado").reduce((s, v) => s + Number(v.total), 0),
    "Crédito ($)": ventas.filter((v) => v.tipo_pago === "credito").reduce((s, v) => s + Number(v.total), 0),
    "Total ($)": granTotal,
  });

  const wsResumen = XLSX.utils.json_to_sheet(resumenData);
  wsResumen["!cols"] = [
    { wch: 25 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen General");

  XLSX.writeFile(wb, `${filename}_${formatDateForFile(new Date())}.xlsx`);
}

function calcularSaldosVentas(ventas: VentaConRuta[], saldosPorCliente: Record<string, number>): any[] {
  // Sort from oldest to newest for correct saldo calculation
  const ventasOrdenadas = [...ventas].sort((a, b) => 
    new Date(a.fecha_iso || a.fecha || 0).getTime() - new Date(b.fecha_iso || b.fecha || 0).getTime()
  );
  
  const resultado: any[] = [];
  
  for (const v of ventasOrdenadas) {
    const clienteId = String(v.cliente_id || v.cliente_nombre);
    const total = Number(v.total) || 0;
    const abono = Number(v.abono) || 0;
    const tipoPago = (v.tipo_pago || "").toLowerCase();
    
    // Calculate pago based on tipo_pago
    let pagoRealizado = 0;
    if (tipoPago === "contado") {
      pagoRealizado = total;
    } else if (tipoPago === "credito") {
      pagoRealizado = 0;
    } else { // parcial
      pagoRealizado = abono;
    }
    
    // Saldo anterior is what client owed before this sale
    const saldoAnterior = saldosPorCliente[clienteId] || 0;
    
    // Saldo actual = saldo anterior + (total - pago)
    const saldoActual = saldoAnterior + (total - pagoRealizado);
    
    // Update client saldo for next sale
    saldosPorCliente[clienteId] = saldoActual;
    
    resultado.push({
      ...v,
      saldo_anterior: saldoAnterior,
      saldo_actual: saldoActual,
      pago_realizado: pagoRealizado,
    });
  }
  
  // Return in descending order (most recent first)
  return resultado.reverse();
}
