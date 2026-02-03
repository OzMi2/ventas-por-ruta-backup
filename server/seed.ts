import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Crear rutas
    const ruta1 = await storage.createRuta({
      nombre: "Ruta Centro",
      descripcion: "Zona centro de la ciudad",
      activa: true,
    });

    const ruta2 = await storage.createRuta({
      nombre: "Ruta Norte",
      descripcion: "Zona norte",
      activa: true,
    });

    console.log("✓ Rutas creadas");

    // Crear usuarios
    const hashedPassword = await bcrypt.hash("1234", 10);

    const vendedor1 = await storage.createUsuario({
      username: "vendedor1",
      password: hashedPassword,
      nombre: "Juan Pérez",
      rol: "vendedor",
      rutaId: ruta1.id,
      activo: true,
    });

    const vendedor2 = await storage.createUsuario({
      username: "vendedor2",
      password: hashedPassword,
      nombre: "María García",
      rol: "vendedor",
      rutaId: ruta2.id,
      activo: true,
    });

    const auditor = await storage.createUsuario({
      username: "auditor",
      password: hashedPassword,
      nombre: "Carlos Auditor",
      rol: "auditor",
      rutaId: null,
      activo: true,
    });

    const admin = await storage.createUsuario({
      username: "admin",
      password: hashedPassword,
      nombre: "Admin Sistema",
      rol: "admin",
      rutaId: null,
      activo: true,
    });

    console.log("✓ Usuarios creados (password: 1234)");

    // Crear clientes para ruta 1
    const clientes1 = await Promise.all([
      storage.createCliente({
        nombre: "Tienda La Esquina",
        direccion: "Av. Principal 123",
        telefono: "5551234567",
        rutaId: ruta1.id,
        activo: true,
      }),
      storage.createCliente({
        nombre: "Abarrotes Don José",
        direccion: "Calle 5 de Mayo 45",
        telefono: "5559876543",
        rutaId: ruta1.id,
        activo: true,
      }),
      storage.createCliente({
        nombre: "Supermercado El Ahorro",
        direccion: "Blvd. Juárez 789",
        telefono: "5555555555",
        rutaId: ruta1.id,
        activo: true,
      }),
    ]);

    // Crear clientes para ruta 2
    const clientes2 = await Promise.all([
      storage.createCliente({
        nombre: "Tienda Lupita",
        direccion: "Calzada Norte 234",
        telefono: "5552223333",
        rutaId: ruta2.id,
        activo: true,
      }),
      storage.createCliente({
        nombre: "Minisuper El Sol",
        direccion: "Av. Reforma 567",
        telefono: "5554445555",
        rutaId: ruta2.id,
        activo: true,
      }),
    ]);

    console.log("✓ Clientes creados");

    // Crear productos
    const productos = await Promise.all([
      storage.createProducto({
        nombre: "Pan Blanco Grande",
        precio: "35.00",
        unidad: "PIEZA",
        activo: true,
      }),
      storage.createProducto({
        nombre: "Pan Integral",
        precio: "42.00",
        unidad: "PIEZA",
        activo: true,
      }),
      storage.createProducto({
        nombre: "Bolillo",
        precio: "2.50",
        unidad: "PIEZA",
        activo: true,
      }),
      storage.createProducto({
        nombre: "Harina para Pastel",
        precio: "85.00",
        unidad: "KG",
        activo: true,
      }),
      storage.createProducto({
        nombre: "Azúcar Refinada",
        precio: "45.00",
        unidad: "KG",
        activo: true,
      }),
    ]);

    console.log("✓ Productos creados");

    // Crear inventario para ruta 1
    await Promise.all(
      productos.map((producto) =>
        storage.createInventario({
          rutaId: ruta1.id,
          productoId: producto.id,
          cantidad: "100.000",
        })
      )
    );

    // Crear inventario para ruta 2
    await Promise.all(
      productos.map((producto) =>
        storage.createInventario({
          rutaId: ruta2.id,
          productoId: producto.id,
          cantidad: "150.000",
        })
      )
    );

    console.log("✓ Inventario creado");

    // Crear reglas de descuento (cliente + producto + volumen)
    // Descuento para cliente 1 (Tienda La Esquina) en Pan Blanco Grande
    await storage.createDiscountRule(
      {
        clienteId: clientes1[0].id,
        productoId: productos[0].id, // Pan Blanco Grande
        tipoDescuento: "PIEZA",
        activo: true,
      },
      [
        { volumenDesde: "10.000", descuentoMonto: "1.00", ruleId: 0 },
        { volumenDesde: "20.000", descuentoMonto: "2.00", ruleId: 0 },
        { volumenDesde: "50.000", descuentoMonto: "3.00", ruleId: 0 },
      ]
    );

    // Descuento para cliente 2 (Abarrotes Don José) en Harina para Pastel
    await storage.createDiscountRule(
      {
        clienteId: clientes1[1].id,
        productoId: productos[3].id, // Harina para Pastel
        tipoDescuento: "KG",
        activo: true,
      },
      [
        { volumenDesde: "5.000", descuentoMonto: "2.00", ruleId: 0 },
        { volumenDesde: "10.000", descuentoMonto: "5.00", ruleId: 0 },
        { volumenDesde: "25.000", descuentoMonto: "10.00", ruleId: 0 },
      ]
    );

    console.log("✓ Reglas de descuento creadas (por cliente + producto)");

    console.log("\n✅ Seed completado!");
    console.log("\nCredenciales de prueba (password: 1234):");
    console.log("  - username: vendedor1 (Ruta Centro)");
    console.log("  - username: vendedor2 (Ruta Norte)");
    console.log("  - username: auditor");
    console.log("  - username: admin");
  } catch (error) {
    console.error("❌ Error en seed:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
