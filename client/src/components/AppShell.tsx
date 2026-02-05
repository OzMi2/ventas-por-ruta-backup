import * as React from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import {
  ArchiveIcon,
  BoxesIcon,
  ClipboardListIcon,
  CogIcon,
  DollarSignIcon,
  LogOutIcon,
  MapPinIcon,
  ReceiptIcon,
  PercentIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "lucide-react";
import { useAppStore } from "@/store/store";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: ("vendedor" | "auditor" | "admin")[];
};

const nav: NavItem[] = [
  { label: "Clientes", href: "/clientes", icon: <UsersIcon />, roles: ["vendedor"] },
  { label: "Inventario", href: "/productos", icon: <BoxesIcon />, roles: ["vendedor"] },
  { label: "Carrito / Checkout", href: "/checkout", icon: <ShoppingCartIcon />, roles: ["vendedor"] },
  { label: "Abonos / Pagos", href: "/abonos", icon: <DollarSignIcon />, roles: ["vendedor"] },

  { label: "Rutas / Historial", href: "/historial", icon: <ReceiptIcon />, roles: ["admin", "auditor"] },
  { label: "Mi Historial", href: "/mi-historial", icon: <ReceiptIcon />, roles: ["vendedor"] },

  { label: "Stock Bodega", href: "/auditoria/stock-bodega", icon: <BoxesIcon />, roles: ["auditor", "admin"] },
  { label: "Mover stock", href: "/auditoria/mover-stock", icon: <ArchiveIcon />, roles: ["auditor", "admin"] },
  { label: "Entrada bodega", href: "/auditoria/entrada-bodega", icon: <ClipboardListIcon />, roles: ["auditor", "admin"] },
  { label: "Movimientos", href: "/auditoria/movimientos", icon: <ReceiptIcon />, roles: ["auditor", "admin"] },
  { label: "Stock Rutas", href: "/admin/stock-rutas", icon: <PackageIcon />, roles: ["auditor", "admin"] },

  { label: "Productos", href: "/admin/productos", icon: <BoxesIcon />, roles: ["admin"] },
  { label: "Clientes", href: "/admin/clientes", icon: <UsersIcon />, roles: ["admin"] },
  { label: "Rutas", href: "/admin/rutas", icon: <MapPinIcon />, roles: ["admin"] },
  { label: "Descuentos", href: "/admin/descuentos", icon: <PercentIcon />, roles: ["admin"] },

  { label: "Configuración", href: "/configuracion", icon: <CogIcon /> },
];

function roleLabel(role: string) {
  if (role === "vendedor") return "Vendedor";
  if (role === "auditor") return "Auditor";
  if (role === "admin") return "Admin";
  return role;
}

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const [location] = useLocation();
  const { state, dispatch } = useAppStore();

  const role = state.session?.rol;
  const visible = nav.filter((it) => !it.roles || (role && it.roles.includes(role)));

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="gap-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground shadow-sm">
              <span className="text-sm font-semibold">GS</span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">Garlo's Ventas</div>
              <div className="truncate text-xs text-sidebar-foreground/70">Sistema de Ventas</div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menú</SidebarGroupLabel>
            <SidebarMenu>
              {visible.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={location === item.href} tooltip={item.label}>
                    <Link href={item.href} data-testid={`link-nav-${item.href}`}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-2">
          {state.session ? (
            <div className="px-2 pb-2">
              <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-accent/40 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold" data-testid="text-user-nombre">
                      {state.session.nombre || "Usuario"}
                    </div>
                    <div className="truncate text-xs text-sidebar-foreground/70" data-testid="text-user-rol">
                      {roleLabel(state.session.rol)} · ID {state.session.usuario_id}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-sidebar-accent text-sidebar-accent-foreground">
                    {state.session.rol}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
                    onClick={() => {
                      dispatch({ type: "SESSION_CLEAR" });
                      dispatch({ type: "CLIENT_SET", client: null });
                      dispatch({ type: "CART_CLEAR" });
                    }}
                    data-testid="button-logout"
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Salir
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <div className="flex min-h-svh flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 px-3 py-2">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="h-9 w-9" />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold" data-testid="text-page-title">{title}</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <OfflineIndicator />
              {state.selectedClient ? (
                <div className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 shadow-sm">
                  <UsersIcon className="h-3 w-3 text-primary" />
                  <span className="max-w-[80px] truncate text-[10px] font-bold" data-testid="text-selected-client">
                    {state.selectedClient.nombre}
                  </span>
                </div>
              ) : null}
              {role === "vendedor" ? (
                <Badge variant="secondary" className="h-8 rounded-full bg-primary/10 text-primary border-none px-2.5" data-testid="badge-cart-count">
                  <ShoppingCartIcon className="mr-1 h-3.5 w-3.5" />
                  {state.cart.length}
                </Badge>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 pb-[72px] sm:pb-4">
          <div className="app-noise app-grid min-h-[calc(100svh-56px)]">
            <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">{children}</div>
          </div>
        </main>

        {role === "vendedor" && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.1)] sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex items-center justify-around py-2.5">
              <Link href="/clientes" data-testid="nav-bottom-clientes">
                <div className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${location === '/clientes' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <UsersIcon className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase">Clientes</span>
                </div>
              </Link>
              <Link href="/productos" data-testid="nav-bottom-productos">
                <div className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${location === '/productos' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <BoxesIcon className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase">Inventario</span>
                </div>
              </Link>
              <Link href="/checkout" data-testid="nav-bottom-checkout">
                <div className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${location === '/checkout' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <div className="relative">
                    <ShoppingCartIcon className="h-5 w-5" />
                    {state.cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center">
                        {state.cart.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase">Carrito</span>
                </div>
              </Link>
              <Link href="/mi-historial" data-testid="nav-bottom-historial">
                <div className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${location === '/mi-historial' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <ReceiptIcon className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase">Historial</span>
                </div>
              </Link>
            </div>
          </nav>
        )}

        {(role === "admin" || role === "auditor") && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.1)] sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex items-center justify-around py-2.5">
              <Link href="/historial" data-testid="nav-bottom-historial-admin">
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${location === '/historial' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <ReceiptIcon className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase">Ventas</span>
                </div>
              </Link>
              <Link href="/auditoria/stock-bodega" data-testid="nav-bottom-bodega">
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${location === '/auditoria/stock-bodega' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <BoxesIcon className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase">Bodega</span>
                </div>
              </Link>
              <Link href="/auditoria/movimientos" data-testid="nav-bottom-movimientos">
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${location === '/auditoria/movimientos' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <ClipboardListIcon className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase">Movim.</span>
                </div>
              </Link>
              <Link href="/auditoria/mover-stock" data-testid="nav-bottom-mover">
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${location === '/auditoria/mover-stock' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <ArchiveIcon className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase">Mover</span>
                </div>
              </Link>
              <Link href="/configuracion" data-testid="nav-bottom-config">
                <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${location === '/configuracion' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <CogIcon className="h-5 w-5" />
                  <span className="text-[9px] font-bold uppercase">Config</span>
                </div>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </SidebarProvider>
  );
}
