import { request } from "./api";

export async function moverStock(payload: unknown) {
  return request<any>("/api/auditoria/mover_stock.php", { method: "POST", body: payload });
}

export async function entradaBodega(payload: unknown) {
  return request<any>("/api/auditoria/entrada_bodega.php", { method: "POST", body: payload });
}
