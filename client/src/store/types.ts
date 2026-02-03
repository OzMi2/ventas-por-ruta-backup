export type Role = "vendedor" | "auditor" | "admin";

export type Session = {
  usuario_id: string;
  rol: Role;
  nombre?: string;
  token?: string;
  rutaId?: number | null;
};

export type Cliente = {
  id: string;
  nombre: string;
  saldo?: number;
};

export type TipoVenta = "unidad" | "peso";

export type Producto = {
  id: string;
  nombre: string;
  tipo_venta: TipoVenta;
  requiere_piezas: boolean;
  stock_piezas?: number;
  stock_kg?: number;
  precio_base: number;
  descuento_aplicado?: number;
  precio_aplicado: number;
  fuente_descuento?: "asignado_cliente" | "volumen" | "ninguno";
};

export type CartItem = {
  producto_id: string;
  nombre: string;
  tipo_venta: TipoVenta;
  requiere_piezas: boolean;
  precio_base: number;
  precio_aplicado: number;
  discount_unit: number;
  cantidad?: number;
  kilos?: number;
};
