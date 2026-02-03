# Ventas por Ruta - Documentación Completa

## 📖 1. Descripción General del Proyecto

### Propósito del Sistema
**Ventas por Ruta** es un sistema integral de gestión de ventas y control de inventario diseñado específicamente para vendedores de ruta (comercio móvil). Permite a los vendedores gestionar clientes, productos, inventario y transacciones de venta mientras trabajan en sus rutas asignadas.

### Problema que Resuelve
- **Gestión offline de ventas**: Los vendedores pueden registrar ventas sin conexión a internet
- **Control de inventario en tiempo real**: Validación de stock antes de cada venta (sin stock negativo)
- **Descuentos automatizados**: Sistema de descuentos por volumen y por cliente específico
- **Créditos y abonos**: Control de saldos de clientes con sistema de pagos parciales
- **Auditoría completa**: Historial de todas las transacciones y movimientos de stock

### Tipo de Aplicación
- **PWA (Progressive Web App)**: Aplicación web responsiva con capacidades offline
- **Full-stack**: Frontend React + Backend Express + PostgreSQL
- **Mobile-first**: Diseñado para uso en dispositivos móviles

### Usuarios Objetivo
| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Vendedor** | Vendedor de ruta asignado a una ruta específica | Ver clientes/productos de su ruta, registrar ventas, ver su historial |
| **Auditor** | Supervisor de operaciones | Ver todas las rutas, historial de ventas, movimientos de stock |
| **Admin** | Administrador del sistema | Acceso completo: CRUD de productos, clientes, descuentos, usuarios |

---

## 🧱 2. Arquitectura del Sistema

### Diagrama Lógico de la Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser/PWA)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │   React 18   │  │  TanStack    │  │   LocalStorage           │   │
│  │   + Wouter   │  │   Query      │  │   (Ventas Offline)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS / HTTP
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVIDOR (Express)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │   Express 5  │  │   JWT Auth   │  │   Zod Validation         │   │
│  │   REST API   │  │   bcryptjs   │  │   Role Middleware        │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ Drizzle ORM
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BASE DE DATOS                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL (AWS RDS)                       │   │
│  │   15+ tablas: usuarios, rutas, clientes, productos,          │   │
│  │   inventario_ruta, ventas, venta_items, descuentos, etc.     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Separación de Capas

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| **Frontend** | React 18 + Vite | UI, estado local, navegación, offline storage |
| **Backend** | Express 5 + Node.js | API REST, autenticación, validación, lógica de negocio |
| **Base de Datos** | PostgreSQL + Drizzle ORM | Persistencia, integridad referencial, índices |

### Flujo General de Datos

1. **Login**: Usuario → POST /api/auth/login → JWT Token
2. **Bootstrap**: Vendedor → GET /api/me/bootstrap → Descarga clientes, productos, inventario de su ruta
3. **Venta Offline**: Vendedor registra venta → LocalStorage → POST /api/sync/push (cuando hay conexión)
4. **Sync Idempotente**: Servidor valida `eventId` y `clienteTxId` para evitar duplicados
5. **Inventario**: Cada venta decrementa el inventario correspondiente con validación de stock

---

## ⚙️ 3. Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.2.0 | Framework UI |
| Vite | 7.1.9 | Build tool y dev server |
| TypeScript | 5.6.3 | Tipado estático |
| Wouter | 3.3.5 | Routing ligero |
| TanStack Query | 5.60.5 | Server state management |
| Tailwind CSS | 4.1.14 | Estilos |
| shadcn/ui | - | Componentes UI (Radix UI) |
| Lucide React | 0.545.0 | Iconos |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | 20.x | Runtime |
| Express | 5.0.1 | Framework web |
| Drizzle ORM | 0.39.3 | ORM para PostgreSQL |
| jsonwebtoken | 9.0.3 | Autenticación JWT |
| bcryptjs | 3.0.3 | Hash de contraseñas |
| Zod | 3.25.76 | Validación de schemas |
| pg | 8.16.3 | Driver PostgreSQL |

### Herramientas de Desarrollo
| Herramienta | Uso |
|-------------|-----|
| TSX | Ejecución de TypeScript en desarrollo |
| esbuild | Bundling del servidor para producción |
| Drizzle Kit | Migraciones de base de datos |

---

## 📂 4. Estructura del Proyecto

