# GUIA SUPER DETALLADA: API desde Cero para Principiantes

Esta guia asume que nunca has creado un servidor. Te explico TODO paso a paso.

---

## ANTES DE EMPEZAR: Que necesitas

### Opcion A: Usar tu computadora (Windows/Mac/Linux)

Necesitas instalar:
1. **Node.js** - El motor que ejecuta JavaScript en el servidor
2. **Un editor de codigo** - Para escribir el codigo (VS Code recomendado)
3. **Git** - Para control de versiones (opcional pero recomendado)

### Opcion B: Usar Replit (mas facil, sin instalar nada)

1. Ve a https://replit.com
2. Crea una cuenta gratis
3. Crea un nuevo Repl con template "Node.js"
4. Ya tienes todo listo!

**RECOMIENDO OPCION B** si eres principiante.

---

# SI USAS TU COMPUTADORA (Opcion A)

## PASO 1: Instalar Node.js

### En Windows:
1. Ve a https://nodejs.org
2. Descarga la version "LTS" (Long Term Support)
3. Ejecuta el instalador (.msi)
4. Haz clic en "Next" en todo
5. Al terminar, reinicia tu computadora

### En Mac:
1. Ve a https://nodejs.org
2. Descarga la version "LTS"
3. Abre el archivo .pkg
4. Sigue las instrucciones

### Verificar instalacion:
1. Abre la **Terminal** (ver abajo como)
2. Escribe: `node --version`
3. Debe mostrar algo como: `v20.10.0`

---

## PASO 2: Que es la Terminal y como abrirla

La **Terminal** (tambien llamada "Command Line", "CMD", "PowerShell", "Consola") es una ventana donde escribes comandos de texto para controlar tu computadora.

### En Windows:
**Opcion 1 - PowerShell (recomendado):**
1. Presiona tecla Windows + R
2. Escribe: `powershell`
3. Presiona Enter

**Opcion 2 - CMD:**
1. Presiona tecla Windows + R
2. Escribe: `cmd`
3. Presiona Enter

**Opcion 3 - Windows Terminal (si lo tienes):**
1. Busca "Terminal" en el menu inicio
2. Abrelo

### En Mac:
1. Presiona Command + Espacio (abre Spotlight)
2. Escribe: `Terminal`
3. Presiona Enter

### En Linux:
1. Presiona Ctrl + Alt + T
   O busca "Terminal" en tus aplicaciones

---

## PASO 3: Navegar en la Terminal

Cuando abres la terminal, estas en una "carpeta" (directorio). Los comandos basicos:

### Ver donde estas:
```bash
pwd
```
(En Windows PowerShell tambien funciona `pwd`)

Esto muestra algo como:
- Mac/Linux: `/Users/tunombre`
- Windows: `C:\Users\tunombre`

### Ver que hay en la carpeta actual:
```bash
ls
```
(En CMD de Windows usa `dir` en lugar de `ls`)

### Ir a otra carpeta:
```bash
cd nombre_carpeta
```

Ejemplos:
```bash
cd Documentos        # Entra a Documentos
cd Desktop          # Entra al Escritorio
cd ..               # Sube un nivel (carpeta padre)
cd /                # Va a la raiz
```

### Crear una carpeta:
```bash
mkdir nombre_carpeta
```

---

## PASO 4: Crear el proyecto

Ahora si, vamos a crear el proyecto. Abre tu terminal y ejecuta:

### 4.1 Ir al Escritorio (o donde quieras el proyecto):
```bash
cd Desktop
```

### 4.2 Crear carpeta del proyecto:
```bash
mkdir ventas-api
```

### 4.3 Entrar a la carpeta:
```bash
cd ventas-api
```

### 4.4 Inicializar proyecto Node.js:
```bash
npm init -y
```

**Que hace esto?**
- `npm` = Node Package Manager (gestor de paquetes)
- `init` = inicializar un proyecto nuevo
- `-y` = aceptar todo por defecto

Esto crea un archivo `package.json` con la configuracion del proyecto.

---

## PASO 5: Instalar las dependencias

Ahora instalamos las librerias que necesitamos. **Sigue en la misma terminal**, asegurandote de estar dentro de la carpeta `ventas-api`:

```bash
npm install express cors dotenv pg drizzle-orm jsonwebtoken bcryptjs zod
```

