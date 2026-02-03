# GUIA: Crear la API desde Cero

Esta guia te muestra como crear el servidor API paso a paso para que puedas replicarlo en cualquier servidor.

---

## ESTRUCTURA DEL PROYECTO

```
mi-proyecto/
├── package.json          # Dependencias y scripts
├── tsconfig.json         # Configuracion TypeScript
├── drizzle.config.ts     # Configuracion Drizzle ORM
├── .env                  # Variables de entorno (NO subir a git)
├── shared/
│   └── schema.ts         # Definicion de tablas (Drizzle)
├── server/
│   ├── index.ts          # Punto de entrada del servidor
│   ├── routes.ts         # Endpoints de la API
│   └── storage.ts        # Operaciones de base de datos
└── client/               # Frontend (React)
```

---

## PASO 1: Crear el proyecto

```bash
mkdir ventas-api
cd ventas-api
npm init -y
```

---

## PASO 2: Instalar dependencias

```bash
# Dependencias principales
npm install express cors dotenv pg drizzle-orm jsonwebtoken bcryptjs zod

# Dependencias de desarrollo
npm install -D typescript tsx @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs drizzle-kit esbuild
```

---

## PASO 3: Crear tsconfig.json

Crea el archivo `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["./shared/*"]
    }
  },
  "include": ["server/**/*", "shared/**/*"],
  "exclude": ["node_modules"]
}
```

---

## PASO 4: Crear archivo .env

Crea el archivo `.env` (NO subir a git):

```env
DATABASE_URL=postgresql://usuario:contrasena@host:5432/basedatos?sslmode=require
JWT_SECRET=tu-secreto-jwt-muy-seguro-aqui-2024
PORT=5000
```

---

## PASO 5: Crear el schema (shared/schema.ts)

Crea la carpeta `shared` y el archivo `schema.ts`:

```typescript
import { pgTable, text, varchar, serial, integer, timestamp, decimal, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Rutas
export const rutas = pgTable("rutas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  activa: boolean("activa").default(true).notNull(),
});

export type Ruta = typeof rutas.$inferSelect;

// Usuarios
export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  rol: varchar("rol", { length: 20 }).notNull(),
  rutaId: integer("ruta_id").references(() => rutas.id),
  activo: boolean("activo").default(true).notNull(),
});

export type Usuario = typeof usuarios.$inferSelect;

// Clientes
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  direccion: text("direccion"),
  telefono: varchar("telefono", { length: 20 }),
  rutaId: integer("ruta_id").references(() => rutas.id).notNull(),
  activo: boolean("activo").default(true).notNull(),
});

export type Cliente = typeof clientes.$inferSelect;

// Productos
export const productos = pgTable("productos", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  precio: decimal("precio", { precision: 10, scale: 2 }).notNull(),
  unidad: varchar("unidad", { length: 20 }).notNull(),
  activo: boolean("activo").default(true).notNull(),
});

export type Producto = typeof productos.$inferSelect;

// Inventario por ruta
export const inventarioRuta = pgTable("inventario_ruta", {
  id: serial("id").primaryKey(),
  rutaId: integer("ruta_id").references(() => rutas.id).notNull(),
  productoId: integer("producto_id").references(() => productos.id).notNull(),
  cantidad: decimal("cantidad", { precision: 10, scale: 3 }).notNull(),
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow().notNull(),
});

export type InventarioRuta = typeof inventarioRuta.$inferSelect;

// Ventas
export const ventas = pgTable("ventas", {
  id: serial("id").primaryKey(),
  clienteTxId: varchar("cliente_tx_id", { length: 100 }).notNull().unique(),
  usuarioId: integer("usuario_id").references(() => usuarios.id).notNull(),
  clienteId: integer("cliente_id").references(() => clientes.id).notNull(),
  rutaId: integer("ruta_id").references(() => rutas.id).notNull(),
  fechaVenta: timestamp("fecha_venta").notNull(),
  fechaSync: timestamp("fecha_sync").defaultNow().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  descuento: decimal("descuento", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export type Venta = typeof ventas.$inferSelect;

// Items de venta
export const ventaItems = pgTable("venta_items", {
  id: serial("id").primaryKey(),
  ventaId: integer("venta_id").references(() => ventas.id).notNull(),
  productoId: integer("producto_id").references(() => productos.id).notNull(),
  cantidad: decimal("cantidad", { precision: 10, scale: 3 }).notNull(),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export type VentaItem = typeof ventaItems.$inferSelect;
```

