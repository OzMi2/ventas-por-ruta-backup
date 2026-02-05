// Usa el backend local (que se conecta a AWS)
const API_BASE = "/api";

export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  rol: "vendedor" | "auditor" | "admin";
  rutaId: number | null;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface Ruta {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  rutaId: number;
  activo: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  precio: string;
  unidad: "PIEZA" | "KG" | "MIXTO";
  activo: boolean;
}

export interface InventarioRuta {
  id: number;
  rutaId: number;
  productoId: number;
  cantidad: string;
  ultimaActualizacion: Date;
}

export interface InventarioRutaMixto {
  id: number;
  rutaId: number;
  productoId: number;
  cantidadPiezas: string;
  cantidadKg: string;
  productoNombre: string;
  ultimaActualizacion: Date;
}

export interface BootstrapResponse {
  usuario: Usuario;
  ruta: Ruta;
  clientes: Cliente[];
  productos: Producto[];
  inventario: InventarioRuta[];
  inventarioMixto?: InventarioRutaMixto[];
}

export interface VentaItem {
  productoId: number;
  cantidad: string;
  precioUnitario: string;
  descuentoUnitario?: string;
  subtotal: string;
  piezas?: string;
  kilos?: string;
}

export interface Venta {
  clienteTxId: string;
  usuarioId: number;
  clienteId: number;
  rutaId: number;
  fechaVenta: Date;
  subtotal: string;
  descuento: string;
  total: string;
  descuentoAplicado: string | null;
}

export interface SyncEvent {
  eventId: string;
  tipo: "venta";
  venta: Venta;
  items: VentaItem[];
  abono?: number;
  pagoCliente?: number;
  cambio?: number;
}

export interface SyncPushRequest {
  events: SyncEvent[];
}

export interface SyncResult {
  eventId: string;
  status: "success" | "error" | "duplicate" | "already_processed";
  ventaId?: number;
  error?: string;
  saldoFinal?: string;
}

export interface SyncPushResponse {
  results: SyncResult[];
}

export interface DiscountTier {
  id: number;
  ruleId: number;
  volumenDesde: string;
  descuentoMonto: string;
}

export interface DiscountRule {
  id: number;
  clienteId: number | null; // NULL = descuento por volumen para todos
  productoId: number;
  tipoDescuento: "PIEZA" | "KG" | "MIXTO";
  activo: boolean;
  tiers: DiscountTier[];
  // Campos poblados por joins
  clienteNombre?: string;
  productoNombre?: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async bootstrap(): Promise<BootstrapResponse> {
    return this.request<BootstrapResponse>("/me/bootstrap");
  }

  async syncPush(events: SyncEvent[]): Promise<SyncPushResponse> {
    return this.request<SyncPushResponse>("/sync/push", {
      method: "POST",
      body: JSON.stringify({ events }),
    });
  }

  async getVentas(params?: {
    rutaId?: number;
    clienteId?: number;
    limit?: number;
  }): Promise<{ ventas: Array<Venta & { items: VentaItem[] }> }> {
    const queryParams = new URLSearchParams();
    if (params?.rutaId) queryParams.set("rutaId", params.rutaId.toString());
    if (params?.clienteId) queryParams.set("clienteId", params.clienteId.toString());
    if (params?.limit) queryParams.set("limit", params.limit.toString());

    const query = queryParams.toString();
    return this.request<{ ventas: Array<Venta & { items: VentaItem[] }> }>(
      `/ventas${query ? `?${query}` : ""}`
    );
  }

  async getDescuentos(): Promise<{ rules: DiscountRule[] }> {
    return this.request<{ rules: DiscountRule[] }>("/descuentos");
  }

  async createDescuento(
    productoId: number,
    tipoDescuento: "PIEZA" | "KG" | "MIXTO",
    tiers: Array<{ volumenDesde: string; descuentoMonto: string }>,
    clienteId?: number | null
  ): Promise<{ rule: DiscountRule }> {
    return this.request<{ rule: DiscountRule }>("/descuentos", {
      method: "POST",
      body: JSON.stringify({ clienteId: clienteId || null, productoId, tipoDescuento, tiers }),
    });
  }

  async deleteDescuento(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/descuentos/${id}`, {
      method: "DELETE",
    });
  }

  async getRutas(): Promise<{ rutas: Ruta[] }> {
    return this.request<{ rutas: Ruta[] }>("/rutas");
  }

  async getClientes(rutaId?: number): Promise<{ clientes: Cliente[] }> {
    const query = rutaId ? `?rutaId=${rutaId}` : "";
    return this.request<{ clientes: Cliente[] }>(`/clientes${query}`);
  }

  async getProductos(): Promise<{ productos: Producto[] }> {
    return this.request<{ productos: Producto[] }>("/productos");
  }

  async getMovimientos(): Promise<{ movimientos: any[] }> {
    return this.request<{ movimientos: any[] }>("/movimientos");
  }
  
  async getMovimientosRuta(rutaId: number, fechaDesde?: string, fechaHasta?: string): Promise<{ movimientos: any[] }> {
    let url = `/movimientos/ruta/${rutaId}`;
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request<{ movimientos: any[] }>(url);
  }
}

export const apiClient = new ApiClient();
