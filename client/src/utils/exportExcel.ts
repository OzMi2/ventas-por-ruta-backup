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
    const unidad = it.unidad || it.tipo_venta || "";
    if (unidad === "KG" || unidad === "peso") {
      totalKg += Number(it.kilos) || Number(it.cantidad) || 0;
    } else if (unidad === "MIXTO") {
      totalPzas += Number(it.cantidad) || 0;
      totalKg += Number(it.kilos) || 0;
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
  ruta_nombre: string;
  folio: string;
  fecha_iso?: string;
  fecha?: string;
  cliente_nombre: string;
  vendedor_nombre?: string;
  tipo_pago: string;
  total: number | string;
  descuentos?: number | string;
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

export function exportVentasPorRutaToExcel(
  ventas: VentaConRuta[],
  filename: string = "ventas_por_ruta"
) {
  const wb = XLSX.utils.book_new();

  const ventasPorRuta: Record<string, VentaConRuta[]> = {};
  for (const v of ventas) {
    const rutaNombre = v.ruta_nombre || "Sin Ruta";
    if (!ventasPorRuta[rutaNombre]) {
      ventasPorRuta[rutaNombre] = [];
    }
    ventasPorRuta[rutaNombre].push(v);
  }

  const rutasOrdenadas = Object.keys(ventasPorRuta).sort();
  
  for (const rutaNombre of rutasOrdenadas) {
    const ventasRuta = ventasPorRuta[rutaNombre];
    
    // Sort by date descending (most recent first)
    ventasRuta.sort((a, b) => new Date(b.fecha_iso || b.fecha || 0).getTime() - new Date(a.fecha_iso || a.fecha || 0).getTime());
    
    // Group by date
    const ventasPorFecha: Record<string, VentaConRuta[]> = {};
    for (const v of ventasRuta) {
      const key = getDateKey(v.fecha_iso || v.fecha || "");
      if (!ventasPorFecha[key]) ventasPorFecha[key] = [];
      ventasPorFecha[key].push(v);
    }
    
    // Sort dates descending
    const fechasOrdenadas = Object.keys(ventasPorFecha).sort((a, b) => b.localeCompare(a));
    
    const data: any[] = [];
    for (let fi = 0; fi < fechasOrdenadas.length; fi++) {
      const fechaKey = fechasOrdenadas[fi];
      const ventasDia = ventasPorFecha[fechaKey];
      
      for (const v of ventasDia) {
        const { kg, pzas, tipo } = calcCantidad(v.items || []);
        let cantidadStr = "";
        if (tipo === "MIXTO") cantidadStr = `${pzas} Pz + ${kg.toFixed(2)} Kg`;
        else if (tipo === "KG") cantidadStr = `${kg.toFixed(2)} Kg`;
        else cantidadStr = `${pzas} Pz`;
        
        data.push({
          Folio: v.folio || "",
          Fecha: formatDateOnly(v.fecha_iso || v.fecha || ""),
          Hora: formatTime(v.fecha_iso || v.fecha || ""),
          Cliente: v.cliente_nombre || "",
          "Cantidad Compra": cantidadStr,
          "Tipo Pago": (v.tipo_pago || "").toUpperCase(),
          Subtotal: (Number(v.total) || 0) + (Number(v.descuentos) || 0),
          Descuentos: Number(v.descuentos) || 0,
          Total: Number(v.total) || 0,
        });
      }
      
      // Add empty row between dates (except after the last date)
      if (fi < fechasOrdenadas.length - 1) {
        data.push({
          Folio: "",
          Fecha: "",
          Hora: "",
          Cliente: "",
          "Cantidad Compra": "",
          "Tipo Pago": "",
          Subtotal: "",
          Descuentos: "",
          Total: "",
        });
      }
    }

    const totalRuta = ventasRuta.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const totalDescuentos = ventasRuta.reduce((sum, v) => sum + (Number(v.descuentos) || 0), 0);
    data.push({
      Folio: "",
      Fecha: "",
      Hora: "",
      Cliente: "",
      "Cantidad Compra": "",
      "Tipo Pago": "TOTAL:",
      Subtotal: totalRuta + totalDescuentos,
      Descuentos: totalDescuentos,
      Total: totalRuta,
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
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
