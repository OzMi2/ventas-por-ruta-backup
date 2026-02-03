import { apiClient, type DiscountRule as ApiDiscountRule } from "@/lib/api";

export type DiscountMode = "PIEZA" | "KG" | "MIXTO";

export interface DiscountTier {
  minQty: number;
  discountAmount: number;
}

export interface DiscountRule {
  id?: number;
  clienteId: number | null; // NULL = descuento por volumen para todos
  productoId: number;
  mode: DiscountMode;
  tiers: DiscountTier[];
  active: boolean;
  clienteNombre?: string;
  productoNombre?: string;
}

function mapApiRuleToLocal(apiRule: ApiDiscountRule): DiscountRule {
  return {
    id: apiRule.id,
    clienteId: apiRule.clienteId,
    productoId: apiRule.productoId,
    mode: apiRule.tipoDescuento,
    tiers: apiRule.tiers.map(t => ({
      minQty: parseFloat(t.volumenDesde),
      discountAmount: parseFloat(t.descuentoMonto),
    })),
    active: apiRule.activo,
    clienteNombre: apiRule.clienteNombre,
    productoNombre: apiRule.productoNombre,
  };
}

export async function fetchDiscounts(): Promise<DiscountRule[]> {
  try {
    const response = await apiClient.getDescuentos();
    return response.rules.map(mapApiRuleToLocal);
  } catch {
    return [];
  }
}

export async function createDiscount(data: {
  productoId: number;
  mode: DiscountMode;
  tiers: DiscountTier[];
  clienteId?: number | null;
}): Promise<DiscountRule | null> {
  try {
    const tiers = data.tiers.map(t => ({
      volumenDesde: t.minQty.toFixed(3),
      descuentoMonto: t.discountAmount.toFixed(2),
    }));
    
    const response = await apiClient.createDescuento(
      data.productoId,
      data.mode,
      tiers,
      data.clienteId
    );
    
    return mapApiRuleToLocal(response.rule);
  } catch {
    return null;
  }
}

export async function deleteDiscount(id: number): Promise<boolean> {
  try {
    await apiClient.deleteDescuento(id);
    return true;
  } catch {
    return false;
  }
}

export function findApplicableDiscount(
  rules: DiscountRule[],
  clienteId: number,
  productoId: number,
  qtyCharged: number,
  unidad: "PIEZA" | "KG" = "PIEZA"
): { discountAmount: number; mode: DiscountMode } | null {
  // Buscar reglas activas que apliquen a este producto
  // Priorizar reglas específicas del cliente sobre las generales (por volumen)
  const matchingRules = rules.filter(r => 
    r.active && 
    r.productoId === productoId &&
    (r.mode === unidad || r.mode === "MIXTO") &&
    (r.clienteId === null || r.clienteId === clienteId)
  );
  
  if (matchingRules.length === 0) return null;

  // Priorizar regla específica del cliente sobre regla general
  const clienteSpecificRules = matchingRules.filter(r => r.clienteId === clienteId);
  const volumeRules = matchingRules.filter(r => r.clienteId === null);
  
  const rulesToCheck = clienteSpecificRules.length > 0 ? clienteSpecificRules : volumeRules;

  let bestDiscount: { discountAmount: number; mode: DiscountMode } | null = null;

  for (const rule of rulesToCheck) {
    const applicableTier = [...rule.tiers]
      .sort((a, b) => b.minQty - a.minQty)
      .find(t => qtyCharged >= t.minQty);

    if (applicableTier) {
      if (!bestDiscount || applicableTier.discountAmount > bestDiscount.discountAmount) {
        bestDiscount = {
          discountAmount: applicableTier.discountAmount,
          mode: rule.mode
        };
      }
    }
  }

  return bestDiscount;
}
