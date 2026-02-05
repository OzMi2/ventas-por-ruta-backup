-- =====================================================
-- SQL para crear tablas faltantes en servidor AWS
-- Ejecutar ANTES de hacer el deploy del nuevo código
-- =====================================================

-- 1. Tabla: saldos_clientes (para sistema de créditos)
CREATE TABLE IF NOT EXISTS saldos_clientes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) UNIQUE,
    saldo DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS saldos_clientes_cliente_idx ON saldos_clientes(cliente_id);

-- 2. Tabla: abonos (pagos parciales de crédito)
CREATE TABLE IF NOT EXISTS abonos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    monto DECIMAL(10, 2) NOT NULL,
    saldo_anterior DECIMAL(12, 2) NOT NULL,
    saldo_nuevo DECIMAL(12, 2) NOT NULL,
    notas TEXT,
    fecha TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS abonos_cliente_idx ON abonos(cliente_id);
CREATE INDEX IF NOT EXISTS abonos_fecha_idx ON abonos(fecha);

-- 3. Tabla: inventario_bodega_mixto (para productos MIXTO en bodega)
CREATE TABLE IF NOT EXISTS inventario_bodega_mixto (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) UNIQUE,
    cantidad_piezas DECIMAL(10, 0) NOT NULL DEFAULT 0,
    cantidad_kg DECIMAL(10, 3) NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS inventario_bodega_mixto_producto_idx ON inventario_bodega_mixto(producto_id);

-- 4. Tabla: inventario_ruta_mixto (para productos MIXTO en rutas)
CREATE TABLE IF NOT EXISTS inventario_ruta_mixto (
    id SERIAL PRIMARY KEY,
    ruta_id INTEGER NOT NULL REFERENCES rutas(id),
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad_piezas DECIMAL(10, 0) NOT NULL DEFAULT 0,
    cantidad_kg DECIMAL(10, 3) NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS inventario_ruta_mixto_ruta_producto_idx ON inventario_ruta_mixto(ruta_id, producto_id);

-- 5. Tabla: historial_precios (historial de cambios de precio)
CREATE TABLE IF NOT EXISTS historial_precios (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    precio_anterior DECIMAL(10, 2) NOT NULL,
    precio_nuevo DECIMAL(10, 2) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    notas TEXT,
    fecha TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS historial_precios_producto_idx ON historial_precios(producto_id);
CREATE INDEX IF NOT EXISTS historial_precios_fecha_idx ON historial_precios(fecha);

-- 6. Tabla: push_subscriptions (para notificaciones push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS push_subs_usuario_idx ON push_subscriptions(usuario_id);
CREATE INDEX IF NOT EXISTS push_subs_endpoint_idx ON push_subscriptions(endpoint);

-- 7. Columnas nuevas en tabla ventas (si no existen)
-- Ejecutar estos uno por uno, ignorar errores si ya existen

ALTER TABLE ventas ADD COLUMN IF NOT EXISTS abono DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(20) NOT NULL DEFAULT 'contado';
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS saldo_anterior DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS saldo_final DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS pago_cliente DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS cambio DECIMAL(12, 2) DEFAULT 0;

-- 8. Columnas nuevas en tabla venta_items (si no existen)
ALTER TABLE venta_items ADD COLUMN IF NOT EXISTS piezas DECIMAL(10, 3);
ALTER TABLE venta_items ADD COLUMN IF NOT EXISTS kilos DECIMAL(10, 3);
ALTER TABLE venta_items ADD COLUMN IF NOT EXISTS descuento_unitario DECIMAL(10, 2) DEFAULT 0;

-- =====================================================
-- Verificar que todo se creó correctamente
-- =====================================================
SELECT 'Tablas creadas:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
