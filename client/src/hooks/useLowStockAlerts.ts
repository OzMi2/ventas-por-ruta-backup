import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProductoStock {
  id: number;
  nombre: string;
  tipo_venta: string;
  stock_piezas: number;
  stock_kg: number;
}

interface LowStockAlert {
  producto: ProductoStock;
  tipo: "piezas" | "kg";
  cantidad: number;
  umbral: number;
}

const LOW_STOCK_THRESHOLD_PIEZAS = 10;
const LOW_STOCK_THRESHOLD_KG = 5;
const STORAGE_KEY = "vr_low_stock_dismissed";

export function useLowStockAlerts(productos: ProductoStock[]) {
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDismissed(parsed);
        }
      }
    } catch {
    }
  }, []);

  const checkAlerts = useCallback(() => {
    const newAlerts: LowStockAlert[] = [];

    for (const p of productos) {
      if (dismissed.includes(p.id)) continue;

      if (p.tipo_venta === "unidad" || p.tipo_venta === "mixto") {
        if (p.stock_piezas > 0 && p.stock_piezas <= LOW_STOCK_THRESHOLD_PIEZAS) {
          newAlerts.push({
            producto: p,
            tipo: "piezas",
            cantidad: p.stock_piezas,
            umbral: LOW_STOCK_THRESHOLD_PIEZAS,
          });
        }
      }

      if (p.tipo_venta === "peso" || p.tipo_venta === "mixto") {
        if (p.stock_kg > 0 && p.stock_kg <= LOW_STOCK_THRESHOLD_KG) {
          newAlerts.push({
            producto: p,
            tipo: "kg",
            cantidad: p.stock_kg,
            umbral: LOW_STOCK_THRESHOLD_KG,
          });
        }
      }
    }

    setAlerts(newAlerts);
    return newAlerts;
  }, [productos, dismissed]);

  useEffect(() => {
    if (productos.length > 0) {
      checkAlerts();
    }
  }, [productos, checkAlerts]);

  const dismissAlert = useCallback((productoId: number) => {
    const newDismissed = [...dismissed, productoId];
    setDismissed(newDismissed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDismissed));
    setAlerts((prev) => prev.filter((a) => a.producto.id !== productoId));
  }, [dismissed]);

  const dismissAll = useCallback(() => {
    const allIds = alerts.map((a) => a.producto.id);
    const combined = [...dismissed, ...allIds];
    const newDismissed = combined.filter((id, index) => combined.indexOf(id) === index);
    setDismissed(newDismissed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDismissed));
    setAlerts([]);
  }, [alerts, dismissed]);

  const showAlertToast = useCallback(() => {
    if (alerts.length > 0) {
      toast({
        title: `⚠️ ${alerts.length} producto(s) con stock bajo`,
        description: alerts.slice(0, 3).map((a) => 
          `${a.producto.nombre}: ${a.cantidad} ${a.tipo}`
        ).join(", ") + (alerts.length > 3 ? "..." : ""),
        duration: 8000,
      });
    }
  }, [alerts, toast]);

  const resetDismissed = useCallback(() => {
    setDismissed([]);
    localStorage.removeItem(STORAGE_KEY);
    checkAlerts();
  }, [checkAlerts]);

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    alertCount: alerts.length,
    dismissAlert,
    dismissAll,
    showAlertToast,
    resetDismissed,
    checkAlerts,
  };
}

export function getLowStockSummary(productos: ProductoStock[]): string[] {
  const issues: string[] = [];

  for (const p of productos) {
    if (p.tipo_venta === "unidad" || p.tipo_venta === "mixto") {
      if (p.stock_piezas > 0 && p.stock_piezas <= LOW_STOCK_THRESHOLD_PIEZAS) {
        issues.push(`${p.nombre}: ${p.stock_piezas} piezas`);
      }
    }
    if (p.tipo_venta === "peso" || p.tipo_venta === "mixto") {
      if (p.stock_kg > 0 && p.stock_kg <= LOW_STOCK_THRESHOLD_KG) {
        issues.push(`${p.nombre}: ${p.stock_kg.toFixed(2)} kg`);
      }
    }
  }

  return issues;
}
