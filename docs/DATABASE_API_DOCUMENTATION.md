# Ventas por Ruta - Documentacion de Base de Datos y API

## Resumen del Sistema

Sistema de gestion de ventas para rutas con:
- Manejo de 15,000+ clientes distribuidos en 100 rutas
- Control de inventario centralizado (bodega) y por ruta
- Sistema de descuentos por volumen y por cliente
- Soporte offline con sincronizacion
- Roles: vendedor, auditor, admin

---

## ESQUEMA DE BASE DE DATOS (PostgreSQL)

### Diagrama de Relaciones

```
                    +-------------+
                    |   rutas     |
                    +-------------+
                    | id (PK)     |
                    | nombre      |
                    | descripcion |
                    | activa      |
                    +------+------+
                           |
       +-------------------+-------------------+
       |                   |                   |
+------v------+    +-------v-------+   +-------v--------+
|  usuarios   |    |   clientes    |   | inventario_ruta|
+-------------+    +---------------+   +----------------+
| id (PK)     |    | id (PK)       |   | id (PK)        |
| username    |    | nombre        |   | ruta_id (FK)   |
| password    |    | direccion     |   | producto_id(FK)|
| nombre      |    | telefono      |   | cantidad       |
| rol         |    | ruta_id (FK)  |   +----------------+
| ruta_id(FK) |    | activo        |
| activo      |    +-------+-------+
+------+------+            |
       |                   |
       |           +-------v--------+
       |           | discount_rules |
       |           +----------------+
       |           | id (PK)        |
       |           | cliente_id(FK) |<-- NULL = todos
       |           | producto_id(FK)|
       |           | tipo_descuento |
       |           | activo         |
       |           +-------+--------+
       |                   |
       |           +-------v--------+
       |           | discount_tiers |
       |           +----------------+
       |           | id (PK)        |
       |           | rule_id (FK)   |
       |           | volumen_desde  |
       |           | descuento_monto|
       |           +----------------+
       |
+------v------+    +---------------+
|   ventas    |    |  productos    |
+-------------+    +---------------+
| id (PK)     |    | id (PK)       |
| cliente_tx_id|   | nombre        |
| usuario_id  |    | precio        |
| cliente_id  |    | unidad        |
| ruta_id     |    | activo        |
| fecha_venta |    +-------+-------+
| subtotal    |            |
| descuento   |    +-------v---------+
| total       |    |inventario_bodega|
+------+------+    +-----------------+
       |           | id (PK)         |
+------v------+    | producto_id(FK) |
| venta_items |    | cantidad        |
+-------------+    +-----------------+
| id (PK)     |            |
| venta_id(FK)|    +-------v----------+
| producto_id |    | movimientos_stock|
| cantidad    |    +------------------+
| precio_unit |    | id (PK)          |
| subtotal    |    | tipo             |
+-------------+    | producto_id (FK) |
                   | cantidad         |
+-------------+    | ruta_id (FK)     |
| sync_events |    | usuario_id (FK)  |
+-------------+    | notas            |
| id (PK)     |    | fecha            |
| event_id    |    +------------------+
| usuario_id  |
| tipo        |
| payload     |
| procesado   |
+-------------+
```

---

## TABLAS DETALLADAS

### 1. rutas
Almacena las rutas de distribucion.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| nombre | VARCHAR(100) | Nombre de la ruta |
| descripcion | TEXT | Descripcion opcional |
| activa | BOOLEAN | Estado activo/inactivo |

```sql
CREATE TABLE rutas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activa BOOLEAN NOT NULL DEFAULT true
);
```

### 2. usuarios
Usuarios del sistema (vendedores, auditores, administradores).

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| username | VARCHAR(50) | Usuario para login (unico) |
| password | TEXT | Hash bcrypt de la contrasena |
| nombre | VARCHAR(100) | Nombre completo |
| rol | VARCHAR(20) | 'vendedor', 'auditor', 'admin' |
| ruta_id | INTEGER (FK) | Ruta asignada (obligatorio para vendedor) |
| activo | BOOLEAN | Estado activo/inactivo |

```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL,
  ruta_id INTEGER REFERENCES rutas(id),
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX usuarios_username_idx ON usuarios(username);
CREATE INDEX usuarios_ruta_idx ON usuarios(ruta_id);
```

### 3. clientes
Clientes asignados a cada ruta.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| nombre | VARCHAR(150) | Nombre del cliente/negocio |
| direccion | TEXT | Direccion fisica |
| telefono | VARCHAR(20) | Telefono de contacto |
| ruta_id | INTEGER (FK) | Ruta a la que pertenece |
| activo | BOOLEAN | Estado activo/inactivo |

```sql
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  direccion TEXT,
  telefono VARCHAR(20),
  ruta_id INTEGER NOT NULL REFERENCES rutas(id),
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX clientes_ruta_idx ON clientes(ruta_id);
```

