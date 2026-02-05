import { apiClient } from "@/lib/api";
import { saveBootstrapToCache } from "./offlineCache";
import { fetchDiscounts } from "./discounts";

const DESCUENTOS_CACHE_KEY = "vr_offline_descuentos";

export async function precacheAllData(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    const bootstrap = await apiClient.bootstrap();
    saveBootstrapToCache(bootstrap);
    console.log("[Precache] Bootstrap data cached");
  } catch (e: any) {
    errors.push(`Bootstrap: ${e.message}`);
  }

  try {
    const descuentos = await fetchDiscounts();
    localStorage.setItem(DESCUENTOS_CACHE_KEY, JSON.stringify(descuentos));
    console.log("[Precache] Descuentos cached");
  } catch (e: any) {
    errors.push(`Descuentos: ${e.message}`);
  }

  return { success: errors.length === 0, errors };
}

export async function precacheAppAssets(): Promise<void> {
  const routes = [
    "/clientes",
    "/productos", 
    "/checkout",
    "/mi-historial",
    "/abonos",
    "/configuracion",
    "/historial",
    "/auditoria/stock-bodega",
    "/auditoria/mover-stock",
    "/auditoria/entrada-bodega",
    "/auditoria/movimientos",
    "/admin/stock-rutas",
    "/admin/productos",
    "/admin/clientes",
    "/admin/rutas",
    "/admin/descuentos"
  ];

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    try {
      const response = await fetch("/");
      const html = await response.text();
      
      const scriptMatches = html.match(/\/assets\/[^"']+\.js/g) || [];
      const cssMatches = html.match(/\/assets\/[^"']+\.css/g) || [];
      const allAssets = Array.from(new Set([...scriptMatches, ...cssMatches]));
      
      const fetchPromises = allAssets.map(async (asset) => {
        try {
          await fetch(asset);
          console.log(`[Precache] Asset cached: ${asset}`);
        } catch (e) {
          console.warn(`[Precache] Failed to cache: ${asset}`);
        }
      });

      await Promise.all(fetchPromises);
      console.log(`[Precache] ${allAssets.length} assets cached`);
    } catch (e) {
      console.warn("[Precache] Asset precaching failed:", e);
    }
  }

  try {
    await fetch("/manifest.json");
    await fetch("/favicon.png");
    await fetch("/icons/icon-192x192.png");
    await fetch("/icons/icon-512x512.png");
    console.log("[Precache] Static assets cached");
  } catch (e) {
    console.warn("[Precache] Static assets failed:", e);
  }
}

export async function precacheEverything(onProgress?: (step: string) => void): Promise<void> {
  onProgress?.("Descargando datos...");
  await precacheAllData();
  
  onProgress?.("Cacheando aplicación...");
  await precacheAppAssets();
  
  onProgress?.("¡Listo para usar offline!");
}

export function getDescuentosFromCache(): any[] {
  try {
    const raw = localStorage.getItem(DESCUENTOS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