**Que es cada cosa?**
- `express` = Framework para crear servidores web
- `cors` = Permite peticiones desde otros dominios
- `dotenv` = Lee variables de entorno del archivo .env
- `pg` = Cliente de PostgreSQL
- `drizzle-orm` = ORM para base de datos (facilita consultas SQL)
- `jsonwebtoken` = Crea y verifica tokens JWT para login
- `bcryptjs` = Encripta contrasenas
- `zod` = Valida datos de entrada

Ahora instalamos las dependencias de desarrollo:

```bash
npm install -D typescript tsx @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs drizzle-kit esbuild
```

**Que es cada cosa?**
- `typescript` = Lenguaje con tipos (mejor JavaScript)
- `tsx` = Ejecuta TypeScript directamente
- `@types/...` = Definiciones de tipos para librerias
- `drizzle-kit` = Herramientas para migraciones
- `esbuild` = Compila el codigo para produccion

---

## PASO 6: Crear la estructura de carpetas

Crea las carpetas necesarias:

```bash
mkdir shared
mkdir server
```

Ahora tienes esta estructura:
```
ventas-api/
├── node_modules/     (creada automaticamente)
├── package.json      (creado automaticamente)
├── package-lock.json (creado automaticamente)
├── shared/           (la acabas de crear)
└── server/           (la acabas de crear)
```

---

## PASO 7: Crear los archivos

Ahora necesitas un **editor de codigo** para crear los archivos.

### Opcion 1 - Visual Studio Code (recomendado):
1. Descarga de https://code.visualstudio.com
2. Instala y abre VS Code
3. Menu File > Open Folder
4. Selecciona la carpeta `ventas-api`
5. Ahora puedes crear archivos facilmente

### Opcion 2 - Desde la terminal:
Puedes crear archivos vacios asi:
```bash
touch tsconfig.json
touch .env
touch shared/schema.ts
touch server/index.ts
touch server/routes.ts
touch server/storage.ts
```
(En Windows CMD usa `type nul > archivo.txt` en lugar de `touch`)

---

## PASO 8: Contenido de cada archivo

### 8.1 Archivo: tsconfig.json (en la raiz)

Crea este archivo y pega este contenido:

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

### 8.2 Archivo: .env (en la raiz)

```
DATABASE_URL=postgresql://usuario:contrasena@tu-host.rds.amazonaws.com:5432/ventasruta?sslmode=require
JWT_SECRET=mi-secreto-super-seguro-cambiar-esto-2024
PORT=5000
```

**IMPORTANTE:** Reemplaza con tus datos reales de la base de datos AWS.

### 8.3 Archivo: shared/schema.ts

```typescript
import { pgTable, text, varchar, serial, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";

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

### 8.4 Archivo: server/storage.ts

```typescript
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import {
  rutas, usuarios, clientes, productos, inventarioRuta, ventas, ventaItems,
  type Ruta, type Usuario, type Cliente, type Producto, type InventarioRuta, type Venta, type VentaItem
} from "../shared/schema";

// Conexion a la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// ========== FUNCIONES DE BASE DE DATOS ==========

// Rutas
export async function getRutas(): Promise<Ruta[]> {
  return await db.select().from(rutas).where(eq(rutas.activa, true));
}

export async function getRuta(id: number): Promise<Ruta | undefined> {
  const result = await db.select().from(rutas).where(eq(rutas.id, id)).limit(1);
  return result[0];
}

// Usuarios
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

// Clientes
export async function getClientesByRuta(rutaId: number): Promise<Cliente[]> {
  return await db.select().from(clientes)
    .where(and(eq(clientes.rutaId, rutaId), eq(clientes.activo, true)));
}

// Productos
export async function getProductos(): Promise<Producto[]> {
  return await db.select().from(productos).where(eq(productos.activo, true));
}

// Inventario
export async function getInventarioByRuta(rutaId: number): Promise<InventarioRuta[]> {
  return await db.select().from(inventarioRuta).where(eq(inventarioRuta.rutaId, rutaId));
}

// Ventas
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

// Decrementar inventario (para ventas)
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

### 8.5 Archivo: server/routes.ts

