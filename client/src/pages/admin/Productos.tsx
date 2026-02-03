import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PackageIcon, PlusIcon, RefreshCwIcon, PencilIcon, Trash2Icon } from "lucide-react";

interface Producto {
  id: number;
  nombre: string;
  precio: string;
  unidad: "PIEZA" | "KG" | "MIXTO";
  activo: boolean;
}

export default function ProductosAdminPage() {
  const { toast } = useToast();
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  
  const [form, setForm] = React.useState({
    nombre: "",
    precio: "",
    unidad: "KG" as "PIEZA" | "KG" | "MIXTO",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/productos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error cargando productos");
      
      const data = await response.json();
      setProductos(data.productos || []);
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.precio || parseFloat(form.precio) <= 0) {
      toast({ title: "Validación", description: "Completa todos los campos correctamente.", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const url = editingId ? `/api/productos/${editingId}` : "/api/productos";
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          precio: parseFloat(form.precio),
          unidad: form.unidad,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error ${editingId ? "actualizando" : "creando"} producto`);
      }

      const data = await response.json();
      toast({ title: editingId ? "Producto actualizado" : "Producto creado", description: `${data.producto.nombre} con ID #${data.producto.id}` });
      setOpen(false);
      setEditingId(null);
      setForm({ nombre: "", precio: "", unidad: "KG" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (p: Producto) => {
    setEditingId(p.id);
    setForm({ nombre: p.nombre, precio: p.precio, unidad: p.unidad });
    setOpen(true);
  };

  const handleDelete = async (p: Producto) => {
    if (!confirm(`¿Eliminar el producto "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/productos/${p.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error eliminando producto");
      }

      toast({ title: "Producto eliminado", description: p.nombre });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AppShell title="Gestión de Productos">
      <div className="grid gap-6 pb-20">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Catálogo de Productos
          </h2>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="h-9 rounded-xl font-black uppercase text-[10px] gap-2"
            >
              <RefreshCwIcon className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                setEditingId(null);
                setForm({ nombre: "", precio: "", unidad: "KG" });
                setOpen(true);
              }}
              className="h-9 rounded-xl font-black uppercase text-[10px] gap-2"
              data-testid="button-new-product"
            >
              <PlusIcon className="h-3 w-3" /> Nuevo
            </Button>
          </div>
        </div>
        
        <div className="grid gap-3">
          {loading ? (
            <Card className="p-8 text-center rounded-3xl bg-muted/20 border-dashed">
              <div className="text-sm font-bold">Cargando...</div>
            </Card>
          ) : productos.length === 0 ? (
            <Card className="p-8 text-center rounded-3xl bg-muted/20 border-dashed">
              <div className="text-sm font-bold">Sin productos</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">
                Crea tu primer producto para empezar.
              </div>
            </Card>
          ) : (
            productos.map(p => (
              <Card 
                key={p.id} 
                className="p-4 rounded-3xl border-none shadow-sm bg-card/60"
                data-testid={`card-product-${p.id}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10">
                      <PackageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[8px] font-black">
                          ID: {p.id}
                        </Badge>
                        <Badge variant="secondary" className="text-[8px] font-black uppercase">
                          {p.unidad}
                        </Badge>
                        <Badge variant={p.activo ? "default" : "destructive"} className="text-[8px] font-black">
                          {p.activo ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </div>
                      <div className="text-sm font-black">{p.nombre}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xl font-black text-primary">
                        ${parseFloat(p.precio).toFixed(2)}
                      </div>
                      <div className="text-[9px] text-muted-foreground font-medium">
                        por {p.unidad === 'KG' ? 'Kg' : p.unidad === 'MIXTO' ? 'Mixto' : 'Pieza'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(p)}
                        data-testid={`button-edit-product-${p.id}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(p)}
                        data-testid={`button-delete-product-${p.id}`}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setEditingId(null); }}>
          <DialogContent className="max-w-[95%] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-black uppercase text-center text-sm">
                {editingId ? "Editar Producto" : "Nuevo Producto"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Nombre del Producto</Label>
                <Input 
                  placeholder="Ej: Huevo, Queso, Jamón..." 
                  value={form.nombre} 
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="h-11 rounded-2xl bg-muted/30 border-none font-bold"
                  data-testid="input-nombre"
                />
              </div>
              
              <div className="grid gap-1.5">
                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Precio</Label>
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00" 
                  value={form.precio} 
                  onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                  className="h-11 rounded-2xl bg-muted/30 border-none font-bold text-center text-lg"
                  data-testid="input-precio"
                />
              </div>
              
              <div className="grid gap-1.5">
                <Label className="text-[10px] font-black uppercase ml-1 text-muted-foreground">Unidad de Venta</Label>
                <Select value={form.unidad} onValueChange={(v: "PIEZA" | "KG" | "MIXTO") => setForm(f => ({ ...f, unidad: v }))}>
                  <SelectTrigger className="h-11 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-unidad">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="KG" className="font-bold">Kilogramos (KG)</SelectItem>
                    <SelectItem value="PIEZA" className="font-bold">Piezas (PIEZA)</SelectItem>
                    <SelectItem value="MIXTO" className="font-bold">Mixto (Piezas + Kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="p-3 rounded-2xl bg-muted/30">
                <div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Vista previa</div>
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-black">{form.nombre || 'Nombre del producto'}</span>
                    <span className="text-muted-foreground"> - </span>
                    <span className="text-primary font-black">${form.precio || '0.00'}/{form.unidad}</span>
                  </div>
                </div>
              </Card>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full h-12 rounded-2xl font-black uppercase" data-testid="button-save">
                {editingId ? "Guardar Cambios" : "Crear Producto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
