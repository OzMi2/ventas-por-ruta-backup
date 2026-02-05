import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, decimal, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Rutas (routes)
export const rutas = pgTable("rutas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  activa: boolean("activa").default(true).notNull(),
});

export const insertRutaSchema = createInsertSchema(rutas).omit({ id: true });
export type InsertRuta = z.infer<typeof insertRutaSchema>;
export type Ruta = typeof rutas.$inferSelect;

// Usuarios (vendedores, auditores, admin)
export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(), // bcrypt hash
  nombre: varchar("nombre", { length: 100 }).notNull(),
  rol: varchar("rol", { length: 20 }).notNull(), // 'vendedor' | 'auditor' | 'admin'
  rutaId: integer("ruta_id").references(() => rutas.id), // NOT NULL for vendedores
  activo: boolean("activo").default(true).notNull(),
}, (table) => ({
  usernameIdx: index("usuarios_username_idx").on(table.username),
  rutaIdx: index("usuarios_ruta_idx").on(table.rutaId),
}));

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({ id: true });
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Usuario = typeof usuarios.$inferSelect;

// Clientes
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  direccion: text("direccion"),
  telefono: varchar("telefono", { length: 20 }),
  rutaId: integer("ruta_id").references(() => rutas.id).notNull(),
  activo: boolean("activo").default(true).notNull(),
}, (table) => ({
  rutaIdx: index("clientes_ruta_idx").on(table.rutaId),
}));

export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true });
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;

// Productos
export const productos = pgTable("productos", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  precio: decimal("precio", { precision: 10, scale: 2 }).notNull(),
  unidad: varchar("unidad", { length: 20 }).notNull(), // 'PIEZA' | 'KG' | 'MIXTO'
  activo: boolean("activo").default(true).notNull(),
});

export const insertProductoSchema = createInsertSchema(productos).omit({ id: true });
export type InsertProducto = z.infer<typeof insertProductoSchema>;
export type Producto = typeof productos.$inferSelect;

// Inventario por ruta
export const inventarioRuta = pgTable("inventario_ruta", {
  id: serial("id").primaryKey(),
  rutaId: integer("ruta_id").references(() => rutas.id).notNull(),
  productoId: integer("producto_id").references(() => productos.id).notNull(),
  cantidad: decimal("cantidad", { precision: 10, scale: 3 }).notNull(),
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow().notNull(),
}, (table) => ({
  rutaProductoIdx: index("inventario_ruta_ruta_producto_idx").on(table.rutaId, table.productoId),
}));

export const insertInventarioRutaSchema = createInsertSchema(inventarioRuta).omit({ id: true, ultimaActualizacion: true });
export type InsertInventarioRuta = z.infer<typeof insertInventarioRutaSchema>;
export type InventarioRuta = typeof inventarioRuta.$inferSelect;

// Inventario de bodega (stock central)
export const inventarioBodega = pgTable("inventario_bodega", {
  id: serial("id").primaryKey(),
  productoId: integer("producto_id").references(() => productos.id).notNull().unique(),
  cantidad: decimal("cantidad", { precision: 10, scale: 3 }).notNull(),
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow().notNull(),
}, (table) => ({
  productoIdx: index("inventario_bodega_producto_idx").on(table.productoId),
}));

export const insertInventarioBodegaSchema = createInsertSchema(inventarioBodega).omit({ id: true, ultimaActualizacion: true });
export type InsertInventarioBodega = z.infer<typeof insertInventarioBodegaSchema>;
export type InventarioBodega = typeof inventarioBodega.$inferSelect;