```typescript
import { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import * as storage from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "secreto-default";

// Tipo personalizado para requests autenticados
interface AuthRequest extends Request {
  usuario?: {
    id: number;
    username: string;
    nombre: string;
    rol: string;
    rutaId: number | null;
  };
}

// ========== MIDDLEWARE DE AUTENTICACION ==========
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

// ========== REGISTRAR TODAS LAS RUTAS ==========
export function registerRoutes(app: Express) {
  
  // ===== LOGIN =====
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

      // Crear token JWT valido por 7 dias
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

  // ===== BOOTSTRAP (datos iniciales para vendedor) =====
  app.get("/api/me/bootstrap", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      // Verificar que el vendedor tenga ruta asignada
      if (usuario.rol === "vendedor" && !usuario.rutaId) {
        return res.status(400).json({ error: "Vendedor sin ruta asignada" });
      }

      const rutaId = usuario.rutaId!;
      
      // Cargar todos los datos en paralelo
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

  // ===== RUTAS =====
  app.get("/api/rutas", authMiddleware, async (req, res) => {
    try {
      const rutas = await storage.getRutas();
      res.json({ rutas });
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo rutas" });
    }
  });

  // ===== CLIENTES =====
  app.get("/api/clientes", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      const { rutaId } = req.query;
      
      let targetRutaId: number;
      
      // Vendedor solo ve sus clientes
      if (usuario.rol === "vendedor") {
        if (!usuario.rutaId) {
          return res.status(400).json({ error: "Vendedor sin ruta asignada" });
        }
        targetRutaId = usuario.rutaId;
      } else {
        // Admin/Auditor necesitan especificar ruta
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

  // ===== PRODUCTOS =====
  app.get("/api/productos", authMiddleware, async (req, res) => {
    try {
      const productos = await storage.getProductos();
      res.json({ productos });
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo productos" });
    }
  });

  // ===== VENTAS =====
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

  // ===== SYNC (recibir ventas offline) =====
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
          if (e.code === "23505") {
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

### 8.6 Archivo: server/index.ts

```typescript
import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware basicos
app.use(cors());                    // Permitir peticiones de otros dominios
app.use(express.json());            // Parsear JSON en el body

// Logging de peticiones
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Registrar todas las rutas de la API
registerRoutes(app);

// Health check (para verificar que el servidor funciona)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Servidor funcionando correctamente"
  });
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log(`  Servidor corriendo en puerto ${PORT}`);
  console.log(`  http://localhost:${PORT}`);
  console.log("======================================");
});
```

### 8.7 Actualizar package.json

Abre `package.json` y reemplaza todo el contenido con:

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

## PASO 9: Ejecutar el servidor

### En desarrollo (con recarga automatica):

Abre la terminal, asegurate de estar en la carpeta del proyecto, y ejecuta:

```bash
npm run dev
```

Veras algo como:
```
======================================
  Servidor corriendo en puerto 5000
  http://localhost:5000
======================================
```

### Para detener el servidor:
Presiona `Ctrl + C` en la terminal

---

## PASO 10: Probar que funciona

### Usando el navegador:
Abre tu navegador y ve a:
```
http://localhost:5000/api/health
```

Deberias ver:
```json
{"status":"ok","timestamp":"2026-02-02T...","message":"Servidor funcionando correctamente"}
```

### Usando la terminal (curl):
```bash
curl http://localhost:5000/api/health
```

### Probar login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'
```

---

## RESUMEN: Estructura final del proyecto

```
ventas-api/
├── .env                  # Variables secretas (NO subir a git)
├── package.json          # Configuracion del proyecto
├── package-lock.json     # Versiones exactas de dependencias
├── tsconfig.json         # Configuracion de TypeScript
├── node_modules/         # Dependencias instaladas
├── shared/
│   └── schema.ts         # Definicion de tablas
└── server/
    ├── index.ts          # Punto de entrada
    ├── routes.ts         # Endpoints de la API
    └── storage.ts        # Operaciones de base de datos
```

---

## PROBLEMAS COMUNES

### "npm: command not found"
- Node.js no esta instalado o no esta en el PATH
- Reinstala Node.js y reinicia la terminal

### "Cannot find module"
- Ejecuta `npm install` de nuevo
- Verifica que estas en la carpeta correcta

### "Connection refused" al conectar base de datos
- Verifica que DATABASE_URL es correcto
- Verifica que la base de datos esta encendida en AWS
- Verifica que "Public mode" esta habilitado en Lightsail

### "EADDRINUSE: port 5000 already in use"
- Otro proceso esta usando el puerto 5000
- Cambia PORT=5001 en .env
- O mata el proceso anterior

---

---

# PARTE 2: CONECTAR EL FRONTEND A TU API

Ahora que tu API funciona, vamos a conectar el frontend de React para que use tu servidor.

---

## PASO 11: Entender la arquitectura

Actualmente tienes:

