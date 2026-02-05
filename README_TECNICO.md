# Ventas por Ruta - Documentación Técnica Completa

**Fecha**: Febrero 2026  
**Versión**: 1.0

---

## 1. ANÁLISIS GENERAL

### Tipo de Arquitectura

**SPA + PWA + API REST**

El proyecto es una **Single Page Application (SPA)** con capacidades de **Progressive Web App (PWA)** que consume una **API REST** servida desde el mismo servidor.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
│  ┌───────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   React SPA   │──│  Service    │──│  localStorage   │   │
│  │   (Vite)      │  │  Worker     │  │  (Cache Local)  │   │
│  └───────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST + JWT
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVIDOR                              │
│  ┌───────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   Express.js  │──│   Drizzle   │──│   PostgreSQL    │   │
│  │   (Node.js)   │  │   ORM       │  │   (Neon)        │   │
│  └───────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Componentes del Sistema

| Componente | Ubicación | Responsabilidad |
|------------|-----------|-----------------|
| Frontend (PWA) | `client/` | UI, cache offline, carrito, tickets |
| Backend (API) | `server/` | Auth, validaciones, transacciones |
| Schema Compartido | `shared/` | Tipos TypeScript y esquema DB |
| Base de Datos | PostgreSQL (Neon) | Persistencia de datos |

### Comunicación Frontend-Backend

- **Protocolo**: HTTP/REST sobre HTTPS
- **Formato**: JSON
- **Autenticación**: JWT Bearer Token
- **Puerto**: 5000 (único puerto, sirve API + estáticos)

### Partes Críticas para Ventas/Transacciones

1. **`server/routes.ts`** líneas 177-363: Endpoint `/api/sync/push` (procesa ventas)
2. **`server/storage.ts`**: Operaciones CRUD de base de datos
3. **`client/src/services/ventas.ts`**: Lógica de envío y cola offline
4. **`shared/schema.ts`**: Definición de tablas `ventas`, `venta_items`, `sync_events`

---

## 2. FRONTEND (PWA)

### Frameworks y Librerías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.2.0 | Framework UI |
| Vite | 7.1.9 | Build tool y dev server |
| Wouter | 3.3.5 | Enrutamiento SPA |
| TanStack Query | 5.60.5 | Cache y fetching de datos |
| Tailwind CSS | 4.1.14 | Estilos |
| shadcn/ui + Radix | - | Componentes UI |
| TypeScript | 5.6.3 | Tipado estático |

### Punto de Entrada

```
client/src/main.tsx
```

```typescript
// Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  });
}

createRoot(document.getElementById("root")!).render(<App />);
```

### Enrutamiento

**Librería**: Wouter (alternativa ligera a React Router)

**Archivo**: `client/src/App.tsx`

```typescript
<Switch>
  <Route path="/" component={IndexRedirect} />
  <Route path="/login" component={LoginPage} />
  <Route path="/clientes">...</Route>
  <Route path="/productos">...</Route>
  <Route path="/checkout">...</Route>
  <Route path="/historial">...</Route>
  <Route path="/abonos">...</Route>
  <Route path="/admin/descuentos">...</Route>
  <Route path="/admin/productos">...</Route>
  <Route path="/admin/clientes">...</Route>
  <Route path="/admin/rutas">...</Route>
  <Route path="/auditoria/mover-stock">...</Route>
  <Route path="/auditoria/entrada-bodega">...</Route>
  <Route path="/auditoria/movimientos">...</Route>
  // ...más rutas
</Switch>
```

### Manejo de Estado

**Arquitectura**: React Context + useReducer + localStorage

**Archivo**: `client/src/store/store.tsx`

```typescript
type AppState = {
  session: Session | null;      // Usuario logueado
  apiBaseUrl: string;           // URL base API (configurable)
  selectedClient: Cliente | null; // Cliente seleccionado
  cart: CartItem[];             // Carrito de compras
};
```

**Persistencia automática**:
- `vr_session` → sesión del usuario
- `vr_selected_client` → cliente seleccionado
- `vr_cart` → productos en carrito

### Manejo Offline Actual

