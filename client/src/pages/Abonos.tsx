import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/store";
import { DollarSignIcon, UserIcon, CreditCardIcon, CheckCircleIcon, HistoryIcon, DownloadIcon } from "lucide-react";
import { exportAbonosToExcel } from "@/utils/exportExcel";

interface Cliente {
  id: number;
  nombre: string;
  saldo?: string;
}

interface Abono {
  id: number;
  clienteId: number;
  monto: string;
  saldoAnterior: string;
  saldoNuevo: string;
  notas?: string;
  fecha: string;
  usuarioNombre: string;
}

export default function AbonosPage() {
  const { toast } = useToast();
  const { state } = useAppStore();
  const userRol = state.session?.rol;
  const canExport = userRol === "admin" || userRol === "auditor";
  
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [clienteId, setClienteId] = React.useState<string>("");
  const [monto, setMonto] = React.useState("");
  const [notas, setNotas] = React.useState("");
  const [saldoActual, setSaldoActual] = React.useState<string | null>(null);
  const [historial, setHistorial] = React.useState<Abono[]>([]);
  const [showHistorial, setShowHistorial] = React.useState(false);

  const selectedCliente = clientes.find(c => c.id.toString() === clienteId);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/clientes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClientes(data.clientes || []);
      }
    } catch (e) {
      console.error("Error cargando clientes:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadSaldo = async (cId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/saldos/${cId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSaldoActual(data.saldo);
      }
    } catch (e) {
      console.error("Error cargando saldo:", e);
    }
  };

  const loadHistorial = async (cId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/abonos/${cId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHistorial(data.abonos || []);
      }
    } catch (e) {
      console.error("Error cargando historial:", e);
    }
  };

  React.useEffect(() => { loadClientes(); }, []);

  React.useEffect(() => {
    if (clienteId) {
      loadSaldo(clienteId);
      loadHistorial(clienteId);
    } else {
      setSaldoActual(null);
      setHistorial([]);
    }
  }, [clienteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteId || !monto || parseFloat(monto) <= 0) {
      toast({ title: "Validación", description: "Selecciona un cliente e ingresa un monto válido.", variant: "destructive" });
      return;
    }
    
    const saldoNum = parseFloat(saldoActual || "0");
    const montoNum = parseFloat(monto);
    
    if (saldoNum <= 0) {
      toast({ title: "Sin saldo pendiente", description: "Este cliente no tiene saldo pendiente.", variant: "destructive" });
      return;
    }
    
    if (montoNum > saldoNum) {
      toast({ title: "Monto excedido", description: `El monto máximo es $${saldoNum.toFixed(2)} (saldo actual del cliente).`, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/abonos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clienteId: parseInt(clienteId),
          monto: parseFloat(monto),
          notas: notas.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar abono");
      }

      const data = await response.json();
      
      toast({ 
        title: "Abono Registrado", 
        description: `Se registró un abono de $${parseFloat(monto).toFixed(2)} para ${selectedCliente?.nombre}. Nuevo saldo: $${data.abono.saldoNuevo}` 
      });
      
      setMonto("");
      setNotas("");
      loadSaldo(clienteId);
      loadHistorial(clienteId);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-MX', { 
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
    } catch {
      return fecha;
    }
  };

  const saldoNum = parseFloat(saldoActual || "0");
  const montoNum = parseFloat(monto || "0");
  const nuevoSaldo = saldoNum - montoNum;

  return (
    <AppShell title="Abonos / Pagos">
      <div className="grid gap-6 pb-20">
        <Card className="p-6 rounded-3xl border-none shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-500/10">
              <DollarSignIcon className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-black">Registrar Abono</h2>
              <p className="text-xs text-muted-foreground font-medium">Recibir pago de cliente a cuenta</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                Cliente
              </Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-cliente">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-60">
                  {loading ? (
                    <div className="p-4">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : (
                    clientes.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()} className="font-bold">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{c.nombre}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedCliente && saldoActual !== null && (
              <Card className={`p-4 rounded-2xl ${saldoNum > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xs font-black text-muted-foreground">Cliente</div>
                      <div className="text-sm font-bold">{selectedCliente.nombre}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-muted-foreground">Saldo Actual</div>
                    <div className={`text-lg font-black ${saldoNum > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${parseFloat(saldoActual).toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                Monto del Abono
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={monto} 
                  onChange={e => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="h-14 rounded-2xl bg-muted/30 border-none font-bold text-xl text-center pl-8"
                  data-testid="input-monto"
                />
              </div>
            </div>

            {montoNum > 0 && saldoActual !== null && (
              <Card className="p-4 rounded-2xl bg-primary/5 border-primary/20">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] font-black text-muted-foreground uppercase">Anterior</div>
                    <div className="text-sm font-bold text-red-600">${saldoNum.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-muted-foreground uppercase">Abono</div>
                    <div className="text-sm font-bold text-green-600">-${montoNum.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-muted-foreground uppercase">Nuevo</div>
                    <div className={`text-sm font-bold ${nuevoSaldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${nuevoSaldo.toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                Notas (opcional)
              </Label>
              <Input 
                value={notas} 
                onChange={e => setNotas(e.target.value)}
                placeholder="Ej: Pago en efectivo"
                className="h-12 rounded-2xl bg-muted/30 border-none font-bold"
                data-testid="input-notas"
              />
            </div>

            <Button 
              type="submit" 
              disabled={saving || !clienteId || !monto || parseFloat(monto) <= 0}
              className="h-14 rounded-2xl font-black uppercase text-sm mt-2"
              data-testid="button-submit"
            >
              {saving ? "Registrando..." : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Registrar Abono
                </>
              )}
            </Button>
          </form>
        </Card>

        {clienteId && (
          <Card className="p-6 rounded-3xl border-none shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10">
                  <HistoryIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-base font-black">Historial de Abonos</h3>
                  <p className="text-xs text-muted-foreground font-medium">{selectedCliente?.nombre}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {historial.length > 0 && canExport && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportAbonosToExcel(historial, selectedCliente?.nombre || "cliente")}
                    className="text-xs font-bold gap-1"
                    data-testid="button-exportar-abonos"
                  >
                    <DownloadIcon className="h-3 w-3" /> Excel
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowHistorial(!showHistorial)}
                  className="text-xs font-bold"
                >
                  {showHistorial ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
            </div>

            {showHistorial && (
              <div className="grid gap-2">
                {historial.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground font-medium">
                    No hay abonos registrados
                  </div>
                ) : (
                  historial.map((a) => (
                    <Card key={a.id} className="p-3 rounded-2xl bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-green-600">+${parseFloat(a.monto).toFixed(2)}</div>
                          <div className="text-[10px] text-muted-foreground font-medium">
                            {formatFecha(a.fecha)} · {a.usuarioNombre}
                          </div>
                          {a.notas && (
                            <div className="text-xs text-muted-foreground mt-1">{a.notas}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-muted-foreground">Saldo</div>
                          <div className="text-xs font-bold">
                            <span className="text-red-500">${parseFloat(a.saldoAnterior).toFixed(2)}</span>
                            <span className="mx-1">→</span>
                            <span className={parseFloat(a.saldoNuevo) > 0 ? 'text-red-500' : 'text-green-500'}>
                              ${parseFloat(a.saldoNuevo).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