```
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│   Tu Telefono   │  ──────>  │  Tu Servidor    │  ──────>  │   Base de Datos │
│   (Frontend)    │   HTTPS   │  (Railway)      │   SSL     │   (AWS RDS)     │
│   React App     │           │  Express API    │           │   PostgreSQL    │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

El frontend (React) hace peticiones HTTP a tu servidor, y el servidor consulta la base de datos.

---

## PASO 12: Obtener la URL de tu API

### Si usas Railway:
Tu URL sera algo como:
```
https://web-production-xxxx.up.railway.app
```

La puedes encontrar en:
1. Dashboard de Railway → tu proyecto → pestaña "Settings"
2. Seccion "Domains" → copia la URL

### Si usas tu propia maquina:
Si el servidor corre en tu computadora local:
```
http://192.168.1.100:5000
```
(Cambia la IP por la IP de tu computadora en la red local)

Para saber tu IP local:
- **Windows**: Abre CMD y escribe `ipconfig`
- **Mac/Linux**: Abre Terminal y escribe `ifconfig` o `ip addr`

Busca algo como `192.168.x.x` o `10.0.x.x`

---

## PASO 13: Configurar el Frontend en Replit

### 13.1 Abrir el proyecto en Replit

1. Ve a https://replit.com
2. Abre tu proyecto "ventas-por-ruta"
3. Busca el archivo de configuracion

### 13.2 Encontrar donde se configura la API

El frontend guarda la URL de la API en varios lugares posibles:

**Opcion A: Variable de entorno**
Busca archivo `.env` o `.env.local` en la carpeta `client/`:
```
VITE_API_BASE_URL=https://tu-servidor.up.railway.app/api
```

**Opcion B: Archivo de configuracion**
Busca en `client/src/lib/api.ts` o similar:
```typescript
const API_BASE = "https://tu-servidor.up.railway.app/api";
```

**Opcion C: Settings del sistema**
La app tiene una pagina de Configuracion donde puedes cambiar la URL.

### 13.3 Cambiar la URL de la API

#### Metodo 1: Desde la aplicacion (recomendado)

1. Abre la app en tu navegador
2. Inicia sesion con cualquier usuario
3. Ve a **Configuracion** (icono de engranaje)
4. Busca "URL del API" o "Servidor"
5. Cambia la URL a tu servidor:
   ```
   https://web-production-xxxx.up.railway.app/api
   ```
6. Guarda cambios
7. Cierra sesion y vuelve a entrar

#### Metodo 2: Desde los archivos

Abre `client/src/lib/api.ts` y busca donde se define la URL base:

```typescript
// Antes (URL de Replit o localhost)
const API_BASE_URL = "http://localhost:5000/api";

// Despues (tu servidor en Railway)
const API_BASE_URL = "https://web-production-xxxx.up.railway.app/api";
```

#### Metodo 3: Variables de entorno

En Replit, ve a la seccion "Secrets" (candado en el menu lateral):

| Nombre | Valor |
|--------|-------|
| `VITE_API_BASE_URL` | `https://web-production-xxxx.up.railway.app/api` |

Despues reinicia el servidor de desarrollo.

---

## PASO 14: Verificar la conexion

### 14.1 Probar desde el navegador

1. Abre la app de React
2. Abre las "Developer Tools" (F12 en Chrome/Firefox)
3. Ve a la pestana "Network" (Red)
4. Intenta hacer login
5. Observa las peticiones:
   - Debe aparecer una peticion POST a `/api/auth/login`
   - El "Remote Address" debe ser tu servidor Railway
   - El status debe ser 200 (verde)

### 14.2 Errores comunes en la conexion

**Error: "Failed to fetch" o "Network Error"**
- La URL de la API esta mal escrita
- El servidor no esta corriendo
- Hay problema de CORS (ver siguiente paso)

**Error: "CORS error" o "blocked by CORS policy"**
- El servidor no permite peticiones desde tu dominio
- Solucion: Configurar CORS en el servidor (ver PASO 15)

**Error: 401 Unauthorized**
- El token JWT expiro o es invalido
- Cierra sesion y vuelve a entrar

**Error: 500 Internal Server Error**
- Hay un error en el servidor
- Revisa los logs de Railway

---

## PASO 15: Configurar CORS correctamente

CORS (Cross-Origin Resource Sharing) es una medida de seguridad del navegador. Si tu frontend esta en un dominio diferente al backend, necesitas configurar CORS.

### 15.1 Que es CORS?

Imagina esto:
- Tu frontend esta en: `https://miapp.replit.app`
- Tu backend esta en: `https://miapi.railway.app`

