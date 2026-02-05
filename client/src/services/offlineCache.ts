import type { BootstrapResponse, Cliente, Producto, InventarioRuta, InventarioRutaMixto } from "@/lib/api";

const CACHE_KEYS = {
  BOOTSTRAP: "vr_offline_bootstrap",
  CLIENTES: "vr_offline_clientes",
  PRODUCTOS: "vr_offline_productos",
  INVENTARIO: "vr_offline_inventario",
  INVENTARIO_MIXTO: "vr_offline_inventario_mixto",
  LAST_SYNC: "vr_offline_last_sync",
};

export function saveBootstrapToCache(data: BootstrapResponse): void {
  try {
    localStorage.setItem(CACHE_KEYS.BOOTSTRAP, JSON.stringify(data));
    localStorage.setItem(CACHE_KEYS.CLIENTES, JSON.stringify(data.clientes));
    localStorage.setItem(CACHE_KEYS.PRODUCTOS, JSON.stringify(data.productos));
    localStorage.setItem(CACHE_KEYS.INVENTARIO, JSON.stringify(data.inventario));
    if (data.inventarioMixto) {
      localStorage.setItem(CACHE_KEYS.INVENTARIO_MIXTO, JSON.stringify(data.inventarioMixto));
    }
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (e) {
    console.error("Error saving bootstrap to cache:", e);
  }
}

export function getBootstrapFromCache(): BootstrapResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.BOOTSTRAP);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getClientesFromCache(): Cliente[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.CLIENTES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getProductosFromCache(): Producto[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.PRODUCTOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getInventarioFromCache(): InventarioRuta[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.INVENTARIO);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getInventarioMixtoFromCache(): InventarioRutaMixto[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.INVENTARIO_MIXTO);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(CACHE_KEYS.LAST_SYNC);
}

export function clearOfflineCache(): void {
  Object.values(CACHE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function hasCachedData(): boolean {
  return !!localStorage.getItem(CACHE_KEYS.BOOTSTRAP);
}

export function clearBootstrapCache(): void {
  localStorage.removeItem(CACHE_KEYS.BOOTSTRAP);
  localStorage.removeItem(CACHE_KEYS.CLIENTES);
  localStorage.removeItem(CACHE_KEYS.PRODUCTOS);
  localStorage.removeItem(CACHE_KEYS.INVENTARIO);
  localStorage.removeItem(CACHE_KEYS.INVENTARIO_MIXTO);
}