// Movimientos de stock (historial de transferencias)
export const movimientosStock = pgTable("movimientos_stock", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 20 }).notNull(), // 'ENTRADA_BODEGA' | 'SALIDA_RUTA' | 'DEVOLUCION'
  productoId: integer("producto_id").references(() => productos.id).notNull(),
  cantidad: decimal("cantidad", { precision: 10, scale: 3 }).notNull(),
  rutaId: integer("ruta_id").references(() => rutas.id), // NULL si es entrada a bodega
  usuarioId: integer("usuario_id").references(() => usuarios.id).notNull(),
  notas: text("notas"),
  fecha: timestamp("fecha").defaultNow().notNull(),
}, (table) => ({
  fechaIdx: index("movimientos_stock_fecha_idx").on(table.fecha),
  productoIdx: index("movimientos_stock_producto_idx").on(table.productoId),
}));

export const insertMovimientoStockSchema = createInsertSchema(movimientosStock).omit({ id: true, fecha: true });
export type InsertMovimientoStock = z.infer<typeof insertMovimientoStockSchema>;
export type MovimientoStock = typeof movimientosStock.$inferSelect;

// Ventas
export const ventas = pgTable("ventas", {
  id: serial("id").primaryKey(),
  clienteTxId: varchar("cliente_tx_id", { length: 100 }).notNull().unique(), // UUID del cliente (idempotencia)
  usuarioId: integer("usuario_id").references(() => usuarios.id).notNull(),
  clienteId: integer("cliente_id").references(() => clientes.id).notNull(),
  rutaId: integer("ruta_id").references(() => rutas.id).notNull(),
  fechaVenta: timestamp("fecha_venta").notNull(), // fecha del cliente (puede ser offline)
  fechaSync: timestamp("fecha_sync").defaultNow().notNull(), // fecha en que llegó al servidor
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  descuento: decimal("descuento", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  descuentoAplicado: text("descuento_aplicado"), // JSON con info de descuento
  abono: decimal("abono", { precision: 10, scale: 2 }).notNull().default("0"), // monto pagado en esta venta
  tipoPago: varchar("tipo_pago", { length: 20 }).notNull().default("contado"), // contado, credito, parcial
  saldoAnterior: decimal("saldo_anterior", { precision: 12, scale: 2 }).default("0"), // saldo antes de esta venta
  saldoFinal: decimal("saldo_final", { precision: 12, scale: 2 }).default("0"), // saldo después de esta venta
  pagoCliente: decimal("pago_cliente", { precision: 12, scale: 2 }).default("0"), // monto que pagó el cliente
  cambio: decimal("cambio", { precision: 12, scale: 2 }).default("0"), // cambio devuelto al cliente
}, (table) => ({
  clienteTxIdIdx: index("ventas_cliente_tx_id_idx").on(table.clienteTxId),
  rutaIdx: index("ventas_ruta_idx").on(table.rutaId),
  clienteIdx: index("ventas_cliente_idx").on(table.clienteId),
  fechaVentaIdx: index("ventas_fecha_venta_idx").on(table.fechaVenta),
}));

export const insertVentaSchema = createInsertSchema(ventas).omit({ id: true, fechaSync: true });
export type InsertVenta = z.infer<typeof insertVentaSchema>;
export type Venta = typeof ventas.$inferSelect;

// Items de venta
export const ventaItems = pgTable("venta_items", {
  id: serial("id").primaryKey(),
  ventaId: integer("venta_id").references(() => ventas.id).notNull(),
  productoId: integer("producto_id").references(() => productos.id).notNull(),
  cantidad: decimal("cantidad", { precision: 10, scale: 3 }).notNull(),
  piezas: decimal("piezas", { precision: 10, scale: 3 }),
  kilos: decimal("kilos", { precision: 10, scale: 3 }),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  descuentoUnitario: decimal("descuento_unitario", { precision: 10, scale: 2 }).default("0"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  ventaIdx: index("venta_items_venta_idx").on(table.ventaId),
}));

export const insertVentaItemSchema = createInsertSchema(ventaItems).omit({ id: true, ventaId: true });
export type InsertVentaItem = z.infer<typeof insertVentaItemSchema>;
export type InsertVentaItemWithVentaId = z.infer<typeof insertVentaItemSchema> & { ventaId: number };
export type VentaItem = typeof ventaItems.$inferSelect;

// Eventos de sync (para idempotencia y auditoría)
export const syncEvents = pgTable("sync_events", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 100 }).notNull().unique(), // UUID del evento
  usuarioId: integer("usuario_id").references(() => usuarios.id).notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'venta'
  payload: text("payload").notNull(), // JSON del evento
  procesado: boolean("procesado").default(false).notNull(),
  fechaRecepcion: timestamp("fecha_recepcion").defaultNow().notNull(),
  fechaProcesamiento: timestamp("fecha_procesamiento"),
  error: text("error"),
}, (table) => ({
  eventIdIdx: index("sync_events_event_id_idx").on(table.eventId),
  procesadoIdx: index("sync_events_procesado_idx").on(table.procesado),
}));

