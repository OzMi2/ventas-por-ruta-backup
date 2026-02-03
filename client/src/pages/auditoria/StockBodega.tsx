import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PackageIcon, RefreshCwIcon, SearchIcon, ScaleIcon, Trash2Icon, PencilIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface BodegaItem {
  id: number;
  productoId: number;
  cantidad: string;
  productoNombre: string;
  productoUnidad: string;
  ultimaActualizacion: string;
}

interface BodegaMixtoItem {
  id: number;
  productoId: number;
  cantidadPiezas: string;
  cantidadKg: string;
  productoNombre: string;
  ultimaActualizacion: string;
}

export default function StockBodegaPage() {
  const { toast } = useToast();
  const [inventario, setInventario] = React.useState<BodegaItem[]>([]);
  const [inventarioMixto, setInventarioMixto] = React.useState<BodegaMixtoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState("");
  
  const [editItem, setEditItem] = React.useState<BodegaItem | null>(null);
  const [editCantidad, setEditCantidad] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<BodegaItem | null>(null);
  
  const [editMixtoItem, setEditMixtoItem] = React.useState<BodegaMixtoItem | null>(null);
  const [editMixtoPiezas, setEditMixtoPiezas] = React.useState("");
  const [editMixtoKg, setEditMixtoKg] = React.useState("");
  const [confirmDeleteMixto, setConfirmDeleteMixto] = React.useState<BodegaMixtoItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const [response, mixtoResponse] = await Promise.all([
        fetch("/api/bodega", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/bodega/mixto", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      if (!response.ok) throw new Error("Error cargando bodega");
      
      const data = await response.json();
      setInventario(data.inventario || []);
      
      if (mixtoResponse.ok) {
        const mixtoData = await mixtoResponse.json();
        setInventarioMixto(mixtoData.inventario || []);
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudo cargar el inventario de bodega.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadData(); }, []);

  const openEdit = (item: BodegaItem) => {
    setEditItem(item);
    setEditCantidad(parseFloat(item.cantidad).toString());
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/bodega/${editItem.productoId}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cantidad: parseFloat(editCantidad) || 0 }),
      });
      
      if (!response.ok) throw new Error("Error actualizando");
      
      toast({ title: "Actualizado", description: "Stock actualizado correctamente." });
      setEditItem(null);
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo actualizar el stock.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/bodega/${confirmDelete.productoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error eliminando");
      
      toast({ title: "Eliminado", description: "Producto eliminado de bodega." });
      setConfirmDelete(null);
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEditMixto = (item: BodegaMixtoItem) => {
    setEditMixtoItem(item);
    setEditMixtoPiezas((parseInt(item.cantidadPiezas) || 0).toString());
    setEditMixtoKg((parseFloat(item.cantidadKg) || 0).toString());
  };

  const handleSaveMixtoEdit = async () => {
    if (!editMixtoItem) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/bodega/mixto/${editMixtoItem.productoId}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          piezas: parseInt(editMixtoPiezas) || 0,
          kg: parseFloat(editMixtoKg) || 0
        }),
      });
      
      if (!response.ok) throw new Error("Error actualizando");
      
      toast({ title: "Actualizado", description: "Stock MIXTO actualizado correctamente." });
      setEditMixtoItem(null);
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo actualizar el stock.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMixto = async () => {
    if (!confirmDeleteMixto) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/bodega/mixto/${confirmDeleteMixto.productoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error eliminando");
      
      toast({ title: "Eliminado", description: "Producto MIXTO eliminado de bodega." });
      setConfirmDeleteMixto(null);
      loadData();
    } catch (e) {
      toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const inventarioFiltrado = busqueda.trim() 
    ? inventario.filter(item => 
        item.productoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.productoId.toString().includes(busqueda)
      )
    : inventario;

  const inventarioMixtoFiltrado = busqueda.trim()
    ? inventarioMixto.filter(item =>
        item.productoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.productoId.toString().includes(busqueda)
      )
    : inventarioMixto;

  const totalItems = inventarioFiltrado.length + inventarioMixtoFiltrado.length;

  return (
    <AppShell title="Stock de Bodega">
      <div className="grid gap-6 pb-20">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Inventario Central
          </h2>
          <Button 
            size="sm" 
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="h-9 rounded-xl font-black uppercase text-[10px] gap-2"
            data-testid="button-refresh"
          >
            <RefreshCwIcon className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            className="h-11 pl-10 rounded-2xl bg-muted/30 border-none font-bold"
            data-testid="input-busqueda-bodega"
          />
        </div>

        <Card className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-none">
          <div className="text-[9px] font-black uppercase text-muted-foreground">Productos</div>
          <div className="text-2xl font-black text-blue-500">{totalItems}</div>
        </Card>
        
        <div className="grid gap-3">
          {loading ? (
            <Card className="p-8 text-center rounded-3xl bg-muted/20 border-dashed">
              <div className="text-sm font-bold">Cargando...</div>
            </Card>
          ) : (inventarioFiltrado.length === 0 && inventarioMixtoFiltrado.length === 0) ? (
            <Card className="p-8 text-center rounded-3xl bg-muted/20 border-dashed">
              <div className="text-sm font-bold">{busqueda ? "Sin coincidencias" : "Sin productos en bodega"}</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">
                {busqueda ? "No hay productos que coincidan con la búsqueda." : "Registra entradas de stock desde \"Entrada bodega\"."}
              </div>
            </Card>
          ) : (
            <>
              {inventarioMixtoFiltrado.map(item => (
                <Card 
                  key={`mixto-${item.id}`} 
                  className="p-4 rounded-3xl border-none shadow-sm bg-card/60"
                  data-testid={`card-bodega-mixto-item-${item.productoId}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-500/10">
                        <ScaleIcon className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[8px] font-black">
                            ID: {item.productoId}
                          </Badge>
                          <Badge className="text-[8px] font-black uppercase bg-purple-500">
                            MIXTO
                          </Badge>
                        </div>
                        <div className="text-sm font-black mt-1">{item.productoNombre}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <div className="text-lg font-black text-primary">
                            {parseInt(item.cantidadPiezas) || 0}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-medium">
                            Piezas
                          </div>
                        </div>
                        <div className="text-muted-foreground font-bold">/</div>
                        <div className="text-center">
                          <div className="text-lg font-black text-purple-500">
                            {parseFloat(item.cantidadKg).toFixed(2)}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-medium">
                            Kg
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => openEditMixto(item)}
                          data-testid={`button-edit-mixto-${item.productoId}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-lg text-destructive"
                          onClick={() => setConfirmDeleteMixto(item)}
                          data-testid={`button-delete-mixto-${item.productoId}`}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {inventarioFiltrado.map(item => (
                <Card 
                  key={item.id} 
                  className="p-4 rounded-3xl border-none shadow-sm bg-card/60"
                  data-testid={`card-bodega-item-${item.productoId}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10">
                        <PackageIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[8px] font-black">
                            ID: {item.productoId}
                          </Badge>
                          <Badge variant="secondary" className="text-[8px] font-black uppercase">
                            {item.productoUnidad}
                          </Badge>
                        </div>
                        <div className="text-sm font-black mt-1">{item.productoNombre}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xl font-black text-primary">
                          {parseFloat(item.cantidad).toFixed(2)}
                        </div>
                        <div className="text-[9px] text-muted-foreground font-medium">
                          {item.productoUnidad === 'KG' ? 'Kilogramos' : 'Piezas'}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => openEdit(item)}
                          data-testid={`button-edit-${item.productoId}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-lg text-destructive"
                          onClick={() => setConfirmDelete(item)}
                          data-testid={`button-delete-${item.productoId}`}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-[90%] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase">Editar Stock</DialogTitle>
            <DialogDescription>
              Modifica la cantidad de {editItem?.productoNombre} en bodega.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 mt-2">
            <div className="grid gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Cantidad ({editItem?.productoUnidad === 'KG' ? 'Kilogramos' : 'Piezas'})
              </label>
              <Input
                type="number"
                step={editItem?.productoUnidad === 'KG' ? '0.001' : '1'}
                min="0"
                value={editCantidad}
                onChange={(e) => setEditCantidad(e.target.value)}
                className="h-12 text-lg font-bold rounded-2xl bg-muted/30 border-none text-center"
                data-testid="input-edit-cantidad"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-2xl font-bold"
                onClick={() => setEditItem(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-12 rounded-2xl font-bold"
                onClick={handleSaveEdit}
                disabled={saving}
                data-testid="button-save-edit"
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="max-w-[90%] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-destructive">Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar {confirmDelete?.productoNombre} del inventario de bodega? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold"
              onClick={() => setConfirmDelete(null)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-12 rounded-2xl font-bold"
              onClick={handleDelete}
              disabled={saving}
              data-testid="button-confirm-delete"
            >
              {saving ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editMixtoItem} onOpenChange={(open) => !open && setEditMixtoItem(null)}>
        <DialogContent className="max-w-[90%] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase">Editar Stock MIXTO</DialogTitle>
            <DialogDescription>
              Modifica las cantidades de {editMixtoItem?.productoNombre} en bodega.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 mt-2">
            <div className="grid gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Piezas
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                value={editMixtoPiezas}
                onChange={(e) => setEditMixtoPiezas(e.target.value)}
                className="h-12 text-lg font-bold rounded-2xl bg-muted/30 border-none text-center"
                data-testid="input-edit-mixto-piezas"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Kilogramos
              </label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={editMixtoKg}
                onChange={(e) => setEditMixtoKg(e.target.value)}
                className="h-12 text-lg font-bold rounded-2xl bg-muted/30 border-none text-center"
                data-testid="input-edit-mixto-kg"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-2xl font-bold"
                onClick={() => setEditMixtoItem(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-12 rounded-2xl font-bold"
                onClick={handleSaveMixtoEdit}
                disabled={saving}
                data-testid="button-save-edit-mixto"
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteMixto} onOpenChange={(open) => !open && setConfirmDeleteMixto(null)}>
        <DialogContent className="max-w-[90%] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-destructive">Eliminar Producto MIXTO</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar {confirmDeleteMixto?.productoNombre} del inventario de bodega? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold"
              onClick={() => setConfirmDeleteMixto(null)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-12 rounded-2xl font-bold"
              onClick={handleDeleteMixto}
              disabled={saving}
              data-testid="button-confirm-delete-mixto"
            >
              {saving ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