Son dominios diferentes, entonces el navegador bloquea las peticiones por seguridad.

### 15.2 Como configurar CORS

En tu servidor (`server/index.ts` o similar), busca la configuracion de CORS:

```typescript
import cors from "cors";

// Opcion 1: Permitir cualquier origen (desarrollo)
app.use(cors());

// Opcion 2: Permitir origenes especificos (produccion)
app.use(cors({
  origin: [
    "https://miapp.replit.app",
    "https://miapp.up.railway.app",
    "http://localhost:5000",
    "http://localhost:3000"
  ],
  credentials: true
}));

// Opcion 3: Permitir cualquier origen pero con credenciales
app.use(cors({
  origin: true,
  credentials: true
}));
```

### 15.3 Verificar que CORS funciona

En Developer Tools > Network, mira los headers de respuesta:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```

Si ves estos headers, CORS esta funcionando.

---

## PASO 16: Probar toda la funcionalidad

### Lista de verificacion

Marca cada item cuando funcione:

- [ ] **Login**: Puedo iniciar sesion con usuario y contrasena
- [ ] **Bootstrap**: Al entrar, se cargan clientes y productos
- [ ] **Ver clientes**: Veo la lista de clientes de mi ruta
- [ ] **Ver productos**: Veo el catalogo de productos
- [ ] **Crear venta**: Puedo agregar productos al carrito y confirmar venta
- [ ] **Historial**: Veo las ventas que he hecho
- [ ] **Sync offline**: Si pierdo conexion y la recupero, las ventas se sincronizan

### Probar en el telefono

1. Abre Chrome/Safari en tu telefono
2. Ve a la URL de tu frontend (ej: `https://miapp.replit.app`)
3. Prueba todas las funciones de la lista

### Instalar como PWA

1. En Chrome Android: Menu (3 puntos) > "Agregar a pantalla de inicio"
2. En Safari iOS: Compartir > "Agregar a inicio"
3. Ahora la app aparece como icono en tu telefono

---

# PARTE 3: DESPLEGAR EL FRONTEND EN PRODUCCION

Si quieres que el frontend NO dependa de Replit, puedes desplegarlo en otro lugar.

---

## PASO 17: Opciones de hosting para Frontend

### Opcion A: Railway (mismo lugar que el backend)

Ventajas:
- Todo en un solo lugar
- Un solo dominio
- Facil de manejar

Pasos:
1. Ya tienes el backend en Railway
2. El frontend se puede servir desde el mismo servidor Express
3. No necesitas hacer nada extra si usas la configuracion actual

### Opcion B: Cloudflare Pages (recomendado para frontend)

Ventajas:
- Gratis
- Muy rapido (CDN global)
- HTTPS automatico
- Despliegue automatico desde GitHub

Pasos:
1. Ve a https://pages.cloudflare.com
2. Conecta tu cuenta de GitHub
3. Selecciona el repositorio `ventas-por-ruta`
4. Configura:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/public`
   - **Root directory**: `/` o `client/`
5. Agrega variable de entorno:
   - `VITE_API_BASE_URL` = `https://tu-api.railway.app/api`
6. Despliega

### Opcion C: Vercel

Similar a Cloudflare Pages:
1. Ve a https://vercel.com
2. Importa desde GitHub
3. Configura igual que Cloudflare Pages

### Opcion D: Netlify

Otro hosting gratuito para frontend:
1. Ve a https://netlify.com
2. Importa desde GitHub
3. Configura igual

---

## PASO 18: Configurar dominio personalizado para Frontend

### 18.1 Si usas Cloudflare Pages

1. Ve a tu proyecto en Cloudflare Pages
2. Custom Domains > Add domain
3. Escribe tu dominio: `app.miempresa.com`
4. Cloudflare te dira que registros DNS agregar
5. Agrega el registro CNAME en tu proveedor de dominio

### 18.2 Ejemplo de configuracion DNS

```
Tipo      Nombre    Valor                              TTL
CNAME     app       miapp.pages.dev                    Auto
```

### 18.3 Esperar propagacion

Los cambios de DNS pueden tardar de 5 minutos a 48 horas.
Verifica en https://dnschecker.org

---

## PASO 19: Variables de entorno para Produccion

### En el Frontend (Cloudflare Pages / Vercel / Netlify)

| Variable | Valor | Descripcion |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://tu-api.railway.app/api` | URL de tu backend |

### En el Backend (Railway)