```
ventas-por-ruta/
├── client/                          # Frontend React
│   ├── index.html                   # Entry point HTML
│   └── src/
│       ├── App.tsx                  # Componente principal y rutas
│       ├── main.tsx                 # Bootstrap de React
│       ├── index.css                # Estilos globales (Tailwind)
│       ├── components/
│       │   ├── AppShell.tsx         # Layout principal con navegación
│       │   ├── ProtectedRoute.tsx   # HOC para rutas protegidas
│       │   ├── TicketPrint.tsx      # Generador de tickets 58mm
│       │   ├── DataTable.tsx        # Tabla de datos reutilizable
│       │   ├── SearchInput.tsx      # Input de búsqueda
│       │   └── ui/                  # Componentes shadcn/ui
│       ├── pages/
│       │   ├── Login.tsx            # Página de login
│       │   ├── Clientes.tsx         # Lista de clientes (vendedor)
│       │   ├── Productos.tsx        # Catálogo de productos
│       │   ├── Checkout.tsx         # Carrito y proceso de venta
│       │   ├── Historial.tsx        # Historial de ventas
│       │   ├── MiHistorial.tsx      # Historial personal del vendedor
│       │   ├── Abonos.tsx           # Gestión de abonos/créditos
│       │   ├── Configuracion.tsx    # Configuración de la app
│       │   ├── admin/               # Páginas de administración
│       │   │   ├── Descuentos.tsx   # CRUD de reglas de descuento
│       │   │   ├── Productos.tsx    # CRUD de productos
│       │   │   └── Clientes.tsx     # CRUD de clientes
│       │   └── auditoria/           # Páginas de auditoría
│       │       ├── MoverStock.tsx   # Transferencia de stock
│       │       ├── EntradaBodega.tsx# Entrada de mercancía
│       │       ├── StockBodega.tsx  # Inventario de bodega
│       │       └── Movimientos.tsx  # Historial de movimientos
│       ├── services/                # Servicios de API
│       │   ├── api.ts               # Cliente HTTP base
│       │   ├── auth.ts              # Autenticación
│       │   ├── ventas.ts            # Operaciones de ventas
│       │   └── ...
│       ├── store/                   # Estado global
│       │   ├── store.tsx            # Context + Provider
│       │   ├── storage.ts           # Persistencia localStorage
│       │   └── types.ts             # Tipos del store
│       ├── lib/
│       │   ├── api.ts               # Cliente API con Axios
│       │   ├── queryClient.ts       # Configuración TanStack Query
│       │   └── utils.ts             # Utilidades (cn, etc.)
│       └── hooks/
│           ├── use-toast.ts         # Hook de notificaciones
│           └── use-mobile.tsx       # Detección de móvil
│
├── server/                          # Backend Express
│   ├── index.ts                     # Entry point del servidor
│   ├── routes.ts                    # Definición de endpoints API
│   ├── storage.ts                   # Capa de acceso a datos (Drizzle)
│   ├── static.ts                    # Servidor de archivos estáticos
│   ├── vite.ts                      # Integración Vite (desarrollo)
│   ├── github.ts                    # Integración con GitHub
│   └── seed.ts                      # Datos iniciales
│
├── shared/
│   └── schema.ts                    # Esquema de base de datos (Drizzle)
│
├── script/
│   ├── build.ts                     # Script de build
│   └── sync-github.ts               # Sincronización con GitHub
│
├── docs/                            # Documentación
│   ├── DOCUMENTACION_COMPLETA.md    # Este archivo
│   └── ...
│
├── package.json                     # Dependencias y scripts
├── tsconfig.json                    # Configuración TypeScript
├── vite.config.ts                   # Configuración Vite
├── drizzle.config.ts                # Configuración Drizzle
├── Procfile                         # Heroku/Railway
├── railway.json                     # Configuración Railway
└── render.yaml                      # Configuración Render
```

---

## 🚀 5. Instalación y Montaje del Proyecto

### Requisitos Previos
- **Node.js** 20.x o superior
- **npm** 10.x o superior
- **PostgreSQL** 14+ (local o remoto)

### Variables de Entorno Necesarias

Crear archivo `.env` en la raíz:

```env
# Base de datos
DATABASE_URL=postgresql://usuario:password@host:5432/ventas_db

# Para AWS RDS (detecta automáticamente SSL)
# DATABASE_URL=postgresql://usuario:password@xxx.rds.amazonaws.com:5432/ventas_db?sslmode=require

# Autenticación
JWT_SECRET=tu-clave-secreta-muy-larga-y-segura

# Modo
NODE_ENV=development

# Puerto (opcional, default 5000)
PORT=5000

# SSL para AWS RDS (si es necesario)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Pasos de Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/OzMi2/ventas-por-ruta.git
cd ventas-por-ruta

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Sincronizar esquema de base de datos
npm run db:push

# 5. (Opcional) Ejecutar seed de datos iniciales
npx tsx server/seed.ts

# 6. Iniciar en desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:5000
```

### Build de Producción

```bash
# Generar build de producción
npm run build

# Iniciar servidor de producción
npm run start
```

---

## 🌐 6. Configuración del Servidor

### Estructura del Servidor

```typescript
// server/index.ts - Configuración principal
const app = express();

// Middlewares globales
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging de requests
app.use((req, res, next) => {
  // Log de todas las peticiones a /api
});

// Registro de rutas
await registerRoutes(httpServer, app);

// Archivos estáticos (producción)
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
}

// Puerto
const port = parseInt(process.env.PORT || "5000", 10);
httpServer.listen({ port, host: "0.0.0.0" });
```

### Middlewares de Seguridad

1. **CORS**: Habilitado para todas las origins (configurable)
2. **authMiddleware**: Valida JWT token en header `Authorization: Bearer <token>`
3. **requireRole**: Middleware de autorización por rol

```typescript
// Ejemplo de protección de ruta
app.post("/api/descuentos", authMiddleware, requireRole("admin"), handler);
```

### Flujo de Request/Response

```
Request → CORS → JSON Parser → Logger → Auth Middleware → Role Check → Handler → Response
```

### Manejo de Errores

```typescript
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(status).json({ message });
});
```

---

## 🗄️ 7. Base de Datos

### Motor de Base de Datos
**PostgreSQL 14+** con Drizzle ORM

### Modelo de Datos (Tablas Principales)

#### Tablas Core

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `usuarios` | Usuarios del sistema | id, username, password, nombre, rol, rutaId |
| `rutas` | Rutas de venta | id, nombre, descripcion, activa |
| `clientes` | Clientes de la empresa | id, nombre, direccion, telefono, rutaId |
| `productos` | Catálogo de productos | id, nombre, precio, unidad (PIEZA/KG/MIXTO) |

#### Tablas de Inventario

| Tabla | Descripción |
|-------|-------------|
| `inventario_bodega` | Stock central por producto |
| `inventario_ruta` | Stock por ruta y producto |
| `inventario_bodega_mixto` | Stock central MIXTO (piezas + kg) |
| `inventario_ruta_mixto` | Stock ruta MIXTO (piezas + kg) |
| `movimientos_stock` | Historial de transferencias |

#### Tablas de Ventas

| Tabla | Descripción |
|-------|-------------|
| `ventas` | Registro de ventas |
| `venta_items` | Items de cada venta |
| `sync_events` | Eventos de sincronización (idempotencia) |

#### Tablas de Descuentos y Créditos

| Tabla | Descripción |
|-------|-------------|
| `discount_rules` | Reglas de descuento |
| `discount_tiers` | Niveles de volumen para descuentos |
| `saldos_clientes` | Saldo de crédito por cliente |
| `abonos` | Pagos parciales de crédito |

### Diagrama de Relaciones

```
rutas ──────┬──── usuarios (rutaId)
            ├──── clientes (rutaId)
            ├──── inventario_ruta (rutaId)
            ├──── inventario_ruta_mixto (rutaId)
            └──── ventas (rutaId)

productos ──┬──── inventario_ruta (productoId)
            ├──── inventario_bodega (productoId)
            ├──── venta_items (productoId)
            └──── discount_rules (productoId)

clientes ───┬──── ventas (clienteId)
            ├──── discount_rules (clienteId) [opcional]
            ├──── saldos_clientes (clienteId)
            └──── abonos (clienteId)

ventas ─────┴──── venta_items (ventaId)
```

### Conexión a Base de Datos

```typescript
// server/storage.ts
constructor() {
  let dbUrl = process.env.AWS_DATABASE_URL || process.env.DATABASE_URL || '';
  const isExternalDB = dbUrl.includes('amazonaws.com') || dbUrl.includes('rds.');
  
  // Quitar sslmode del URL para manejarlo manualmente
  if (isExternalDB) {
    dbUrl = dbUrl.replace(/[?&]sslmode=[^&]*/g, '');
  }
  
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isExternalDB ? { rejectUnauthorized: false } : false,
  });
  
  this.db = drizzle(pool);
}
```

