import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertVentaSchema, insertVentaItemSchema, insertSyncEventSchema, insertDiscountRuleSchema, insertDiscountTierSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";

// Auth middleware
interface AuthRequest extends Request {
  usuario?: {
    id: number;
    username: string;
    rol: string;
    rutaId: number | null;
  };
}

async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const usuario = await storage.getUsuario(decoded.id);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: "Usuario inválido" });
    }

    req.usuario = {
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
      rutaId: usuario.rutaId,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Role middleware
function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "No autorizado para esta acción" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== HEALTH CHECK =====
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ===== AUTH =====
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Usuario y contraseña requeridos" });
      }

      const usuario = await storage.getUsuarioByUsername(username);
      if (!usuario || !usuario.activo) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const valid = await bcrypt.compare(password, usuario.password);
      if (!valid) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const token = jwt.sign(
        { id: usuario.id, username: usuario.username, rol: usuario.rol },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

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

  // ===== BOOTSTRAP (vendedor descarga datos iniciales) =====
  app.get("/api/me/bootstrap", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      // Vendedores solo pueden acceder a su ruta
      if (usuario.rol === "vendedor" && !usuario.rutaId) {
        return res.status(400).json({ error: "Vendedor sin ruta asignada" });
      }

      const rutaId = usuario.rutaId!;
      
      const [clientes, productos, inventario, inventarioMixto, ruta] = await Promise.all([
        storage.getClientesByRuta(rutaId),
        storage.getProductos(),
        storage.getInventarioByRuta(rutaId),
        storage.getInventarioRutaMixto(rutaId),
        storage.getRuta(rutaId),
      ]);

      res.json({
        usuario: {
          id: usuario.id,
          username: usuario.username,
          nombre: usuario.username,
          rol: usuario.rol,
          rutaId: usuario.rutaId,
        },
        ruta,
        clientes,
        productos,
        inventario,
        inventarioMixto,
      });
    } catch (error) {
      console.error("Bootstrap error:", error);
      res.status(500).json({ error: "Error cargando datos" });
    }
  });

  // ===== SYNC PUSH (vendedor sube ventas offline) =====
  const syncVentaSchema = z.object({
    clienteTxId: z.string(),
    usuarioId: z.number(),
    clienteId: z.number(),
    rutaId: z.number(),
    fechaVenta: z.union([z.date(), z.string()]).transform(val => 
      typeof val === 'string' ? new Date(val) : val
    ),
    subtotal: z.string(),
    descuento: z.string().optional().default("0"),
    total: z.string(),
    descuentoAplicado: z.string().nullable().optional(),
  });
  
  const syncPushSchema = z.object({
    events: z.array(z.object({
      eventId: z.string(),
      tipo: z.literal("venta"),
      venta: syncVentaSchema,
      items: z.array(insertVentaItemSchema),
      abono: z.number().min(0).optional().default(0),
    })),
  });

  app.post("/api/sync/push", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      const body = syncPushSchema.parse(req.body);
      
      const results = [];
      
      for (const event of body.events) {
        // Verificar idempotencia
        const existingEvent = await storage.getSyncEvent(event.eventId);
        if (existingEvent) {
          results.push({
            eventId: event.eventId,
            status: existingEvent.procesado ? "already_processed" : "processing",
            ventaId: existingEvent.procesado ? JSON.parse(existingEvent.payload).ventaId : null,
          });
          continue;
        }

        // Registrar evento
        await storage.createSyncEvent({
          eventId: event.eventId,
          usuarioId: usuario.id,
          tipo: "venta",
          payload: JSON.stringify({ venta: event.venta, items: event.items }),
          procesado: false,
        });

        try {
          // Verificar venta duplicada por clienteTxId
          const existingVenta = await storage.getVentaByClienteTxId(event.venta.clienteTxId);
          if (existingVenta) {
            await storage.markSyncEventProcessed(event.eventId);
            results.push({
              eventId: event.eventId,
              status: "duplicate",
              ventaId: existingVenta.id,
            });
            continue;
          }

          // Validar y decrementar inventario (bloqueo de stock negativo)
          for (const item of event.items) {
            // Obtener info del producto para saber si es MIXTO
            const producto = await storage.getProducto(item.productoId);
            if (!producto) {
              throw new Error(`Producto ${item.productoId} no encontrado`);
            }
            
            if (producto.unidad === "MIXTO") {
              // Para productos MIXTOS, validar inventario MIXTO
              const inventarioMixto = await storage.getInventarioRutaMixtoItem(event.venta.rutaId, item.productoId);
              if (!inventarioMixto) {
                throw new Error(`Producto MIXTO ${item.productoId} no encontrado en inventario`);
              }
              
              // Leer piezas y kilos del item (enviados por el frontend)
              const cantidadPiezas = parseInt((item as any).piezas || "0") || 0;
              const cantidadKg = parseFloat((item as any).kilos || "0") || 0;
              const cantidadActualPiezas = parseInt(inventarioMixto.cantidadPiezas) || 0;
              const cantidadActualKg = parseFloat(inventarioMixto.cantidadKg) || 0;
              
              // Validar stock suficiente para piezas
              if (cantidadPiezas > 0 && cantidadActualPiezas < cantidadPiezas) {
                throw new Error(`Stock insuficiente de piezas para producto MIXTO ${item.productoId}. Disponible: ${cantidadActualPiezas} pz, solicitado: ${cantidadPiezas} pz`);
              }
              
              // Validar stock suficiente para kilos
              if (cantidadKg > 0 && cantidadActualKg < cantidadKg) {
                throw new Error(`Stock insuficiente de kg para producto MIXTO ${item.productoId}. Disponible: ${cantidadActualKg} kg, solicitado: ${cantidadKg} kg`);
              }
              
              // Decrementar inventario MIXTO (piezas y/o kilos)
              if (cantidadPiezas > 0 || cantidadKg > 0) {
                const success = await storage.decrementarInventarioMixto(
                  event.venta.rutaId,
                  item.productoId,
                  cantidadPiezas.toString(),
                  cantidadKg.toString()
                );
                if (!success) {
                  throw new Error(`Error decrementando inventario MIXTO del producto ${item.productoId}`);
                }
              }
            } else {
              // Producto normal (PIEZA o KG)
              const inventarioItem = await storage.getInventarioItem(event.venta.rutaId, item.productoId);
              if (!inventarioItem) {
                throw new Error(`Producto ${item.productoId} no encontrado en inventario`);
              }
              
              const cantidadActual = parseFloat(inventarioItem.cantidad);
              const cantidadVenta = parseFloat(item.cantidad);
              
              if (cantidadActual < cantidadVenta) {
                throw new Error(`Stock insuficiente para producto ${item.productoId}. Disponible: ${cantidadActual}, solicitado: ${cantidadVenta}`);
              }
              
              // Decrementar inventario normal
              const success = await storage.decrementarInventario(
                event.venta.rutaId,
                item.productoId,
                item.cantidad
              );
              if (!success) {
                throw new Error(`Error decrementando inventario del producto ${item.productoId}`);
              }
            }
          }

          // Calcular tipo de pago
          const totalVenta = parseFloat(event.venta.total);
          const abonoCliente = event.abono || 0;
          const creditoNuevo = totalVenta - abonoCliente;
          
          // Determinar tipo de pago
          let tipoPago = "contado";
          if (abonoCliente === 0) {
            tipoPago = "credito"; // No pagó nada, todo a crédito
          } else if (abonoCliente < totalVenta) {
            tipoPago = "parcial"; // Pagó una parte
          }
          // Si abonoCliente >= totalVenta, es contado
          
          // Agregar abono y tipoPago a la venta
          const ventaConPago = {
            ...event.venta,
            abono: abonoCliente.toFixed(2),
            tipoPago,
          };
          
          const ventaCreated = await storage.createVentaWithItems(ventaConPago, event.items);
          
          if (creditoNuevo > 0) {
            // Actualizar saldo del cliente (incrementar crédito)
            const saldoActual = await storage.getSaldoCliente(event.venta.clienteId);
            const saldoAnterior = saldoActual ? parseFloat(saldoActual.saldo) : 0;
            const nuevoSaldo = saldoAnterior + creditoNuevo;
            await storage.actualizarSaldoCliente(event.venta.clienteId, nuevoSaldo.toFixed(2));
          } else if (abonoCliente > totalVenta) {
            // El cliente pagó más que el total (posiblemente abonando a créditos anteriores)
            const excedente = abonoCliente - totalVenta;
            const saldoActual = await storage.getSaldoCliente(event.venta.clienteId);
            const saldoAnterior = saldoActual ? parseFloat(saldoActual.saldo) : 0;
            const nuevoSaldo = Math.max(0, saldoAnterior - excedente);
            await storage.actualizarSaldoCliente(event.venta.clienteId, nuevoSaldo.toFixed(2));
          }
          
          await storage.markSyncEventProcessed(event.eventId);
          
          // Obtener saldo final para retornar al cliente
          const saldoFinal = await storage.getSaldoCliente(event.venta.clienteId);
          
          results.push({
            eventId: event.eventId,
            status: "success",
            ventaId: ventaCreated.id,
            saldoFinal: saldoFinal?.saldo || "0",
          });
        } catch (error: any) {
          await storage.markSyncEventProcessed(event.eventId, error.message);
          results.push({
            eventId: event.eventId,
            status: "error",
            error: error.message,
          });
        }
      }

      res.json({ results });
    } catch (error: any) {
      console.error("Sync push error:", error);
      res.status(400).json({ error: error.message || "Error procesando sync" });
    }
  });

  // ===== HISTORIAL DE VENTAS =====
  app.get("/api/ventas", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      const { rutaId, clienteId, limit } = req.query;
      
      const parsedLimit = limit ? parseInt(limit as string) : 100;

      let ventas;
      
      if (usuario.rol === "vendedor") {
        // Vendedores solo ven sus propias ventas
        ventas = await storage.getVentasByVendedor(usuario.id, parsedLimit);
      } else if (rutaId) {
        // Auditor/admin filtran por ruta
        ventas = await storage.getVentasByRuta(parseInt(rutaId as string), parsedLimit);
      } else if (clienteId) {
        // Filtrar por cliente
        ventas = await storage.getVentasByCliente(parseInt(clienteId as string), parsedLimit);
      } else {
        // Por defecto, vendedor ve sus ventas, admin/auditor necesitan especificar
        if (usuario.rol === "admin" || usuario.rol === "auditor") {
          return res.status(400).json({ error: "Especifique rutaId o clienteId" });
        }
        ventas = await storage.getVentasByVendedor(usuario.id, parsedLimit);
      }

      res.json({ ventas });
    } catch (error) {
      console.error("Ventas error:", error);
      res.status(500).json({ error: "Error obteniendo ventas" });
    }
  });

  // ===== DESCUENTOS =====
  app.get("/api/descuentos", authMiddleware, async (req, res) => {
    try {
      const rules = await storage.getDiscountRules();
      res.json({ rules });
    } catch (error) {
      console.error("Get descuentos error:", error);
      res.status(500).json({ error: "Error obteniendo descuentos" });
    }
  });

  app.post("/api/descuentos", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { clienteId, productoId, tipoDescuento, tiers } = req.body;
      
      // productoId, tipoDescuento y tiers son requeridos
      // clienteId es opcional: NULL = descuento por volumen para todos, valor = solo para ese cliente
      if (!productoId || !tipoDescuento || !tiers || !Array.isArray(tiers)) {
        return res.status(400).json({ error: "Datos inválidos: productoId, tipoDescuento y tiers son requeridos" });
      }

      const rule = await storage.createDiscountRule(
        { 
          clienteId: clienteId ? parseInt(clienteId) : null, 
          productoId: parseInt(productoId), 
          tipoDescuento, 
          activo: true 
        },
        tiers
      );
      
      res.json({ rule });
    } catch (error) {
      console.error("Create descuento error:", error);
      res.status(500).json({ error: "Error creando descuento" });
    }
  });

  app.delete("/api/descuentos/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      await storage.deleteDiscountRule(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete descuento error:", error);
      res.status(500).json({ error: "Error eliminando descuento" });
    }
  });

  // ===== USUARIOS (admin) =====
  app.get("/api/usuarios/vendedores", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const vendedores = await storage.getVendedores();
      res.json({ vendedores });
    } catch (error) {
      console.error("Get vendedores error:", error);
      res.status(500).json({ error: "Error obteniendo vendedores" });
    }
  });

  app.put("/api/usuarios/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      const { nombre, password } = req.body;
      
      if (nombre) {
        await storage.updateUsuarioNombre(id, nombre);
      }
      if (password) {
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash(password, 10);
        await storage.updateUsuarioPassword(id, hashedPassword);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Update usuario error:", error);
      res.status(500).json({ error: "Error actualizando usuario" });
    }
  });

  // ===== RUTAS (para admin/auditor) =====
  app.get("/api/rutas", authMiddleware, requireRole("admin", "auditor"), async (req, res) => {
    try {
      const { all } = req.query;
      const rutas = all === "true" ? await storage.getAllRutas() : await storage.getRutas();
      res.json({ rutas });
    } catch (error) {
      console.error("Get rutas error:", error);
      res.status(500).json({ error: "Error obteniendo rutas" });
    }
  });

  app.post("/api/rutas", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { nombre, descripcion, vendedorId, vendedorNombre, vendedorPassword } = req.body;
      if (!nombre) {
        return res.status(400).json({ error: "Nombre es requerido" });
      }
      const ruta = await storage.createRuta({ nombre, descripcion, activa: true });
      
      if (vendedorId) {
        await storage.updateUsuarioRuta(vendedorId, ruta.id);
        
        if (vendedorNombre) {
          await storage.updateUsuarioNombre(vendedorId, vendedorNombre);
        }
        if (vendedorPassword) {
          const bcrypt = await import("bcryptjs");
          const hashedPassword = await bcrypt.hash(vendedorPassword, 10);
          await storage.updateUsuarioPassword(vendedorId, hashedPassword);
        }
      }
      
      res.json({ ruta });
    } catch (error) {
      console.error("Create ruta error:", error);
      res.status(500).json({ error: "Error creando ruta" });
    }
  });

  app.put("/api/rutas/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      const { nombre, descripcion, activa, vendedorId, vendedorNombre, vendedorPassword } = req.body;
      
      if (nombre || descripcion !== undefined || activa !== undefined) {
        const updateData: any = {};
        if (nombre) updateData.nombre = nombre;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (activa !== undefined) updateData.activa = activa;
        await storage.updateRuta(id, updateData);
      }
      
      if (vendedorId !== undefined) {
        const vendedoresActuales = await storage.getVendedores();
        const vendedorAnterior = vendedoresActuales.find(v => v.rutaId === id);
        if (vendedorAnterior && vendedorAnterior.id !== vendedorId) {
          await storage.updateUsuarioRuta(vendedorAnterior.id, null);
        }
        if (vendedorId) {
          await storage.updateUsuarioRuta(vendedorId, id);
          
          if (vendedorNombre) {
            await storage.updateUsuarioNombre(vendedorId, vendedorNombre);
          }
          if (vendedorPassword) {
            const bcrypt = await import("bcryptjs");
            const hashedPassword = await bcrypt.hash(vendedorPassword, 10);
            await storage.updateUsuarioPassword(vendedorId, hashedPassword);
          }
        }
      }
      
      const ruta = await storage.getRuta(id);
      res.json({ ruta });
    } catch (error) {
      console.error("Update ruta error:", error);
      res.status(500).json({ error: "Error actualizando ruta" });
    }
  });

  app.delete("/api/rutas/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      const deleted = await storage.deleteRuta(id);
      if (!deleted) {
        return res.status(404).json({ error: "Ruta no encontrada" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete ruta error:", error);
      res.status(500).json({ error: "Error eliminando ruta" });
    }
  });

  // ===== CLIENTES (para consulta rápida) =====
  app.get("/api/clientes", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      const { rutaId, all } = req.query;
      
      // Admin/auditor can get all clients with all=true
      if (all === "true" && (usuario.rol === "admin" || usuario.rol === "auditor")) {
        const clientes = await storage.getAllClientes();
        return res.json({ clientes });
      }
      
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
      
      // Agregar saldo a cada cliente
      const clientesConSaldo = await Promise.all(clientes.map(async (cliente) => {
        const saldoData = await storage.getSaldoCliente(cliente.id);
        return {
          ...cliente,
          saldo: saldoData?.saldo || "0",
        };
      }));
      res.json({ clientes: clientesConSaldo });
    } catch (error) {
      console.error("Get clientes error:", error);
      res.status(500).json({ error: "Error obteniendo clientes" });
    }
  });

  // Obtener todos los clientes (admin only)
  app.get("/api/clientes/todos", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const clientes = await storage.getAllClientes();
      res.json({ clientes });
    } catch (error) {
      console.error("Get all clientes error:", error);
      res.status(500).json({ error: "Error obteniendo clientes" });
    }
  });

  // Crear cliente (admin only)
  const createClienteSchema = z.object({
    nombre: z.string().min(1, "Nombre requerido"),
    rutaId: z.number().int().positive("Ruta requerida"),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
  });

  app.post("/api/clientes", authMiddleware, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
      const parsed = createClienteSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Datos inválidos" });
      }
      
      const cliente = await storage.createCliente({
        nombre: parsed.data.nombre,
        rutaId: parsed.data.rutaId,
        direccion: parsed.data.direccion || null,
        telefono: parsed.data.telefono || null,
        activo: true,
      });
      
      res.json({ cliente });
    } catch (error) {
      console.error("Create cliente error:", error);
      res.status(500).json({ error: "Error creando cliente" });
    }
  });

  // ===== BODEGA (admin/auditor) =====
  app.get("/api/bodega", authMiddleware, requireRole("admin", "auditor"), async (req, res) => {
    try {
      const inventario = await storage.getInventarioBodega();
      res.json({ inventario });
    } catch (error) {
      console.error("Get bodega error:", error);
      res.status(500).json({ error: "Error obteniendo inventario de bodega" });
    }
  });

  // Entrada a bodega (incrementar stock) - Operación atómica
  const entradaBodegaSchema = z.object({
    productoId: z.number().int().positive(),
    cantidad: z.number().positive(),
    notas: z.string().optional(),
  });

  app.post("/api/bodega/entrada", authMiddleware, requireRole("admin", "auditor"), async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      const parsed = entradaBodegaSchema.safeParse({
        productoId: req.body.productoId ? parseInt(req.body.productoId) : undefined,
        cantidad: req.body.cantidad ? parseFloat(req.body.cantidad) : undefined,
        notas: req.body.notas,
      });
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos: productoId y cantidad son requeridos" });
      }
      
      const { productoId, cantidad, notas } = parsed.data;
      
      // Operación atómica: incrementa stock + registra movimiento
      await storage.entradaBodegaAtomica(
        productoId,
        cantidad.toFixed(3),
        usuario.id,
        notas
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Entrada bodega error:", error);
      res.status(500).json({ error: "Error registrando entrada a bodega" });
    }
  });

  // Salida de bodega (decrementar stock) - Operación atómica
  app.post("/api/bodega/salida", authMiddleware, requireRole("admin", "auditor"), async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      const parsed = entradaBodegaSchema.safeParse({
        productoId: req.body.productoId ? parseInt(req.body.productoId) : undefined,
        cantidad: req.body.cantidad ? parseFloat(req.body.cantidad) : undefined,
        notas: req.body.notas,
      });
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos: productoId y cantidad son requeridos" });
      }
      
      const { productoId, cantidad, notas } = parsed.data;
      
      // Operación atómica: decrementa stock + registra movimiento
      const success = await storage.salidaBodegaAtomica(
        productoId,
        cantidad.toFixed(3),
        usuario.id,
        notas
      );
      
      if (!success) {
        return res.status(400).json({ error: "Stock insuficiente en bodega" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Salida bodega error:", error);
      res.status(500).json({ error: "Error registrando salida de bodega" });
    }
  });

  // Modificar stock de bodega directamente (sin registrar movimiento)
  app.put("/api/bodega/:productoId", authMiddleware, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
      const productoId = parseInt(req.params.productoId as string);
      const cantidadParsed = Number(req.body.cantidad);
      
      if (isNaN(productoId) || !Number.isFinite(cantidadParsed) || cantidadParsed < 0) {
        return res.status(400).json({ error: "Datos inválidos" });
      }
      
      await storage.updateInventarioBodega(productoId, cantidadParsed.toFixed(3));
      res.json({ success: true });
    } catch (error) {
      console.error("Update bodega error:", error);
      res.status(500).json({ error: "Error actualizando stock de bodega" });
    }
  });

  // Eliminar producto de bodega
  app.delete("/api/bodega/:productoId", authMiddleware, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
      const productoId = parseInt(req.params.productoId as string);
      
      if (isNaN(productoId)) {
        return res.status(400).json({ error: "ID de producto inválido" });
      }
      
      await storage.deleteInventarioBodega(productoId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete bodega error:", error);
      res.status(500).json({ error: "Error eliminando producto de bodega" });
    }
  });

  // Mover stock de bodega a ruta - Operación atómica (transferirBodegaARuta ya usa transacción)
  const moverARutaSchema = z.object({
    productoId: z.number().int().positive(),
    rutaId: z.number().int().positive(),
    cantidad: z.number().positive(),
    notas: z.string().optional(),
  });

  app.post("/api/bodega/mover-a-ruta", authMiddleware, requireRole("admin", "auditor"), async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      const parsed = moverARutaSchema.safeParse({
        productoId: req.body.productoId ? parseInt(req.body.productoId) : undefined,
        rutaId: req.body.rutaId ? parseInt(req.body.rutaId) : undefined,
        cantidad: req.body.cantidad ? parseFloat(req.body.cantidad) : undefined,
        notas: req.body.notas,
      });
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos: productoId, rutaId y cantidad son requeridos" });
      }
      
      const { productoId, rutaId, cantidad, notas } = parsed.data;
      
      const success = await storage.transferirBodegaARuta(
        productoId,
        rutaId,
        cantidad.toFixed(3),
        usuario.id,
        notas
      );
      
      if (!success) {
        return res.status(400).json({ error: "Stock insuficiente en bodega" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Mover a ruta error:", error);
      res.status(500).json({ error: "Error moviendo stock a ruta" });
    }
  });

  // ===== MOVIMIENTOS DE STOCK (historial) =====
  app.get("/api/movimientos", authMiddleware, requireRole("admin", "auditor"), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const movimientos = await storage.getMovimientosStock(limit);
      res.json({ movimientos });
    } catch (error) {
      console.error("Get movimientos error:", error);
      res.status(500).json({ error: "Error obteniendo movimientos" });
    }
  });

  // ===== PRODUCTOS (admin para crear nuevos) =====
  app.get("/api/productos", authMiddleware, async (req, res) => {
    try {
      const productos = await storage.getProductos();
      res.json({ productos });
    } catch (error) {
      console.error("Get productos error:", error);
      res.status(500).json({ error: "Error obteniendo productos" });
    }
  });

  app.post("/api/productos", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { nombre, precio, unidad } = req.body;
      
      if (!nombre || !precio || !unidad) {
        return res.status(400).json({ error: "nombre, precio y unidad son requeridos" });
      }
      
      if (!['PIEZA', 'KG', 'MIXTO'].includes(unidad)) {
        return res.status(400).json({ error: "unidad debe ser PIEZA, KG o MIXTO" });
      }
      
      const producto = await storage.createProducto({
        nombre,
        precio: parseFloat(precio).toFixed(2),
        unidad,
        activo: true,
      });
      
      res.json({ producto });
    } catch (error) {
      console.error("Create producto error:", error);
      res.status(500).json({ error: "Error creando producto" });
    }
  });

  // Editar producto
  app.put("/api/productos/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { nombre, precio, unidad } = req.body;
      
      const updates: any = {};
      if (nombre) updates.nombre = nombre;
      if (precio) updates.precio = parseFloat(precio).toFixed(2);
      if (unidad && ['PIEZA', 'KG', 'MIXTO'].includes(unidad)) updates.unidad = unidad;
      
      const producto = await storage.updateProducto(id, updates);
      if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      
      res.json({ producto });
    } catch (error) {
      console.error("Update producto error:", error);
      res.status(500).json({ error: "Error actualizando producto" });
    }
  });

  // Eliminar producto (soft delete)
  app.delete("/api/productos/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const success = await storage.deleteProducto(id);
      
      if (!success) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete producto error:", error);
      res.status(500).json({ error: "Error eliminando producto" });
    }
  });

  // ===== BODEGA MIXTO (piezas + kg) =====
  app.get("/api/bodega/mixto", authMiddleware, requireRole("admin", "auditor"), async (req, res) => {
    try {
      const inventario = await storage.getInventarioBodegaMixto();
      res.json({ inventario });
    } catch (error) {
      console.error("Get bodega mixto error:", error);
      res.status(500).json({ error: "Error obteniendo inventario mixto" });
    }
  });

  // Entrada a bodega MIXTO
  const entradaBodegaMixtoSchema = z.object({
    productoId: z.number().int().positive(),
    piezas: z.number().min(0).default(0),
    kg: z.number().min(0).default(0),
    notas: z.string().optional(),
  });

  app.post("/api/bodega/entrada-mixto", authMiddleware, requireRole("admin", "auditor"), async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      const parsed = entradaBodegaMixtoSchema.safeParse({
        productoId: req.body.productoId ? parseInt(req.body.productoId) : undefined,
        piezas: req.body.piezas ? parseFloat(req.body.piezas) : 0,
        kg: req.body.kg ? parseFloat(req.body.kg) : 0,
        notas: req.body.notas,
      });
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos" });
      }
      
      const { productoId, piezas, kg, notas } = parsed.data;
      
      if (piezas <= 0 && kg <= 0) {
        return res.status(400).json({ error: "Debe ingresar al menos piezas o kg" });
      }
      
      await storage.entradaBodegaMixto(
        productoId,
        piezas.toString(),
        kg.toFixed(3),
        usuario.id,
        notas
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Entrada bodega mixto error:", error);
      res.status(500).json({ error: "Error registrando entrada mixto" });
    }
  });

  // Salida de bodega MIXTO
  app.post("/api/bodega/salida-mixto", authMiddleware, requireRole("admin", "auditor"), async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      const parsed = entradaBodegaMixtoSchema.safeParse({
        productoId: req.body.productoId ? parseInt(req.body.productoId) : undefined,
        piezas: req.body.piezas ? parseFloat(req.body.piezas) : 0,
        kg: req.body.kg ? parseFloat(req.body.kg) : 0,
        notas: req.body.notas,
      });
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos" });
      }
      
      const { productoId, piezas, kg, notas } = parsed.data;
      
      const success = await storage.salidaBodegaMixto(
        productoId,
        piezas.toString(),
        kg.toFixed(3),
        usuario.id,
        notas
      );
      
      if (!success) {
        return res.status(400).json({ error: "Stock insuficiente" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Salida bodega mixto error:", error);
      res.status(500).json({ error: "Error registrando salida mixto" });
    }
  });

  // Actualizar stock MIXTO en bodega (PUT)
  app.put("/api/bodega/mixto/:productoId", authMiddleware, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
      const productoId = parseInt(req.params.productoId as string);
      const piezas = parseInt(req.body.piezas) || 0;
      const kg = parseFloat(req.body.kg) || 0;
      
      if (isNaN(productoId)) {
        return res.status(400).json({ error: "ID de producto inválido" });
      }
      
      await storage.updateInventarioBodegaMixto(productoId, piezas.toString(), kg.toFixed(3));
      res.json({ success: true });
    } catch (error) {
      console.error("Update bodega mixto error:", error);
      res.status(500).json({ error: "Error actualizando stock mixto" });
    }
  });

  // Eliminar producto MIXTO de bodega (DELETE)
  app.delete("/api/bodega/mixto/:productoId", authMiddleware, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
      const productoId = parseInt(req.params.productoId as string);
      
      if (isNaN(productoId)) {
        return res.status(400).json({ error: "ID de producto inválido" });
      }
      
      await storage.deleteInventarioBodegaMixto(productoId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete bodega mixto error:", error);
      res.status(500).json({ error: "Error eliminando producto mixto de bodega" });
    }
  });

  // Mover stock MIXTO de bodega a ruta
  const moverMixtoARutaSchema = z.object({
    productoId: z.number().int().positive(),
    rutaId: z.number().int().positive(),
    piezas: z.number().min(0),
    kg: z.number().min(0),
    notas: z.string().optional(),
  });

  app.post("/api/bodega/mover-mixto-a-ruta", authMiddleware, requireRole("admin", "auditor"), async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      const parsed = moverMixtoARutaSchema.safeParse({
        productoId: req.body.productoId ? parseInt(req.body.productoId) : undefined,
        rutaId: req.body.rutaId ? parseInt(req.body.rutaId) : undefined,
        piezas: req.body.piezas ? parseFloat(req.body.piezas) : 0,
        kg: req.body.kg ? parseFloat(req.body.kg) : 0,
        notas: req.body.notas,
      });
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos" });
      }
      
      const { productoId, rutaId, piezas, kg, notas } = parsed.data;
      
      if (piezas <= 0 && kg <= 0) {
        return res.status(400).json({ error: "Debe especificar al menos piezas o kg" });
      }
      
      const success = await storage.transferirBodegaMixtoARuta(
        productoId,
        rutaId,
        piezas.toString(),
        kg.toFixed(3),
        usuario.id,
        notas
      );
      
      if (!success) {
        return res.status(400).json({ error: "Stock insuficiente en bodega" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Mover mixto a ruta error:", error);
      res.status(500).json({ error: "Error moviendo stock mixto a ruta" });
    }
  });

  // Obtener inventario MIXTO de ruta
  app.get("/api/ruta/:rutaId/mixto", authMiddleware, requireRole("admin", "auditor", "vendedor"), async (req: AuthRequest, res) => {
    try {
      const rutaId = parseInt(req.params.rutaId as string);
      const inventario = await storage.getInventarioRutaMixto(rutaId);
      res.json({ inventario });
    } catch (error) {
      console.error("Get inventario ruta mixto error:", error);
      res.status(500).json({ error: "Error obteniendo inventario mixto de ruta" });
    }
  });

  // ===== SALDOS Y CRÉDITOS =====
  app.get("/api/saldos", authMiddleware, requireRole("admin", "auditor", "vendedor"), async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      if (usuario.rol === "vendedor") {
        // Vendedor solo ve saldos de su ruta
        const clientes = await storage.getClientesByRuta(usuario.rutaId!);
        const saldosPromises = clientes.map(async (c) => {
          const saldo = await storage.getSaldoCliente(c.id);
          return {
            clienteId: c.id,
            clienteNombre: c.nombre,
            saldo: saldo?.saldo || "0",
          };
        });
        const saldos = await Promise.all(saldosPromises);
        res.json({ saldos });
      } else {
        // Admin/auditor ve todos los saldos
        const saldos = await storage.getSaldosClientes();
        res.json({ saldos });
      }
    } catch (error) {
      console.error("Get saldos error:", error);
      res.status(500).json({ error: "Error obteniendo saldos" });
    }
  });

  app.get("/api/saldos/:clienteId", authMiddleware, async (req, res) => {
    try {
      const clienteId = parseInt(req.params.clienteId as string);
      const saldo = await storage.getSaldoCliente(clienteId);
      res.json({ saldo: saldo?.saldo || "0" });
    } catch (error) {
      console.error("Get saldo cliente error:", error);
      res.status(500).json({ error: "Error obteniendo saldo" });
    }
  });

  // ===== ABONOS =====
  const abonoSchema = z.object({
    clienteId: z.number().int().positive(),
    monto: z.number().positive(),
    notas: z.string().optional(),
  });

  app.get("/api/abonos/:clienteId", authMiddleware, async (req, res) => {
    try {
      const clienteId = parseInt(req.params.clienteId as string);
      const abonos = await storage.getAbonosByCliente(clienteId);
      res.json({ abonos });
    } catch (error) {
      console.error("Get abonos error:", error);
      res.status(500).json({ error: "Error obteniendo abonos" });
    }
  });

  app.post("/api/abonos", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const usuario = req.usuario!;
      
      const parsed = abonoSchema.safeParse({
        clienteId: req.body.clienteId ? parseInt(req.body.clienteId) : undefined,
        monto: req.body.monto ? parseFloat(req.body.monto) : undefined,
        notas: req.body.notas,
      });
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Datos inválidos: clienteId y monto son requeridos" });
      }
      
      const { clienteId, monto, notas } = parsed.data;
      
      const abono = await storage.registrarAbono(
        clienteId,
        monto.toFixed(2),
        usuario.id,
        notas
      );
      
      res.json({ abono });
    } catch (error) {
      console.error("Registrar abono error:", error);
      res.status(500).json({ error: "Error registrando abono" });
    }
  });

  return httpServer;
}
