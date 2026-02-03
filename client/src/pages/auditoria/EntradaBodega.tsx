import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PackageIcon, PlusIcon, MinusIcon, ScaleIcon } from "lucide-react";

interface Producto {
  id: number;
  nombre: string;
  unidad: "PIEZA" | "KG" | "MIXTO";
}

type ModoOperacion = "entrada" | "salida";

export default function EntradaBodegaPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [productos, setProductos] = React.useState<Producto[]>([]);
  
  const [productoId, setProductoId] = React.useState<string>("");
  const [cantidad, setCantidad] = React.useState("");
  const [piezas, setPiezas] = React.useState("");
  const [kg, setKg] = React.useState("");
  const [notas, setNotas] = React.useState("");
  const [modo, setModo] = React.useState<ModoOperacion>("entrada");

  const selectedProducto = productos.find(p => p.id.toString() === productoId);
  const isMixto = selectedProducto?.unidad === "MIXTO";

  const loadProductos = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/productos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProductos(data.productos || []);
      }
    } catch (e) {
      console.error("Error cargando productos:", e);
    }
  };

  React.useEffect(() => { loadProductos(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productoId) {
      toast({ title: "Validación", description: "Selecciona un producto.", variant: "destructive" });
      return;
    }

    if (isMixto) {
      const pzVal = parseFloat(piezas) || 0;
      const kgVal = parseFloat(kg) || 0;
      if (pzVal <= 0 && kgVal <= 0) {
        toast({ title: "Validación", description: "Ingresa piezas y/o kilogramos.", variant: "destructive" });
        return;
      }
    } else {
      if (!cantidad || parseFloat(cantidad) <= 0) {
        toast({ title: "Validación", description: "Ingresa una cantidad válida.", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      
      let endpoint = "";
      let body: any = {};
      
      if (isMixto) {
        endpoint = modo === "entrada" ? "/api/bodega/entrada-mixto" : "/api/bodega/salida-mixto";
        body = {
          productoId: parseInt(productoId),
          piezas: parseFloat(piezas) || 0,
          kg: parseFloat(kg) || 0,
          notas: notas.trim() || undefined,
        };
      } else {
        endpoint = modo === "entrada" ? "/api/bodega/entrada" : "/api/bodega/salida";
        body = {
          productoId: parseInt(productoId),
          cantidad: parseFloat(cantidad),
          notas: notas.trim() || undefined,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar operación");
      }

      const accion = modo === "entrada" ? "agregaron" : "retiraron";
      let mensaje = "";
      
      if (isMixto) {
        const pzVal = parseFloat(piezas) || 0;
        const kgVal = parseFloat(kg) || 0;
        mensaje = `Se ${accion} ${pzVal > 0 ? pzVal + ' pzs' : ''}${pzVal > 0 && kgVal > 0 ? ' + ' : ''}${kgVal > 0 ? kgVal + ' kg' : ''} de ${selectedProducto?.nombre}`;
      } else {
        mensaje = `Se ${accion} ${cantidad} ${selectedProducto?.unidad === 'KG' ? 'kg' : 'piezas'} de ${selectedProducto?.nombre}`;
      }
      
      toast({ title: "Éxito", description: mensaje });
      setCantidad("");
      setPiezas("");
      setKg("");
      setNotas("");
      setProductoId("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title={modo === "entrada" ? "Entrada a Bodega" : "Salida de Bodega"}>
      <div className="grid gap-6 pb-20">
        <div className="flex gap-2">
          <Button
            variant={modo === "entrada" ? "default" : "outline"}
            className="flex-1 h-12 rounded-2xl font-black uppercase text-xs"
            onClick={() => setModo("entrada")}
            data-testid="button-modo-entrada"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Entrada
          </Button>
          <Button
            variant={modo === "salida" ? "destructive" : "outline"}
            className="flex-1 h-12 rounded-2xl font-black uppercase text-xs"
            onClick={() => setModo("salida")}
            data-testid="button-modo-salida"
          >
            <MinusIcon className="h-4 w-4 mr-2" />
            Salida
          </Button>
        </div>

        <Card className="p-6 rounded-3xl border-none shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${modo === "entrada" ? "bg-green-500/10" : "bg-red-500/10"}`}>
              {modo === "entrada" ? (
                <PlusIcon className="h-6 w-6 text-green-500" />
              ) : (
                <MinusIcon className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black">
                {modo === "entrada" ? "Registrar Entrada" : "Registrar Salida"}
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                {modo === "entrada" ? "Agregar stock al inventario central" : "Retirar stock del inventario central"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                Producto (ID - Nombre)
              </Label>
              <Select value={productoId} onValueChange={(val) => { setProductoId(val); setCantidad(""); setPiezas(""); setKg(""); }}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-producto">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-60">
                  {productos.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()} className="font-bold">
                      <div className="flex items-center gap-2">
                        <PackageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-primary font-black">#{p.id}</span>
                        <span>- {p.nombre}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${p.unidad === 'MIXTO' ? 'bg-purple-500/20 text-purple-700' : 'text-muted-foreground'}`}>
                          ({p.unidad})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProducto && (
              <Card className={`p-3 rounded-2xl ${isMixto ? 'bg-purple-500/5 border-purple-500/20' : 'bg-primary/5 border-primary/20'}`}>
                <div className="flex items-center gap-2">
                  {isMixto ? (
                    <ScaleIcon className="h-5 w-5 text-purple-500" />
                  ) : (
                    <PackageIcon className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <div className="text-xs font-black">Producto seleccionado:</div>
                    <div className={`text-sm font-bold ${isMixto ? 'text-purple-700' : 'text-primary'}`}>
                      #{selectedProducto.id} - {selectedProducto.nombre}
                      {isMixto && <span className="ml-2 text-xs bg-purple-500/20 px-2 py-0.5 rounded">MIXTO</span>}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {isMixto ? (
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                    Piezas
                  </Label>
                  <Input 
                    type="number" 
                    step="1"
                    min="0"
                    value={piezas} 
                    onChange={e => setPiezas(e.target.value)}
                    placeholder="0"
                    className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-lg text-center"
                    data-testid="input-piezas"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                    Kilogramos
                  </Label>
                  <Input 
                    type="number" 
                    step="0.001"
                    min="0"
                    value={kg} 
                    onChange={e => setKg(e.target.value)}
                    placeholder="0.000"
                    className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-lg text-center"
                    data-testid="input-kg"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                  Cantidad ({selectedProducto?.unidad === 'KG' ? 'Kilogramos' : 'Piezas'})
                </Label>
                <Input 
                  type="number" 
                  step="0.001"
                  min="0"
                  value={cantidad} 
                  onChange={e => setCantidad(e.target.value)}
                  placeholder="0.00"
                  className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-lg text-center"
                  data-testid="input-cantidad"
                />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                Notas (opcional)
              </Label>
              <Input 
                value={notas} 
                onChange={e => setNotas(e.target.value)}
                placeholder="Ej: Proveedor XYZ, Factura #123"
                className="h-12 rounded-2xl bg-muted/30 border-none font-bold"
                data-testid="input-notas"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !productoId}
              variant={modo === "salida" ? "destructive" : "default"}
              className="h-14 rounded-2xl font-black uppercase text-sm mt-2"
              data-testid="button-submit"
            >
              {loading ? "Registrando..." : modo === "entrada" ? "Registrar Entrada" : "Registrar Salida"}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
