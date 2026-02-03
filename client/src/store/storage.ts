export type StorageKey =
  | "vr_session"
  | "vr_api_base_url"
  | "vr_selected_client"
  | "vr_cart";

export const storage = {
  get<T>(key: StorageKey, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: StorageKey, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  },
  remove(key: StorageKey) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
