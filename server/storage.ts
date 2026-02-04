import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import {
  type Usuario, type InsertUsuario,
  type Ruta, type InsertRuta,
  type Cliente, type InsertCliente,
  type Producto, type InsertProducto,
  type InventarioRuta, type InsertInventarioRuta,
  type InventarioBodega, type InsertInventarioBodega,
  type MovimientoStock, type InsertMovimientoStock,
  type Venta, type InsertVenta,
  type VentaItem, type InsertVentaItem,
  type SyncEvent, type InsertSyncEvent,
  type DiscountRule, type InsertDiscountRule,
  type DiscountTier, type InsertDiscountTier,
  type SaldoCliente, type InsertSaldoCliente,
  type Abono, type InsertAbono,
  type InventarioBodegaMixto, type InsertInventarioBodegaMixto,
  type InventarioRutaMixto, type InsertInventarioRutaMixto,
  usuarios, rutas, clientes, productos, inventarioRuta,
  inventarioBodega, movimientosStock,
  ventas, ventaItems, syncEvents, discountRules, discountTiers,
  saldosClientes, abonos, inventarioBodegaMixto, inventarioRutaMixto
} from "@shared/schema";

export interface IStorage {
  // Usuarios
  getUsuario(id: number): Promise<Usuario | undefined>;
  getUsuarioByUsername(username: string): Promise<Usuario | undefined>;
  createUsuario(usuario: InsertUsuario): Promise<Usuario>;
  getVendedores(): Promise<Usuario[]>;
  updateUsuarioRuta(usuarioId: number, rutaId: number | null): Promise<void>;
  updateUsuarioPassword(usuarioId: number, password: string): Promise<void>;
  updateUsuarioNombre(usuarioId: number, nombre: string): Promise<void>;
  
  // Rutas
  getRuta(id: number): Promise<Ruta | undefined>;
  getRutas(): Promise<Ruta[]>;
  getAllRutas(): Promise<Ruta[]>;
  createRuta(ruta: InsertRuta): Promise<Ruta>;
  updateRuta(id: number, data: Partial<InsertRuta>): Promise<Ruta | undefined>;
  deleteRuta(id: number): Promise<boolean>;
  
  // Clientes
  getAllClientes(): Promise<Cliente[]>;
  getClientesByRuta(rutaId: number): Promise<Cliente[]>;
  getCliente(id: number): Promise<Cliente | undefined>;
  createCliente(cliente: InsertCliente): Promise<Cliente>;
  
  // Productos
  getProductos(): Promise<Producto[]>;
  getProducto(id: number): Promise<Producto | undefined>;
  createProducto(producto: InsertProducto): Promise<Producto>;
  
  // Inventario
  getInventarioByRuta(rutaId: number): Promise<InventarioRuta[]>;
  getInventarioItem(rutaId: number, productoId: number): Promise<InventarioRuta | undefined>;
  updateInventario(rutaId: number, productoId: number, cantidad: string): Promise<void>;
  decrementarInventario(rutaId: number, productoId: number, cantidad: string): Promise<boolean>;
  createInventario(inventario: InsertInventarioRuta): Promise<InventarioRuta>;
  
  // Ventas (transaccional)
  createVentaWithItems(venta: InsertVenta, items: InsertVentaItem[]): Promise<Venta>;
  getVentaByClienteTxId(clienteTxId: string): Promise<Venta | undefined>;
  getVentasByRuta(rutaId: number, limit?: number): Promise<Array<Venta & { items: VentaItem[] }>>;
  getVentasByCliente(clienteId: number, limit?: number): Promise<Array<Venta & { items: VentaItem[] }>>;
  getVentasByVendedor(usuarioId: number, limit?: number): Promise<Array<Venta & { items: VentaItem[] }>>;
  
  // Sync events
  getSyncEvent(eventId: string): Promise<SyncEvent | undefined>;
  createSyncEvent(event: InsertSyncEvent): Promise<SyncEvent>;
  markSyncEventProcessed(eventId: string, error?: string): Promise<void>;
  
  // Descuentos
  getDiscountRules(): Promise<Array<DiscountRule & { tiers: DiscountTier[] }>>;
  getDiscountRule(id: number): Promise<(DiscountRule & { tiers: DiscountTier[] }) | undefined>;
  getDiscountRuleByClienteProducto(clienteId: number, productoId: number): Promise<(DiscountRule & { tiers: DiscountTier[] }) | undefined>;
  createDiscountRule(rule: InsertDiscountRule, tiers: InsertDiscountTier[]): Promise<DiscountRule>;
  deleteDiscountRule(id: number): Promise<void>;
  
  // Bodega
  getInventarioBodega(): Promise<Array<InventarioBodega & { productoNombre: string; productoUnidad: string }>>;
  getInventarioBodegaItem(productoId: number): Promise<InventarioBodega | undefined>;
  updateInventarioBodega(productoId: number, cantidad: string): Promise<void>;
  deleteInventarioBodega(productoId: number): Promise<void>;
  incrementarBodega(productoId: number, cantidad: string): Promise<void>;
  entradaBodegaAtomica(productoId: number, cantidad: string, usuarioId: number, notas?: string): Promise<void>;
  salidaBodegaAtomica(productoId: number, cantidad: string, usuarioId: number, notas?: string): Promise<boolean>;
  decrementarBodega(productoId: number, cantidad: string): Promise<boolean>;
  
  // Movimientos de stock
  getMovimientosStock(limit?: number): Promise<Array<MovimientoStock & { productoNombre: string; rutaNombre?: string; usuarioNombre: string }>>;
  createMovimientoStock(movimiento: InsertMovimientoStock): Promise<MovimientoStock>;
  
  // Transferencia bodega -> ruta
  transferirBodegaARuta(productoId: number, rutaId: number, cantidad: string, usuarioId: number, notas?: string): Promise<boolean>;
  
  // Productos - Editar y eliminar
  updateProducto(id: number, data: Partial<InsertProducto>): Promise<Producto | undefined>;
  deleteProducto(id: number): Promise<boolean>;
  
