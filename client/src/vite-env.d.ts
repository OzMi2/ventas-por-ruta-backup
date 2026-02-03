/// <reference types="vite/client" />

declare module "@/services/auth" {
  export function login(input: { usuario: string; password: string }): Promise<any>;
}

declare module "@/services/clientes" {
  export function fetchClientes(): Promise<any>;
}

declare module "@/services/productos" {
  export function fetchProductos(input: { vendedor_id?: string | number; cliente_id?: string | number }): Promise<any>;
}

declare module "@/services/ventas" {
  export function registrarVenta(payload: unknown): Promise<any>;
}

declare module "@/services/auditoria" {
  export function moverStock(payload: unknown): Promise<any>;
  export function entradaBodega(payload: unknown): Promise<any>;
}

declare module "@/services/admin" {
  export const descuentosClientes: {
    list: () => Promise<any>;
    create: (body: unknown) => Promise<any>;
    update: (id: unknown, body: unknown) => Promise<any>;
    remove: (id: unknown) => Promise<any>;
  };
  export const descuentosVolumen: {
    list: () => Promise<any>;
    create: (body: unknown) => Promise<any>;
    update: (id: unknown, body: unknown) => Promise<any>;
    remove: (id: unknown) => Promise<any>;
  };
}
