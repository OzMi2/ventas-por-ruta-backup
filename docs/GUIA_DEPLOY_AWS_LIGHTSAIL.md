# GUIA: Desplegar la API en AWS Lightsail

Esta guia te muestra como poner tu API en un servidor de AWS Lightsail para que funcione 24/7 y sea accesible desde cualquier lugar.

---

## ARQUITECTURA FINAL

```
[Celular/Tablet del Vendedor]
         |
         v
[Internet]
         |
         v
[AWS Lightsail - Instancia Node.js]  <---> [AWS Lightsail - Base de datos PostgreSQL]
     (Tu API - $3.50/mes)                        (Tus datos - $15/mes)
```

**Costo total: ~$18.50 USD/mes**

---

## PASO 1: Crear instancia de Node.js en Lightsail

### 1.1 Acceder a Lightsail
1. Ve a https://lightsail.aws.amazon.com
2. Inicia sesion con tu cuenta AWS

### 1.2 Crear instancia
1. Haz clic en **"Create instance"** (Crear instancia)
2. Configura:

**Ubicacion:**
- Region: La misma donde creaste la base de datos (ej: us-east-1)
- Zona: Cualquiera

**Plataforma:**
- Selecciona: **Linux/Unix**

**Blueprint (plantilla):**
- Categoria: **OS Only** (Solo sistema operativo)
- Sistema: **Ubuntu 22.04 LTS**

**Plan:**
- Selecciona: **$3.50 USD/mes** (512 MB RAM, 1 vCPU)
- Para produccion real: $5 USD/mes (1 GB RAM)

**Nombre:**
- Escribe: `ventas-api-server`

3. Haz clic en **"Create instance"**
4. Espera 2-3 minutos mientras se crea

---

## PASO 2: Conectarse al servidor por SSH

### 2.1 Desde el navegador (mas facil)
1. En Lightsail, haz clic en tu instancia `ventas-api-server`
2. Haz clic en **"Connect using SSH"**
3. Se abre una terminal en el navegador

### 2.2 Desde tu computadora (opcional)
1. Descarga la llave SSH desde Lightsail > Account > SSH Keys
2. Abre tu terminal local
3. Ejecuta:
```bash
ssh -i tu-llave.pem ubuntu@IP-DE-TU-SERVIDOR
```

---

## PASO 3: Instalar Node.js en el servidor

Una vez conectado por SSH, ejecuta estos comandos **uno por uno**:

### 3.1 Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```
(Espera a que termine, puede tardar 1-2 minutos)

### 3.2 Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

```bash
sudo apt install -y nodejs
```

### 3.3 Verificar instalacion
```bash
node --version
```
Debe mostrar: `v20.x.x`

```bash
npm --version
```
Debe mostrar: `10.x.x`

### 3.4 Instalar PM2 (mantiene la app corriendo)
```bash
sudo npm install -g pm2
```

---

## PASO 4: Crear la carpeta del proyecto

```bash
mkdir ~/ventas-api
cd ~/ventas-api
```

---

## PASO 5: Crear los archivos del proyecto

### 5.1 Inicializar proyecto
```bash
npm init -y
```

### 5.2 Instalar dependencias
```bash
npm install express cors dotenv pg drizzle-orm jsonwebtoken bcryptjs zod
```

### 5.3 Crear archivo package.json actualizado
```bash
nano package.json
```

Borra todo y pega esto (en nano: Ctrl+K borra linea, Ctrl+Shift+V pega):

```json
{
  "name": "ventas-api",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
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
  }
}
```

Guardar: `Ctrl + O`, Enter, `Ctrl + X`

### 5.4 Crear archivo .env
```bash
nano .env
```

Pega esto (con TUS datos de AWS):
```
DATABASE_URL=postgresql://ventasadmin:TU_CONTRASENA@tu-db.xxxxxx.rds.amazonaws.com:5432/ventasruta?sslmode=require
JWT_SECRET=cambia-esto-por-algo-muy-seguro-y-largo-2024
PORT=5000
```

Guardar: `Ctrl + O`, Enter, `Ctrl + X`

### 5.5 Crear el servidor (archivo unico simplificado)
```bash
nano server.js
```

Pega todo este codigo:

```javascript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { z } from 'zod';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secreto';

// Conexion a base de datos
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware
app.use(cors());
app.use(express.json());

// Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// ========== FUNCIONES DE BASE DE DATOS ==========

async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

async function queryOne(text, params) {
  const rows = await query(text, params);
  return rows[0];
}

// ========== MIDDLEWARE DE AUTENTICACION ==========

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await queryOne('SELECT * FROM usuarios WHERE id = $1 AND activo = true', [decoded.userId]);
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
}

// ========== ENDPOINTS ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password requeridos' });
    }
    const usuario = await queryOne('SELECT * FROM usuarios WHERE username = $1 AND activo = true', [username]);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    const token = jwt.sign({ userId: usuario.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        rol: usuario.rol,
        rutaId: usuario.ruta_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error en login' });
  }
});

// Bootstrap (datos iniciales para vendedor)
app.get('/api/me/bootstrap', authMiddleware, async (req, res) => {
  try {
    const usuario = req.usuario;
    if (usuario.rol === 'vendedor' && !usuario.ruta_id) {
      return res.status(400).json({ error: 'Vendedor sin ruta asignada' });
    }
    const rutaId = usuario.ruta_id;
    const [ruta, clientes, productos, inventario] = await Promise.all([
      queryOne('SELECT * FROM rutas WHERE id = $1', [rutaId]),
      query('SELECT * FROM clientes WHERE ruta_id = $1 AND activo = true', [rutaId]),
      query('SELECT * FROM productos WHERE activo = true', []),
      query('SELECT * FROM inventario_ruta WHERE ruta_id = $1', [rutaId])
    ]);
    res.json({
      usuario: { id: usuario.id, username: usuario.username, nombre: usuario.nombre, rol: usuario.rol, rutaId: usuario.ruta_id },
      ruta,
      clientes,
      productos,
      inventario
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Error en bootstrap' });
  }
});

// Rutas
app.get('/api/rutas', authMiddleware, async (req, res) => {
  try {
    const rutas = await query('SELECT * FROM rutas WHERE activa = true', []);
    res.json({ rutas });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo rutas' });
  }
});

// Clientes
app.get('/api/clientes', authMiddleware, async (req, res) => {
  try {
    const usuario = req.usuario;
    let rutaId;
    if (usuario.rol === 'vendedor') {
      rutaId = usuario.ruta_id;
    } else {
      rutaId = req.query.rutaId;
      if (!rutaId) return res.status(400).json({ error: 'rutaId requerido' });
    }
    const clientes = await query('SELECT * FROM clientes WHERE ruta_id = $1 AND activo = true', [rutaId]);
    res.json({ clientes });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo clientes' });
  }
});

// Productos
app.get('/api/productos', authMiddleware, async (req, res) => {
  try {
    const productos = await query('SELECT * FROM productos WHERE activo = true', []);
    res.json({ productos });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo productos' });
  }
});

// Ventas
app.get('/api/ventas', authMiddleware, async (req, res) => {
  try {
    const usuario = req.usuario;
    let ventas;
    if (usuario.rol === 'vendedor') {
      ventas = await query('SELECT * FROM ventas WHERE usuario_id = $1 ORDER BY fecha_venta DESC LIMIT 100', [usuario.id]);
    } else if (req.query.rutaId) {
      ventas = await query('SELECT * FROM ventas WHERE ruta_id = $1 ORDER BY fecha_venta DESC LIMIT 100', [req.query.rutaId]);
    } else {
      ventas = await query('SELECT * FROM ventas ORDER BY fecha_venta DESC LIMIT 100', []);
    }
    res.json({ ventas });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo ventas' });
  }
});

// Sync (recibir ventas offline)
app.post('/api/sync/push', authMiddleware, async (req, res) => {
  try {
    const usuario = req.usuario;
    const { events } = req.body;
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'events requerido' });
    }
    const results = [];
    for (const event of events) {
      try {
        // Verificar si ya existe (idempotencia)
        const exists = await queryOne('SELECT id FROM ventas WHERE cliente_tx_id = $1', [event.venta.clienteTxId]);
        if (exists) {
          results.push({ eventId: event.eventId, status: 'duplicate' });
          continue;
        }
        // Verificar y decrementar stock
        for (const item of event.items) {
          const inv = await queryOne('SELECT * FROM inventario_ruta WHERE ruta_id = $1 AND producto_id = $2', [usuario.ruta_id, item.productoId]);
          if (!inv || parseFloat(inv.cantidad) < parseFloat(item.cantidad)) {
            results.push({ eventId: event.eventId, status: 'error', error: 'Stock insuficiente' });
            continue;
          }
          await pool.query('UPDATE inventario_ruta SET cantidad = cantidad - $1, ultima_actualizacion = NOW() WHERE id = $2', [item.cantidad, inv.id]);
        }
        // Crear venta
        const ventaResult = await queryOne(
          'INSERT INTO ventas (cliente_tx_id, usuario_id, cliente_id, ruta_id, fecha_venta, subtotal, descuento, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
          [event.venta.clienteTxId, usuario.id, event.venta.clienteId, usuario.ruta_id, event.venta.fechaVenta, event.venta.subtotal, event.venta.descuento, event.venta.total]
        );
        // Crear items
        for (const item of event.items) {
          await pool.query(
            'INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
            [ventaResult.id, item.productoId, item.cantidad, item.precioUnitario, item.subtotal]
          );
        }
        results.push({ eventId: event.eventId, status: 'success', ventaId: ventaResult.id });
      } catch (e) {
        results.push({ eventId: event.eventId, status: 'error', error: e.message });
      }
    }
    res.json({ results });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Error en sync' });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`  SERVIDOR VENTAS API`);
  console.log(`  Puerto: ${PORT}`);
  console.log(`  Hora: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
});
```

Guardar: `Ctrl + O`, Enter, `Ctrl + X`

---

## PASO 6: Probar que funciona

### 6.1 Ejecutar manualmente primero
```bash
node server.js
```

Deberias ver:
```
==================================================
  SERVIDOR VENTAS API
  Puerto: 5000
  Hora: 2026-02-02T...