---

## PASO 6: Crear el storage (server/storage.ts)

Crea la carpeta `server` y el archivo `storage.ts`:

```typescript
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import {
  rutas, usuarios, clientes, productos, inventarioRuta, ventas, ventaItems,
  type Ruta, type Usuario, type Cliente, type Producto, type InventarioRuta, type Venta, type VentaItem
} from "../shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// Funciones de base de datos
export async function getRutas(): Promise<Ruta[]> {
  return await db.select().from(rutas).where(eq(rutas.activa, true));
}

export async function getRuta(id: number): Promise<Ruta | undefined> {
  const result = await db.select().from(rutas).where(eq(rutas.id, id)).limit(1);
  return result[0];
}

export async function getUsuarioByUsername(username: string): Promise<Usuario | undefined> {
  const result = await db.select().from(usuarios)
    .where(and(eq(usuarios.username, username), eq(usuarios.activo, true)))
    .limit(1);
  return result[0];
}

export async function getUsuario(id: number): Promise<Usuario | undefined> {
  const result = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  return result[0];
}

export async function getClientesByRuta(rutaId: number): Promise<Cliente[]> {
  return await db.select().from(clientes)
    .where(and(eq(clientes.rutaId, rutaId), eq(clientes.activo, true)));
}

export async function getProductos(): Promise<Producto[]> {
  return await db.select().from(productos).where(eq(productos.activo, true));
}

export async function getInventarioByRuta(rutaId: number): Promise<InventarioRuta[]> {
  return await db.select().from(inventarioRuta).where(eq(inventarioRuta.rutaId, rutaId));
}

export async function getVentas(rutaId?: number, limit: number = 100): Promise<Venta[]> {
  if (rutaId) {
    return await db.select().from(ventas).where(eq(ventas.rutaId, rutaId)).limit(limit);
  }
  return await db.select().from(ventas).limit(limit);
}

export async function createVenta(venta: Omit<Venta, 'id' | 'fechaSync'>): Promise<Venta> {
  const result = await db.insert(ventas).values(venta).returning();
  return result[0];
}

export async function createVentaItem(item: Omit<VentaItem, 'id'>): Promise<VentaItem> {
  const result = await db.insert(ventaItems).values(item).returning();
  return result[0];
}

export async function decrementarInventario(rutaId: number, productoId: number, cantidad: string): Promise<boolean> {
  const inv = await db.select().from(inventarioRuta)
    .where(and(eq(inventarioRuta.rutaId, rutaId), eq(inventarioRuta.productoId, productoId)))
    .limit(1);
  
  if (!inv[0]) return false;
  
  const nuevaCantidad = parseFloat(inv[0].cantidad) - parseFloat(cantidad);
  if (nuevaCantidad < 0) return false; // No permitir stock negativo
  
  await db.update(inventarioRuta)
    .set({ cantidad: nuevaCantidad.toFixed(3), ultimaActualizacion: new Date() })
    .where(eq(inventarioRuta.id, inv[0].id));
  
  return true;
}
```

---

## PASO 7: Crear las rutas (server/routes.ts)

Crea el archivo `server/routes.ts`:

