import { storage } from "@/store/storage";

const API_URL_KEY = "vr_api_base_url";
const SESSION_KEY = "vr_session";

function normalizeBaseUrl(url: string) {
  if (!url) return "";
  return String(url).trim().replace(/\/+$/, "");
}

export function getBaseUrl() {
  const saved = storage.get<string>(API_URL_KEY, "");
  const env = String((import.meta as any)?.env?.VITE_API_BASE_URL || "").trim();
  return normalizeBaseUrl(saved || env);
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  url: string;
  method: string;

  constructor({ message, status, payload, url, method }: { message: string; status: number; payload: unknown; url: string; method: string }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.url = url;
    this.method = method;
  }
}

export async function request<T = unknown>(
  path: string,
  {
    method = "GET",
    body,
    headers,
  }: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = baseUrl ? `${baseUrl}${path}` : path;

  const session = storage.get<any>(SESSION_KEY, null);
  const token = session?.token as string | undefined;

  const finalHeaders: Record<string, string> = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError({
      message: "No se pudo conectar con el API. Revisa la URL base y tu red.",
      status: 0,
      payload: null,
      url,
      method,
    });
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let payload: unknown = null;
  try {
    payload = isJson ? await res.json() : await res.text();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && (payload as any).message) ||
      (typeof payload === "string" && payload.trim()) ||
      `Error ${res.status}`;

    throw new ApiError({
      message,
      status: res.status,
      payload,
      url,
      method,
    });
  }

  return payload as T;
}