| Mecanismo | Archivo | Función |
|-----------|---------|---------|
| Service Worker | `client/public/sw.js` | Cache de assets estáticos |
| localStorage | `client/src/services/offlineCache.ts` | Cache de datos bootstrap |
| Cola de ventas | `client/src/services/ventas.ts` | Ventas pendientes de sync |

**Claves de localStorage**:
```
vr_session              - Sesión del usuario
vr_cart                 - Carrito actual
vr_selected_client      - Cliente seleccionado
vr_pending_ventas       - Ventas offline pendientes
vr_offline_bootstrap    - Datos iniciales cacheados
vr_offline_clientes     - Lista de clientes
vr_offline_productos    - Lista de productos
vr_offline_inventario   - Inventario de la ruta
vr_offline_last_sync    - Timestamp última sincronización
```

### Flujo de una Venta (UI → Backend)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. Usuario selecciona cliente en /clientes                               │
│    └── dispatch({ type: "CLIENT_SET", client })                          │
│                                                                          │
│ 2. Usuario agrega productos en /productos                                │
│    └── dispatch({ type: "CART_ADD", item })                              │
│                                                                          │
│ 3. Usuario va a /checkout                                                │
│    ├── Ingresa monto de pago (abono)                                     │
│    └── Clic en "Enviar"                                                  │
│                                                                          │
│ 4. Función handleEnviarClick() valida datos                              │
│    ├── Validación de sesión, cliente, carrito                           │
│    ├── Validación de montos                                              │
│    └── Muestra diálogo de confirmación                                   │
│                                                                          │
│ 5. Usuario confirma → doSubmit()                                         │
│    └── Llama a registrarVenta(payload)                                   │
│                                                                          │
│ 6. registrarVenta() en client/src/services/ventas.ts                     │
│    ├── Genera eventId (UUID) para idempotencia                          │
│    ├── Genera clienteTxId (UUID) para la venta                           │
│    ├── Construye SyncEvent con venta + items                             │
│    └── Llama a apiClient.syncPush([syncEvent])                           │
│                                                                          │
│ 7. Si hay conexión:                                                      │
│    └── POST /api/sync/push → Backend procesa                             │
│                                                                          │
│ 8. Si NO hay conexión (catch error):                                     │
│    ├── Guarda en localStorage (vr_pending_ventas)                        │
│    └── Retorna folio OFFLINE-xxxxxxxx                                    │
│                                                                          │
│ 9. Respuesta exitosa → Muestra ticket, limpia carrito                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### ¿Qué Pasa si el Usuario Cierra la App a Mitad del Proceso?

| Momento | Estado Guardado | Se Pierde |
|---------|-----------------|-----------|
| Antes de confirmar | Carrito en localStorage | Nada crítico |
| Después de confirmar, antes de respuesta | Venta en `vr_pending_ventas` | Nada, se reintentará |
| Después de respuesta éxito | Venta en BD | Nada |

**Protección actual**: El carrito se guarda en cada modificación. Las ventas fallidas se guardan en cola offline.

---

## 3. SERVICE WORKER

### Ubicación

```
client/public/sw.js
```

### Archivos que Cachea (Precache)

```javascript
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];
```

### Estrategias de Cache

| Tipo de Request | Estrategia | Descripción |
|-----------------|------------|-------------|
| Assets estáticos | **Cache-First** | Busca en cache, si no existe, va a red |
| Llamadas API (`/api/*`) | **Network-First** | Intenta red, si falla usa cache |

```javascript
self.addEventListener('fetch', (event) => {
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
```

### Limitaciones Actuales para POS Offline

1. **No cachea respuestas de API de manera inteligente**: Solo cachea si la petición de red falla
2. **Sin IndexedDB**: Todo está en localStorage (límite ~5-10MB)
3. **Sin sincronización en background**: No usa Background Sync API
4. **Sin notificaciones push**: No hay alertas de sincronización
5. **Cache de assets insuficiente**: No cachea bundles JS/CSS compilados por Vite

---

## 4. BACKEND (API)

### Framework y Runtime

- **Runtime**: Node.js
- **Framework**: Express 5.0.1
- **Lenguaje**: TypeScript (compilado con TSX en dev, esbuild en prod)

### Punto de Entrada

```
server/index.ts (desarrollo)
server/index.prod.ts (producción)
```

