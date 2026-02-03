import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PackageIcon, ArrowRightIcon, TruckIcon, ScaleIcon } from "lucide-react";

interface Producto {
  id: number;
  nombre: string;
  unidad: "PIEZA" | "KG" | "MIXTO";
}

interface Ruta {
  id: number;
  nombre: string;
}

interface BodegaItem {
  productoId: number;
  cantidad: string;
  productoNombre: string;
}

interface BodegaMixtoItem {
  productoId: number;
  cantidadPiezas: string;
  cantidadKg: string;
  productoNombre: string;
}

export default function MoverStockPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [rutas, setRutas] = React.useState<Ruta[]>([]);
  const [bodegaStock, setBodegaStock] = React.useState<BodegaItem[]>([]);
  const [bodegaMixtoStock, setBodegaMixtoStock] = React.useState<BodegaMixtoItem[]>([]);
  
  const [productoId, setProductoId] = React.useState<string>("");
  const [rutaId, setRutaId] = React.useState<string>("");
  const [cantidad, setCantidad] = React.useState("");
  const [piezas, setPiezas] = React.useState("");
  const [kg, setKg] = React.useState("");
  const [notas, setNotas] = React.useState("");

  const selectedProducto = productos.find(p => p.id.toString() === productoId);
  const selectedRuta = rutas.find(r => r.id.toString() === rutaId);
  const isMixto = selectedProducto?.unidad === "MIXTO";
  
  const bodegaItem = bodegaStock.find(b => b.productoId.toString() === productoId);
  const bodegaMixtoItem = bodegaMixtoStock.find(b => b.productoId.toString() === productoId);
  
  const stockDisponible = bodegaItem ? parseFloat(bodegaItem.cantidad) : 0;
  const stockPiezasDisponible = bodegaMixtoItem ? parseInt(bodegaMixtoItem.cantidadPiezas) || 0 : 0;
  const stockKgDisponible = bodegaMixtoItem ? parseFloat(bodegaMixtoItem.cantidadKg) || 0 : 0;

  const loadData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      
      const [productosRes, rutasRes, bodegaRes, bodegaMixtoRes] = await Promise.all([
        fetch("/api/productos", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/rutas", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/bodega", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/bodega/mixto", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      if (productosRes.ok) {
        const data = await productosRes.json();
        setProductos(data.productos || []);
      }
      if (rutasRes.ok) {
        const data = await rutasRes.json();
        setRutas(data.rutas || []);
      }
      if (bodegaRes.ok) {
        const data = await bodegaRes.json();
        setBodegaStock(data.inventario || []);
      }
      if (bodegaMixtoRes.ok) {
        const data = await bodegaMixtoRes.json();
        setBodegaMixtoStock(data.inventario || []);
      }
    } catch (e) {
      console.error("Error cargando datos:", e);
    }
  };

  React.useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productoId || !rutaId) {
      toast({ title: "Validación", description: "Selecciona producto y ruta.", variant: "destructive" });
      return;
    }

    if (isMixto) {
      const pzVal = parseInt(piezas) || 0;
      const kgVal = parseFloat(kg) || 0;
      
      if (pzVal <= 0 && kgVal <= 0) {
        toast({ title: "Validación", description: "Ingresa piezas y/o kilogramos.", variant: "destructive" });
        return;
      }
      
      if (pzVal > stockPiezasDisponible) {
        toast({ title: "Stock insuficiente", description: `Solo hay ${stockPiezasDisponible} piezas disponibles.`, variant: "destructive" });
        return;
      }
      
      if (kgVal > stockKgDisponible) {
        toast({ title: "Stock insuficiente", description: `Solo hay ${stockKgDisponible.toFixed(3)} kg disponibles.`, variant: "destructive" });
        return;
      }
    } else {
      if (!cantidad || parseFloat(cantidad) <= 0) {
        toast({ title: "Validación", description: "Ingresa una cantidad válida.", variant: "destructive" });
        return;
      }
      
      if (parseFloat(cantidad) > stockDisponible) {
        toast({ title: "Stock insuficiente", description: `Solo hay ${stockDisponible.toFixed(2)} disponibles en bodega.`, variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      
      let endpoint = "";
      let body: any = {};
      
      if (isMixto) {
        endpoint = "/api/bodega/mover-mixto-a-ruta";
        body = {
          productoId: parseInt(productoId),
          rutaId: parseInt(rutaId),
          piezas: parseInt(piezas) || 0,
          kg: parseFloat(kg) || 0,
          notas: notas.trim() || undefined,
        };
      } else {
        endpoint = "/api/bodega/mover-a-ruta";
        body = {
          productoId: parseInt(productoId),
          rutaId: parseInt(rutaId),
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
        throw new Error(error.error || "Error al mover stock");
      }

      let mensaje = "";
      if (isMixto) {
        const pzVal = parseInt(piezas) || 0;
        const kgVal = parseFloat(kg) || 0;
        mensaje = `Se movieron ${pzVal > 0 ? pzVal + ' pzs' : ''}${pzVal > 0 && kgVal > 0 ? ' + ' : ''}${kgVal > 0 ? kgVal + ' kg' : ''} de ${selectedProducto?.nombre} a ${selectedRuta?.nombre}.`;
      } else {
        mensaje = `Se movieron ${cantidad} ${selectedProducto?.unidad === 'KG' ? 'kg' : 'piezas'} de ${selectedProducto?.nombre} a ${selectedRuta?.nombre}.`;
      }
      
      toast({ title: "Éxito", description: mensaje });
      setCantidad("");
      setPiezas("");
      setKg("");
      setNotas("");
      setProductoId("");
      setRutaId("");
      loadData(); // Refresh stock
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getStockInfo = (producto: Producto) => {
    if (producto.unidad === "MIXTO") {
      const mixtoItem = bodegaMixtoStock.find(b => b.productoId === producto.id);
      const pz = mixtoItem ? parseInt(mixtoItem.cantidadPiezas) || 0 : 0;
      const kgVal = mixtoItem ? parseFloat(mixtoItem.cantidadKg) || 0 : 0;
      return { haStock: pz > 0 || kgVal > 0, display: `${pz} pz / ${kgVal.toFixed(2)} kg` };
    } else {
      const item = bodegaStock.find(b => b.productoId === producto.id);
      const qty = item ? parseFloat(item.cantidad) : 0;
      return { haStock: qty > 0, display: `${qty.toFixed(2)} ${producto.unidad}` };
    }
  };

  return (
    <AppShell title="Mover Stock">
      <div className="grid gap-6 pb-20">
        <Card className="p-6 rounded-3xl border-none shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10">
              <TruckIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-black">Mover Stock</h2>
              <p className="text-xs text-muted-foreground font-medium">Transferir de bodega a ruta</p>
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
                  {productos.map(p => {
                    const stockInfo = getStockInfo(p);
                    return (
                      <SelectItem key={p.id} value={p.id.toString()} className="font-bold">
                        <div className="flex items-center gap-2">
                          <PackageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-primary font-black">#{p.id}</span>
                          <span>- {p.nombre}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${p.unidad === 'MIXTO' ? 'bg-purple-500/20 text-purple-700' : ''} ${stockInfo.haStock ? 'text-green-500' : 'text-red-500'}`}>
                            ({stockInfo.display})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedProducto && (
              <Card className="p-3 rounded-2xl bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageIcon className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs font-black">Producto seleccionado:</div>
                      <div className="text-sm font-bold text-primary">
                        #{selectedProducto.id} - {selectedProducto.nombre}
                        {isMixto && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700">MIXTO</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black uppercase text-muted-foreground">Stock bodega</div>
                    {isMixto ? (
                      <div className="text-sm font-black">
                        <span className={stockPiezasDisponible > 0 ? 'text-green-500' : 'text-red-500'}>{stockPiezasDisponible} pz</span>
                        <span className="mx-1 text-muted-foreground">/</span>
                        <span className={stockKgDisponible > 0 ? 'text-green-500' : 'text-red-500'}>{stockKgDisponible.toFixed(3)} kg</span>
                      </div>
                    ) : (
                      <div className={`text-lg font-black ${stockDisponible > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stockDisponible.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                Ruta Destino
              </Label>
              <Select value={rutaId} onValueChange={setRutaId}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-ruta">
                  <SelectValue placeholder="Seleccionar ruta..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {rutas.map(r => (
                    <SelectItem key={r.id} value={r.id.toString()} className="font-bold">
                      <div className="flex items-center gap-2">
                        <TruckIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-primary font-black">#{r.id}</span>
                        <span>- {r.nombre}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProducto && selectedRuta && (
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="text-center">
                  <div className="text-[9px] font-black uppercase text-muted-foreground">Bodega</div>
                  {isMixto ? (
                    <div className="text-sm font-black">
                      {stockPiezasDisponible} pz / {stockKgDisponible.toFixed(2)} kg
                    </div>
                  ) : (
                    <div className="text-sm font-black">{stockDisponible.toFixed(2)}</div>
                  )}
                </div>
                <ArrowRightIcon className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <div className="text-[9px] font-black uppercase text-muted-foreground">{selectedRuta.nombre}</div>
                  {isMixto ? (
                    <div className="text-sm font-black text-primary">
                      +{piezas || '0'} pz / +{kg || '0'} kg
                    </div>
                  ) : (
                    <div className="text-sm font-black text-primary">+{cantidad || '0'}</div>
                  )}
                </div>
              </div>
            )}

            {isMixto ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground flex items-center gap-1">
                    <PackageIcon className="h-3 w-3" /> Piezas
                  </Label>
                  <Input 
                    type="number" 
                    step="1"
                    min="0"
                    max={stockPiezasDisponible}
                    value={piezas} 
                    onChange={e => setPiezas(e.target.value)}
                    placeholder="0"
                    className="h-12 rounded-2xl bg-muted/30 border-none font-bold text-lg text-center"
                    data-testid="input-piezas"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground flex items-center gap-1">
                    <ScaleIcon className="h-3 w-3" /> Kilogramos
                  </Label>
                  <Input 
                    type="number" 
                    step="0.001"
                    min="0"
                    max={stockKgDisponible}
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
                  Cantidad a mover ({selectedProducto?.unidad === 'KG' ? 'Kilogramos' : 'Piezas'})
                </Label>
                <Input 
                  type="number" 
                  step="0.001"
                  min="0"
                  max={stockDisponible}
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
                placeholder="Ej: Carga del día"
                className="h-12 rounded-2xl bg-muted/30 border-none font-bold"
                data-testid="input-notas"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !productoId || !rutaId || (isMixto ? ((parseInt(piezas) || 0) <= 0 && (parseFloat(kg) || 0) <= 0) : (!cantidad || parseFloat(cantidad) <= 0))}
              className="h-14 rounded-2xl font-black uppercase text-sm mt-2"
              data-testid="button-submit"
            >
              {loading ? "Moviendo..." : "Mover Stock a Ruta"}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