  // Bodega MIXTO (piezas + kg)
  getInventarioBodegaMixto(): Promise<Array<InventarioBodegaMixto & { productoNombre: string }>>;
  getInventarioBodegaMixtoItem(productoId: number): Promise<InventarioBodegaMixto | undefined>;
  entradaBodegaMixto(productoId: number, piezas: string, kg: string, usuarioId: number, notas?: string): Promise<void>;
  salidaBodegaMixto(productoId: number, piezas: string, kg: string, usuarioId: number, notas?: string): Promise<boolean>;
  updateInventarioBodegaMixto(productoId: number, piezas: string, kg: string): Promise<void>;
  deleteInventarioBodegaMixto(productoId: number): Promise<void>;
  
  // Ruta MIXTO (piezas + kg)
  getInventarioRutaMixto(rutaId: number): Promise<Array<InventarioRutaMixto & { productoNombre: string }>>;
  getInventarioRutaMixtoItem(rutaId: number, productoId: number): Promise<InventarioRutaMixto | undefined>;
  transferirBodegaMixtoARuta(productoId: number, rutaId: number, piezas: string, kg: string, usuarioId: number, notas?: string): Promise<boolean>;
  decrementarInventarioMixto(rutaId: number, productoId: number, piezas: string, kg: string): Promise<boolean>;
  updateInventarioRutaMixtoPiezas(rutaId: number, productoId: number, cantidad: string): Promise<void>;
  updateInventarioRutaMixtoKg(rutaId: number, productoId: number, cantidad: string): Promise<void>;
  
  // Saldos y Créditos
  getSaldoCliente(clienteId: number): Promise<SaldoCliente | undefined>;
  getSaldosClientes(): Promise<Array<SaldoCliente & { clienteNombre: string }>>;
  actualizarSaldoCliente(clienteId: number, nuevoSaldo: string): Promise<void>;
  
  // Abonos
  getAbonosByCliente(clienteId: number, limit?: number): Promise<Array<Abono & { usuarioNombre: string }>>;
  registrarAbono(clienteId: number, monto: string, usuarioId: number, notas?: string): Promise<Abono>;
  
  // Ventas a crédito
  registrarVentaCredito(venta: InsertVenta, items: InsertVentaItem[], montoCredito: string): Promise<Venta>;
}