==================================================
```

### 6.2 Probar en otra terminal (o navegador)
Abre otra conexion SSH (o usa el navegador) y prueba:
```bash
curl http://localhost:5000/api/health
```

Debe responder:
```json
{"status":"ok","timestamp":"..."}
```

### 6.3 Detener el servidor
Presiona `Ctrl + C`

---

## PASO 7: Configurar PM2 (para que corra 24/7)

### 7.1 Iniciar con PM2
```bash
cd ~/ventas-api
pm2 start server.js --name ventas-api
```

### 7.2 Verificar que esta corriendo
```bash
pm2 status
```

Debe mostrar:
```
┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ mode        │ status  │ cpu     │ memory   │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ ventas-api   │ fork        │ online  │ 0%      │ 40mb     │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┘
```

### 7.3 Configurar para que inicie automaticamente al reiniciar
```bash
pm2 save
pm2 startup
```

Copia y ejecuta el comando que te muestra (algo como `sudo env PATH=...`).

### 7.4 Comandos utiles de PM2
```bash
pm2 logs ventas-api      # Ver logs en tiempo real
pm2 restart ventas-api   # Reiniciar la app
pm2 stop ventas-api      # Detener la app
pm2 delete ventas-api    # Eliminar del PM2
```

---

## PASO 8: Abrir el puerto en el firewall

### 8.1 En Lightsail
1. Ve a tu instancia en Lightsail
2. Haz clic en la pestana **"Networking"**
3. En "IPv4 Firewall", haz clic en **"+ Add rule"**
4. Configura:
   - Application: **Custom**
   - Protocol: **TCP**
   - Port: **5000**
5. Haz clic en **"Create"**

### 8.2 Obtener la IP publica
En la misma pagina de Lightsail, copia la **IP publica** de tu instancia.
Ejemplo: `54.123.45.67`

---

## PASO 9: Probar desde internet

Desde tu computadora o celular, abre el navegador y ve a:
```
http://54.123.45.67:5000/api/health
```
(Reemplaza con TU IP publica)

Debe responder:
```json
{"status":"ok","timestamp":"..."}
```

---

## PASO 10: Configurar el frontend

En tu aplicacion de Replit (o donde tengas el frontend), actualiza la URL de la API:

### En el archivo .env del frontend:
```
VITE_API_BASE_URL=http://54.123.45.67:5000
```

O en el codigo, busca donde se configura la URL de la API y cambiala.

---

## RESUMEN DE URLS

| Servicio | URL |
|----------|-----|
| Health check | http://TU-IP:5000/api/health |
| Login | POST http://TU-IP:5000/api/auth/login |
| Bootstrap | GET http://TU-IP:5000/api/me/bootstrap |
| Rutas | GET http://TU-IP:5000/api/rutas |
| Clientes | GET http://TU-IP:5000/api/clientes |
| Productos | GET http://TU-IP:5000/api/productos |
| Ventas | GET http://TU-IP:5000/api/ventas |
| Sync | POST http://TU-IP:5000/api/sync/push |

---

## COMANDOS RAPIDOS (referencia)

### Conectarse al servidor
```bash
# Desde Lightsail: Click "Connect using SSH"
```

### Ver logs
```bash
pm2 logs ventas-api
```

### Reiniciar despues de cambios
```bash
pm2 restart ventas-api
```

### Editar archivo .env
```bash
cd ~/ventas-api
nano .env
pm2 restart ventas-api
```

### Actualizar el codigo
```bash
cd ~/ventas-api
nano server.js
pm2 restart ventas-api
```

---

## COSTO MENSUAL TOTAL

| Servicio | Costo |
|----------|-------|
| Instancia Node.js (512MB) | $3.50 USD |
| Base de datos PostgreSQL | $15.00 USD |
| **TOTAL** | **$18.50 USD/mes** |

---

## PROBLEMAS COMUNES

### "Connection refused" o "Timeout"
- Verifica que el puerto 5000 este abierto en Networking
- Verifica que PM2 este corriendo: `pm2 status`
- Verifica los logs: `pm2 logs ventas-api`

### "Cannot connect to database"
- Verifica DATABASE_URL en .env
- Verifica que "Public mode" este habilitado en la base de datos Lightsail
- Prueba la conexion: `node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1').then(()=>console.log('OK')).catch(e=>console.log(e))"`

### La app se detiene al cerrar SSH
- Asegurate de usar PM2, no `node server.js` directamente
- Ejecuta `pm2 save` despues de iniciar

### Cambios no se reflejan
- Despues de editar archivos, reinicia: `pm2 restart ventas-api`

---

## OPCIONAL: Usar dominio personalizado

Si quieres usar un dominio como `api.tuempresa.com`:

1. Compra un dominio (GoDaddy, Namecheap, etc.)
2. En el DNS del dominio, crea un registro A apuntando a tu IP de Lightsail
3. Configura Nginx como proxy inverso (para HTTPS)

Si necesitas ayuda con esto, dimelo!
