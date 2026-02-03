import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchDiscounts, createDiscount, deleteDiscount, type DiscountRule, type DiscountTier, type DiscountMode } from "@/services/discounts";
import { apiClient } from "@/lib/api";
import { PlusIcon, Trash2Icon, UsersIcon, PackageIcon } from "lucide-react";

interface ClienteOption {
  id: number;
  nombre: string;
  rutaId: number;
}

interface RutaOption {
  id: number;
  nombre: string;
}

interface ProductoOption {
  id: number;
  nombre: string;
  unidad: "PIEZA" | "KG" | "MIXTO";
}

type DiscountType = "volumen" | "cliente";

export default function DescuentosPage() {
  const { toast } = useToast();
  const [discounts, setDiscounts] = React.useState<DiscountRule[]>([]);
  const [clientes, setClientes] = React.useState<ClienteOption[]>([]);
  const [rutas, setRutas] = React.useState<RutaOption[]>([]);
  const [productos, setProductos] = React.useState<ProductoOption[]>([]);
  const [open, setOpen] = React.useState(false);
  
  const [form, setForm] = React.useState<{
    tipo: DiscountType;
    rutaId: number | null;
    clienteId: number | null;
    productoId: number | null;
    mode: DiscountMode;
    tiers: DiscountTier[];
  }>({
    tipo: "volumen",
    rutaId: null,
    clienteId: null,
    productoId: null,
    mode: "KG",
    tiers: [{ minQty: 1, discountAmount: 0 }],
  });

  const clientesFiltrados = form.rutaId 
    ? clientes.filter(c => c.rutaId === form.rutaId)
    : [];

  const loadData = async () => {
    try {
      const d = await fetchDiscounts();
      setDiscounts(Array.isArray(d) ? d : []);
      
      const token = localStorage.getItem("auth_token");
      const [rutasRes, clientesRes, productosRes] = await Promise.all([
        fetch("/api/rutas", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/clientes?all=true", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch("/api/productos", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      
      setRutas(rutasRes.rutas || []);
      setClientes((clientesRes.clientes || []).map((c: any) => ({ id: c.id, nombre: c.nombre, rutaId: c.rutaId })));
      setProductos((productosRes.productos || []).map((p: any) => ({ id: p.id, nombre: p.nombre, unidad: p.unidad })));
    } catch (e) {
      toast({ title: "Error", description: "No se pudo cargar la información.", variant: "destructive" });
    }
  };

  React.useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.productoId || !form.tiers.length) {
      toast({ title: "Validación", description: "Selecciona un producto y al menos un nivel de descuento.", variant: "destructive" });
      return;
    }
    
    if (form.tipo === "cliente" && !form.clienteId) {
      toast({ title: "Validación", description: "Selecciona un cliente para el descuento específico.", variant: "destructive" });
      return;
    }
    
    try {
      await createDiscount({
        productoId: form.productoId,
        mode: form.mode,
        tiers: form.tiers,
        clienteId: form.tipo === "cliente" ? form.clienteId : null,
      });
      toast({ title: "Creado", description: "Nueva regla de descuento creada." });
      setOpen(false);
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta regla de descuento?")) return;
    try {
      await deleteDiscount(id);
      toast({ title: "Eliminado", description: "Regla eliminada." });
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const updateTier = (idx: number, patch: Partial<DiscountTier>) => {
    setForm(prev => {
      const newTiers = [...prev.tiers];
      if (newTiers[idx]) {
        newTiers[idx] = { ...newTiers[idx], ...patch };
      }
      return { ...prev, tiers: newTiers };
    });
  };

  const addTier = () => {
    setForm(prev => ({ ...prev, tiers: [...prev.tiers, { minQty: 0, discountAmount: 0 }] }));
  };

  const removeTier = (idx: number) => {
    setForm(prev => ({ ...prev, tiers: prev.tiers.filter((_, i) => i !== idx) }));
  };

  const openNewDialog = () => {
    setForm({ 
      tipo: "volumen", 
      rutaId: null,
      clienteId: null, 
      productoId: null, 
      mode: "KG", 
      tiers: [{ minQty: 1, discountAmount: 0 }] 
    });
    setOpen(true);
  };

  // Separar descuentos por tipo
  const volumeDiscounts = discounts.filter(d => d.clienteId === null);
  const clientDiscounts = discounts.filter(d => d.clienteId !== null);

  return (
    <AppShell title="Gestión de Descuentos">
      <div className="grid gap-6 pb-20">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Reglas de Descuento</h2>
          <Button 
            size="sm" 
            onClick={openNewDialog} 
            className="h-9 rounded-xl font-black uppercase text-[10px] gap-2"
            data-testid="button-new-discount"
          >
            <PlusIcon className="h-3 w-3" /> Nuevo
          </Button>
        </div>
        
        {/* Descuentos por Volumen (para todos) */}
        <div className="grid gap-3">
          <div className="flex items-center gap-2 px-1">
            <PackageIcon className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Descuentos por Volumen (Aplican a todos)
            </span>
          </div>
          
          {volumeDiscounts.length === 0 ? (
            <Card className="p-6 text-center rounded-3xl bg-muted/20 border-dashed">
              <div className="text-sm font-bold">Sin descuentos por volumen</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">
                Crea un descuento que aplique a todos los clientes según la cantidad comprada.
              </div>
            </Card>
          ) : (
            volumeDiscounts.map(d => (
              <Card key={d.id} className="p-4 rounded-3xl border-none shadow-sm bg-card/60" data-testid={`card-discount-${d.id}`}>
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="text-[8px] font-black bg-blue-500">
                        TODOS
                      </Badge>
                      <Badge variant="outline" className="text-[8px] font-black uppercase border-primary text-primary">
                        {d.mode}
                      </Badge>
                    </div>
                    <div className="text-sm font-black truncate">{d.productoNombre || `Producto #${d.productoId}`}</div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => d.id && handleDelete(d.id)} 
                    className="h-7 rounded-full text-[9px] font-black uppercase"
                    data-testid={`button-delete-discount-${d.id}`}
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {d.tiers.map((t, i) => (
                    <div key={i} className="bg-background/40 p-2 rounded-xl border border-muted/50">
                      <div className="text-[7px] font-black text-muted-foreground uppercase leading-none">
                        Desde {d.mode === 'PIEZA' ? 'Pzs' : d.mode === 'KG' ? 'Kg' : 'Unidades'}
                      </div>
                      <div className="text-xs font-black">
                        {t.minQty} → <span className="text-green-500">-${t.discountAmount}/u</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Descuentos por Cliente */}
        <div className="grid gap-3">
          <div className="flex items-center gap-2 px-1">
            <UsersIcon className="h-4 w-4 text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Descuentos por Cliente (Solo para cliente específico)
            </span>
          </div>
          
          {clientDiscounts.length === 0 ? (
            <Card className="p-6 text-center rounded-3xl bg-muted/20 border-dashed">
              <div className="text-sm font-bold">Sin descuentos por cliente</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">
                Crea un descuento especial para un cliente en particular.
              </div>
            </Card>
          ) : (
            clientDiscounts.map(d => (
              <Card key={d.id} className="p-4 rounded-3xl border-none shadow-sm bg-card/60" data-testid={`card-discount-${d.id}`}>
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="text-[8px] font-black bg-orange-500">
                        CLIENTE
                      </Badge>
                      <Badge variant="outline" className="text-[8px] font-black uppercase border-primary text-primary">
                        {d.mode}
                      </Badge>
                    </div>
                    <div className="text-sm font-black truncate">{d.clienteNombre || `Cliente #${d.clienteId}`}</div>
                    <div className="text-xs text-muted-foreground font-medium">{d.productoNombre || `Producto #${d.productoId}`}</div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => d.id && handleDelete(d.id)} 
                    className="h-7 rounded-full text-[9px] font-black uppercase"
                    data-testid={`button-delete-discount-${d.id}`}
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {d.tiers.map((t, i) => (
                    <div key={i} className="bg-background/40 p-2 rounded-xl border border-muted/50">
                      <div className="text-[7px] font-black text-muted-foreground uppercase leading-none">
                        Desde {d.mode === 'PIEZA' ? 'Pzs' : d.mode === 'KG' ? 'Kg' : 'Unidades'}
                      </div>
                      <div className="text-xs font-black">
                        {t.minQty} → <span className="text-green-500">-${t.discountAmount}/u</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[95%] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-black uppercase text-center text-sm">Nueva Regla de Descuento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto px-1">
              {/* Tipo de descuento */}
              <div className="grid gap-1.5">
                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Tipo de Descuento</Label>
                <Select 
                  value={form.tipo} 
                  onValueChange={(v: DiscountType) => setForm(f => ({ ...f, tipo: v, clienteId: null }))}
                >
                  <SelectTrigger className="h-11 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="volumen" className="font-bold">Por Volumen (Aplica a todos)</SelectItem>
                    <SelectItem value="cliente" className="font-bold">Por Cliente (Solo cliente específico)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de ruta y cliente (solo si es por cliente) */}
              {form.tipo === "cliente" && (
                <>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Ruta</Label>
                    <Select 
                      value={form.rutaId?.toString() || ""} 
                      onValueChange={(v) => setForm(f => ({ ...f, rutaId: parseInt(v), clienteId: null }))}
                    >
                      <SelectTrigger className="h-11 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-ruta">
                        <SelectValue placeholder="Primero selecciona una ruta..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl max-h-60">
                        {rutas.map(r => (
                          <SelectItem key={r.id} value={r.id.toString()} className="font-bold">
                            {r.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Cliente</Label>
                    <Select 
                      value={form.clienteId?.toString() || ""} 
                      onValueChange={(v) => setForm(f => ({ ...f, clienteId: parseInt(v) }))}
                      disabled={!form.rutaId}
                    >
                      <SelectTrigger className="h-11 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-client">
                        <SelectValue placeholder={form.rutaId ? "Seleccionar cliente..." : "Selecciona una ruta primero"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl max-h-60">
                        {clientesFiltrados.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()} className="font-bold">
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Selector de producto */}
              <div className="grid gap-1.5">
                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Producto</Label>
                <Select 
                  value={form.productoId?.toString() || ""} 
                  onValueChange={(v) => {
                    const prod = productos.find(p => p.id === parseInt(v));
                    setForm(f => ({ 
                      ...f, 
                      productoId: parseInt(v),
                      mode: prod?.unidad === "PIEZA" ? "PIEZA" : "KG"
                    }));
                  }}
                >
                  <SelectTrigger className="h-11 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-product">
                    <SelectValue placeholder="Seleccionar producto..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-60">
                    {productos.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()} className="font-bold">
                        {p.nombre} ({p.unidad})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de unidad */}
              <div className="grid gap-1.5">
                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Unidad</Label>
                <Select value={form.mode} onValueChange={(v: DiscountMode) => setForm(f => ({ ...f, mode: v }))}>
                  <SelectTrigger className="h-11 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="PIEZA" className="font-bold">Por Piezas</SelectItem>
                    <SelectItem value="KG" className="font-bold">Por Kilogramos</SelectItem>
                    <SelectItem value="MIXTO" className="font-bold">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tiers de volumen */}
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">
                    Niveles de Descuento (Cantidad mínima → Descuento por unidad)
                  </Label>
                  <Button size="sm" variant="ghost" onClick={addTier} className="h-6 text-[9px] font-black uppercase gap-1">
                    <PlusIcon className="h-3 w-3" /> Añadir
                  </Button>
                </div>
                {form.tiers.map((t, i) => (
                  <div key={i} className="flex gap-2 items-center bg-muted/20 p-2 rounded-xl">
                    <div className="flex-1 grid gap-1">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">
                        Desde ({form.mode === 'PIEZA' ? 'pzs' : form.mode === 'KG' ? 'kg' : 'u'})
                      </span>
                      <Input 
                        type="number" 
                        value={t.minQty} 
                        onChange={e => updateTier(i, { minQty: Number(e.target.value) })}
                        className="h-9 rounded-xl bg-background border-none text-center font-bold"
                        data-testid={`input-tier-qty-${i}`}
                      />
                    </div>
                    <div className="flex-1 grid gap-1">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">Descuento $</span>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={t.discountAmount} 
                        onChange={e => updateTier(i, { discountAmount: Number(e.target.value) })}
                        className="h-9 rounded-xl bg-background border-none text-center font-bold"
                        data-testid={`input-tier-discount-${i}`}
                      />
                    </div>
                    {form.tiers.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeTier(i)} className="h-8 w-8 text-destructive">
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="text-[9px] text-muted-foreground bg-muted/30 p-2 rounded-xl">
                  <strong>Ejemplo:</strong> Si el precio del huevo es $31/kg y pones "Desde: 10kg, Descuento: $2", 
                  cuando un cliente compre 10kg o más, el precio será $29/kg.
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full h-12 rounded-2xl font-black uppercase" data-testid="button-save-discount">
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
