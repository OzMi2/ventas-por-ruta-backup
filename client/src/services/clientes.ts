import { apiClient } from "@/lib/api";

export async function fetchClientes(rutaId?: number) {
  const response = await apiClient.getClientes(rutaId);
  return response.clientes;
}
