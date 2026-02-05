# Documentación Completa de la Base de Datos
## Sistema Ventas por Ruta - Garlo Alimentos

---

## Índice

1. [Resumen General](#resumen-general)
2. [Diagrama de Relaciones](#diagrama-de-relaciones)
3. [Secciones de la Base de Datos](#secciones-de-la-base-de-datos)
4. [Tablas Detalladas](#tablas-detalladas)
5. [Flujos de Datos](#flujos-de-datos)
6. [Reglas de Negocio](#reglas-de-negocio)

---

## Resumen General

La base de datos está diseñada para gestionar un sistema de ventas por rutas donde:

- **Vendedores** viajan por rutas asignadas visitando clientes
- **Productos** se almacenan en una **bodega central** y se distribuyen a las **rutas**
- Las **ventas** pueden ser de contado, crédito o pago parcial
- El sistema funciona **offline** y sincroniza cuando hay conexión
- Soporta productos por **pieza**, **kilogramo** o **mixto** (ambos)
- Incluye sistema de **descuentos por volumen** y **por cliente específico**

### Tecnología Utilizada
- **PostgreSQL** como motor de base de datos
- **Drizzle ORM** para definir el esquema y consultas
- Precisión decimal para montos financieros (evita errores de redondeo)

---

## Diagrama de Relaciones

```
                                    ┌─────────────┐
                                    │   RUTAS     │
                                    │─────────────│
                                    │ id (PK)     │
                                    │ nombre      │
                                    │ descripcion │
                                    │ activa      │
                                    └──────┬──────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
     ┌─────────────┐              ┌─────────────┐              ┌─────────────────┐
     │  USUARIOS   │              │  CLIENTES   │              │ INVENTARIO_RUTA │
     │─────────────│              │─────────────│              │─────────────────│
     │ id (PK)     │              │ id (PK)     │              │ id (PK)         │
     │ username    │              │ nombre      │              │ rutaId (FK)     │
     │ password    │              │ direccion   │              │ productoId (FK) │
     │ nombre      │              │ telefono    │              │ cantidad        │
     │ rol         │              │ rutaId (FK) │              └────────┬────────┘
     │ rutaId (FK) │              │ activo      │                       │
     └──────┬──────┘              └──────┬──────┘                       │
            │                            │                              │
            │                            │                              │
            ▼                            ▼                              ▼
     ┌─────────────┐         ┌───────────────────┐             ┌─────────────┐
     │   VENTAS    │         │  SALDOS_CLIENTES  │             │  PRODUCTOS  │
     │─────────────│         │───────────────────│             │─────────────│
     │ id (PK)     │         │ id (PK)           │             │ id (PK)     │
     │ usuarioId   │◄────────│ clienteId (FK)    │             │ nombre      │
     │ clienteId   │         │ saldo             │             │ precio      │
     │ rutaId      │         └───────────────────┘             │ unidad      │
     │ total       │                                           │ activo      │
     └──────┬──────┘                                           └──────┬──────┘
            │                                                         │
            ▼                                                         │
     ┌─────────────┐                                                  │
     │ VENTA_ITEMS │                                                  │
     │─────────────│                                                  │
     │ id (PK)     │◄─────────────────────────────────────────────────┘
     │ ventaId (FK)│
     │ productoId  │
     │ cantidad    │
     │ subtotal    │
     └─────────────┘


     ┌───────────────────┐          ┌─────────────────┐
     │ INVENTARIO_BODEGA │          │ DISCOUNT_RULES  │
     │───────────────────│          │─────────────────│
     │ id (PK)           │          │ id (PK)         │
     │ productoId (FK)   │          │ clienteId (FK)  │◄── NULL = todos los clientes
     │ cantidad          │          │ productoId (FK) │
     └───────────────────┘          │ tipoDescuento   │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ DISCOUNT_TIERS  │
                                    │─────────────────│
                                    │ id (PK)         │
                                    │ ruleId (FK)     │
                                    │ volumenDesde    │
                                    │ descuentoMonto  │
                                    └─────────────────┘
```

---

## Secciones de la Base de Datos

La base de datos se divide en **6 secciones lógicas**:

### 1. ORGANIZACIÓN (Rutas y Usuarios)
Define la estructura organizacional: qué rutas existen y quién trabaja en cada una.

### 2. CATÁLOGOS (Clientes y Productos)
Información maestra de clientes y productos disponibles para venta.

### 3. INVENTARIOS (Bodega y Rutas)
Control de stock tanto en la bodega central como en cada ruta de venta.

### 4. TRANSACCIONES (Ventas, Items, Abonos)
Registro de todas las operaciones de venta y pagos.

### 5. DESCUENTOS (Reglas y Tiers)
Sistema flexible de descuentos por volumen y por cliente.

### 6. SINCRONIZACIÓN (Sync Events)
Manejo de operaciones offline y control de idempotencia.

---

## Tablas Detalladas

### SECCIÓN 1: ORGANIZACIÓN

---

#### Tabla: `rutas`
**Propósito:** Define las rutas geográficas de venta. Cada ruta es un territorio asignado a un vendedor.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único autoincremental |
| `nombre` | varchar(100) | Nombre de la ruta (ej: "Ruta Centro", "Ruta Norte") |
| `descripcion` | text | Descripción opcional de la zona o detalles |
| `activa` | boolean | Si la ruta está activa (default: true) |

**Relaciones:**
- Una ruta tiene **muchos clientes**
- Una ruta tiene **muchos usuarios** (vendedores asignados)
- Una ruta tiene su propio **inventario**

**Motivo de existir:** Permite organizar clientes y vendedores por zonas geográficas, facilitando la logística y asignación de trabajo.

---

#### Tabla: `usuarios`
**Propósito:** Almacena todos los usuarios del sistema (vendedores, auditores, administradores).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `username` | varchar(50) | Nombre de usuario para login (único) |
| `password` | text | Contraseña encriptada con bcrypt |
| `nombre` | varchar(100) | Nombre completo del usuario |
| `rol` | varchar(20) | Tipo de usuario: `vendedor`, `auditor`, `admin` |
| `rutaId` | integer (FK) | Ruta asignada (obligatorio para vendedores) |
| `activo` | boolean | Si el usuario puede acceder al sistema |

**Roles explicados:**
- **vendedor:** Solo ve sus propios clientes y su ruta. Puede hacer ventas.
- **auditor:** Puede ver todas las rutas y generar reportes. No puede modificar.
- **admin:** Acceso total. Puede crear usuarios, productos, descuentos, etc.

**Índices:**
- `usuarios_username_idx`: Búsqueda rápida por username (login)
- `usuarios_ruta_idx`: Filtrar usuarios por ruta

---

### SECCIÓN 2: CATÁLOGOS

---

#### Tabla: `clientes`
**Propósito:** Directorio de todos los clientes/tiendas que visitan los vendedores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `nombre` | varchar(150) | Nombre del negocio o persona |
| `direccion` | text | Dirección física (opcional) |
| `telefono` | varchar(20) | Teléfono de contacto (opcional) |
| `rutaId` | integer (FK) | Ruta a la que pertenece (obligatorio) |
| `activo` | boolean | Si el cliente está activo |

**Relaciones:**
- Pertenece a **una ruta**
- Tiene **un saldo** (en `saldos_clientes`)
- Puede tener **descuentos especiales** (en `discount_rules`)
- Tiene **muchas ventas**

**Motivo del rutaId:** Un cliente solo puede pertenecer a una ruta. Esto asegura que cada vendedor solo vea los clientes de su zona.

---

#### Tabla: `productos`
**Propósito:** Catálogo de todos los productos que se pueden vender.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `nombre` | varchar(150) | Nombre del producto |
| `precio` | decimal(10,2) | Precio base de venta |
| `unidad` | varchar(20) | Tipo de venta: `PIEZA`, `KG`, `MIXTO` |
| `activo` | boolean | Si el producto está disponible para venta |

**Tipos de unidad:**
- **PIEZA:** Se vende por unidades completas (ej: 5 pollos)
- **KG:** Se vende por peso (ej: 2.5 kg de carne)
- **MIXTO:** Se vende por piezas Y peso (ej: 3 pollos que pesan 4.2 kg)

**Motivo del campo unidad:** Los productos alimenticios pueden venderse de diferentes formas. El pollo se vende por pieza pero se cobra por kg. Este campo define cómo se maneja el inventario y la facturación.

---

### SECCIÓN 3: INVENTARIOS

---

#### Tabla: `inventario_bodega`
**Propósito:** Stock central de productos. De aquí se abastecen las rutas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `productoId` | integer (FK) | Producto (único por bodega) |
| `cantidad` | decimal(10,3) | Cantidad disponible |
| `ultimaActualizacion` | timestamp | Última vez que se modificó |

**Motivo:** La bodega es el almacén central. Cuando llega mercancía del proveedor, entra aquí. Cuando se envía a una ruta, sale de aquí.

---

#### Tabla: `inventario_bodega_mixto`
**Propósito:** Stock de productos MIXTO en bodega (requiere piezas Y kilos).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `productoId` | integer (FK) | Producto MIXTO |
| `cantidadPiezas` | decimal(10,0) | Número de piezas |
| `cantidadKg` | decimal(10,3) | Peso total en kilos |
| `ultimaActualizacion` | timestamp | Última modificación |

**Motivo de tabla separada:** Los productos MIXTO necesitan dos cantidades diferentes (piezas y kilos). Mantenerlos separados evita confusiones y facilita las validaciones.

---

#### Tabla: `inventario_ruta`
**Propósito:** Stock disponible en cada ruta para vender.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `rutaId` | integer (FK) | Ruta dueña del inventario |
| `productoId` | integer (FK) | Producto en esta ruta |
| `cantidad` | decimal(10,3) | Cantidad disponible para vender |
| `ultimaActualizacion` | timestamp | Última modificación |

**Índice compuesto:** `inventario_ruta_ruta_producto_idx` permite buscar rápidamente "¿cuánto producto X tiene la ruta Y?"

**Regla crítica:** No se puede vender si `cantidad` llega a cero o negativo. El sistema valida esto antes de confirmar cualquier venta.

---

#### Tabla: `inventario_ruta_mixto`
**Propósito:** Stock de productos MIXTO en cada ruta.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `rutaId` | integer (FK) | Ruta |
| `productoId` | integer (FK) | Producto MIXTO |
| `cantidadPiezas` | decimal(10,0) | Piezas disponibles |
| `cantidadKg` | decimal(10,3) | Kilos disponibles |
| `ultimaActualizacion` | timestamp | Última modificación |

---

#### Tabla: `movimientos_stock`
**Propósito:** Historial de todas las transferencias de inventario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `tipo` | varchar(20) | Tipo de movimiento |
| `productoId` | integer (FK) | Producto movido |
| `cantidad` | decimal(10,3) | Cantidad transferida |
| `rutaId` | integer (FK) | Ruta destino (NULL si es bodega) |
| `usuarioId` | integer (FK) | Quién hizo el movimiento |
| `notas` | text | Comentarios opcionales |
| `fecha` | timestamp | Cuándo ocurrió |

**Tipos de movimiento:**
- **ENTRADA_BODEGA:** Producto entra a bodega (proveedor)
- **SALIDA_RUTA:** Producto sale de bodega hacia una ruta
- **DEVOLUCION:** Producto regresa de ruta a bodega

**Motivo:** Auditoría completa. Permite rastrear dónde está cada producto y cómo llegó ahí.

---

### SECCIÓN 4: TRANSACCIONES

---

#### Tabla: `ventas`
**Propósito:** Registro de cada venta realizada.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Folio de venta |
| `clienteTxId` | varchar(100) | UUID único del cliente (idempotencia) |
| `usuarioId` | integer (FK) | Vendedor que realizó la venta |
| `clienteId` | integer (FK) | Cliente que compró |
| `rutaId` | integer (FK) | Ruta donde ocurrió |
| `fechaVenta` | timestamp | Fecha/hora de la venta (puede ser offline) |
| `fechaSync` | timestamp | Cuándo se sincronizó al servidor |
| `subtotal` | decimal(10,2) | Suma de items antes de descuentos |
| `descuento` | decimal(10,2) | Total de descuentos aplicados |
| `total` | decimal(10,2) | Monto final a pagar |
| `descuentoAplicado` | text | JSON con detalles del descuento |
| `abono` | decimal(10,2) | Monto pagado en esta transacción |
| `tipoPago` | varchar(20) | `contado`, `credito`, `parcial` |

**Campo clienteTxId explicado:**
- Es un UUID generado por el cliente (app móvil)
- Si la venta se envía dos veces (por error de red), el servidor detecta el duplicado y lo ignora
- Esto garantiza **idempotencia**: la misma venta no se procesa dos veces

**Tipos de pago:**
- **contado:** Cliente paga todo al momento. `abono = total`
- **credito:** Cliente no paga nada. `abono = 0`. Se suma a su saldo.
- **parcial:** Cliente paga parte. `abono < total`. La diferencia va al saldo.

---

#### Tabla: `venta_items`
**Propósito:** Detalle de productos en cada venta (líneas del ticket).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `ventaId` | integer (FK) | Venta a la que pertenece |
| `productoId` | integer (FK) | Producto vendido |
| `cantidad` | decimal(10,3) | Cantidad vendida (piezas o kg) |
| `precioUnitario` | decimal(10,2) | Precio por unidad/kg |
| `subtotal` | decimal(10,2) | cantidad × precioUnitario |

**Relación:** Una venta tiene **muchos items**. Cada item es una línea del ticket.

---

#### Tabla: `saldos_clientes`
**Propósito:** Control del crédito de cada cliente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `clienteId` | integer (FK) | Cliente (único) |
| `saldo` | decimal(12,2) | Monto que debe el cliente |
| `ultimaActualizacion` | timestamp | Última modificación |

**Cómo funciona:**
- Cuando hay venta a crédito: `saldo += (total - abono)`
- Cuando el cliente paga (abono): `saldo -= monto_abono`
- Saldo positivo = cliente debe dinero
- Saldo negativo = tenemos saldo a favor del cliente

---

#### Tabla: `abonos`
**Propósito:** Registro de pagos que hacen los clientes a su crédito.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `clienteId` | integer (FK) | Cliente que paga |
| `usuarioId` | integer (FK) | Vendedor que recibe el pago |
| `monto` | decimal(10,2) | Cantidad pagada |
| `saldoAnterior` | decimal(12,2) | Saldo antes del pago |
| `saldoNuevo` | decimal(12,2) | Saldo después del pago |
| `notas` | text | Comentarios opcionales |
| `fecha` | timestamp | Cuándo se recibió el pago |

**Motivo de saldoAnterior/saldoNuevo:** Auditoría. Permite reconstruir el historial de pagos y verificar que los cálculos son correctos.

---

### SECCIÓN 5: DESCUENTOS

---

#### Tabla: `discount_rules`
**Propósito:** Define reglas de descuento por producto.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `clienteId` | integer (FK) | Cliente específico (NULL = todos) |
| `productoId` | integer (FK) | Producto al que aplica |
| `tipoDescuento` | varchar(20) | `PIEZA`, `KG`, `MIXTO` |
| `activo` | boolean | Si la regla está activa |
| `fechaCreacion` | timestamp | Cuándo se creó |

**clienteId explicado:**
- **NULL:** El descuento aplica a TODOS los clientes (descuento por volumen general)
- **Con valor:** El descuento es EXCLUSIVO para ese cliente específico

**Ejemplo:**
- Regla con clienteId=NULL, productoId=1: "Todos obtienen descuento en pollo"
- Regla con clienteId=5, productoId=1: "Solo Tienda Juanita tiene descuento en pollo"

---

#### Tabla: `discount_tiers`
**Propósito:** Niveles de descuento según cantidad comprada.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `ruleId` | integer (FK) | Regla de descuento padre |
| `volumenDesde` | decimal(10,3) | Cantidad mínima para aplicar |
| `descuentoMonto` | decimal(10,2) | Monto fijo de descuento por unidad |

**Ejemplo de tiers para pollo (precio $50/kg):**

| volumenDesde | descuentoMonto | Precio resultante |
|--------------|----------------|-------------------|
| 5 | 2.00 | $48/kg |
| 10 | 4.00 | $46/kg |
| 20 | 6.00 | $44/kg |

**Interpretación:** 
- Si compra 5-9 kg: descuento de $2 por kg
- Si compra 10-19 kg: descuento de $4 por kg
- Si compra 20+ kg: descuento de $6 por kg

**Motivo de monto fijo vs porcentaje:** Los montos fijos son más fáciles de comunicar a clientes y evitan errores de redondeo.

---

### SECCIÓN 6: SINCRONIZACIÓN

---

#### Tabla: `sync_events`
**Propósito:** Registro de todas las operaciones sincronizadas desde la app móvil.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | serial (PK) | Identificador único |
| `eventId` | varchar(100) | UUID único del evento |
| `usuarioId` | integer (FK) | Usuario que envió el evento |
| `tipo` | varchar(50) | Tipo de evento (ej: `venta`) |
| `payload` | text | Datos del evento en JSON |
| `procesado` | boolean | Si ya se procesó |
| `fechaRecepcion` | timestamp | Cuándo llegó al servidor |
| `fechaProcesamiento` | timestamp | Cuándo se procesó |
| `error` | text | Mensaje de error si falló |

**Propósito de esta tabla:**
1. **Idempotencia:** Si un evento llega dos veces, se detecta por `eventId`
2. **Auditoría:** Registro completo de qué envió cada usuario
3. **Recuperación:** Si algo falla, se puede reprocesar el evento

---

## Flujos de Datos

### Flujo 1: Venta Normal (Contado)

```
1. Vendedor selecciona cliente
2. Agrega productos al carrito
3. Sistema calcula descuentos automáticamente
4. Vendedor confirma venta
5. Sistema:
   a. Valida stock disponible en ruta
   b. Crea registro en `ventas`
   c. Crea registros en `venta_items`
   d. Descuenta de `inventario_ruta`
   e. Registra en `sync_events`
```

### Flujo 2: Venta a Crédito

```
1-4. Igual que venta normal
5. Sistema:
   a-e. Igual que venta normal
   f. Actualiza `saldos_clientes` (aumenta saldo)
```

### Flujo 3: Abono de Cliente

```
1. Vendedor selecciona cliente
2. Ingresa monto de abono
3. Sistema:
   a. Crea registro en `abonos`
   b. Actualiza `saldos_clientes` (reduce saldo)
```

### Flujo 4: Transferencia Bodega → Ruta

```
1. Auditor/Admin selecciona producto
2. Indica cantidad y ruta destino
3. Sistema:
   a. Valida stock en bodega
   b. Descuenta de `inventario_bodega`
   c. Aumenta en `inventario_ruta`
   d. Registra en `movimientos_stock`
```

---

## Reglas de Negocio

### Validaciones Críticas

1. **No stock negativo:** Una venta NO se puede completar si el inventario de ruta quedaría negativo.

2. **Idempotencia:** Si una venta llega dos veces (mismo `clienteTxId`), solo se procesa una vez.

3. **Roles restrictivos:**
   - Vendedor solo ve clientes de SU ruta
   - Vendedor solo vende productos con stock en SU ruta
   - Auditor puede ver todo pero no modificar
   - Admin tiene acceso total

4. **Descuentos por precedencia:**
   - Primero busca descuento específico del cliente
   - Si no hay, busca descuento por volumen general
   - Aplica el tier más favorable según cantidad

5. **Saldos siempre actualizados:**
   - Cada venta a crédito actualiza el saldo inmediatamente
   - Cada abono actualiza el saldo inmediatamente

### Precisión Decimal

- **Montos financieros:** `decimal(10,2)` = hasta $99,999,999.99
- **Cantidades de peso:** `decimal(10,3)` = hasta 9,999,999.999 kg
- **Saldos grandes:** `decimal(12,2)` = hasta $9,999,999,999.99

---

## Glosario

| Término | Significado |
|---------|-------------|
| PK | Primary Key (llave primaria) |
| FK | Foreign Key (llave foránea) |
| Ruta | Zona geográfica de ventas |
| Bodega | Almacén central |
| Mixto | Producto que se cuenta en piezas pero se cobra por kg |
| Abono | Pago parcial de crédito |
| Tier | Nivel de descuento por volumen |
| Idempotencia | Garantía de que una operación se procesa solo una vez |
| Sync | Sincronización de datos offline |

---

*Documento generado para el Sistema Ventas por Ruta - Garlo Alimentos*
*Última actualización: Febrero 2026*