### 4. productos
Catalogo de productos.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| nombre | VARCHAR(150) | Nombre del producto |
| precio | DECIMAL(10,2) | Precio unitario |
| unidad | VARCHAR(20) | 'PIEZA' o 'KG' |
| activo | BOOLEAN | Estado activo/inactivo |

```sql
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  unidad VARCHAR(20) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true
);
```

### 5. inventario_ruta
Stock disponible en cada ruta.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| ruta_id | INTEGER (FK) | Ruta |
| producto_id | INTEGER (FK) | Producto |
| cantidad | DECIMAL(10,3) | Cantidad disponible |
| ultima_actualizacion | TIMESTAMP | Fecha de ultima modificacion |

```sql
CREATE TABLE inventario_ruta (
  id SERIAL PRIMARY KEY,
  ruta_id INTEGER NOT NULL REFERENCES rutas(id),
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad DECIMAL(10,3) NOT NULL,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX inventario_ruta_ruta_producto_idx ON inventario_ruta(ruta_id, producto_id);
```

### 6. inventario_bodega
Stock central (almacen principal).

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| producto_id | INTEGER (FK) | Producto (unico) |
| cantidad | DECIMAL(10,3) | Cantidad en bodega |
| ultima_actualizacion | TIMESTAMP | Fecha de ultima modificacion |

```sql
CREATE TABLE inventario_bodega (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL UNIQUE REFERENCES productos(id),
  cantidad DECIMAL(10,3) NOT NULL,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX inventario_bodega_producto_idx ON inventario_bodega(producto_id);
```

### 7. movimientos_stock
Historial de movimientos de inventario.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| tipo | VARCHAR(20) | 'ENTRADA_BODEGA', 'SALIDA_RUTA', 'DEVOLUCION' |
| producto_id | INTEGER (FK) | Producto |
| cantidad | DECIMAL(10,3) | Cantidad movida |
| ruta_id | INTEGER (FK) | Ruta destino (NULL si entrada) |
| usuario_id | INTEGER (FK) | Usuario que realizo el movimiento |
| notas | TEXT | Notas opcionales |
| fecha | TIMESTAMP | Fecha del movimiento |

```sql
CREATE TABLE movimientos_stock (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad DECIMAL(10,3) NOT NULL,
  ruta_id INTEGER REFERENCES rutas(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  notas TEXT,
  fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX movimientos_stock_fecha_idx ON movimientos_stock(fecha);
CREATE INDEX movimientos_stock_producto_idx ON movimientos_stock(producto_id);
```

### 8. ventas
Registro de ventas realizadas.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| cliente_tx_id | VARCHAR(100) | UUID de transaccion (idempotencia) |
| usuario_id | INTEGER (FK) | Vendedor |
| cliente_id | INTEGER (FK) | Cliente |
| ruta_id | INTEGER (FK) | Ruta |
| fecha_venta | TIMESTAMP | Fecha de la venta (puede ser offline) |
| fecha_sync | TIMESTAMP | Fecha de sincronizacion |
| subtotal | DECIMAL(10,2) | Subtotal antes de descuento |
| descuento | DECIMAL(10,2) | Monto de descuento aplicado |
| total | DECIMAL(10,2) | Total final |
| descuento_aplicado | TEXT | JSON con detalles del descuento |

```sql
CREATE TABLE ventas (
  id SERIAL PRIMARY KEY,
  cliente_tx_id VARCHAR(100) NOT NULL UNIQUE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  ruta_id INTEGER NOT NULL REFERENCES rutas(id),
  fecha_venta TIMESTAMP NOT NULL,
  fecha_sync TIMESTAMP NOT NULL DEFAULT NOW(),
  subtotal DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  descuento_aplicado TEXT
);

CREATE INDEX ventas_cliente_tx_id_idx ON ventas(cliente_tx_id);
CREATE INDEX ventas_ruta_idx ON ventas(ruta_id);
CREATE INDEX ventas_cliente_idx ON ventas(cliente_id);
CREATE INDEX ventas_fecha_venta_idx ON ventas(fecha_venta);
```

### 9. venta_items
Detalle de productos en cada venta.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| venta_id | INTEGER (FK) | Venta padre |
| producto_id | INTEGER (FK) | Producto vendido |
| cantidad | DECIMAL(10,3) | Cantidad vendida |
| precio_unitario | DECIMAL(10,2) | Precio al momento de la venta |
| subtotal | DECIMAL(10,2) | Subtotal del item |

```sql
CREATE TABLE venta_items (
  id SERIAL PRIMARY KEY,
  venta_id INTEGER NOT NULL REFERENCES ventas(id),
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad DECIMAL(10,3) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX venta_items_venta_idx ON venta_items(venta_id);
```