```typescript
import { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import * as storage from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "secreto-default";

interface AuthRequest extends Request {
  usuario?: {
    id: number;
    username: string;
    nombre: string;
    rol: string;
    rutaId: number | null;
  };
}

// Middleware de autenticacion
async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requerido" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const usuario = await storage.getUsuario(decoded.userId);
    if (!usuario) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    req.usuario = {
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
      rutaId: usuario.rutaId,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalido" });
  }
}

// Middleware para verificar roles
function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    next();
  };
}

export function registerRoutes(app: Express) {
  
  // LOGIN
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username y password requeridos" });
      }

      const usuario = await storage.getUsuarioByUsername(username);
      if (!usuario) {
        return res.status(401).json({ error: "Credenciales invalidas" });
      }

      const passwordValid = await bcrypt.compare(password, usuario.password);
      if (!passwordValid) {
        return res.status(401).json({ error: "Credenciales invalidas" });
      }

      const token = jwt.sign({ userId: usuario.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        token,
        usuario: {
          id: usuario.id,
          username: usuario.username,
          nombre: usuario.nombre,
          rol: usuario.rol,
          rutaId: usuario.rutaId,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Error en login" });
    }
  });

  // BOOTSTRAP (datos iniciales para vendedor)
  app.get("/api/me/bootstrap", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      if (usuario.rol === "vendedor" && !usuario.rutaId) {
        return res.status(400).json({ error: "Vendedor sin ruta asignada" });
      }

      const rutaId = usuario.rutaId!;
      
      const [clientes, productos, inventario, ruta] = await Promise.all([
        storage.getClientesByRuta(rutaId),
        storage.getProductos(),
        storage.getInventarioByRuta(rutaId),
        storage.getRuta(rutaId),
      ]);

      res.json({
        usuario: {
          id: usuario.id,
          username: usuario.username,
          nombre: usuario.nombre,
          rol: usuario.rol,
          rutaId: usuario.rutaId,
        },
        ruta,
        clientes,
        productos,
        inventario,
      });
    } catch (error) {
      console.error("Bootstrap error:", error);
      res.status(500).json({ error: "Error en bootstrap" });
    }
  });

  // RUTAS
  app.get("/api/rutas", authMiddleware, async (req, res) => {
    try {
      const rutas = await storage.getRutas();
      res.json({ rutas });
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo rutas" });
    }
  });

  // CLIENTES
  app.get("/api/clientes", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      const { rutaId } = req.query;
      
      let targetRutaId: number;
      
      if (usuario.rol === "vendedor") {
        if (!usuario.rutaId) {
          return res.status(400).json({ error: "Vendedor sin ruta asignada" });
        }
        targetRutaId = usuario.rutaId;
      } else {
        if (!rutaId) {
          return res.status(400).json({ error: "rutaId requerido" });
        }
        targetRutaId = parseInt(rutaId as string);
      }
      
      const clientes = await storage.getClientesByRuta(targetRutaId);
      res.json({ clientes });
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo clientes" });
    }
  });

  // PRODUCTOS
  app.get("/api/productos", authMiddleware, async (req, res) => {
    try {
      const productos = await storage.getProductos();
      res.json({ productos });
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo productos" });
    }
  });

  // VENTAS
  app.get("/api/ventas", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      const { rutaId, limit } = req.query;
      
      let targetRutaId: number | undefined;
      
      if (usuario.rol === "vendedor") {
        targetRutaId = usuario.rutaId || undefined;
      } else if (rutaId) {
        targetRutaId = parseInt(rutaId as string);
      }
      
      const ventas = await storage.getVentas(targetRutaId, parseInt(limit as string) || 100);
      res.json({ ventas });
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo ventas" });
    }
  });

  // SYNC (recibir ventas offline)
  const syncSchema = z.object({
    events: z.array(z.object({
      eventId: z.string(),
      tipo: z.literal("venta"),
      venta: z.object({
        clienteTxId: z.string(),
        clienteId: z.number(),
        fechaVenta: z.string(),
        subtotal: z.string(),
        descuento: z.string(),
        total: z.string(),
      }),
      items: z.array(z.object({
        productoId: z.number(),
        cantidad: z.string(),
        precioUnitario: z.string(),
        subtotal: z.string(),
      })),
    })),
  });

  app.post("/api/sync/push", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      const parsed = syncSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos invalidos" });
      }

      const results = [];
      
      for (const event of parsed.data.events) {
        try {
          // Verificar stock antes de crear venta
          for (const item of event.items) {
            const success = await storage.decrementarInventario(
              usuario.rutaId!,
              item.productoId,
              item.cantidad
            );
            if (!success) {
              results.push({ eventId: event.eventId, status: "error", error: "Stock insuficiente" });
              continue;
            }
          }

          // Crear venta
          const venta = await storage.createVenta({
            clienteTxId: event.venta.clienteTxId,
            usuarioId: usuario.id,
            clienteId: event.venta.clienteId,
            rutaId: usuario.rutaId!,
            fechaVenta: new Date(event.venta.fechaVenta),
            subtotal: event.venta.subtotal,
            descuento: event.venta.descuento,
            total: event.venta.total,
          });

          // Crear items
          for (const item of event.items) {
            await storage.createVentaItem({
              ventaId: venta.id,
              productoId: item.productoId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.subtotal,
            });
          }

          results.push({ eventId: event.eventId, status: "success", ventaId: venta.id });
        } catch (e: any) {
          if (e.code === "23505") { // Duplicado
            results.push({ eventId: event.eventId, status: "duplicate" });
          } else {
            results.push({ eventId: event.eventId, status: "error", error: e.message });
          }
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: "Error en sync" });
    }
  });
}
```