### Middlewares

| Middleware | Función |
|------------|---------|
| `cors` | Habilita CORS con credentials |
| `express.json()` | Parsea body JSON |
| `express.urlencoded()` | Parsea body URL-encoded |
| Logging custom | Log de requests API con timing |
| `authMiddleware` | Valida JWT y extrae usuario |
| `requireRole(...)` | Valida rol del usuario |

### Endpoints Principales

#### Autenticación
| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| POST | `/api/auth/login` | Público | Login con username/password |
| GET | `/api/me/bootstrap` | Autenticado | Descarga datos iniciales |

#### Ventas y Sync
| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| POST | `/api/sync/push` | Autenticado | Sube ventas (idempotente) |
| GET | `/api/ventas` | Autenticado | Lista ventas (filtrado por rol) |
| GET | `/api/ventas/todas` | Admin, Auditor | Todas las ventas |

#### Clientes y Saldos
| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| GET | `/api/clientes` | Autenticado | Lista clientes (por ruta) |
| GET | `/api/saldos/:clienteId` | Autenticado | Saldo de un cliente |
| POST | `/api/abonos` | Autenticado | Registra pago/abono |

#### Productos e Inventario
| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| GET | `/api/productos` | Autenticado | Lista productos |
| GET | `/api/inventario/ruta/:rutaId` | Admin, Auditor | Inventario de ruta |
| POST | `/api/bodega/mover-a-ruta` | Admin, Auditor | Transfiere stock |

#### Descuentos
| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| GET | `/api/descuentos` | Autenticado | Lista reglas de descuento |
| POST | `/api/descuentos` | Admin | Crea regla de descuento |
| DELETE | `/api/descuentos/:id` | Admin | Elimina regla |

### Validaciones y Reglas de Negocio

**En `/api/sync/push`** (procesamiento de ventas):

1. **Idempotencia por eventId**: Si el `eventId` ya existe en `sync_events`, retorna resultado previo
2. **Idempotencia por clienteTxId**: Si la venta ya existe con ese `clienteTxId`, retorna como duplicado
3. **Validación de stock**: Verifica inventario antes de decrementar (no permite negativos)
4. **Cálculo de tipo de pago**: Determina si es `contado`, `credito`, o `parcial`
5. **Actualización de saldos**: Actualiza `saldos_clientes` automáticamente
6. **Transacción atómica**: La venta y sus items se crean en una sola operación

### Manejo de Peticiones Duplicadas