### 10. sync_events
Eventos de sincronizacion para idempotencia.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| event_id | VARCHAR(100) | UUID del evento (unico) |
| usuario_id | INTEGER (FK) | Usuario que envio |
| tipo | VARCHAR(50) | Tipo de evento ('venta') |
| payload | TEXT | JSON del evento completo |
| procesado | BOOLEAN | Si ya fue procesado |
| fecha_recepcion | TIMESTAMP | Cuando se recibio |
| fecha_procesamiento | TIMESTAMP | Cuando se proceso |
| error | TEXT | Error si fallo |

```sql
CREATE TABLE sync_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(100) NOT NULL UNIQUE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  tipo VARCHAR(50) NOT NULL,
  payload TEXT NOT NULL,
  procesado BOOLEAN NOT NULL DEFAULT false,
  fecha_recepcion TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_procesamiento TIMESTAMP,
  error TEXT
);

CREATE INDEX sync_events_event_id_idx ON sync_events(event_id);
CREATE INDEX sync_events_procesado_idx ON sync_events(procesado);
```

### 11. discount_rules
Reglas de descuento por producto.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| cliente_id | INTEGER (FK) | NULL = todos, valor = cliente especifico |
| producto_id | INTEGER (FK) | Producto al que aplica |
| tipo_descuento | VARCHAR(20) | 'PIEZA', 'KG', 'MIXTO' |
| activo | BOOLEAN | Estado activo/inactivo |
| fecha_creacion | TIMESTAMP | Fecha de creacion |

```sql
CREATE TABLE discount_rules (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  tipo_descuento VARCHAR(20) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX discount_rules_cliente_producto_idx ON discount_rules(cliente_id, producto_id);
```

### 12. discount_tiers
Niveles de descuento por volumen.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | SERIAL (PK) | Identificador unico |
| rule_id | INTEGER (FK) | Regla padre |
| volumen_desde | DECIMAL(10,3) | Desde que cantidad aplica |
| descuento_monto | DECIMAL(10,2) | Monto fijo de descuento |

```sql
CREATE TABLE discount_tiers (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER NOT NULL REFERENCES discount_rules(id),
  volumen_desde DECIMAL(10,3) NOT NULL,
  descuento_monto DECIMAL(10,2) NOT NULL
);

CREATE INDEX discount_tiers_rule_idx ON discount_tiers(rule_id);
```

---

## API ENDPOINTS

### Autenticacion

| Metodo | Endpoint | Descripcion | Roles |
|--------|----------|-------------|-------|
| POST | /api/auth/login | Login con username/password | Publico |

**Request:**
```json
{
  "username": "vendedor1",
  "password": "1234"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": 1,
    "username": "vendedor1",
    "nombre": "Juan Perez",
    "rol": "vendedor",
    "rutaId": 1
  }
}
```

### Bootstrap (Datos iniciales)

| Metodo | Endpoint | Descripcion | Roles |
|--------|----------|-------------|-------|
| GET | /api/me/bootstrap | Datos para el vendedor | vendedor |

**Response:**
```json
{
  "usuario": {...},
  "ruta": {...},
  "clientes": [...],
  "productos": [...],
  "inventario": [...]
}
```

### Rutas

| Metodo | Endpoint | Descripcion | Roles |
|--------|----------|-------------|-------|
| GET | /api/rutas | Lista de rutas | todos |

### Clientes

| Metodo | Endpoint | Descripcion | Roles |
|--------|----------|-------------|-------|
| GET | /api/clientes?rutaId=X | Clientes por ruta | todos |
| GET | /api/clientes/todos | Todos los clientes | admin |
| POST | /api/clientes | Crear cliente | admin |

**POST /api/clientes Request:**
```json
{
  "nombre": "Tienda Nueva",
  "rutaId": 1,
  "direccion": "Calle 123",
  "telefono": "5551234567"
}
```

### Productos

| Metodo | Endpoint | Descripcion | Roles |
|--------|----------|-------------|-------|
| GET | /api/productos | Lista de productos | todos |
| POST | /api/productos | Crear producto | admin |

**POST /api/productos Request:**
```json
{
  "nombre": "Producto Nuevo",
  "precio": "25.50",
  "unidad": "KG"
}
```

### Inventario Bodega

| Metodo | Endpoint | Descripcion | Roles |
|--------|----------|-------------|-------|
| GET | /api/bodega | Stock de bodega | admin, auditor |
| POST | /api/bodega/entrada | Registrar entrada | admin, auditor |
| POST | /api/bodega/mover-a-ruta | Mover a ruta | admin, auditor |

**POST /api/bodega/entrada Request:**
```json
{
  "productoId": 1,
  "cantidad": 100.5,
  "notas": "Entrada de proveedor"
}
```

