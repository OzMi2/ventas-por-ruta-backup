import { Redirect, Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { ToastHost } from "@/components/ToastHost";
import { AppStoreProvider, useAppStore } from "@/store/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import LoginPage from "@/pages/Login";
import ConfiguracionPage from "@/pages/Configuracion";
import ClientesPage from "@/pages/Clientes";
import ProductosPage from "@/pages/Productos";
import CheckoutPage from "@/pages/Checkout";
import MoverStockPage from "@/pages/auditoria/MoverStock";
import EntradaBodegaPage from "@/pages/auditoria/EntradaBodega";
import MovimientosPage from "@/pages/auditoria/Movimientos";
import StockBodegaPage from "@/pages/auditoria/StockBodega";
import DescuentosPage from "@/pages/admin/Descuentos";
import ProductosAdminPage from "@/pages/admin/Productos";
import ClientesAdminPage from "@/pages/admin/Clientes";
import RutasAdminPage from "@/pages/admin/Rutas";
import StockRutasPage from "@/pages/admin/StockRutas";
import HistorialPage from "@/pages/Historial";
import MiHistorialPage from "@/pages/MiHistorial";
import AbonosPage from "@/pages/Abonos";
import NotFound from "@/pages/not-found";

function IndexRedirect() {
  const { state } = useAppStore();
  if (!state.session) return <Redirect to="/login" />;

  const role = state.session.rol;
  if (role === "vendedor") return <Redirect to="/clientes" />;
  if (role === "auditor") return <Redirect to="/historial" />;
  if (role === "admin") return <Redirect to="/historial" />;
  return <Redirect to="/configuracion" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={IndexRedirect} />
      <Route path="/login" component={LoginPage} />

      <Route path="/configuracion">
        <ProtectedRoute>
          <ConfiguracionPage />
        </ProtectedRoute>
      </Route>

      <Route path="/clientes">
        <ProtectedRoute>
          <ClientesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/productos">
        <ProtectedRoute>
          <ProductosPage />
        </ProtectedRoute>
      </Route>

      <Route path="/checkout">
        <ProtectedRoute>
          <CheckoutPage />
        </ProtectedRoute>
      </Route>

      <Route path="/auditoria/mover-stock">
        <ProtectedRoute>
          <MoverStockPage />
        </ProtectedRoute>
      </Route>

      <Route path="/auditoria/entrada-bodega">
        <ProtectedRoute>
          <EntradaBodegaPage />
        </ProtectedRoute>
      </Route>

      <Route path="/auditoria/movimientos">
        <ProtectedRoute>
          <MovimientosPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/descuentos">
        <ProtectedRoute>
          <DescuentosPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/productos">
        <ProtectedRoute>
          <ProductosAdminPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/clientes">
        <ProtectedRoute>
          <ClientesAdminPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/rutas">
        <ProtectedRoute>
          <RutasAdminPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/stock-rutas">
        <ProtectedRoute>
          <StockRutasPage />
        </ProtectedRoute>
      </Route>

      <Route path="/auditoria/stock-bodega">
        <ProtectedRoute>
          <StockBodegaPage />
        </ProtectedRoute>
      </Route>

      <Route path="/historial">
        <ProtectedRoute>
          <HistorialPage />
        </ProtectedRoute>
      </Route>

      <Route path="/mi-historial">
        <ProtectedRoute>
          <MiHistorialPage />
        </ProtectedRoute>
      </Route>

      <Route path="/abonos">
        <ProtectedRoute>
          <AbonosPage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastHost />
        <AppStoreProvider>
          <Router />
        </AppStoreProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