```
┌─────────────────────────────────────────────────────────────┐
│ Petición llega con eventId + clienteTxId                    │
│                                                             │
│ 1. ¿Existe eventId en sync_events?                         │
│    ├── SÍ → Retorna status: "already_processed"            │
│    └── NO → Continúa                                        │
│                                                             │
│ 2. Registra evento en sync_events (procesado: false)       │
│                                                             │
│ 3. ¿Existe clienteTxId en ventas?                          │
│    ├── SÍ → Marca evento procesado, retorna "duplicate"    │
│    └── NO → Procesa la venta                               │
│                                                             │
│ 4. Procesa venta (validar stock, decrementar, etc.)        │
│    ├── OK → Crea venta + items, marca evento procesado     │
│    └── ERROR → Marca evento con error, retorna "error"     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. BASE DE DATOS (PostgreSQL)

### Tablas Principales

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           MODELO DE DATOS                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐                      │
│  │   rutas   │◄────│ usuarios  │     │ productos │                      │
│  │  (id, nombre)   │ (rol, rutaId)   │ (precio, unidad)                 │
│  └─────┬─────┘     └───────────┘     └─────┬─────┘                      │
│        │                                    │                            │
│        ▼                                    ▼                            │
│  ┌───────────┐     ┌───────────────────────┴──────────────┐             │
│  │ clientes  │     │            inventario                │             │
│  │ (rutaId)  │     │  inventario_ruta    inventario_bodega│             │
│  └─────┬─────┘     │  inventario_ruta_mixto               │             │
│        │           │  inventario_bodega_mixto             │             │
│        │           └──────────────────────────────────────┘             │
│        │                                                                 │
│        ▼                                                                 │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐                      │
│  │  ventas   │────►│venta_items│     │sync_events│                      │
│  │(clienteTxId)    │(ventaId)  │     │(eventId)  │                      │
│  └─────┬─────┘     └───────────┘     └───────────┘                      │
│        │                                                                 │
│        ▼                                                                 │
│  ┌─────────────────┐     ┌───────────┐                                  │
│  │ saldos_clientes │     │  abonos   │                                  │
│  │ (saldo actual)  │◄────│ (pagos)   │                                  │
│  └─────────────────┘     └───────────┘                                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      DESCUENTOS                                      ││
│  │  discount_rules (clienteId?, productoId, tipoDescuento)             ││
│  │  discount_tiers (ruleId, volumenDesde, descuentoMonto)              ││
│  └─────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

### Tablas de Transacciones

#### `ventas`
```sql
id                SERIAL PRIMARY KEY
cliente_tx_id     VARCHAR(100) UNIQUE  -- UUID del cliente (idempotencia)
usuario_id        INTEGER FK usuarios
cliente_id        INTEGER FK clientes
ruta_id           INTEGER FK rutas
fecha_venta       TIMESTAMP            -- Fecha del cliente (puede ser offline)
fecha_sync        TIMESTAMP DEFAULT NOW -- Fecha de llegada al servidor
subtotal          DECIMAL(10,2)
descuento         DECIMAL(10,2)
total             DECIMAL(10,2)
abono             DECIMAL(10,2)        -- Monto pagado en esta venta
tipo_pago         VARCHAR(20)          -- 'contado', 'credito', 'parcial'
saldo_anterior    DECIMAL(12,2)        -- Saldo antes de esta venta
saldo_final       DECIMAL(12,2)        -- Saldo después de esta venta
pago_cliente      DECIMAL(12,2)        -- Monto físico entregado
cambio            DECIMAL(12,2)        -- Cambio devuelto
```

#### `venta_items`
```sql
id                SERIAL PRIMARY KEY
venta_id          INTEGER FK ventas
producto_id       INTEGER FK productos
cantidad          DECIMAL(10,3)
piezas            DECIMAL(10,3)        -- Para productos MIXTO
kilos             DECIMAL(10,3)        -- Para productos MIXTO
precio_unitario   DECIMAL(10,2)
descuento_unitario DECIMAL(10,2)
subtotal          DECIMAL(10,2)
```

#### `sync_events` (Idempotencia y Auditoría)
```sql
id                SERIAL PRIMARY KEY
event_id          VARCHAR(100) UNIQUE  -- UUID del evento
usuario_id        INTEGER FK usuarios
tipo              VARCHAR(50)          -- 'venta'
payload           TEXT                 -- JSON del evento completo
procesado         BOOLEAN DEFAULT FALSE
fecha_recepcion   TIMESTAMP DEFAULT NOW
fecha_procesamiento TIMESTAMP
error             TEXT                 -- Mensaje de error si falló
```

### Identificación de una Venta

| Campo | Propósito | Generado |
|-------|-----------|----------|
| `id` | ID secuencial en BD | Servidor (serial) |
| `cliente_tx_id` | UUID único de la venta | Cliente (crypto.randomUUID) |
| `event_id` | UUID del evento de sync | Cliente (crypto.randomUUID) |
| `fecha_venta` | Timestamp del momento de venta | Cliente |
| `fecha_sync` | Timestamp de recepción | Servidor |

### Riesgos Actuales de Duplicados

✅ **Protegido**: Ventas duplicadas por `cliente_tx_id` y `event_id`

⚠️ **Riesgo potencial**: 
- Si el cliente genera dos UUIDs diferentes para la misma venta conceptual (reintentos mal implementados)
- Si se pierde la respuesta del servidor y el cliente no tiene el evento en `vr_pending_ventas`

---

## 6. FLUJO DE TRANSACCIÓN (Paso a Paso)

```
VENDEDOR                    FRONTEND                     BACKEND                    DATABASE
    │                           │                            │                          │
    │ 1. Selecciona cliente     │                            │                          │
    ├──────────────────────────►│                            │                          │
    │                           │ localStorage.set           │                          │
    │                           │ (vr_selected_client)       │                          │
    │                           │                            │                          │
    │ 2. Agrega productos       │                            │                          │
    ├──────────────────────────►│                            │                          │
    │                           │ localStorage.set           │                          │
    │                           │ (vr_cart)                  │                          │
    │                           │                            │                          │
    │ 3. Va a Checkout          │                            │                          │
    ├──────────────────────────►│                            │                          │
    │                           │ Muestra resumen            │                          │
    │                           │                            │                          │
    │ 4. Ingresa abono y        │                            │                          │
    │    confirma               │                            │                          │
    ├──────────────────────────►│                            │                          │
    │                           │                            │                          │
    │                           │ 5. Genera UUIDs            │                          │
    │                           │    eventId, clienteTxId    │                          │
    │                           │                            │                          │
    │                           │ 6. POST /api/sync/push     │                          │
    │                           ├───────────────────────────►│                          │
    │                           │                            │                          │
    │                           │                            │ 7. Verifica eventId      │
    │                           │                            ├─────────────────────────►│
    │                           │                            │◄─────────────────────────┤
    │                           │                            │                          │
    │                           │                            │ 8. Registra sync_event   │
    │                           │                            ├─────────────────────────►│
    │                           │                            │                          │
    │                           │                            │ 9. Verifica clienteTxId  │
    │                           │                            ├─────────────────────────►│
    │                           │                            │◄─────────────────────────┤
    │                           │                            │                          │
    │                           │                            │ 10. Valida inventario    │
    │                           │                            ├─────────────────────────►│
    │                           │                            │◄─────────────────────────┤
    │                           │                            │                          │
    │                           │                            │ 11. Decrementa stock     │
    │                           │                            ├─────────────────────────►│
    │                           │                            │                          │
    │                           │                            │ 12. Calcula saldos       │
    │                           │                            │                          │
    │                           │                            │ 13. Crea venta + items   │
    │                           │                            ├─────────────────────────►│
    │                           │                            │                          │
    │                           │                            │ 14. Actualiza saldo      │
    │                           │                            ├─────────────────────────►│
    │                           │                            │                          │
    │                           │                            │ 15. Marca evento OK      │
    │                           │                            ├─────────────────────────►│
    │                           │                            │                          │
    │                           │ 16. Respuesta JSON         │                          │
    │                           │◄───────────────────────────┤                          │
    │                           │                            │                          │
    │                           │ 17. Muestra ticket         │                          │
    │◄──────────────────────────┤    Limpia carrito          │                          │
    │                           │                            │                          │
