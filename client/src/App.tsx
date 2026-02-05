import * as React from "react";
import { Redirect, Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { ToastHost } from "@/components/ToastHost";
import { AppStoreProvider, useAppStore } from "@/store/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2Icon } from "lucide-react";

const LoginPage = React.lazy(() => import("@/pages/Login"));
const ConfiguracionPage = React.lazy(() => import("@/pages/Configuracion"));
const ClientesPage = React.lazy(() => import("@/pages/Clientes"));
const ProductosPage = React.lazy(() => import("@/pages/Productos"));
const CheckoutPage = React.lazy(() => import("@/pages/Checkout"));
const MoverStockPage = React.lazy(() => import("@/pages/auditoria/MoverStock"));
const EntradaBodegaPage = React.lazy(() => import("@/pages/auditoria/EntradaBodega"));
const MovimientosPage = React.lazy(() => import("@/pages/auditoria/Movimientos"));
const StockBodegaPage = React.lazy(() => import("@/pages/auditoria/StockBodega"));
const DescuentosPage = React.lazy(() => import("@/pages/admin/Descuentos"));
const ProductosAdminPage = React.lazy(() => import("@/pages/admin/Productos"));
const ClientesAdminPage = React.lazy(() => import("@/pages/admin/Clientes"));
const RutasAdminPage = React.lazy(() => import("@/pages/admin/Rutas"));
const StockRutasPage = React.lazy(() => import("@/pages/admin/StockRutas"));
const HistorialPage = React.lazy(() => import("@/pages/Historial"));
const MiHistorialPage = React.lazy(() => import("@/pages/MiHistorial"));
const AbonosPage = React.lazy(() => import("@/pages/Abonos"));
const NotFound = React.lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

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
    <React.Suspense fallback={<PageLoader />}>
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
    </React.Suspense>
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