### Ejemplos de Consultas con Drizzle

```typescript
// Obtener clientes por ruta
async getClientesByRuta(rutaId: number) {
  return this.db.select()
    .from(clientes)
    .where(and(
      eq(clientes.rutaId, rutaId),
      eq(clientes.activo, true)
    ));
}

// Crear venta con items (transacción)
async createVentaWithItems(venta: InsertVenta, items: InsertVentaItem[]) {
  return this.db.transaction(async (tx) => {
    const [newVenta] = await tx.insert(ventas).values(venta).returning();
    for (const item of items) {
      await tx.insert(ventaItems).values({ ...item, ventaId: newVenta.id });
    }
    return newVenta;
  });
}
```

---

## 🔑 8. Variables de Entorno

### Lista Completa

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `DATABASE_URL` | ✅ | URL de conexión PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ | Clave secreta para JWT | `mi-clave-super-secreta-123` |
| `NODE_ENV` | ❌ | Modo de ejecución | `development` / `production` |
| `PORT` | ❌ | Puerto del servidor (default: 5000) | `5000` |
| `NODE_TLS_REJECT_UNAUTHORIZED` | ❌ | Deshabilitar verificación SSL (AWS RDS) | `0` |
| `VITE_API_BASE_URL` | ❌ | URL base del API (frontend) | `http://api.example.com/api` |

### Archivo .env de Ejemplo

```env
# ========================================
# CONFIGURACIÓN DE BASE DE DATOS
# ========================================
DATABASE_URL=postgresql://postgres:password123@localhost:5432/ventas_ruta

# Para AWS RDS:
# DATABASE_URL=postgresql://admin:password@mydb.xxx.us-east-2.rds.amazonaws.com:5432/ventas

# ========================================
# SEGURIDAD
# ========================================
JWT_SECRET=cambiar-esta-clave-en-produccion-usar-minimo-32-caracteres

# ========================================
# SERVIDOR
# ========================================
NODE_ENV=development
PORT=5000

# ========================================
# SSL (solo si usas AWS RDS)
# ========================================
NODE_TLS_REJECT_UNAUTHORIZED=0
```

---

## 🌍 9. Conexión a Dominio y Despliegue

### Opción 1: Railway (Recomendado)

1. **Crear cuenta** en [railway.app](https://railway.app) con GitHub
2. **Nuevo proyecto** → "Deploy from GitHub repo"
3. **Seleccionar repositorio** `ventas-por-ruta`
4. **Agregar variables de entorno**:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_TLS_REJECT_UNAUTHORIZED=0` (si usas AWS RDS)
5. Railway detectará automáticamente y desplegará
6. **Dominio automático**: `tu-app.up.railway.app` con HTTPS

### Opción 2: Render

1. **Crear cuenta** en [render.com](https://render.com)
2. **New Web Service** → Conectar repositorio GitHub
3. **Configurar**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
4. **Variables de entorno** en panel de Render
5. **Dominio automático**: `tu-app.onrender.com` con HTTPS

### Opción 3: AWS Lightsail (Manual)

```bash
# En instancia Ubuntu
sudo apt update && sudo apt install -y nodejs npm

# Clonar y configurar
git clone https://github.com/OzMi2/ventas-por-ruta.git
cd ventas-por-ruta
npm install
npm run build

# Configurar PM2
npm install -g pm2
NODE_TLS_REJECT_UNAUTHORIZED=0 pm2 start npm --name "ventas-api" -- run start
pm2 save
pm2 startup
```

### Configuración de Dominio Personalizado

#### Con Cloudflare (Proxy)

1. Agregar dominio a Cloudflare
2. Configurar DNS:
   - Tipo: **A** o **CNAME**
   - Nombre: `@` o `app`
   - Contenido: IP del servidor o URL de Railway/Render
   - Proxy: **Activado** (nube naranja)
3. SSL/TLS → Modo **Full (strict)**

#### DNS Records Ejemplo

```
Tipo    Nombre    Contenido                      TTL
A       @         123.45.67.89                   Auto
CNAME   www       tu-app.up.railway.app          Auto
CNAME   api       tu-api.up.railway.app          Auto
```

---

## 📡 10. API / Funciones Principales

### Endpoints de Autenticación

#### POST /api/auth/login
Autentica un usuario y retorna JWT token.

**Request:**
```json
{
  "username": "R1",
  "password": "3142"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": 1,
    "username": "R1",
    "nombre": "Juan",
    "rol": "vendedor",
    "rutaId": 1
  }
}
```

### Endpoints de Datos (Requieren JWT)

#### GET /api/me/bootstrap
Descarga datos iniciales para vendedor (clientes, productos, inventario de su ruta).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "usuario": { ... },
  "ruta": { "id": 1, "nombre": "Ruta Centro" },
  "clientes": [ ... ],
  "productos": [ ... ],
  "inventario": [ ... ],
  "inventarioMixto": [ ... ]
}
```