---

## PASO 8: Crear el servidor (server/index.ts)

Crea el archivo `server/index.ts`:

```typescript
import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toLocaleTimeString()} [express] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Registrar rutas
registerRoutes(app);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
```

---

## PASO 9: Configurar package.json

Actualiza tu `package.json`:

```json
{
  "name": "ventas-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch server/index.ts",
    "build": "esbuild server/index.ts --bundle --platform=node --outfile=dist/server.js --external:pg-native",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "drizzle-orm": "^0.29.0",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.0",
    "drizzle-kit": "^0.20.0",
    "esbuild": "^0.19.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.0"
  }
}
```

---

## PASO 10: Ejecutar

### Desarrollo:
```bash
npm run dev
```

### Produccion:
```bash
npm run build
npm start
```

---

## PASO 11: Probar la API

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'
```

### Bootstrap (con token):
```bash
curl http://localhost:5000/api/me/bootstrap \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Health check:
```bash
curl http://localhost:5000/api/health
```

---

## ENDPOINTS DISPONIBLES

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | Iniciar sesion | No |
| GET | /api/me/bootstrap | Datos iniciales vendedor | Si |
| GET | /api/rutas | Lista de rutas | Si |
| GET | /api/clientes | Clientes por ruta | Si |
| GET | /api/productos | Lista de productos | Si |
| GET | /api/ventas | Historial de ventas | Si |
| POST | /api/sync/push | Sincronizar ventas offline | Si |
| GET | /api/health | Estado del servidor | No |

---

## DESPLIEGUE EN AWS LIGHTSAIL

1. Crea una instancia Node.js en Lightsail ($3.50/mes)
2. Conectate por SSH
3. Clona tu repositorio:
   ```bash
   git clone https://github.com/tu-usuario/ventas-api.git
   cd ventas-api
   ```
4. Instala dependencias:
   ```bash
   npm install
   ```
5. Crea archivo .env con tus variables
6. Compila:
   ```bash
   npm run build
   ```
7. Instala PM2 para mantener el servidor:
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name ventas-api
   pm2 save
   pm2 startup
   ```
8. Configura el firewall para abrir el puerto 5000

---

## NOTAS IMPORTANTES

1. **Nunca subas .env a git** - Agregalo a .gitignore
2. **Usa HTTPS en produccion** - Configura un certificado SSL
3. **Cambia JWT_SECRET** - Usa un valor aleatorio largo
4. **Haz backups** - Configura backups automaticos en Lightsail
