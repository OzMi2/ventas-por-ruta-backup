# GUIA DE INSTALACION - Base de Datos y API en AWS Lightsail

Esta guia te llevara paso a paso para crear la base de datos PostgreSQL en AWS Lightsail y conectarla con tu aplicacion.

---

## PASO 1: Crear cuenta en AWS (si no tienes)

1. Ve a https://aws.amazon.com
2. Haz clic en "Crear una cuenta de AWS"
3. Completa el registro (necesitaras tarjeta de credito)
4. Verifica tu correo electronico

---

## PASO 2: Acceder a AWS Lightsail

1. Inicia sesion en https://console.aws.amazon.com
2. En la barra de busqueda superior, escribe "Lightsail"
3. Haz clic en "Lightsail" para abrir el servicio

---

## PASO 3: Crear la base de datos PostgreSQL

1. En Lightsail, haz clic en la pestana **"Databases"** (Bases de datos)
2. Haz clic en **"Create database"** (Crear base de datos)
3. Configura lo siguiente:

   **Ubicacion:**
   - Region: Selecciona la mas cercana a ti (ej: us-east-1)
   - Zona: Cualquiera disponible

   **Motor de base de datos:**
   - Selecciona: **PostgreSQL**
   - Version: **16.x** (la mas reciente disponible)

   **Plan:**
   - Para produccion: $15/mes (1GB RAM, 40GB SSD)
   - Para pruebas: $15/mes (minimo disponible)

   **Credenciales:**
   - Haz clic en "Specify login credentials"
   - Usuario: `ventasadmin` (o el que prefieras)
   - Contrasena: Genera una segura y GUARDALA

   **Nombre de la base de datos:**
   - Nombre: `ventasruta`

4. Haz clic en **"Create database"**
5. Espera 10-15 minutos mientras se crea

---

## PASO 4: Obtener datos de conexion

Una vez creada la base de datos:

1. Haz clic en el nombre de tu base de datos
2. Ve a la pestana **"Connect"** (Conectar)
3. Anota estos datos:

```
Endpoint: tu-db.xxxxxx.us-east-1.rds.amazonaws.com
Puerto: 5432
Usuario: ventasadmin
Contrasena: (la que guardaste)
Base de datos: ventasruta
```

4. **IMPORTANTE**: En la seccion "Networking", habilita "Public mode" para poder conectarte desde fuera de AWS

---

## PASO 5: Instalar herramienta para conectarte

Necesitas una herramienta para ejecutar comandos SQL. Opciones:

**Opcion A - pgAdmin (Recomendada para Windows/Mac):**
1. Descarga de: https://www.pgadmin.org/download/
2. Instala y abre pgAdmin
3. Clic derecho en "Servers" > "Register" > "Server"
4. Pestana "General": Nombre = "VentasRuta AWS"
5. Pestana "Connection":
   - Host: (tu endpoint de AWS)
   - Port: 5432
   - Maintenance database: ventasruta
   - Username: ventasadmin
   - Password: (tu contrasena)
6. Haz clic en "Save"

**Opcion B - DBeaver (Gratuito, multiplataforma):**
1. Descarga de: https://dbeaver.io/download/
2. Instala y abre DBeaver
3. Menu "Database" > "New Database Connection"
4. Selecciona "PostgreSQL"
5. Ingresa los datos de conexion
6. Haz clic en "Test Connection" y luego "Finish"

**Opcion C - Linea de comandos (psql):**
```bash
psql -h tu-endpoint.rds.amazonaws.com -U ventasadmin -d ventasruta
```

---

## PASO 6: Crear las tablas

Conectate a tu base de datos y ejecuta estos comandos SQL EN ORDEN:

### 6.1 Tabla: rutas
```sql
CREATE TABLE rutas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activa BOOLEAN NOT NULL DEFAULT true
);
```

### 6.2 Tabla: usuarios
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

### 6.3 Tabla: clientes
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