```

---

## 7. PUNTOS DÉBILES PARA POS OFFLINE

### ¿Qué Se Perdería Sin Internet?

| Funcionalidad | Estado Actual | Riesgo |
|---------------|---------------|--------|
| Login inicial | ❌ Requiere red | **CRÍTICO**: No se puede trabajar sin login previo |
| Datos de clientes | ✅ En cache | OK si se hizo bootstrap |
| Datos de productos | ✅ En cache | OK si se hizo bootstrap |
| Inventario inicial | ✅ En cache | ⚠️ Puede estar desactualizado |
| Crear ventas | ✅ Cola offline | OK, se guardan localmente |
| Ver historial | ❌ Requiere API | Solo ventas locales |
| Registrar abonos | ❌ Requiere API | **ALTO**: No se pueden registrar pagos |
| Validar stock real | ❌ Stock local desactualizado | **ALTO**: Puede vender más de lo disponible |

### ¿Qué Se Pierde Si Se Cierra la App?

| Dato | Almacenamiento | Persistencia |
|------|----------------|--------------|
| Sesión | localStorage | ✅ Persiste |
| Carrito | localStorage | ✅ Persiste |
| Cliente seleccionado | localStorage | ✅ Persiste |
| Ventas pendientes | localStorage | ✅ Persiste |
| Cache de datos | localStorage | ✅ Persiste |
| Estado de UI | Memoria | ❌ Se pierde |

### Dependencias del Navegador

1. **localStorage**: Límite ~5-10MB (insuficiente para muchos productos con imágenes)
2. **Service Worker**: Requiere HTTPS, puede ser limpiado por el navegador
3. **crypto.randomUUID()**: Necesario para generar IDs únicos
4. **fetch API**: Necesario para comunicación con servidor

### ¿Qué NO Es Seguro para un POS?

1. ❌ **Datos en localStorage**: Puede ser borrado por el usuario o el navegador
2. ❌ **Sin validación de stock local**: Puede vender productos sin stock
3. ❌ **Sin firma de transacciones**: Las ventas offline no tienen garantía de integridad
4. ❌ **Sin respaldo automático**: Si se borra localStorage, se pierden ventas pendientes
5. ❌ **JWT sin refresh**: Token expira en 7 días, luego requiere login online

---

## 8. REQUERIMIENTOS PARA OFFLINE REAL

### Datos que Deben Moverse a Base Local (SQLite/IndexedDB)

| Dato | Prioridad | Razón |
|------|-----------|-------|
| Clientes de la ruta | CRÍTICA | Necesario para crear ventas |
| Productos (catálogo) | CRÍTICA | Precios y configuración |
| Inventario de la ruta | CRÍTICA | Validar stock disponible |
| Reglas de descuento | ALTA | Cálculo correcto de precios |
| Historial de ventas del día | MEDIA | Referencia y reimprimir tickets |
| Saldos de clientes | ALTA | Mostrar deuda pendiente |

### Datos que Deben Cachearse

```javascript
const REQUIRED_OFFLINE_DATA = {
  // Catálogo (cambia poco)
  productos: { ttl: '24h', priority: 'high' },
  discount_rules: { ttl: '24h', priority: 'high' },
  
  // Ruta específica (cambia diario)
  clientes: { ttl: '12h', priority: 'critical' },
  inventario: { ttl: '1h', priority: 'critical' },
  saldos: { ttl: '1h', priority: 'high' },
  
  // Transacciones (generadas localmente)
  ventas_pendientes: { persist: true, priority: 'critical' },
  abonos_pendientes: { persist: true, priority: 'critical' },
};
```

### Reglas de Negocio que Deben Duplicarse en Cliente

1. **Validación de stock**: No permitir venta si cantidad > stock disponible local
2. **Cálculo de descuentos**: Aplicar reglas de volumen según tiers
3. **Cálculo de saldos**: Actualizar saldo local después de cada venta/abono
4. **Validación de montos**: Abono <= (total_venta + saldo_anterior)
5. **Generación de folios offline**: Secuencia local con prefijo OFFLINE-

### Cambios Mínimos en Backend

| Cambio | Descripción | Prioridad |
|--------|-------------|-----------|
| Sync bidireccional | Enviar actualizaciones de inventario al cliente | ALTA |
| Timestamps de versión | Cada registro con `updated_at` para delta sync | ALTA |
| Cola de respuestas | Guardar respuestas para clientes que se reconectan | MEDIA |
| Validación de fecha | Rechazar ventas con fecha muy antigua | MEDIA |
| Auditoría de sync | Log detallado de cada sincronización | MEDIA |

---

## 9. RECOMENDACIÓN DE ARQUITECTURA FINAL

### Arquitectura Propuesta: PWA + Android App (WebView/React Native)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITECTURA PROPUESTA                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     CAPA DE PRESENTACIÓN                            │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │   │
│  │  │   PWA (Web)     │  │  Android App    │  │   iOS App (futuro)  │ │   │
│  │  │   (React)       │  │  (React Native) │  │   (React Native)    │ │   │
│  │  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘ │   │
│  │           └───────────────────┬┴─────────────────────┘             │   │
│  └───────────────────────────────┼─────────────────────────────────────┘   │
│                                  │                                          │
│  ┌───────────────────────────────┼─────────────────────────────────────┐   │
│  │              CAPA DE LÓGICA DE NEGOCIO COMPARTIDA                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │   │
│  │  │ Validaciones    │  │ Cálculo         │  │ Generación de       │ │   │
│  │  │ de Stock        │  │ de Descuentos   │  │ Tickets             │ │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │   │
│  └───────────────────────────────┼─────────────────────────────────────┘   │
│                                  │                                          │
│  ┌───────────────────────────────┼─────────────────────────────────────┐   │
│  │                    CAPA DE DATOS LOCAL                              │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │   │
│  │  │ SQLite          │  │ Cola de Sync    │  │ Estado de la App    │ │   │
│  │  │ (Productos,     │  │ (Ventas,        │  │ (Sesión, UI)        │ │   │
│  │  │  Clientes,      │  │  Abonos         │  │                     │ │   │
│  │  │  Inventario)    │  │  pendientes)    │  │                     │ │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │   │
│  └───────────────────────────────┼─────────────────────────────────────┘   │
│                                  │                                          │
│                                  │ SYNC                                     │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         BACKEND (SIN CAMBIOS MAYORES)               │   │
│  │  Express + Drizzle + PostgreSQL                                     │   │
│  │  + Endpoints de sync mejorados                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Qué Reutilizar

| Componente | Acción | Razón |
|------------|--------|-------|
| Componentes React | ✅ Reutilizar | Funcionan en React Native Web |
| Lógica de servicios | ✅ Reutilizar | Ya está separada de UI |
| API client | ✅ Reutilizar | Compatible con cualquier cliente HTTP |
| Schema compartido | ✅ Reutilizar | TypeScript funciona igual |
| Backend Express | ✅ Reutilizar | Agregar endpoints de sync |
| Estilos Tailwind | ⚠️ Adaptar | Usar NativeWind para React Native |

### Qué NO Tocar

1. ✅ Estructura de base de datos (ya tiene idempotencia)
2. ✅ Lógica de autenticación JWT
3. ✅ Sistema de roles y permisos
4. ✅ Cálculo de descuentos en servidor

### Qué Extender

| Extensión | Descripción | Esfuerzo |
|-----------|-------------|----------|
| SQLite local | Reemplazar localStorage con SQLite | ALTO |
| Delta sync | Sincronización incremental por timestamps | ALTO |
| Background sync | Sincronizar cuando hay conexión | MEDIO |
| Validación local de stock | Bloquear ventas sin stock | MEDIO |
| Impresión térmica | Soporte para impresoras POS | MEDIO |
| Modo kiosko | Bloquear salida de la app | BAJO |

### Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Conflictos de sync | MEDIA | ALTO | Estrategia last-write-wins + auditoría |
| Pérdida de datos locales | BAJA | CRÍTICO | Backup automático a archivo + sync frecuente |
| Stock desactualizado | ALTA | MEDIO | Sync cada X minutos cuando hay red |
| Duplicación de ventas | BAJA | MEDIO | Ya mitigado con eventId/clienteTxId |
| Falla de impresora | ALTA | BAJO | Cola de impresión + reintento |

---

## 10. ENTREGABLE FINAL

### Mapa de Carpetas

```
ventas-por-ruta/
├── client/                      # Frontend React PWA
│   ├── public/
│   │   ├── sw.js               # Service Worker
│   │   ├── manifest.json       # PWA manifest
│   │   └── icons/              # Iconos PWA
│   └── src/
│       ├── main.tsx            # Punto de entrada
│       ├── App.tsx             # Router y providers
│       ├── index.css           # Estilos globales
│       ├── components/         # Componentes reutilizables
│       │   ├── ui/             # shadcn/ui components
│       │   ├── AppShell.tsx    # Layout principal
│       │   ├── ProtectedRoute.tsx
│       │   └── TicketPrint.tsx # Generación de tickets
│       ├── pages/              # Páginas/vistas
│       │   ├── Login.tsx
│       │   ├── Clientes.tsx
│       │   ├── Productos.tsx
│       │   ├── Checkout.tsx    # ⭐ Flujo de venta
│       │   ├── Historial.tsx   # ⭐ Historial y Excel
│       │   ├── Abonos.tsx
│       │   ├── admin/          # Páginas de administrador
│       │   └── auditoria/      # Páginas de auditor
│       ├── services/           # Lógica de negocio
│       │   ├── ventas.ts       # ⭐ Registro y cola offline
│       │   ├── historial.ts    # ⭐ Consulta de historial
│       │   ├── offlineCache.ts # Cache local
│       │   ├── discounts.ts    # Cálculo de descuentos
│       │   └── api.ts          # Llamadas base
│       ├── lib/
│       │   ├── api.ts          # ⭐ Cliente API + tipos
│       │   └── queryClient.ts  # TanStack Query config
│       ├── store/
│       │   ├── store.tsx       # Estado global (Context)
│       │   ├── storage.ts      # Wrapper localStorage
│       │   └── types.ts        # Tipos del store
│       ├── hooks/              # Custom hooks
│       └── utils/
│           └── exportExcel.ts  # ⭐ Exportación Excel
│
├── server/                      # Backend Express
│   ├── index.ts                # Punto de entrada (dev)
│   ├── index.prod.ts           # Punto de entrada (prod)
│   ├── routes.ts               # ⭐ Todos los endpoints API
│   ├── storage.ts              # ⭐ Operaciones de BD
│   ├── seed.ts                 # Datos iniciales
│   ├── static.ts               # Servir estáticos (prod)
│   └── vite.ts                 # Config Vite (dev)
│
├── shared/
│   └── schema.ts               # ⭐ Esquema Drizzle + tipos
│
├── package.json                # Dependencias y scripts
├── tsconfig.json               # Config TypeScript
├── vite.config.ts              # Config Vite
├── drizzle.config.ts           # Config Drizzle
├── replit.md                   # Documentación del proyecto
└── README_TECNICO.md           # ⭐ Este documento
```

### Flujo de Datos (Resumen)

```
INICIO DE JORNADA:
  Vendedor → Login → Bootstrap → Cache local → Listo para vender

