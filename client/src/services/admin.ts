import { request } from "./api";

export const descuentosClientes = {
  list: () => request<any>("/api/admin/descuentos_clientes.php"),
  create: (body: unknown) => request<any>("/api/admin/descuentos_clientes.php", { method: "POST", body }),
  update: (id: unknown, body: unknown) =>
    request<any>(`/api/admin/descuentos_clientes.php?id=${encodeURIComponent(String(id))}`, { method: "PUT", body }),
  remove: (id: unknown) => request<any>(`/api/admin/descuentos_clientes.php?id=${encodeURIComponent(String(id))}`, { method: "DELETE" }),
};

export const descuentosVolumen = {
  list: () => request<any>("/api/admin/descuentos_volumen.php"),
  create: (body: unknown) => request<any>("/api/admin/descuentos_volumen.php", { method: "POST", body }),
  update: (id: unknown, body: unknown) =>
    request<any>(`/api/admin/descuentos_volumen.php?id=${encodeURIComponent(String(id))}`, { method: "PUT", body }),
  remove: (id: unknown) => request<any>(`/api/admin/descuentos_volumen.php?id=${encodeURIComponent(String(id))}`, { method: "DELETE" }),
};