### 6.4 Tabla: productos
```sql
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  unidad VARCHAR(20) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true
);
```

### 6.5 Tabla: inventario_ruta
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

### 6.6 Tabla: inventario_bodega
```sql
CREATE TABLE inventario_bodega (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL UNIQUE REFERENCES productos(id),
  cantidad DECIMAL(10,3) NOT NULL,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX inventario_bodega_producto_idx ON inventario_bodega(producto_id);
```

### 6.7 Tabla: movimientos_stock
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

### 6.8 Tabla: ventas
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

### 6.9 Tabla: venta_items
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

### 6.10 Tabla: sync_events
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

### 6.11 Tabla: discount_rules
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

### 6.12 Tabla: discount_tiers
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

## PASO 7: Insertar datos iniciales

### 7.1 Crear rutas
```sql
INSERT INTO rutas (nombre, descripcion) VALUES 
  ('Ruta Centro', 'Zona centro de la ciudad'),
  ('Ruta Norte', 'Zona norte'),
  ('Ruta Sur', 'Zona sur'),
  ('Ruta Este', 'Zona este'),
  ('Ruta Oeste', 'Zona oeste');
```

### 7.2 Crear usuarios
Las contrasenas estan encriptadas con bcrypt. El hash de abajo corresponde a la contrasena "1234":

```sql
-- Hash bcrypt para "1234"
-- $2b$10$8K1p/h0ql1F1F1F1F1F1F.1F1F1F1F1F1F1F1F1F1F1F1F1F1F1

INSERT INTO usuarios (username, password, nombre, rol, ruta_id) VALUES 
  ('admin', '$2b$10$rQnM1f1lmF3RmzLe0jGpCeOiIwL3.LvNGxL5HvL3UrCMfG0PVYi6G', 'Administrador', 'admin', NULL),
  ('auditor', '$2b$10$rQnM1f1lmF3RmzLe0jGpCeOiIwL3.LvNGxL5HvL3UrCMfG0PVYi6G', 'Auditor General', 'auditor', NULL),
  ('vendedor1', '$2b$10$rQnM1f1lmF3RmzLe0jGpCeOiIwL3.LvNGxL5HvL3UrCMfG0PVYi6G', 'Juan Perez', 'vendedor', 1),
  ('vendedor2', '$2b$10$rQnM1f1lmF3RmzLe0jGpCeOiIwL3.LvNGxL5HvL3UrCMfG0PVYi6G', 'Maria Garcia', 'vendedor', 2),
  ('vendedor3', '$2b$10$rQnM1f1lmF3RmzLe0jGpCeOiIwL3.LvNGxL5HvL3UrCMfG0PVYi6G', 'Carlos Lopez', 'vendedor', 3);
```

**NOTA**: El hash anterior es de ejemplo. Para generar tu propio hash, usa este codigo en Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('tu_contrasena', 10);
console.log(hash);
```

### 7.3 Crear productos de ejemplo
```sql
INSERT INTO productos (nombre, precio, unidad) VALUES 
  ('Pollo entero', '85.00', 'KG'),
  ('Pechuga de pollo', '120.00', 'KG'),
  ('Pierna de pollo', '75.00', 'KG'),
  ('Muslo de pollo', '70.00', 'KG'),
  ('Alas de pollo', '65.00', 'KG'),
  ('Menudencias', '35.00', 'KG'),
  ('Huevo (30 pzas)', '85.00', 'PIEZA'),
  ('Huevo (12 pzas)', '38.00', 'PIEZA');
```

### 7.4 Crear clientes de ejemplo
```sql
INSERT INTO clientes (nombre, direccion, telefono, ruta_id) VALUES 
  ('Tienda La Esquina', 'Av. Principal 123', '5551234567', 1),
  ('Abarrotes Don Jose', 'Calle 5 de Mayo 45', '5559876543', 1),
  ('Supermercado El Ahorro', 'Blvd. Juarez 789', '5555555555', 1),
  ('Tienda Lupita', 'Calle Norte 100', '5551111111', 2),
  ('Mini Super Martinez', 'Av. Norte 200', '5552222222', 2),
  ('Carniceria El Toro', 'Calle Sur 50', '5553333333', 3);