**POST /api/bodega/mover-a-ruta Request:**
```json
{
  "productoId": 1,
  "rutaId": 1,
  "cantidad": 50.0,
  "notas": "Entrega matutina"
}
```

### Movimientos

| Metodo | Endpoint | Descripcion | Roles |
|--------|----------|-------------|-------|
| GET | /api/movimientos | Historial de movimientos | admin, auditor |

### Ventas

| Metodo | Endpoint | Descripcion | Roles |
|--------|----------|-------------|-------|
| GET | /api/ventas | Lista de ventas | todos |
| POST | /api/sync/push | Sincronizar ventas offline | vendedor |

**GET /api/ventas Query params:**
- `rutaId`: Filtrar por ruta
- `clienteId`: Filtrar por cliente
- `limit`: Limite de resultados

**POST /api/sync/push Request:**
```json
{
  "events": [
    {
      "eventId": "uuid-unico",
      "tipo": "venta",
      "venta": {
        "clienteTxId": "uuid-transaccion",
        "usuarioId": 1,
        "clienteId": 1,
        "rutaId": 1,
        "fechaVenta": "2026-02-02T10:30:00Z",
        "subtotal": "100.00",
        "descuento": "5.00",
        "total": "95.00"
      },
      "items": [
        {
          "productoId": 1,
          "cantidad": "5.000",
          "precioUnitario": "20.00",
          "subtotal": "100.00"
        }
      ]
    }
  ]
}
```

### Descuentos

| Metodo | Endpoint | Descripcion | Roles |
|--------|----------|-------------|-------|
| GET | /api/descuentos | Lista de reglas de descuento | todos |
| POST | /api/descuentos | Crear regla de descuento | admin |
| DELETE | /api/descuentos/:id | Eliminar regla | admin |

**POST /api/descuentos Request:**
```json
{
  "clienteId": null,
  "productoId": 1,
  "tipoDescuento": "KG",
  "tiers": [
    { "volumenDesde": "10", "descuentoMonto": "1.00" },
    { "volumenDesde": "20", "descuentoMonto": "2.00" }
  ]
}
```

---

## IMPLEMENTACION EN AWS LIGHTSAIL

### 1. Crear instancia de PostgreSQL

```bash
# En AWS Lightsail, crear una base de datos PostgreSQL
# - Plan: $15/mes (1GB RAM, 40GB SSD)
# - Version: PostgreSQL 15+
```

### 2. Configurar conexion

Una vez creada la base de datos, obtener:
- Endpoint (host)
- Puerto (5432)
- Usuario master
- Password

### 3. Variables de entorno necesarias

```env
DATABASE_URL=postgresql://usuario:password@host:5432/ventasruta
JWT_SECRET=tu-secreto-jwt-seguro-aqui
```

### 4. Script de inicializacion

Ejecutar las sentencias SQL de cada tabla en orden:
1. rutas
2. usuarios
3. clientes
4. productos
5. inventario_ruta
6. inventario_bodega
7. movimientos_stock
8. ventas
9. venta_items
10. sync_events
11. discount_rules
12. discount_tiers

### 5. Datos iniciales (seed)

```sql
-- Rutas
INSERT INTO rutas (nombre, descripcion) VALUES 
  ('Ruta Centro', 'Zona centro de la ciudad'),
  ('Ruta Norte', 'Zona norte');

-- Usuario admin
INSERT INTO usuarios (username, password, nombre, rol) VALUES 
  ('admin', '$2b$10$...hash...', 'Administrador', 'admin');

-- Usuarios vendedores
INSERT INTO usuarios (username, password, nombre, rol, ruta_id) VALUES 
  ('vendedor1', '$2b$10$...hash...', 'Juan Vendedor', 'vendedor', 1);
```

### 6. Conexion desde la aplicacion

La aplicacion usa Drizzle ORM. Para conectar:

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Para Lightsail
});

const db = drizzle(pool);
```

---

## CREDENCIALES DE PRUEBA

| Usuario | Password | Rol | Ruta |
|---------|----------|-----|------|
| vendedor1 | 1234 | vendedor | Ruta Centro |
| vendedor2 | 1234 | vendedor | Ruta Norte |
| auditor | 1234 | auditor | - |
| admin | 1234 | admin | - |

---

## NOTAS IMPORTANTES

1. **Idempotencia**: Las ventas usan `cliente_tx_id` unico para evitar duplicados en sincronizacion offline.

2. **Validacion de stock**: El sistema NO permite ventas que dejen inventario negativo.

3. **Descuentos**: 
   - `cliente_id = NULL` = Descuento por volumen para TODOS
   - `cliente_id = valor` = Descuento solo para ese cliente

4. **Transacciones atomicas**: Las operaciones de bodega (entrada, transferencia) usan transacciones de base de datos para garantizar consistencia.

5. **Bcrypt**: Las contrasenas se almacenan como hash bcrypt con salt rounds = 10.