export const insertSyncEventSchema = createInsertSchema(syncEvents).omit({ id: true, fechaRecepcion: true });
export type InsertSyncEvent = z.infer<typeof insertSyncEventSchema>;
export type SyncEvent = typeof syncEvents.$inferSelect;

// Reglas de descuento (por volumen general o por cliente específico)
// clienteId = NULL significa descuento por volumen para TODOS los clientes
// clienteId = valor significa descuento solo para ese cliente específico
export const discountRules = pgTable("discount_rules", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientes.id), // NULL = aplica a todos
  productoId: integer("producto_id").references(() => productos.id).notNull(),
  tipoDescuento: varchar("tipo_descuento", { length: 20 }).notNull(), // 'PIEZA' | 'KG' | 'MIXTO'
  activo: boolean("activo").default(true).notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
}, (table) => ({
  clienteProductoIdx: index("discount_rules_cliente_producto_idx").on(table.clienteId, table.productoId),
}));

export const insertDiscountRuleSchema = createInsertSchema(discountRules).omit({ id: true, fechaCreacion: true });
export type InsertDiscountRule = z.infer<typeof insertDiscountRuleSchema>;
export type DiscountRule = typeof discountRules.$inferSelect;

// Tiers de descuento (volúmenes)
export const discountTiers = pgTable("discount_tiers", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").references(() => discountRules.id).notNull(),
  volumenDesde: decimal("volumen_desde", { precision: 10, scale: 3 }).notNull(),
  descuentoMonto: decimal("descuento_monto", { precision: 10, scale: 2 }).notNull(), // monto fijo
}, (table) => ({
  ruleIdx: index("discount_tiers_rule_idx").on(table.ruleId),
}));

export const insertDiscountTierSchema = createInsertSchema(discountTiers).omit({ id: true });
export type InsertDiscountTier = z.infer<typeof insertDiscountTierSchema>;
export type DiscountTier = typeof discountTiers.$inferSelect;

// Saldo de clientes (para créditos)
export const saldosClientes = pgTable("saldos_clientes", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientes.id).notNull().unique(),
  saldo: decimal("saldo", { precision: 12, scale: 2 }).notNull().default("0"),
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow().notNull(),
}, (table) => ({
  clienteIdx: index("saldos_clientes_cliente_idx").on(table.clienteId),
}));

export const insertSaldoClienteSchema = createInsertSchema(saldosClientes).omit({ id: true, ultimaActualizacion: true });
export type InsertSaldoCliente = z.infer<typeof insertSaldoClienteSchema>;
export type SaldoCliente = typeof saldosClientes.$inferSelect;

// Abonos (pagos parciales de crédito)
export const abonos = pgTable("abonos", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").references(() => clientes.id).notNull(),
  usuarioId: integer("usuario_id").references(() => usuarios.id).notNull(),
  monto: decimal("monto", { precision: 10, scale: 2 }).notNull(),
  saldoAnterior: decimal("saldo_anterior", { precision: 12, scale: 2 }).notNull(),
  saldoNuevo: decimal("saldo_nuevo", { precision: 12, scale: 2 }).notNull(),
  notas: text("notas"),
  fecha: timestamp("fecha").defaultNow().notNull(),
}, (table) => ({
  clienteIdx: index("abonos_cliente_idx").on(table.clienteId),
  fechaIdx: index("abonos_fecha_idx").on(table.fecha),
}));