VENTA NORMAL (CON RED):
  Seleccionar cliente → Agregar productos → Checkout → Confirmar
    → POST /api/sync/push
    → Validar stock → Decrementar inventario → Crear venta
    → Actualizar saldo → Respuesta → Mostrar ticket

VENTA OFFLINE (SIN RED):
  Seleccionar cliente → Agregar productos → Checkout → Confirmar
    → Error de red → Guardar en vr_pending_ventas
    → Mostrar ticket OFFLINE → Reintentar cuando haya red

SINCRONIZACIÓN:
  App detecta conexión → Lee vr_pending_ventas → POST /api/sync/push
    → Por cada venta: Verificar idempotencia → Procesar o skip
    → Remover de cola local → Actualizar cache local
```

### Checklist de Preparación para Android POS

#### Fase 1: Preparación del Código Actual
- [ ] Extraer lógica de negocio de componentes a servicios puros
- [ ] Crear capa de abstracción para almacenamiento (localStorage → interface)
- [ ] Documentar todas las llamadas a APIs nativas del navegador
- [ ] Agregar tests unitarios para servicios críticos

#### Fase 2: Base de Datos Local
- [ ] Implementar SQLite con esquema compatible (usar Drizzle o similar)
- [ ] Crear migraciones locales automáticas
- [ ] Implementar sincronización bidireccional
- [ ] Agregar timestamps `updated_at` a todas las tablas del servidor

#### Fase 3: Sincronización Mejorada
- [ ] Implementar delta sync (solo cambios desde último sync)
- [ ] Agregar endpoint `/api/sync/pull` para descargar actualizaciones
- [ ] Implementar Background Sync API (web) o equivalente (Android)
- [ ] Agregar indicador de conexión y cola de pendientes en UI

#### Fase 4: Aplicación Android
- [ ] Evaluar React Native vs PWA en WebView
- [ ] Configurar proyecto React Native (si aplica)
- [ ] Integrar SQLite nativo (react-native-sqlite-storage o expo-sqlite)
- [ ] Implementar impresión térmica (Bluetooth/USB)
- [ ] Configurar modo kiosko (device owner)

#### Fase 5: Pruebas y Despliegue
- [ ] Pruebas de sincronización en escenarios de red intermitente
- [ ] Pruebas de rendimiento con grandes volúmenes de datos
- [ ] Pruebas de impresión con diferentes modelos de impresoras
- [ ] Documentación de usuario final
- [ ] Despliegue en Play Store (si es APK) o actualización de PWA

---

## Credenciales de Prueba

| Usuario | Contraseña | Rol | Ruta |
|---------|------------|-----|------|
| vendedor1 | 1234 | vendedor | Ruta Centro |
| vendedor2 | 1234 | vendedor | Ruta Norte |
| auditor | 1234 | auditor | Todas |
| admin | 1234 | admin | Todas |

---

**Documento generado automáticamente por análisis del código fuente.**
