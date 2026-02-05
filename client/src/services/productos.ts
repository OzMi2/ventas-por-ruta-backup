import { apiClient, type BootstrapResponse } from "@/lib/api";
import { saveBootstrapToCache, getBootstrapFromCache } from "./offlineCache";

let cachedBootstrap: BootstrapResponse | null = getBootstrapFromCache();

interface PendingStockAdjustment {
  [productoId: number]: { piezas: number; kilos: number };
}

function getPendingStockAdjustments(): PendingStockAdjustment {
  try {
    const raw = localStorage.getItem("vr_pending_ventas");
    if (!raw) return {};
    
    const pending = JSON.parse(raw);
    const adjustments: PendingStockAdjustment = {};
    
    for (const sale of pending) {
      for (const item of sale.venta.items) {
        const prodId = parseInt(String(item.producto_id));
        if (!adjustments[prodId]) {
          adjustments[prodId] = { piezas: 0, kilos: 0 };
        }
        adjustments[prodId].piezas += item.cantidad || 0;
        adjustments[prodId].kilos += item.kilos || 0;
      }
    }
    
    return adjustments;
  } catch {
    return {};
  }
}

let lastRefreshTime = 0;
const REFRESH_INTERVAL = 60000;

async function ensureBootstrap(): Promise<BootstrapResponse> {
  if (cachedBootstrap) {
    const now = Date.now();
    if (navigator.onLine && now - lastRefreshTime > REFRESH_INTERVAL) {
      lastRefreshTime = now;
      refreshBootstrapInBackground();
    }
    return cachedBootstrap;
  }
  
  try {
    cachedBootstrap = await apiClient.bootstrap();
    saveBootstrapToCache(cachedBootstrap);
    lastRefreshTime = Date.now();
    return cachedBootstrap;
  } catch (error) {
    const offlineData = getBootstrapFromCache();
    if (offlineData) {
      cachedBootstrap = offlineData;
      return cachedBootstrap;
    }
    throw error;
  }
}

function refreshBootstrapInBackground() {
  if (!navigator.onLine) return;
  
  apiClient.bootstrap().then((data) => {
    cachedBootstrap = data;
    saveBootstrapToCache(data);
  }).catch(() => {
  });
}

export async function fetchProductos(_params?: { vendedor_id?: string | number; cliente_id?: string | number }) {
  await ensureBootstrap();
  if (!cachedBootstrap) throw new Error("No data available");
  
  const inventario = cachedBootstrap.inventario || [];
  const inventarioMixto = cachedBootstrap.inventarioMixto || [];
  const pendingAdjustments = getPendingStockAdjustments();
  
  const productos = cachedBootstrap.productos.map(p => {
    const isMixto = p.unidad === "MIXTO";
    const adj = pendingAdjustments[p.id] || { piezas: 0, kilos: 0 };
    
    if (isMixto) {
      const mixtoItem = inventarioMixto.find(inv => inv.productoId === p.id);
      const basePiezas = mixtoItem ? parseInt(mixtoItem.cantidadPiezas) || 0 : 0;
      const baseKg = mixtoItem ? parseFloat(mixtoItem.cantidadKg) || 0 : 0;
      
      return {
        id: p.id,
        nombre: p.nombre,
        precio_base: parseFloat(p.precio),
        tipo_venta: "peso" as const,
        requiere_piezas: true,
        precio_aplicado: parseFloat(p.precio),
        stock_piezas: Math.max(0, basePiezas - adj.piezas),
        stock_kg: Math.max(0, baseKg - adj.kilos),
        unidad: "MIXTO" as const,
      };
    } else {
      const invItem = inventario.find(inv => inv.productoId === p.id);
      const stockCantidad = invItem ? parseFloat(invItem.cantidad) : 0;
      
      const adjustedPiezas = p.unidad === "PIEZA" 
        ? Math.max(0, stockCantidad - adj.piezas) 
        : undefined;
      const adjustedKg = p.unidad === "KG" 
        ? Math.max(0, stockCantidad - adj.kilos) 
        : undefined;
      
      return {
        id: p.id,
        nombre: p.nombre,
        precio_base: parseFloat(p.precio),
        tipo_venta: p.unidad === "KG" ? "peso" as const : "unidad" as const,
        requiere_piezas: false,
        precio_aplicado: parseFloat(p.precio),
        stock_piezas: adjustedPiezas,
        stock_kg: adjustedKg,
        unidad: p.unidad,
      };
    }
  });
  
  return productos;
}

export async function getInventario() {
  await ensureBootstrap();
  return cachedBootstrap?.inventario || [];
}

export async function getInventarioMixto() {
  await ensureBootstrap();
  return cachedBootstrap?.inventarioMixto || [];
}

export function clearBootstrapCache() {
  cachedBootstrap = null;
}