```

---

## PASO 8: Configurar la aplicacion

### 8.1 Variable de entorno DATABASE_URL

Forma el URL de conexion asi:
```
postgresql://USUARIO:CONTRASENA@ENDPOINT:5432/BASEDATOS?sslmode=require
```

Ejemplo:
```
postgresql://ventasadmin:MiContrasena123@tu-db.xxxxxx.rds.amazonaws.com:5432/ventasruta?sslmode=require
```

### 8.2 En Replit

1. Ve a la pestana "Secrets" (candado en el panel izquierdo)
2. Agrega un nuevo secreto:
   - Nombre: `DATABASE_URL`
   - Valor: (tu URL de conexion completo)
3. Agrega tambien:
   - Nombre: `JWT_SECRET`
   - Valor: (una cadena aleatoria larga, ej: "mi-secreto-super-seguro-2024")

### 8.3 En AWS Lightsail (si despliegas ahi)

1. Crea una instancia de Node.js en Lightsail
2. En la configuracion de la instancia, agrega variables de entorno:
   - `DATABASE_URL` = tu URL de conexion
   - `JWT_SECRET` = tu secreto JWT

---

## PASO 9: Verificar conexion

Ejecuta este comando SQL para verificar que todo funciona:

```sql
SELECT 
  (SELECT COUNT(*) FROM rutas) as total_rutas,
  (SELECT COUNT(*) FROM usuarios) as total_usuarios,
  (SELECT COUNT(*) FROM productos) as total_productos,
  (SELECT COUNT(*) FROM clientes) as total_clientes;
```

Deberia mostrar los conteos de cada tabla.

---

## PASO 10: Probar la aplicacion

1. Abre la aplicacion
2. Inicia sesion con:
   - Usuario: `admin`
   - Contrasena: `1234`
3. Navega por las diferentes secciones para verificar que todo funciona

---

## RESUMEN DE CREDENCIALES DE PRUEBA

| Usuario | Contrasena | Rol | Ruta |
|---------|------------|-----|------|
| admin | 1234 | Administrador | - |
| auditor | 1234 | Auditor | - |
| vendedor1 | 1234 | Vendedor | Ruta Centro |
| vendedor2 | 1234 | Vendedor | Ruta Norte |
| vendedor3 | 1234 | Vendedor | Ruta Sur |

---

## SOLUCION DE PROBLEMAS

### Error: "Connection refused"
- Verifica que "Public mode" este habilitado en Lightsail
- Verifica que el endpoint sea correcto

### Error: "Authentication failed"
- Verifica usuario y contrasena
- Asegurate de que la contrasena no tenga caracteres especiales sin escapar

### Error: "Database does not exist"
- Verifica el nombre de la base de datos en el URL
- Asegurate de haber creado la base de datos en Lightsail

### Error: "SSL required"
- Agrega `?sslmode=require` al final del DATABASE_URL

---

## COSTO ESTIMADO MENSUAL

| Servicio | Costo |
|----------|-------|
| Base de datos PostgreSQL (Lightsail) | $15 USD |
| Instancia Node.js (Lightsail) - opcional | $3.50 USD |
| **Total minimo** | **$15-18.50 USD/mes** |

---

## SIGUIENTE PASO: Desplegar la API

Una vez que la base de datos este funcionando, puedes:
1. Continuar usando Replit como servidor de la aplicacion
2. O desplegar la API en una instancia de Lightsail

Para desplegar en Lightsail, necesitaras:
1. Crear una instancia Node.js
2. Clonar el repositorio
3. Configurar las variables de entorno
4. Ejecutar `npm install` y `npm run build`
5. Configurar un proceso para mantener la app corriendo (PM2)

Si prefieres, puedo darte instrucciones detalladas para el despliegue de la API.
