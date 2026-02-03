# API Contract: Descuentos por Cliente y Volumen

## 1. Estructura de Datos (JSON)

### DiscountRule
```json
{
  "id": "string (opcional en POST)",
  "clientName": "string",
  "productId": "string",
  "productName": "string (opcional)",
  "mode": "PIEZA | KG | MIXTO",
  "tiers": [
    {
      "minQty": number,
      "discountAmount": number
    }
  ],
  "active": boolean
}
```

## 2. Endpoints Requeridos

| Método | Ruta | Query Params | Descripción |
|--------|------|--------------|-------------|
| GET | `/api/discounts.php` | `clientName`, `productId` | Lista descuentos filtrados |
| POST | `/api/discounts.php` | - | Crea un nuevo descuento |
| PUT | `/api/discounts.php` | `id` | Actualiza un descuento existente |
| PATCH | `/api/discounts.php` | `id` | Actualización parcial (ej. active) |

## 3. Ejemplos Request/Response

### POST /api/discounts.php
**Request:**
```json
{
  "clientName": "Tienda Lupita",
  "productId": "PROD-001",
  "mode": "MIXTO",
  "tiers": [
    {"minQty": 10, "discountAmount": 1.5},
    {"minQty": 50, "discountAmount": 3.0}
  ],
  "active": true
}
```

## 4. Reglas de Cálculo

1. **Determinar Cantidad Cobrada (chargedQty):**
   - Modo `PIEZA`: `chargedQty = piezas`
   - Modo `KG`: `chargedQty = kg`
   - Modo `MIXTO`: `chargedQty = kg`
2. **Selección de Escalón (Tier):**
   - Elegir el tier donde `chargedQty >= minQty` con el `minQty` más alto.
3. **Cálculo:**
   - `unitDiscount` = `tier.discountAmount`
   - `precioFinal` = `max(precioBase - unitDiscount, 0)`
   - `descuentoLinea` = `unitDiscount * chargedQty`

## 5. Notas para Base de Datos

Se sugiere una tabla `discounts` con:
- `id` (PK)
- `client_name` (Indexado)
- `product_id` (FK a productos)
- `mode` (ENUM: PIEZA, KG, MIXTO)
- `active` (BOOLEAN)
- `tiers` (JSON o tabla relacionada `discount_tiers`)