#### POST /api/sync/push
Sincroniza ventas offline con el servidor.

**Request:**
```json
{
  "events": [{
    "eventId": "uuid-unico",
    "tipo": "venta",
    "venta": {
      "clienteTxId": "uuid-transaccion",
      "clienteId": 1,
      "rutaId": 1,
      "fechaVenta": "2026-02-03T10:00:00Z",
      "subtotal": "100.00",
      "descuento": "10.00",
      "total": "90.00"
    },
    "items": [{
      "productoId": 1,
      "cantidad": "5",
      "precioUnitario": "20.00",
      "subtotal": "100.00"
    }],
    "abono": 50
  }]
}
```

**Response:**
```json
{
  "results": [{
    "eventId": "uuid-unico",
    "status": "success",
    "ventaId": 123,
    "saldoFinal": "40.00"
  }]
}
```

### Endpoints de Consulta

| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/ventas` | GET | Historial de ventas | todos |
| `/api/clientes` | GET | Lista de clientes | todos |
| `/api/productos` | GET | Catálogo de productos | todos |
| `/api/rutas` | GET | Lista de rutas | admin, auditor |
| `/api/descuentos` | GET | Reglas de descuento | todos |

### Endpoints de Administración

| Endpoint | Método | Descripción | Rol |
|----------|--------|-------------|-----|
| `/api/descuentos` | POST | Crear regla de descuento | admin |
| `/api/descuentos/:id` | DELETE | Eliminar descuento | admin |
| `/api/clientes` | POST | Crear cliente | admin |
| `/api/productos` | POST | Crear producto | admin |

---

## 🧪 11. Pruebas y Verificación

### Health Check

```bash
curl http://localhost:5000/api/health
# Response: {"status":"ok","timestamp":"2026-02-03T10:00:00.000Z"}
```

### Prueba de Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"R1","password":"3142"}'
```

### Prueba de Bootstrap

```bash
TOKEN="eyJhbGci..."
curl http://localhost:5000/api/me/bootstrap \
  -H "Authorization: Bearer $TOKEN"
```

### Usuarios de Prueba (password: 1234 o según seed)

| Usuario | Rol | Ruta |
|---------|-----|------|
| R1 | vendedor | Ruta 1 |
| auditor | auditor | - |
| admin | admin | - |

---

## 📦 12. Repositorios y Versionamiento

### Estructura del Repositorio

```
main (producción)
├── Código estable y probado
└── Deployments automáticos a producción
```

### Convención de Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formateo, sin cambios de lógica
refactor: restructuración de código
test: pruebas
chore: tareas de mantenimiento
```

### Ejemplo de Commit

```bash
git commit -m "feat: agregar sistema de descuentos por cliente"
git commit -m "fix: corregir validación de stock negativo"
```

---

## 🔒 13. Seguridad y Buenas Prácticas

### Manejo de Credenciales

- ✅ Contraseñas hasheadas con bcrypt (salt rounds: 10)
- ✅ JWT tokens con expiración (7 días)
- ✅ Variables de entorno para secretos
- ❌ NUNCA commitear archivos .env

### Protección de Rutas

```typescript
// Middleware de autenticación
app.use("/api/protected", authMiddleware);

// Middleware de autorización por rol
app.post("/api/admin", authMiddleware, requireRole("admin"), handler);
```

### Validación de Datos

```typescript
// Zod schemas para validación
const syncPushSchema = z.object({
  events: z.array(z.object({
    eventId: z.string(),
    tipo: z.literal("venta"),
    // ...
  })),
});

