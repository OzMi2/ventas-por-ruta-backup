import { apiClient } from "@/lib/api";
import { getClientesFromCache, getBootstrapFromCache } from "./offlineCache";

export async function fetchClientes(rutaId?: number) {
  try {
    const response = await apiClient.getClientes(rutaId);
    return response.clientes;
  } catch (error) {
    const cachedClientes = getClientesFromCache();
    if (cachedClientes && cachedClientes.length > 0) {
      console.log("Usando clientes desde cache offline");
      return cachedClientes;
    }
    
    const bootstrap = getBootstrapFromCache();
    if (bootstrap?.clientes && bootstrap.clientes.length > 0) {
      console.log("Usando clientes desde bootstrap cache");
      return bootstrap.clientes;
    }
    
    throw error;
  }
}