export const insertAbonoSchema = createInsertSchema(abonos).omit({ id: true, fecha: true });
export type InsertAbono = z.infer<typeof insertAbonoSchema>;
export type Abono = typeof abonos.$inferSelect;

// Inventario de bodega MIXTO (piezas + kg simultáneos)
export const inventarioBodegaMixto = pgTable("inventario_bodega_mixto", {
  id: serial("id").primaryKey(),
  productoId: integer("producto_id").references(() => productos.id).notNull().unique(),
  cantidadPiezas: decimal("cantidad_piezas", { precision: 10, scale: 0 }).notNull().default("0"),
  cantidadKg: decimal("cantidad_kg", { precision: 10, scale: 3 }).notNull().default("0"),
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow().notNull(),
}, (table) => ({
  productoIdx: index("inventario_bodega_mixto_producto_idx").on(table.productoId),
}));

export const insertInventarioBodegaMixtoSchema = createInsertSchema(inventarioBodegaMixto).omit({ id: true, ultimaActualizacion: true });
export type InsertInventarioBodegaMixto = z.infer<typeof insertInventarioBodegaMixtoSchema>;
export type InventarioBodegaMixto = typeof inventarioBodegaMixto.$inferSelect;

// Inventario de ruta MIXTO (piezas + kg simultáneos)
export const inventarioRutaMixto = pgTable("inventario_ruta_mixto", {
  id: serial("id").primaryKey(),
  rutaId: integer("ruta_id").references(() => rutas.id).notNull(),
  productoId: integer("producto_id").references(() => productos.id).notNull(),
  cantidadPiezas: decimal("cantidad_piezas", { precision: 10, scale: 0 }).notNull().default("0"),
  cantidadKg: decimal("cantidad_kg", { precision: 10, scale: 3 }).notNull().default("0"),
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow().notNull(),
}, (table) => ({
  rutaProductoIdx: index("inventario_ruta_mixto_ruta_producto_idx").on(table.rutaId, table.productoId),
}));

export const insertInventarioRutaMixtoSchema = createInsertSchema(inventarioRutaMixto).omit({ id: true, ultimaActualizacion: true });
export type InsertInventarioRutaMixto = z.infer<typeof insertInventarioRutaMixtoSchema>;
export type InventarioRutaMixto = typeof inventarioRutaMixto.$inferSelect;

// Historial de precios de productos
export const historialPrecios = pgTable("historial_precios", {
  id: serial("id").primaryKey(),
  productoId: integer("producto_id").references(() => productos.id).notNull(),
  precioAnterior: decimal("precio_anterior", { precision: 10, scale: 2 }).notNull(),
  precioNuevo: decimal("precio_nuevo", { precision: 10, scale: 2 }).notNull(),
  usuarioId: integer("usuario_id").references(() => usuarios.id),
  notas: text("notas"),
  fecha: timestamp("fecha").defaultNow().notNull(),
}, (table) => ({
  productoIdx: index("historial_precios_producto_idx").on(table.productoId),
  fechaIdx: index("historial_precios_fecha_idx").on(table.fecha),
}));

export const insertHistorialPrecioSchema = createInsertSchema(historialPrecios).omit({ id: true, fecha: true });
export type InsertHistorialPrecio = z.infer<typeof insertHistorialPrecioSchema>;
export type HistorialPrecio = typeof historialPrecios.$inferSelect;

// Suscripciones Push
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").references(() => usuarios.id).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  usuarioIdx: index("push_subs_usuario_idx").on(table.usuarioId),
  endpointIdx: index("push_subs_endpoint_idx").on(table.endpoint),
}));

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