// Uso en endpoint
const body = syncPushSchema.parse(req.body);
```

### Recomendaciones de Seguridad

1. **Usar HTTPS** en producción (Railway/Render lo incluyen)
2. **JWT_SECRET** largo y aleatorio (mínimo 32 caracteres)
3. **Validar inputs** con Zod en todos los endpoints
4. **Rate limiting** (implementar si es necesario)
5. **Logs de auditoría** (sync_events registra todo)

---

## 📄 14. Notas Finales

### Posibles Mejoras

1. **Notificaciones push** para vendedores
2. **Reportes PDF** exportables
3. **Dashboard de métricas** para admin
4. **Geolocalización** de vendedores
5. **Sincronización en background** con Service Workers

### Escalabilidad

- **Base de datos**: PostgreSQL soporta millones de registros
- **Servidor**: Stateless, puede escalar horizontalmente
- **Cache**: Implementar Redis para sesiones/cache si es necesario
- **CDN**: Usar Cloudflare para assets estáticos

### Mantenimiento

1. **Backups diarios** de base de datos
2. **Monitoreo** con logs de PM2 o servicio externo
3. **Actualizaciones** regulares de dependencias
4. **Health checks** automatizados

---

## 🆘 Soporte

Para soporte técnico o preguntas sobre este proyecto:

- **Repositorio**: https://github.com/OzMi2/ventas-por-ruta
- **Issues**: Crear issue en GitHub para bugs o features

---

## 🌐 15. Configuración de Dominios Personalizados (Guía Detallada)

Esta sección explica paso a paso cómo conectar tu dominio personalizado a la aplicación desplegada en Railway.

### Variables de Entorno en Railway

Antes de configurar el dominio, asegúrate de tener estas variables configuradas en Railway:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://usuario:contraseña@host:5432/basedatos?sslmode=require` | URL de conexión a PostgreSQL |
| `JWT_SECRET` | `Tu_Clave_Secreta_Muy_Larga_2026` | Clave para firmar tokens JWT |
| `NODE_ENV` | `production` | Modo de producción |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` | Permite conexiones SSL sin certificado verificado (necesario para AWS RDS) |

> **IMPORTANTE**: Si tu contraseña contiene caracteres especiales como `$`, `@`, `#`, `!`, debes codificarlos en la URL:
> - `$` → `%24`
> - `@` → `%40`
> - `#` → `%23`
> - `!` → `%21`
> - `&` → `%26`
> - `=` → `%3D`

**Ejemplo de DATABASE_URL con contraseña que contiene `$`:**
```
postgresql://dbmasteruser:MiPassword%24123@midb.us-east-2.rds.amazonaws.com:5432/ventas?sslmode=require
```

---

### 15.1 Configuración en GoDaddy

