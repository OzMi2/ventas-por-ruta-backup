import * as React from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { login } from "@/services/auth";
import { precacheEverything } from "@/services/precache";
import { useAppStore } from "@/store/store";

function safeString(v: any) {
  if (v == null) return "";
  return String(v);
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { dispatch, state } = useAppStore();
  const { toast } = useToast();

  const [usuario, setUsuario] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [precaching, setPrecaching] = React.useState(false);
  const [precacheStatus, setPrecacheStatus] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state.session) setLocation("/clientes");
  }, [state.session, setLocation]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!usuario.trim() || !password.trim()) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const res = await login({ usuario: usuario.trim(), password: password.trim() });

      const session = {
        usuario_id: res.usuario_id.toString(),
        rol: res.rol,
        nombre: res.nombre,
        token: res.token,
        rutaId: res.rutaId,
      };

      dispatch({ type: "SESSION_SET", session });
      toast({ title: "Sesión iniciada", description: `Bienvenido/a ${session.nombre}`.trim() });
      
      setPrecaching(true);
      setPrecacheStatus("Preparando app para uso offline...");
      
      precacheEverything((step) => setPrecacheStatus(step))
        .then(() => {
          toast({ title: "App lista", description: "Todos los datos están cacheados para uso offline" });
        })
        .catch(() => {})
        .finally(() => {
          setPrecaching(false);
          setLocation("/clientes");
        });
    } catch (e: any) {
      setError(e?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh grid place-items-center p-6 app-noise app-grid">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <span className="text-sm font-semibold">GS</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-login-title">
            Garlo's Sistema de Ventas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-login-subtitle">
            Soluciones rápidas, ventas rápidas
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive" className="mb-4" data-testid="alert-login-error">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription data-testid="text-login-error">{error}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="usuario">
                  Usuario
                </label>
                <Input
                  id="usuario"
                  className="h-12 text-base rounded-xl"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ej. vendedor01"
                  autoComplete="username"
                  data-testid="input-usuario"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="password">
                  Contraseña
                </label>
                <Input
                  id="password"
                  className="h-12 text-base rounded-xl"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  data-testid="input-password"
                />
              </div>

              <Button type="submit" size="lg" className="h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20" disabled={loading || precaching} data-testid="button-login">
                {loading ? "Entrando..." : precaching ? "Cargando datos..." : "Iniciar Sesión"}
              </Button>

              {precaching && (
                <div className="mt-2 p-3 rounded-xl bg-primary/10 text-center animate-pulse">
                  <div className="text-xs font-bold text-primary">{precacheStatus}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">Esto solo ocurre una vez</div>
                </div>
              )}

              <div className="mt-2 text-xs text-muted-foreground" data-testid="text-login-hint">
                Tip: configura la URL del API (IP/puerto) en "Configuración" si no es la predeterminada.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
