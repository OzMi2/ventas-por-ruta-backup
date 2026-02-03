import * as React from "react";
import { storage } from "./storage";
import type { CartItem, Cliente, Session } from "./types";

type AppState = {
  session: Session | null;
  apiBaseUrl: string;
  selectedClient: Cliente | null;
  cart: CartItem[];
};

type Action =
  | { type: "SESSION_SET"; session: Session }
  | { type: "SESSION_CLEAR" }
  | { type: "API_BASE_URL_SET"; apiBaseUrl: string }
  | { type: "CLIENT_SET"; client: Cliente | null }
  | { type: "CART_SET"; cart: CartItem[] }
  | { type: "CART_ADD"; item: CartItem }
  | { type: "CART_UPDATE"; index: number; patch: Partial<CartItem> }
  | { type: "CART_REMOVE"; index: number }
  | { type: "CART_CLEAR" };

function envApiBaseUrl() {
  const raw = (import.meta as any).env?.VITE_API_BASE_URL;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : "";
}

const initialState: AppState = {
  session: null,
  apiBaseUrl: "",
  selectedClient: null,
  cart: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SESSION_SET": {
      const next = { ...state, session: action.session };
      storage.set("vr_session", action.session);
      return next;
    }
    case "SESSION_CLEAR": {
      storage.remove("vr_session");
      return { ...state, session: null };
    }
    case "API_BASE_URL_SET": {
      const apiBaseUrl = action.apiBaseUrl;
      storage.set("vr_api_base_url", apiBaseUrl);
      return { ...state, apiBaseUrl };
    }
    case "CLIENT_SET": {
      storage.set("vr_selected_client", action.client);
      return { ...state, selectedClient: action.client };
    }
    case "CART_SET": {
      storage.set("vr_cart", action.cart);
      return { ...state, cart: action.cart };
    }
    case "CART_ADD": {
      const cart = [...state.cart, action.item];
      storage.set("vr_cart", cart);
      return { ...state, cart };
    }
    case "CART_UPDATE": {
      const cart = state.cart.map((it, idx) =>
        idx === action.index ? { ...it, ...action.patch } : it,
      );
      storage.set("vr_cart", cart);
      return { ...state, cart };
    }
    case "CART_REMOVE": {
      const cart = state.cart.filter((_, idx) => idx !== action.index);
      storage.set("vr_cart", cart);
      return { ...state, cart };
    }
    case "CART_CLEAR": {
      storage.set("vr_cart", []);
      return { ...state, cart: [] };
    }
    default:
      return state;
  }
}

const StoreContext = React.createContext<
  | {
      state: AppState;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initialState, (base) => {
    const persistedSession = storage.get<Session | null>("vr_session", null);
    const persistedApiBaseUrl = storage.get<string>("vr_api_base_url", "");
    const persistedClient = storage.get<Cliente | null>("vr_selected_client", null);
    const persistedCart = storage.get("vr_cart", [] as any[]);

    const apiBaseUrl = persistedApiBaseUrl || envApiBaseUrl();

    return {
      ...base,
      session: persistedSession,
      apiBaseUrl,
      selectedClient: persistedClient,
      cart: Array.isArray(persistedCart) ? (persistedCart as any) : [],
    };
  });

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