#### Paso 1: Acceder al Panel de DNS
1. Inicia sesión en [godaddy.com](https://godaddy.com)
2. Ve a **"Mis productos"** → selecciona tu dominio
3. Click en **"DNS"** o **"Administrar DNS"**

#### Paso 2: Agregar Registro CNAME
1. En la sección **"Registros"**, click en **"Agregar"**
2. Configurar:
   - **Tipo**: `CNAME`
   - **Nombre**: `@` (para dominio raíz) o `app` (para subdominio app.tudominio.com)
   - **Valor**: `web-production-7ceb1.up.railway.app` (tu URL de Railway sin https://)
   - **TTL**: `600` segundos (o "1 hora")
3. Click en **"Guardar"**

#### Paso 3: Para dominio raíz (@)
GoDaddy no soporta CNAME en raíz. Usa **"Forwarding"**:
1. Ve a **"Forwarding"** en el panel de DNS
2. **Reenviar a**: `https://app.tudominio.com`
3. **Tipo**: `Permanente (301)`
4. Guarda cambios

#### Configuración Final GoDaddy
```
Tipo      Nombre    Valor                                    TTL
CNAME     app       web-production-7ceb1.up.railway.app      600
CNAME     www       web-production-7ceb1.up.railway.app      600
```

---

### 15.2 Configuración en Namecheap

#### Paso 1: Acceder a DNS Avanzado
1. Inicia sesión en [namecheap.com](https://namecheap.com)
2. Ve a **"Domain List"** → click en **"Manage"** junto a tu dominio
3. Click en pestaña **"Advanced DNS"**

#### Paso 2: Agregar Registros
1. En **"Host Records"**, click **"Add New Record"**
2. Para subdominio `app`:
   - **Type**: `CNAME Record`
   - **Host**: `app`
   - **Value**: `web-production-7ceb1.up.railway.app`
   - **TTL**: `Automatic`
3. Para `www`:
   - **Type**: `CNAME Record`
   - **Host**: `www`
   - **Value**: `web-production-7ceb1.up.railway.app`
   - **TTL**: `Automatic`

#### Paso 3: Para dominio raíz
Namecheap soporta **ALIAS** para raíz:
1. **Type**: `ALIAS Record`
2. **Host**: `@`
3. **Value**: `web-production-7ceb1.up.railway.app`

#### Configuración Final Namecheap
```
Type      Host    Value                                    TTL
ALIAS     @       web-production-7ceb1.up.railway.app      Auto
CNAME     app     web-production-7ceb1.up.railway.app      Auto
CNAME     www     web-production-7ceb1.up.railway.app      Auto
```

---

### 15.3 Configuración en Cloudflare

#### Paso 1: Agregar Sitio a Cloudflare
1. Crea cuenta en [cloudflare.com](https://cloudflare.com)
2. Click **"Add a Site"** → ingresa tu dominio
3. Selecciona plan **Free**
4. Cloudflare escaneará tus DNS actuales

#### Paso 2: Cambiar Nameservers
Cloudflare te dará 2 nameservers, ejemplo:
- `aria.ns.cloudflare.com`
- `bruce.ns.cloudflare.com`

Ve a tu registrador (GoDaddy, Namecheap, etc.) y cambia los nameservers a los de Cloudflare.

#### Paso 3: Configurar DNS en Cloudflare
1. En el dashboard de Cloudflare, ve a **"DNS"** → **"Records"**
2. Click **"Add record"**

**Para subdominio:**
- **Type**: `CNAME`
- **Name**: `app` (o `www`)
- **Target**: `web-production-7ceb1.up.railway.app`
- **Proxy status**: **Proxied** (nube naranja) ✅

**Para dominio raíz:**
Cloudflare soporta **CNAME Flattening** para raíz:
- **Type**: `CNAME`
- **Name**: `@`
- **Target**: `web-production-7ceb1.up.railway.app`
- **Proxy status**: **Proxied** ✅

#### Paso 4: Configurar SSL/TLS
1. Ve a **"SSL/TLS"** en el menú lateral
2. Selecciona modo **"Full (strict)"**
3. En **"Edge Certificates"**, activa:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites

#### Configuración Final Cloudflare
```
Type      Name    Content                                  Proxy
CNAME     @       web-production-7ceb1.up.railway.app      Proxied ☁️
CNAME     www     web-production-7ceb1.up.railway.app      Proxied ☁️
CNAME     app     web-production-7ceb1.up.railway.app      Proxied ☁️
```

---

### 15.4 Configuración en Google Domains / Squarespace

#### Paso 1: Acceder a DNS
1. Ve a [domains.squarespace.com](https://domains.squarespace.com) (Google Domains migró a Squarespace)
2. Selecciona tu dominio
3. Click en **"DNS"** → **"DNS Settings"**

#### Paso 2: Agregar Registros
Click **"Add record"** para cada registro:

**Para subdominio:**
- **Host name**: `app`
- **Type**: `CNAME`
- **Data**: `web-production-7ceb1.up.railway.app`

**Para dominio raíz:**
Squarespace soporta **"Synthetic records"** → **"Subdomain forward"**:
1. Ve a **"Synthetic records"**
2. **Subdomain forward**: vacío (para raíz)
3. **Destination URL**: `https://app.tudominio.com`

#### Configuración Final Squarespace/Google Domains
```
Host name    Type      Data
app          CNAME     web-production-7ceb1.up.railway.app
www          CNAME     web-production-7ceb1.up.railway.app
```

---

### 15.5 Configuración en HostGator

#### Paso 1: Acceder a cPanel
1. Inicia sesión en tu cuenta HostGator
2. Ve a **cPanel** → sección **"Domains"**
3. Click en **"Zone Editor"** o **"Advanced DNS Zone Editor"**

#### Paso 2: Agregar Registro CNAME
1. Selecciona tu dominio
2. Click **"+ Add Record"** → **"CNAME"**
3. Configurar:
   - **Name**: `app.tudominio.com.` (con punto al final)
   - **CNAME**: `web-production-7ceb1.up.railway.app`
   - **TTL**: `14400`
4. Click **"Add Record"**

#### Configuración Final HostGator
```
Name                     Type      Record                                   TTL
app.tudominio.com.       CNAME     web-production-7ceb1.up.railway.app      14400
www.tudominio.com.       CNAME     web-production-7ceb1.up.railway.app      14400
```

---

### 15.6 Configuración en Bluehost

#### Paso 1: Acceder a DNS
1. Inicia sesión en [bluehost.com](https://bluehost.com)
2. Ve a **"Domains"** → selecciona tu dominio
3. Click en **"DNS"**

#### Paso 2: Agregar CNAME
1. Busca sección **"CNAME"**
2. Click **"Add Record"**
3. Configurar:
   - **Host Record**: `app`
   - **Points To**: `web-production-7ceb1.up.railway.app`
   - **TTL**: `4 Hours`

#### Configuración Final Bluehost
```
Host Record    Points To                                TTL
app            web-production-7ceb1.up.railway.app      4 Hours
www            web-production-7ceb1.up.railway.app      4 Hours
```

---

### 15.7 Agregar Dominio en Railway

Una vez configurado el DNS en tu proveedor, debes agregar el dominio en Railway:

#### Paso 1: Ir a Settings
1. Abre tu proyecto en [railway.app](https://railway.app)
2. Selecciona tu servicio (web)
3. Ve a pestaña **"Settings"**

#### Paso 2: Agregar Custom Domain
1. Busca sección **"Domains"**
2. Click **"+ Custom Domain"**
3. Ingresa tu dominio: `app.tudominio.com`
4. Railway mostrará el registro DNS que necesitas (ya lo configuraste)

#### Paso 3: Verificar
1. Railway verificará automáticamente el DNS
2. Estado cambiará a ✅ **"Valid"**
3. Railway generará certificado SSL automáticamente

---

### 15.8 Verificar Propagación DNS

Después de configurar DNS, espera entre 5 minutos y 48 horas para propagación.

#### Herramientas de Verificación
- **[dnschecker.org](https://dnschecker.org)** - Verifica propagación mundial
- **[whatsmydns.net](https://whatsmydns.net)** - Estado de propagación

#### Verificar con Terminal
```bash
# Verificar CNAME
nslookup app.tudominio.com

# Verificar con dig
dig app.tudominio.com CNAME

# Verificar que responde
curl -I https://app.tudominio.com
```

#### Respuesta Esperada
```
app.tudominio.com.    CNAME    web-production-7ceb1.up.railway.app.
```

---

### 15.9 Solución de Problemas Comunes

#### Problema: "DNS_PROBE_FINISHED_NXDOMAIN"
- **Causa**: DNS no ha propagado o registro incorrecto
- **Solución**: Esperar 24-48 horas o verificar registro en dnschecker.org

#### Problema: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"
- **Causa**: Certificado SSL no generado aún
- **Solución**: Esperar 10-15 minutos después de agregar dominio en Railway

#### Problema: "Too many redirects"
- **Causa**: Configuración SSL conflictiva
- **Solución**: 
  - En Cloudflare: cambiar SSL/TLS a "Full (strict)"
  - Desactivar "Always Use HTTPS" temporalmente

#### Problema: Dominio raíz no funciona
- **Causa**: CNAME en raíz no soportado por algunos proveedores
- **Solución**: 
  - Usar Cloudflare (soporta CNAME flattening)
  - Usar subdominio `www` o `app`
  - Configurar redirección de raíz a www

---

### 15.10 Resumen de Configuración por Proveedor

| Proveedor | CNAME Raíz | Método Recomendado |
|-----------|------------|-------------------|
| **GoDaddy** | ❌ No | Usar forwarding + CNAME en www |
| **Namecheap** | ✅ ALIAS | ALIAS en @ + CNAME en www |
| **Cloudflare** | ✅ CNAME Flattening | CNAME en @ (Proxied) |
| **Squarespace** | ❌ No | Subdomain forward + CNAME |
| **HostGator** | ❌ No | CNAME en www + A record opcional |
| **Bluehost** | ❌ No | CNAME en www + forwarding |

---

### 15.11 Lista de Verificación Final

- [ ] Variables de entorno configuradas en Railway
- [ ] Registro CNAME agregado en proveedor de dominio
- [ ] Dominio agregado en Railway Settings
- [ ] Estado DNS "Valid" en Railway
- [ ] Certificado SSL generado (HTTPS funciona)
- [ ] Prueba de login exitosa en dominio personalizado
- [ ] PWA instalable desde dominio HTTPS

---

*Documentación generada: Febrero 2026*
*Versión: 1.1.0 - Actualizada con guía de dominios personalizados*
