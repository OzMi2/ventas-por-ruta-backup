import { apiClient } from "@/lib/api";

export type LoginResponse = {
  ok: true;
  usuario_id: number;
  rol: "vendedor" | "auditor" | "admin";
  nombre: string;
  token: string;
  rutaId?: number | null;
};

export async function login({ usuario, password }: { usuario: string; password: string }): Promise<LoginResponse> {
  const response = await apiClient.login(usuario, password);
  
  return {
    ok: true,
    usuario_id: response.usuario.id,
    rol: response.usuario.rol,
    nombre: response.usuario.nombre,
    token: response.token,
    rutaId: response.usuario.rutaId,
  };
}