export class DBStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    // Usa AWS_DATABASE_URL si existe, sino DATABASE_URL
    let dbUrl = process.env.AWS_DATABASE_URL || process.env.DATABASE_URL || '';
    const isExternalDB = dbUrl.includes('amazonaws.com') || dbUrl.includes('rds.') || dbUrl.includes('lightsail');
    
    // Quitar sslmode del URL para manejarlo manualmente
    if (isExternalDB) {
      dbUrl = dbUrl.replace(/[?&]sslmode=[^&]*/g, '');
      console.log('Conectando a base de datos externa (AWS)...');
    }
    
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: isExternalDB ? { rejectUnauthorized: false } : false,
    });
    this.db = drizzle(pool);
  }

  // Usuarios
  async getUsuario(id: number): Promise<Usuario | undefined> {
    const result = await this.db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
    return result[0];
  }

  async getUsuarioByUsername(username: string): Promise<Usuario | undefined> {
    const result = await this.db.select().from(usuarios).where(eq(usuarios.username, username)).limit(1);
    return result[0];
  }

  async createUsuario(usuario: InsertUsuario): Promise<Usuario> {
    const result = await this.db.insert(usuarios).values(usuario).returning();
    return result[0];
  }

  async getVendedores(): Promise<Usuario[]> {
    return await this.db.select().from(usuarios).where(eq(usuarios.rol, "vendedor")).orderBy(usuarios.nombre);
  }

  async updateUsuarioRuta(usuarioId: number, rutaId: number | null): Promise<void> {
    await this.db.update(usuarios).set({ rutaId }).where(eq(usuarios.id, usuarioId));
  }

  async updateUsuarioPassword(usuarioId: number, password: string): Promise<void> {
    await this.db.update(usuarios).set({ password }).where(eq(usuarios.id, usuarioId));
  }

  async updateUsuarioNombre(usuarioId: number, nombre: string): Promise<void> {
    await this.db.update(usuarios).set({ nombre }).where(eq(usuarios.id, usuarioId));
  }

  // Rutas
  async getRuta(id: number): Promise<Ruta | undefined> {
    const result = await this.db.select().from(rutas).where(eq(rutas.id, id)).limit(1);
    return result[0];
  }

  async getRutas(): Promise<Ruta[]> {
    return await this.db.select().from(rutas).where(eq(rutas.activa, true));
  }

  async createRuta(ruta: InsertRuta): Promise<Ruta> {
    const result = await this.db.insert(rutas).values(ruta).returning();
    return result[0];
  }

  async updateRuta(id: number, data: Partial<InsertRuta>): Promise<Ruta | undefined> {
    const result = await this.db.update(rutas).set(data).where(eq(rutas.id, id)).returning();
    return result[0];
  }

  async deleteRuta(id: number): Promise<boolean> {
    const result = await this.db.delete(rutas).where(eq(rutas.id, id)).returning();
    return result.length > 0;
  }

  async getAllRutas(): Promise<Ruta[]> {
    return await this.db.select().from(rutas).orderBy(rutas.id);
  }

  // Clientes
  async getAllClientes(): Promise<Cliente[]> {
    return await this.db.select().from(clientes).where(eq(clientes.activo, true));
  }

  async getClientesByRuta(rutaId: number): Promise<Cliente[]> {
    return await this.db.select().from(clientes).where(
      and(eq(clientes.rutaId, rutaId), eq(clientes.activo, true))
    );
  }

  async getCliente(id: number): Promise<Cliente | undefined> {
    const result = await this.db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
    return result[0];
  }

  async createCliente(cliente: InsertCliente): Promise<Cliente> {
    const result = await this.db.insert(clientes).values(cliente).returning();
    return result[0];
  }

  // Productos
  async getProductos(): Promise<Producto[]> {
    return await this.db.select().from(productos).where(eq(productos.activo, true));
  }

  async getProducto(id: number): Promise<Producto | undefined> {
    const result = await this.db.select().from(productos).where(eq(productos.id, id)).limit(1);
    return result[0];
  }

  async createProducto(producto: InsertProducto): Promise<Producto> {
    const result = await this.db.insert(productos).values(producto).returning();
    return result[0];
  }

  // Inventario
  async getInventarioByRuta(rutaId: number): Promise<InventarioRuta[]> {
    const items = await this.db.select().from(inventarioRuta).where(eq(inventarioRuta.rutaId, rutaId));
    const activeItems = await Promise.all(
      items.map(async (item) => {
        const producto = await this.db.select().from(productos).where(eq(productos.id, item.productoId)).limit(1);
        if (!producto[0] || producto[0].activo === false) {
          return null;
        }
        return item;
      })
    );
    return activeItems.filter((item): item is InventarioRuta => item !== null);
  }

  async getInventarioItem(rutaId: number, productoId: number): Promise<InventarioRuta | undefined> {
    const result = await this.db.select().from(inventarioRuta).where(
      and(eq(inventarioRuta.rutaId, rutaId), eq(inventarioRuta.productoId, productoId))
    ).limit(1);
    return result[0];
  }

  async updateInventario(rutaId: number, productoId: number, cantidad: string): Promise<void> {
    await this.db.update(inventarioRuta)
      .set({ cantidad, ultimaActualizacion: new Date() })
      .where(and(eq(inventarioRuta.rutaId, rutaId), eq(inventarioRuta.productoId, productoId)));
  }

  async decrementarInventario(rutaId: number, productoId: number, cantidad: string): Promise<boolean> {
    const result = await this.db.execute(sql`
      UPDATE ${inventarioRuta}
      SET cantidad = cantidad - ${cantidad},
          ultima_actualizacion = NOW()
      WHERE ruta_id = ${rutaId}
        AND producto_id = ${productoId}
        AND cantidad >= ${cantidad}
      RETURNING *
    `);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createInventario(inventario: InsertInventarioRuta): Promise<InventarioRuta> {
    const result = await this.db.insert(inventarioRuta).values(inventario).returning();
    return result[0];
  }

  // Ventas
  async createVentaWithItems(venta: InsertVenta, items: InsertVentaItem[]): Promise<Venta> {
    return await this.db.transaction(async (tx) => {
      const [ventaCreated] = await tx.insert(ventas).values(venta).returning();
      
      const itemsWithVentaId = items.map(item => ({ ...item, ventaId: ventaCreated.id }));
      await tx.insert(ventaItems).values(itemsWithVentaId);
      
      return ventaCreated;
    });
  }

  async getVentaByClienteTxId(clienteTxId: string): Promise<Venta | undefined> {
    const result = await this.db.select().from(ventas).where(eq(ventas.clienteTxId, clienteTxId)).limit(1);
    return result[0];
  }

  async getVentasByRuta(rutaId: number, limit: number = 100): Promise<Array<Venta & { items: VentaItem[] }>> {
    const ventasResult = await this.db.select().from(ventas)
      .where(eq(ventas.rutaId, rutaId))
      .orderBy(desc(ventas.fechaVenta))
      .limit(limit);
    
    return await this.populateVentaItems(ventasResult);
  }

  async getVentasByCliente(clienteId: number, limit: number = 100): Promise<Array<Venta & { items: VentaItem[] }>> {
    const ventasResult = await this.db.select().from(ventas)
      .where(eq(ventas.clienteId, clienteId))
      .orderBy(desc(ventas.fechaVenta))
      .limit(limit);
    
    return await this.populateVentaItems(ventasResult);
  }

  async getVentasByVendedor(usuarioId: number, limit: number = 100): Promise<Array<Venta & { items: VentaItem[] }>> {
    const ventasResult = await this.db.select().from(ventas)
      .where(eq(ventas.usuarioId, usuarioId))
      .orderBy(desc(ventas.fechaVenta))
      .limit(limit);
    
    return await this.populateVentaItems(ventasResult);
  }

  private async populateVentaItems(ventasResult: Venta[]): Promise<Array<Venta & { items: Array<VentaItem & { productoNombre?: string }>; vendedorNombre?: string }>> {
    // Get all unique producto IDs and usuario IDs
    const usuarioIds = Array.from(new Set(ventasResult.map(v => v.usuarioId).filter(Boolean)));
    const ventaIds = ventasResult.map(v => v.id);
    
    // Batch fetch usuarios
    const usuariosMap: Record<number, string> = {};
    if (usuarioIds.length > 0) {
      const usuariosResult = await this.db.select({ id: usuarios.id, nombre: usuarios.nombre })
        .from(usuarios)
        .where(inArray(usuarios.id, usuarioIds as number[]));
      for (const u of usuariosResult) {
        usuariosMap[u.id] = u.nombre;
      }
    }
    
    // Batch fetch all venta items
    const allItems = ventaIds.length > 0 
      ? await this.db.select().from(ventaItems).where(inArray(ventaItems.ventaId, ventaIds))
      : [];
    
    // Get unique producto IDs from items
    const productoIds = Array.from(new Set(allItems.map(i => i.productoId).filter(Boolean)));
    
    // Batch fetch productos (nombre y unidad)
    const productosMap: Record<number, { nombre: string; unidad: string }> = {};
    if (productoIds.length > 0) {
      const productosResult = await this.db.select({ id: productos.id, nombre: productos.nombre, unidad: productos.unidad })
        .from(productos)
        .where(inArray(productos.id, productoIds as number[]));
      for (const p of productosResult) {
        productosMap[p.id] = { nombre: p.nombre, unidad: p.unidad };
      }
    }
    
    // Group items by venta ID
    const itemsByVentaId: Record<number, Array<VentaItem & { productoNombre?: string; productoUnidad?: string }>> = {};
    for (const item of allItems) {
      if (!itemsByVentaId[item.ventaId]) {
        itemsByVentaId[item.ventaId] = [];
      }
      const prod = productosMap[item.productoId];
      itemsByVentaId[item.ventaId].push({
        ...item,
        productoNombre: prod?.nombre || `Producto ${item.productoId}`,
        productoUnidad: prod?.unidad || "PIEZA",
      });
    }
    
    return ventasResult.map(venta => ({
      ...venta,
      vendedorNombre: usuariosMap[venta.usuarioId] || "",
      items: itemsByVentaId[venta.id] || [],
    }));
  }

  // Sync events
  async getSyncEvent(eventId: string): Promise<SyncEvent | undefined> {
    const result = await this.db.select().from(syncEvents).where(eq(syncEvents.eventId, eventId)).limit(1);
    return result[0];
  }

  async createSyncEvent(event: InsertSyncEvent): Promise<SyncEvent> {
    const result = await this.db.insert(syncEvents).values(event).returning();
    return result[0];
  }

  async markSyncEventProcessed(eventId: string, error?: string): Promise<void> {
    await this.db.update(syncEvents)
      .set({ 
        procesado: true, 
        fechaProcesamiento: new Date(),
        error: error || null 
      })
      .where(eq(syncEvents.eventId, eventId));
  }

  // Descuentos
  async getDiscountRules(): Promise<Array<DiscountRule & { tiers: DiscountTier[]; clienteNombre?: string; productoNombre?: string }>> {
    const rules = await this.db.select().from(discountRules).where(eq(discountRules.activo, true));
    
    const rulesWithTiers = await Promise.all(
      rules.map(async (rule) => {
        const tiers = await this.db.select().from(discountTiers)
          .where(eq(discountTiers.ruleId, rule.id))
          .orderBy(discountTiers.volumenDesde);
        
        // Get cliente name if exists
        let clienteNombre: string | undefined;
        if (rule.clienteId) {
          const cliente = await this.db.select().from(clientes).where(eq(clientes.id, rule.clienteId)).limit(1);
          clienteNombre = cliente[0]?.nombre;
        }
        
        // Get producto name
        const producto = await this.db.select().from(productos).where(eq(productos.id, rule.productoId)).limit(1);
        const productoNombre = producto[0]?.nombre;
        
        return { ...rule, tiers, clienteNombre, productoNombre };
      })
    );
    
    return rulesWithTiers;
  }

  async getDiscountRule(id: number): Promise<(DiscountRule & { tiers: DiscountTier[] }) | undefined> {
    const result = await this.db.select().from(discountRules).where(eq(discountRules.id, id)).limit(1);
    if (!result[0]) return undefined;
    
    const tiers = await this.db.select().from(discountTiers)
      .where(eq(discountTiers.ruleId, id))
      .orderBy(discountTiers.volumenDesde);
    
    return { ...result[0], tiers };
  }

  async getDiscountRuleByClienteProducto(clienteId: number, productoId: number): Promise<(DiscountRule & { tiers: DiscountTier[] }) | undefined> {
    const result = await this.db.select().from(discountRules).where(
      and(
        eq(discountRules.clienteId, clienteId),
        eq(discountRules.productoId, productoId),
        eq(discountRules.activo, true)
      )
    ).limit(1);
    
    if (!result[0]) return undefined;
    
    const tiers = await this.db.select().from(discountTiers)
      .where(eq(discountTiers.ruleId, result[0].id))
      .orderBy(discountTiers.volumenDesde);
    
    return { ...result[0], tiers };
  }

  async createDiscountRule(rule: InsertDiscountRule, tiers: InsertDiscountTier[]): Promise<DiscountRule> {
    return await this.db.transaction(async (tx) => {
      const [ruleCreated] = await tx.insert(discountRules).values(rule).returning();
      
      const tiersWithRuleId = tiers.map(tier => ({ ...tier, ruleId: ruleCreated.id }));
      await tx.insert(discountTiers).values(tiersWithRuleId);
      
      return ruleCreated;
    });
  }

  async deleteDiscountRule(id: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(discountTiers).where(eq(discountTiers.ruleId, id));
      await tx.delete(discountRules).where(eq(discountRules.id, id));
    });
  }

  // Bodega
  async getInventarioBodega(): Promise<Array<InventarioBodega & { productoNombre: string; productoUnidad: string }>> {
    const items = await this.db.select().from(inventarioBodega);
    
    const itemsWithProducto = await Promise.all(
      items.map(async (item) => {
        const producto = await this.db.select().from(productos).where(eq(productos.id, item.productoId)).limit(1);
        if (!producto[0] || producto[0].activo === false) {
          return null;
        }
        return { 
          ...item, 
          productoNombre: producto[0].nombre,
          productoUnidad: producto[0].unidad || 'PIEZA'
        };
      })
    );
    
    return itemsWithProducto.filter((item): item is NonNullable<typeof item> => item !== null);
  }
  
  async deleteInventarioBodega(productoId: number): Promise<void> {
    await this.db.delete(inventarioBodega).where(eq(inventarioBodega.productoId, productoId));
  }

  async getInventarioBodegaItem(productoId: number): Promise<InventarioBodega | undefined> {
    const result = await this.db.select().from(inventarioBodega).where(eq(inventarioBodega.productoId, productoId)).limit(1);
    return result[0];
  }

  async updateInventarioBodega(productoId: number, cantidad: string): Promise<void> {
    const existing = await this.getInventarioBodegaItem(productoId);
    if (existing) {
      await this.db.update(inventarioBodega)
        .set({ cantidad, ultimaActualizacion: new Date() })
        .where(eq(inventarioBodega.productoId, productoId));
    } else {
      await this.db.insert(inventarioBodega).values({ productoId, cantidad });
    }
  }

  async incrementarBodega(productoId: number, cantidad: string): Promise<void> {
    const existing = await this.getInventarioBodegaItem(productoId);
    if (existing) {
      const newCantidad = parseFloat(existing.cantidad) + parseFloat(cantidad);
      await this.db.update(inventarioBodega)
        .set({ cantidad: newCantidad.toFixed(3), ultimaActualizacion: new Date() })
        .where(eq(inventarioBodega.productoId, productoId));
    } else {
      await this.db.insert(inventarioBodega).values({ productoId, cantidad });
    }
  }

  // Entrada a bodega atómica (incrementa stock + registra movimiento)
  async entradaBodegaAtomica(productoId: number, cantidad: string, usuarioId: number, notas?: string): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Incrementar stock de bodega
      const existing = await tx.select().from(inventarioBodega).where(eq(inventarioBodega.productoId, productoId)).limit(1);
      if (existing[0]) {
        const newCantidad = parseFloat(existing[0].cantidad) + parseFloat(cantidad);
        await tx.update(inventarioBodega)
          .set({ cantidad: newCantidad.toFixed(3), ultimaActualizacion: new Date() })
          .where(eq(inventarioBodega.productoId, productoId));
      } else {
        await tx.insert(inventarioBodega).values({ productoId, cantidad });
      }
      
      // Registrar movimiento
      await tx.insert(movimientosStock).values({
        tipo: 'ENTRADA_BODEGA',
        productoId,
        cantidad,
        rutaId: null,
        usuarioId,
        notas: notas || 'Entrada a bodega',
      });
    });
  }

  // Salida de bodega atómica (decrementa stock + registra movimiento)
  async salidaBodegaAtomica(productoId: number, cantidad: string, usuarioId: number, notas?: string): Promise<boolean> {
    return await this.db.transaction(async (tx) => {
      // Verificar y decrementar stock de bodega
      const existing = await tx.select().from(inventarioBodega).where(eq(inventarioBodega.productoId, productoId)).limit(1);
      if (!existing[0]) return false;
      
      const currentQty = parseFloat(existing[0].cantidad);
      const decrementQty = parseFloat(cantidad);
      
      if (currentQty < decrementQty) return false;
      
      const newCantidad = currentQty - decrementQty;
      await tx.update(inventarioBodega)
        .set({ cantidad: newCantidad.toFixed(3), ultimaActualizacion: new Date() })
        .where(eq(inventarioBodega.productoId, productoId));
      
      // Registrar movimiento
      await tx.insert(movimientosStock).values({
        tipo: 'SALIDA_BODEGA',
        productoId,
        cantidad,
        rutaId: null,
        usuarioId,
        notas: notas || 'Salida de bodega',
      });
      
      return true;
    });
  }

  async decrementarBodega(productoId: number, cantidad: string): Promise<boolean> {
    const existing = await this.getInventarioBodegaItem(productoId);
    if (!existing) return false;
    
    const currentQty = parseFloat(existing.cantidad);
    const decrementQty = parseFloat(cantidad);
    
    if (currentQty < decrementQty) return false;
    
    const newCantidad = currentQty - decrementQty;
    await this.db.update(inventarioBodega)
      .set({ cantidad: newCantidad.toFixed(3), ultimaActualizacion: new Date() })
      .where(eq(inventarioBodega.productoId, productoId));
    
    return true;
  }

  // Movimientos de stock
  async getMovimientosStock(limit: number = 100): Promise<Array<MovimientoStock & { productoNombre: string; rutaNombre?: string; usuarioNombre: string }>> {
    const movimientos = await this.db.select().from(movimientosStock).orderBy(desc(movimientosStock.fecha)).limit(limit);
    
    const movimientosConDetalles = await Promise.all(
      movimientos.map(async (mov) => {
        const producto = await this.db.select().from(productos).where(eq(productos.id, mov.productoId)).limit(1);
        const usuario = await this.db.select().from(usuarios).where(eq(usuarios.id, mov.usuarioId)).limit(1);
        let rutaNombre: string | undefined;
        if (mov.rutaId) {
          const ruta = await this.db.select().from(rutas).where(eq(rutas.id, mov.rutaId)).limit(1);
          rutaNombre = ruta[0]?.nombre;
        }
        return {
          ...mov,
          productoNombre: producto[0]?.nombre || `Producto #${mov.productoId}`,
          rutaNombre,
          usuarioNombre: usuario[0]?.nombre || `Usuario #${mov.usuarioId}`,
        };
      })
    );
    
    return movimientosConDetalles;
  }

  async createMovimientoStock(movimiento: InsertMovimientoStock): Promise<MovimientoStock> {
    const result = await this.db.insert(movimientosStock).values(movimiento).returning();
    return result[0];
  }

  // Transferencia bodega -> ruta
  async transferirBodegaARuta(productoId: number, rutaId: number, cantidad: string, usuarioId: number, notas?: string): Promise<boolean> {
    return await this.db.transaction(async (tx) => {
      // Verificar stock en bodega
      const bodegaItem = await tx.select().from(inventarioBodega).where(eq(inventarioBodega.productoId, productoId)).limit(1);
      if (!bodegaItem[0] || parseFloat(bodegaItem[0].cantidad) < parseFloat(cantidad)) {
        return false;
      }
      
      // Decrementar bodega
      const newBodegaCantidad = parseFloat(bodegaItem[0].cantidad) - parseFloat(cantidad);
      await tx.update(inventarioBodega)
        .set({ cantidad: newBodegaCantidad.toFixed(3), ultimaActualizacion: new Date() })
        .where(eq(inventarioBodega.productoId, productoId));
      
      // Incrementar inventario de ruta
      const rutaItem = await tx.select().from(inventarioRuta)
        .where(and(eq(inventarioRuta.rutaId, rutaId), eq(inventarioRuta.productoId, productoId)))
        .limit(1);
      
      if (rutaItem[0]) {
        const newRutaCantidad = parseFloat(rutaItem[0].cantidad) + parseFloat(cantidad);
        await tx.update(inventarioRuta)
          .set({ cantidad: newRutaCantidad.toFixed(3), ultimaActualizacion: new Date() })
          .where(and(eq(inventarioRuta.rutaId, rutaId), eq(inventarioRuta.productoId, productoId)));
      } else {
        await tx.insert(inventarioRuta).values({ rutaId, productoId, cantidad });
      }
      
      // Registrar movimiento
      await tx.insert(movimientosStock).values({
        tipo: 'SALIDA_RUTA',
        productoId,
        cantidad,
        rutaId,
        usuarioId,
        notas: notas || `Transferencia a ruta`,
      });
      
      return true;
    });
  }

  // Productos - Editar y eliminar
  async updateProducto(id: number, data: Partial<InsertProducto>): Promise<Producto | undefined> {
    const result = await this.db.update(productos)
      .set(data)
      .where(eq(productos.id, id))
      .returning();
    return result[0];
  }

  async deleteProducto(id: number): Promise<boolean> {
    const result = await this.db.update(productos)
      .set({ activo: false })
      .where(eq(productos.id, id))
      .returning();
    return result.length > 0;
  }

  // Bodega MIXTO (piezas + kg)
  async getInventarioBodegaMixto(): Promise<Array<InventarioBodegaMixto & { productoNombre: string }>> {
    const items = await this.db.select().from(inventarioBodegaMixto);
    const itemsConNombre = await Promise.all(
      items.map(async (item) => {
        const producto = await this.db.select().from(productos).where(eq(productos.id, item.productoId)).limit(1);
        if (!producto[0] || producto[0].activo === false) {
          return null;
        }
        return {
          ...item,
          productoNombre: producto[0].nombre,
        };
      })
    );
    return itemsConNombre.filter((item): item is NonNullable<typeof item> => item !== null);
  }

  async entradaBodegaMixto(productoId: number, piezas: string, kg: string, usuarioId: number, notas?: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const existing = await tx.select().from(inventarioBodegaMixto)
        .where(eq(inventarioBodegaMixto.productoId, productoId)).limit(1);
      
      if (existing[0]) {
        const newPiezas = parseInt(existing[0].cantidadPiezas || "0") + parseInt(piezas || "0");
        const newKg = parseFloat(existing[0].cantidadKg || "0") + parseFloat(kg || "0");
        await tx.update(inventarioBodegaMixto)
          .set({
            cantidadPiezas: newPiezas.toString(),
            cantidadKg: newKg.toFixed(3),
            ultimaActualizacion: new Date(),
          })
          .where(eq(inventarioBodegaMixto.productoId, productoId));
      } else {
        await tx.insert(inventarioBodegaMixto).values({
          productoId,
          cantidadPiezas: piezas || "0",
          cantidadKg: kg || "0",
        });
      }
      
      // Registrar movimiento
      await tx.insert(movimientosStock).values({
        tipo: 'ENTRADA_BODEGA_MIXTO',
        productoId,
        cantidad: kg || "0",
        usuarioId,
        notas: notas || `Entrada MIXTO: ${piezas} pzs + ${kg} kg`,
      });
    });
  }

  async salidaBodegaMixto(productoId: number, piezas: string, kg: string, usuarioId: number, notas?: string): Promise<boolean> {
    return await this.db.transaction(async (tx) => {
      const existing = await tx.select().from(inventarioBodegaMixto)
        .where(eq(inventarioBodegaMixto.productoId, productoId)).limit(1);
      
      if (!existing[0]) return false;
      
      const currentPiezas = parseInt(existing[0].cantidadPiezas || "0");
      const currentKg = parseFloat(existing[0].cantidadKg || "0");
      const retiroPiezas = parseInt(piezas || "0");
      const retiroKg = parseFloat(kg || "0");
      
      if (currentPiezas < retiroPiezas || currentKg < retiroKg) {
        return false;
      }
      
      await tx.update(inventarioBodegaMixto)
        .set({
          cantidadPiezas: (currentPiezas - retiroPiezas).toString(),
          cantidadKg: (currentKg - retiroKg).toFixed(3),
          ultimaActualizacion: new Date(),
        })
        .where(eq(inventarioBodegaMixto.productoId, productoId));
      
      // Registrar movimiento
      await tx.insert(movimientosStock).values({
        tipo: 'SALIDA_BODEGA_MIXTO',
        productoId,
        cantidad: kg || "0",
        usuarioId,
        notas: notas || `Salida MIXTO: ${piezas} pzs + ${kg} kg`,
      });
      
      return true;
    });
  }

  // Ruta MIXTO
  async getInventarioRutaMixto(rutaId: number): Promise<Array<InventarioRutaMixto & { productoNombre: string }>> {
    const items = await this.db.select().from(inventarioRutaMixto)
      .where(eq(inventarioRutaMixto.rutaId, rutaId));
    const itemsConNombre = await Promise.all(
      items.map(async (item) => {
        const producto = await this.db.select().from(productos).where(eq(productos.id, item.productoId)).limit(1);
        if (!producto[0] || producto[0].activo === false) {
          return null;
        }
        return {
          ...item,
          productoNombre: producto[0].nombre,
        };
      })
    );
    return itemsConNombre.filter((item): item is NonNullable<typeof item> => item !== null);
  }

  async getInventarioBodegaMixtoItem(productoId: number): Promise<InventarioBodegaMixto | undefined> {
    const result = await this.db.select().from(inventarioBodegaMixto)
      .where(eq(inventarioBodegaMixto.productoId, productoId)).limit(1);
    return result[0];
  }

  async updateInventarioBodegaMixto(productoId: number, piezas: string, kg: string): Promise<void> {
    const existing = await this.getInventarioBodegaMixtoItem(productoId);
    if (existing) {
      await this.db.update(inventarioBodegaMixto)
        .set({
          cantidadPiezas: piezas,
          cantidadKg: kg,
          ultimaActualizacion: new Date(),
        })
        .where(eq(inventarioBodegaMixto.productoId, productoId));
    } else {
      await this.db.insert(inventarioBodegaMixto).values({
        productoId,
        cantidadPiezas: piezas,
        cantidadKg: kg,
      });
    }
  }

  async deleteInventarioBodegaMixto(productoId: number): Promise<void> {
    await this.db.delete(inventarioBodegaMixto).where(eq(inventarioBodegaMixto.productoId, productoId));
  }

  async getInventarioRutaMixtoItem(rutaId: number, productoId: number): Promise<InventarioRutaMixto | undefined> {
    const result = await this.db.select().from(inventarioRutaMixto)
      .where(and(eq(inventarioRutaMixto.rutaId, rutaId), eq(inventarioRutaMixto.productoId, productoId))).limit(1);
    return result[0];
  }

  async decrementarInventarioMixto(rutaId: number, productoId: number, piezas: string, kg: string): Promise<boolean> {
    const decrementPiezas = parseInt(piezas) || 0;
    const decrementKg = parseFloat(kg) || 0;
    
    if (decrementPiezas <= 0 && decrementKg <= 0) {
      return false;
    }
    
    const item = await this.db.select().from(inventarioRutaMixto)
      .where(and(eq(inventarioRutaMixto.rutaId, rutaId), eq(inventarioRutaMixto.productoId, productoId)))
      .limit(1);
    
    if (!item[0]) {
      return false;
    }
    
    const currentPiezas = parseInt(item[0].cantidadPiezas) || 0;
    const currentKg = parseFloat(item[0].cantidadKg) || 0;
    
    // Validar stock suficiente
    if (decrementPiezas > 0 && currentPiezas < decrementPiezas) {
      return false;
    }
    if (decrementKg > 0 && currentKg < decrementKg) {
      return false;
    }
    
    const newPiezas = currentPiezas - decrementPiezas;
    const newKg = currentKg - decrementKg;
    
    await this.db.update(inventarioRutaMixto)
      .set({
        cantidadPiezas: newPiezas.toString(),
        cantidadKg: newKg.toFixed(3),
        ultimaActualizacion: new Date(),
      })
      .where(and(eq(inventarioRutaMixto.rutaId, rutaId), eq(inventarioRutaMixto.productoId, productoId)));
    
    return true;
  }

  async updateInventarioRutaMixtoPiezas(rutaId: number, productoId: number, cantidad: string): Promise<void> {
    const existing = await this.db.select().from(inventarioRutaMixto)
      .where(and(eq(inventarioRutaMixto.rutaId, rutaId), eq(inventarioRutaMixto.productoId, productoId)))
      .limit(1);
    
    if (existing[0]) {
      await this.db.update(inventarioRutaMixto)
        .set({ cantidadPiezas: cantidad, ultimaActualizacion: new Date() })
        .where(and(eq(inventarioRutaMixto.rutaId, rutaId), eq(inventarioRutaMixto.productoId, productoId)));
    } else {
      await this.db.insert(inventarioRutaMixto).values({
        rutaId,
        productoId,
        cantidadPiezas: cantidad,
        cantidadKg: "0",
        ultimaActualizacion: new Date(),
      });
    }
  }

  async updateInventarioRutaMixtoKg(rutaId: number, productoId: number, cantidad: string): Promise<void> {
    const existing = await this.db.select().from(inventarioRutaMixto)
      .where(and(eq(inventarioRutaMixto.rutaId, rutaId), eq(inventarioRutaMixto.productoId, productoId)))
      .limit(1);
    
    if (existing[0]) {
      await this.db.update(inventarioRutaMixto)
        .set({ cantidadKg: cantidad, ultimaActualizacion: new Date() })
        .where(and(eq(inventarioRutaMixto.rutaId, rutaId), eq(inventarioRutaMixto.productoId, productoId)));
    } else {
      await this.db.insert(inventarioRutaMixto).values({
        rutaId,
        productoId,
        cantidadPiezas: "0",
        cantidadKg: cantidad,
        ultimaActualizacion: new Date(),
      });
    }
  }

  async transferirBodegaMixtoARuta(productoId: number, rutaId: number, piezas: string, kg: string, usuarioId: number, notas?: string): Promise<boolean> {
    return await this.db.transaction(async (tx) => {
      const transferPiezas = parseInt(piezas) || 0;
      const transferKg = parseFloat(kg) || 0;
      
      if (transferPiezas <= 0 && transferKg <= 0) {
        return false;
      }
      
      // Verificar stock en bodega mixto
      const bodegaItem = await tx.select().from(inventarioBodegaMixto)
        .where(eq(inventarioBodegaMixto.productoId, productoId)).limit(1);
      
      if (!bodegaItem[0]) {
        return false;
      }
      
      const currentPiezas = parseInt(bodegaItem[0].cantidadPiezas) || 0;
      const currentKg = parseFloat(bodegaItem[0].cantidadKg) || 0;
      
      if (transferPiezas > currentPiezas || transferKg > currentKg) {
        return false; // Stock insuficiente
      }
      
      // Decrementar bodega mixto
      await tx.update(inventarioBodegaMixto)
        .set({
          cantidadPiezas: (currentPiezas - transferPiezas).toString(),
          cantidadKg: (currentKg - transferKg).toFixed(3),
          ultimaActualizacion: new Date(),
        })
        .where(eq(inventarioBodegaMixto.productoId, productoId));
      
      // Incrementar inventario de ruta mixto
      const rutaItem = await tx.select().from(inventarioRutaMixto)
        .where(and(eq(inventarioRutaMixto.rutaId, rutaId), eq(inventarioRutaMixto.productoId, productoId)))
        .limit(1);
      
      if (rutaItem[0]) {
        const newPiezas = (parseInt(rutaItem[0].cantidadPiezas) || 0) + transferPiezas;
        const newKg = (parseFloat(rutaItem[0].cantidadKg) || 0) + transferKg;
        await tx.update(inventarioRutaMixto)
          .set({
            cantidadPiezas: newPiezas.toString(),
            cantidadKg: newKg.toFixed(3),
            ultimaActualizacion: new Date(),
          })
          .where(and(eq(inventarioRutaMixto.rutaId, rutaId), eq(inventarioRutaMixto.productoId, productoId)));
      } else {
        await tx.insert(inventarioRutaMixto).values({
          rutaId,
          productoId,
          cantidadPiezas: transferPiezas.toString(),
          cantidadKg: transferKg.toFixed(3),
        });
      }
      
      // Registrar movimiento
      await tx.insert(movimientosStock).values({
        tipo: 'SALIDA_RUTA_MIXTO',
        productoId,
        cantidad: kg || "0",
        rutaId,
        usuarioId,
        notas: notas || `Mover a Ruta MIXTO: ${piezas} pzs + ${kg} kg`,
      });
      
      return true;
    });
  }

  // Saldos y Créditos
  async getSaldoCliente(clienteId: number): Promise<SaldoCliente | undefined> {
    const result = await this.db.select().from(saldosClientes)
      .where(eq(saldosClientes.clienteId, clienteId)).limit(1);
    return result[0];
  }

  async getSaldosClientes(): Promise<Array<SaldoCliente & { clienteNombre: string }>> {
    const saldos = await this.db.select().from(saldosClientes);
    const saldosConNombre = await Promise.all(
      saldos.map(async (s) => {
        const cliente = await this.db.select().from(clientes).where(eq(clientes.id, s.clienteId)).limit(1);
        return {
          ...s,
          clienteNombre: cliente[0]?.nombre || `Cliente #${s.clienteId}`,
        };
      })
    );
    return saldosConNombre;
  }

  async actualizarSaldoCliente(clienteId: number, nuevoSaldo: string): Promise<void> {
    const existing = await this.db.select().from(saldosClientes)
      .where(eq(saldosClientes.clienteId, clienteId)).limit(1);
    
    if (existing[0]) {
      await this.db.update(saldosClientes)
        .set({ saldo: nuevoSaldo, ultimaActualizacion: new Date() })
        .where(eq(saldosClientes.clienteId, clienteId));
    } else {
      await this.db.insert(saldosClientes).values({ clienteId, saldo: nuevoSaldo });
    }
  }

  // Abonos
  async getAbonosByCliente(clienteId: number, limit: number = 50): Promise<Array<Abono & { usuarioNombre: string }>> {
    const abonosResult = await this.db.select().from(abonos)
      .where(eq(abonos.clienteId, clienteId))
      .orderBy(desc(abonos.fecha))
      .limit(limit);
    
    const abonosConNombre = await Promise.all(
      abonosResult.map(async (a) => {
        const usuario = await this.db.select().from(usuarios).where(eq(usuarios.id, a.usuarioId)).limit(1);
        return {
          ...a,
          usuarioNombre: usuario[0]?.nombre || `Usuario #${a.usuarioId}`,
        };
      })
    );
    return abonosConNombre;
  }

  async registrarAbono(clienteId: number, monto: string, usuarioId: number, notas?: string): Promise<Abono> {
    return await this.db.transaction(async (tx) => {
      // Obtener saldo actual
      const saldoActual = await tx.select().from(saldosClientes)
        .where(eq(saldosClientes.clienteId, clienteId)).limit(1);
      
      const saldoAnterior = saldoActual[0]?.saldo || "0";
      const nuevoSaldo = (parseFloat(saldoAnterior) - parseFloat(monto)).toFixed(2);
      
      // Actualizar saldo
      if (saldoActual[0]) {
        await tx.update(saldosClientes)
          .set({ saldo: nuevoSaldo, ultimaActualizacion: new Date() })
          .where(eq(saldosClientes.clienteId, clienteId));
      } else {
        await tx.insert(saldosClientes).values({ clienteId, saldo: nuevoSaldo });
      }
      
      // Registrar abono
      const [abono] = await tx.insert(abonos).values({
        clienteId,
        usuarioId,
        monto,
        saldoAnterior,
        saldoNuevo: nuevoSaldo,
        notas,
      }).returning();
      
      return abono;
    });
  }

  // Atomic inventory update with movement logging
  async updateInventarioWithMovement(params: {
    rutaId: number;
    productoId: number;
    cantidad: string;
    tipo: "piezas" | "kg" | "mixto_piezas" | "mixto_kg";
    usuarioId: number;
    username: string;
    notas?: string;
  }): Promise<void> {
    const { rutaId, productoId, cantidad, tipo, usuarioId, username, notas } = params;
    
    await this.db.transaction(async (tx) => {
      // Get current inventory for comparison
      let cantidadAnterior = "0";
      
      if (tipo === "mixto_piezas" || tipo === "mixto_kg") {
        const [currentMixto] = await tx.select().from(inventarioRutaMixto)
          .where(and(
            eq(inventarioRutaMixto.rutaId, rutaId),
            eq(inventarioRutaMixto.productoId, productoId)
          )).limit(1);
        cantidadAnterior = tipo === "mixto_piezas" 
          ? (currentMixto?.cantidadPiezas || "0") 
          : (currentMixto?.cantidadKg || "0");
      } else {
        const [current] = await tx.select().from(inventarioRuta)
          .where(and(
            eq(inventarioRuta.rutaId, rutaId),
            eq(inventarioRuta.productoId, productoId)
          )).limit(1);
        cantidadAnterior = current?.cantidad || "0";
      }
      
      // Update inventory within transaction
      if (tipo === "mixto_piezas") {
        const [existing] = await tx.select().from(inventarioRutaMixto)
          .where(and(
            eq(inventarioRutaMixto.rutaId, rutaId),
            eq(inventarioRutaMixto.productoId, productoId)
          )).limit(1);
        if (existing) {
          await tx.update(inventarioRutaMixto)
            .set({ cantidadPiezas: cantidad, ultimaActualizacion: new Date() })
            .where(and(
              eq(inventarioRutaMixto.rutaId, rutaId),
              eq(inventarioRutaMixto.productoId, productoId)
            ));
        } else {
          await tx.insert(inventarioRutaMixto).values({
            rutaId, productoId, cantidadPiezas: cantidad, cantidadKg: "0"
          });
        }
      } else if (tipo === "mixto_kg") {
        const [existing] = await tx.select().from(inventarioRutaMixto)
          .where(and(
            eq(inventarioRutaMixto.rutaId, rutaId),
            eq(inventarioRutaMixto.productoId, productoId)
          )).limit(1);
        if (existing) {
          await tx.update(inventarioRutaMixto)
            .set({ cantidadKg: cantidad, ultimaActualizacion: new Date() })
            .where(and(
              eq(inventarioRutaMixto.rutaId, rutaId),
              eq(inventarioRutaMixto.productoId, productoId)
            ));
        } else {
          await tx.insert(inventarioRutaMixto).values({
            rutaId, productoId, cantidadPiezas: "0", cantidadKg: cantidad
          });
        }
      } else {
        const [existing] = await tx.select().from(inventarioRuta)
          .where(and(
            eq(inventarioRuta.rutaId, rutaId),
            eq(inventarioRuta.productoId, productoId)
          )).limit(1);
        if (existing) {
          await tx.update(inventarioRuta)
            .set({ cantidad, ultimaActualizacion: new Date() })
            .where(and(
              eq(inventarioRuta.rutaId, rutaId),
              eq(inventarioRuta.productoId, productoId)
            ));
        } else {
          await tx.insert(inventarioRuta).values({ rutaId, productoId, cantidad });
        }
      }
      
      // Log movement within same transaction
      const cantidadNum = parseFloat(cantidad);
      const diferencia = cantidadNum - parseFloat(cantidadAnterior);
      const tipoMovimiento = diferencia >= 0 ? "ajuste_entrada" : "ajuste_salida";
      
      await tx.insert(movimientosStock).values({
        productoId,
        rutaId,
        usuarioId,
        tipo: tipoMovimiento,
        cantidad: Math.abs(diferencia).toString(),
        notas: notas || `Ajuste de inventario por ${username}: ${cantidadAnterior} -> ${cantidad}`,
      });
    });
  }

  // Ventas a crédito
  async registrarVentaCredito(venta: InsertVenta, items: InsertVentaItem[], montoCredito: string): Promise<Venta> {
    return await this.db.transaction(async (tx) => {
      // Crear la venta
      const [ventaCreated] = await tx.insert(ventas).values(venta).returning();
      
      const itemsWithVentaId = items.map(item => ({ ...item, ventaId: ventaCreated.id }));
      await tx.insert(ventaItems).values(itemsWithVentaId);
      
      // Actualizar saldo del cliente (agregar crédito)
      const saldoActual = await tx.select().from(saldosClientes)
        .where(eq(saldosClientes.clienteId, venta.clienteId)).limit(1);
      
      const saldoAnterior = saldoActual[0]?.saldo || "0";
      const nuevoSaldo = (parseFloat(saldoAnterior) + parseFloat(montoCredito)).toFixed(2);
      
      if (saldoActual[0]) {
        await tx.update(saldosClientes)
          .set({ saldo: nuevoSaldo, ultimaActualizacion: new Date() })
          .where(eq(saldosClientes.clienteId, venta.clienteId));
      } else {
        await tx.insert(saldosClientes).values({ clienteId: venta.clienteId, saldo: nuevoSaldo });
      }
      
      return ventaCreated;
    });
  }
}

export const storage = new DBStorage();