| Variable | Valor | Descripcion |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | Conexion a PostgreSQL |
| `JWT_SECRET` | `tu-clave-super-secreta-2026` | Clave para firmar tokens |
| `NODE_ENV` | `production` | Modo produccion |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` | Para AWS RDS SSL |

### Importante sobre caracteres especiales

Si tu contrasena tiene `$`, `@`, `#`, etc., codificalos:
- `$` → `%24`
- `@` → `%40`
- `#` → `%23`

Ejemplo:
```
# Contrasena: MiPass$123
# URL correcta:
DATABASE_URL=postgresql://user:MiPass%24123@host:5432/db
```

---

## PASO 20: Verificar todo en Produccion

### 20.1 Checklist final

- [ ] Backend corriendo en Railway
- [ ] Frontend desplegado (Railway, Cloudflare Pages, etc.)
- [ ] HTTPS funcionando en ambos
- [ ] Login funciona
- [ ] Datos se guardan en la base de datos
- [ ] PWA instalable en telefono
- [ ] Funciona sin conexion (offline)

### 20.2 Probar flujo completo

1. Abre la app en tu telefono
2. Login con usuario `vendedor1` / `1234`
3. Selecciona un cliente
4. Agrega productos al carrito
5. Confirma la venta
6. Verifica que aparece en el historial
7. En otro dispositivo, entra como `admin` y verifica la venta

### 20.3 Monitorear errores

En Railway:
1. Ve a tu proyecto
2. Logs (en tiempo real)
3. Observa si hay errores

En el navegador:
1. Developer Tools > Console
2. Busca errores en rojo

---

## RESUMEN FINAL

### Arquitectura completa:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                    │
└─────────────────────────────────────────────────────────────────────────┘
         │                           │                          │
         ▼                           ▼                          ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Telefono 1    │       │   Telefono 2    │       │   Computadora   │
│   (Vendedor)    │       │   (Auditor)     │       │   (Admin)       │
│   PWA React     │       │   PWA React     │       │   Navegador     │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                          │
         └─────────────────────────┼──────────────────────────┘
                                   │
                                   ▼ HTTPS
                    ┌─────────────────────────────┐
                    │   Railway / Tu Servidor     │
                    │   Express.js API            │
                    │   https://miapi.railway.app │
                    └─────────────┬───────────────┘
                                  │
                                  ▼ SSL/TLS
                    ┌─────────────────────────────┐
                    │   AWS RDS                   │
                    │   PostgreSQL Database       │
                    │   (15,000+ clientes)        │
                    └─────────────────────────────┘
```

### URLs finales de ejemplo:

| Componente | URL |
|------------|-----|
| Frontend | `https://ventas.miempresa.com` |
| Backend API | `https://api.miempresa.com` |
| Base de datos | `midb.xxx.us-east-2.rds.amazonaws.com` |

### Credenciales de prueba:

| Usuario | Contrasena | Rol |
|---------|------------|-----|
| `vendedor1` | `1234` | Vendedor Ruta Centro |
| `vendedor2` | `1234` | Vendedor Ruta Norte |
| `auditor` | `1234` | Auditor |
| `admin` | `1234` | Administrador |

---

## PROBLEMAS FRECUENTES

### "La app no carga datos despues del login"

1. Verifica que la URL del API este correcta
2. Abre Developer Tools > Network
3. Busca la peticion a `/api/me/bootstrap`
4. Si dice error, revisa el mensaje

### "Las ventas no se guardan"

1. Verifica conexion a internet
2. Revisa si hay ventas pendientes (icono de sync)
3. Fuerza sincronizacion desde Configuracion
4. Revisa logs del servidor

### "CORS error en produccion"

1. Agrega tu dominio frontend a la lista de CORS permitidos
2. Reinicia el servidor en Railway

### "SSL certificate error"

1. Verifica que `NODE_TLS_REJECT_UNAUTHORIZED=0` esta configurado
2. Asegurate de usar `?sslmode=require` en DATABASE_URL

### "La PWA no se instala"

1. Verifica que uses HTTPS (no HTTP)
2. Verifica que el manifest.json existe
3. Verifica que el Service Worker esta registrado
4. En Chrome: DevTools > Application > Manifest

---

## CONTACTO Y SOPORTE

- **Repositorio**: https://github.com/OzMi2/ventas-por-ruta
- **Documentacion**: `/docs/DOCUMENTACION_COMPLETA.md`
- **Issues**: Crea un issue en GitHub para reportar problemas

---

*Guia creada: Febrero 2026*
*Version: 2.0 - Incluye conexion Frontend + Produccion*
