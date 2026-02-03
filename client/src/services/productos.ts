import { apiClient, type BootstrapResponse } from "@/lib/api";
import { saveBootstrapToCache, getBootstrapFromCache } from "./offlineCache";

let cachedBootstrap: BootstrapResponse | null = null;

async function ensureBootstrap(): Promise<BootstrapResponse> {
  if (cachedBootstrap) return cachedBootstrap;
  
  try {
    cachedBootstrap = await apiClient.bootstrap();
    saveBootstrapToCache(cachedBootstrap);
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

export async function fetchProductos(_params?: { vendedor_id?: string | number; cliente_id?: string | number }) {
  await ensureBootstrap();
  if (!cachedBootstrap) throw new Error("No data available");
  
  const inventario = cachedBootstrap.inventario || [];
  const inventarioMixto = cachedBootstrap.inventarioMixto || [];
  
  const productos = cachedBootstrap.productos.map(p => {
    const isMixto = p.unidad === "MIXTO";
    
    if (isMixto) {
      const mixtoItem = inventarioMixto.find(inv => inv.productoId === p.id);
      return {
        id: p.id,
        nombre: p.nombre,
        precio_base: parseFloat(p.precio),
        tipo_venta: "peso" as const,
        requiere_piezas: true,
        precio_aplicado: parseFloat(p.precio),
        stock_piezas: mixtoItem ? parseInt(mixtoItem.cantidadPiezas) || 0 : 0,
        stock_kg: mixtoItem ? parseFloat(mixtoItem.cantidadKg) || 0 : 0,
        unidad: "MIXTO" as const,
      };
    } else {
      const invItem = inventario.find(inv => inv.productoId === p.id);
      const stockCantidad = invItem ? parseFloat(invItem.cantidad) : 0;
      
      return {
        id: p.id,
        nombre: p.nombre,
        precio_base: parseFloat(p.precio),
        tipo_venta: p.unidad === "KG" ? "peso" as const : "unidad" as const,
        requiere_piezas: false,
        precio_aplicado: parseFloat(p.precio),
        stock_piezas: p.unidad === "PIEZA" ? stockCantidad : undefined,
        stock_kg: p.unidad === "KG" ? stockCantidad : undefined,
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
