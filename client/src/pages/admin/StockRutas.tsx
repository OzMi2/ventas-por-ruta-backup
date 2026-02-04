import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SearchInput } from "@/components/SearchInput";
import { useToast } from "@/hooks/use-toast";
import { PackageIcon, EditIcon, SaveIcon, XIcon } from "lucide-react";

interface Ruta {
  id: number;
  nombre: string;
}

interface InventarioItem {
  id: number;
  rutaId: number;
  productoId: number;
  cantidad: string;
  productoNombre: string;
  productoUnidad: string;
}

interface InventarioMixtoItem {
  id: number;
  rutaId: number;
  productoId: number;
  cantidadPiezas: string;
  cantidadKg: string;
  productoNombre: string;
}

export default function StockRutasPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [rutas, setRutas] = React.useState<Ruta[]>([]);
  const [rutaId, setRutaId] = React.useState<string>("");
  const [inventario, setInventario] = React.useState<InventarioItem[]>([]);
  const [inventarioMixto, setInventarioMixto] = React.useState<InventarioMixtoItem[]>([]);
  const [search, setSearch] = React.useState("");
  
  const [editItem, setEditItem] = React.useState<InventarioItem | InventarioMixtoItem | null>(null);
  const [editCantidad, setEditCantidad] = React.useState("");
  const [editPiezas, setEditPiezas] = React.useState("");
  const [editKg, setEditKg] = React.useState("");
  const [editNotas, setEditNotas] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const loadRutas = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/rutas", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.rutas || []).sort((a: Ruta, b: Ruta) => {
          const numA = parseInt(a.nombre.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.nombre.replace(/\D/g, '')) || 0;
          return numA - numB;
        });
        setRutas(sorted);
      }
    } catch (e) {
      console.error("Error cargando rutas:", e);
    }
  };

  const loadInventario = async (rId: string) => {
    if (!rId) {
      setInventario([]);
      setInventarioMixto([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/inventario/ruta/${rId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setInventario(data.inventario || []);
        setInventarioMixto(data.inventarioMixto || []);
      } else {
        toast({ title: "Error", description: "No se pudo cargar el inventario", variant: "destructive" });
      }
    } catch (e) {
      console.error("Error cargando inventario:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadRutas(); }, []);
  React.useEffect(() => { loadInventario(rutaId); }, [rutaId]);

  const rutaNombre = rutas.find(r => r.id.toString() === rutaId)?.nombre || "";

  const filteredInventario = inventario.filter(i => 
    i.productoNombre.toLowerCase().includes(search.toLowerCase())
  );
  const filteredMixto = inventarioMixto.filter(i => 
    i.productoNombre.toLowerCase().includes(search.toLowerCase())
  );

  const isMixtoItem = (item: InventarioItem | InventarioMixtoItem): item is InventarioMixtoItem => {
    return 'cantidadPiezas' in item;
  };

  const openEdit = (item: InventarioItem | InventarioMixtoItem) => {
    setEditItem(item);
    if (isMixtoItem(item)) {
      setEditPiezas(item.cantidadPiezas || "0");
      setEditKg(item.cantidadKg || "0");
      setEditCantidad("");
    } else {
      setEditCantidad(item.cantidad || "0");
      setEditPiezas("");
      setEditKg("");
    }
    setEditNotas("");
  };

  const closeEdit = () => {
    setEditItem(null);
    setEditCantidad("");
    setEditPiezas("");
    setEditKg("");
    setEditNotas("");
  };

  const handleSave = async () => {
    if (!editItem || !rutaId) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      
      if (isMixtoItem(editItem)) {
        // Update piezas first
        const resPiezas = await fetch(`/api/inventario/ruta/${rutaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            productoId: editItem.productoId,
            cantidad: editPiezas,
            tipo: "mixto_piezas",
            notas: editNotas || undefined,
          }),
        });
        
        if (!resPiezas.ok) {
          const errData = await resPiezas.json().catch(() => ({}));
          throw new Error(errData.error || "Error actualizando piezas");
        }
        
        // Update kg
        const resKg = await fetch(`/api/inventario/ruta/${rutaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            productoId: editItem.productoId,
            cantidad: editKg,
            tipo: "mixto_kg",
            notas: editNotas || undefined,
          }),
        });
        
        if (!resKg.ok) {
          const errData = await resKg.json().catch(() => ({}));
          throw new Error(errData.error || "Error actualizando kg");
        }
      } else {
        const tipo = editItem.productoUnidad === "KG" ? "kg" : "piezas";
        const res = await fetch(`/api/inventario/ruta/${rutaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            productoId: editItem.productoId,
            cantidad: editCantidad,
            tipo,
            notas: editNotas || undefined,
          }),
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Error actualizando inventario");
        }
      }
      
      toast({ title: "Guardado", description: "Inventario actualizado correctamente" });
      closeEdit();
      loadInventario(rutaId);
    } catch (e) {
      console.error("Error guardando:", e);
      const errMsg = e instanceof Error ? e.message : "No se pudo guardar";
      toast({ title: "Error", description: errMsg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Stock de Rutas">
      <div className="grid gap-4">
        <Card className="p-4 rounded-3xl border-none shadow-sm bg-card/60">
          <div className="grid gap-3">
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Modificar Stock de Rutas
            </div>
            <div className="text-sm text-muted-foreground">
              Selecciona una ruta para ver y modificar su inventario. Los cambios se registran en movimientos.
            </div>
            
            <Select value={rutaId} onValueChange={setRutaId}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-none font-bold" data-testid="select-ruta-stock">
                <SelectValue placeholder="Seleccionar ruta..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl max-h-[300px]">
                {rutas.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()} className="font-bold" data-testid={`option-ruta-stock-${r.id}`}>
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {rutaId && (
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto..." testId="search-stock-producto" />
            )}
          </div>
        </Card>

        {!rutaId ? (
          <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center">
            <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div className="mt-4 text-sm font-bold">Selecciona una ruta</div>
            <div className="mt-1 text-xs text-muted-foreground font-medium">
              Elige una ruta para ver y modificar su inventario.
            </div>
          </Card>
        ) : loading ? (
          <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center">
            <div className="text-xs font-bold text-muted-foreground uppercase">Cargando inventario...</div>
          </Card>
        ) : (
          <div className="grid gap-2">
            {filteredInventario.length === 0 && filteredMixto.length === 0 ? (
              <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center">
                <div className="text-sm font-bold">Sin productos</div>
                <div className="mt-1 text-xs text-muted-foreground font-medium">
                  No hay productos en el inventario de {rutaNombre}
                </div>
              </Card>
            ) : (
              <>
                {filteredInventario.map((item) => (
                  <Card key={`inv-${item.productoId}`} className="p-4 rounded-2xl border-none shadow-sm bg-card/60">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-black truncate">{item.productoNombre}</div>
                        <div className="mt-1 text-xs font-bold text-muted-foreground">
                          {item.productoUnidad === "KG" ? (
                            <span className="text-primary">{parseFloat(item.cantidad || "0").toFixed(2)} KG</span>
                          ) : (
                            <span className="text-primary">{parseInt(item.cantidad || "0")} Piezas</span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-9 rounded-xl font-black uppercase text-[10px] gap-1"
                        onClick={() => openEdit(item)}
                        data-testid={`button-edit-stock-${item.productoId}`}
                      >
                        <EditIcon className="h-4 w-4" /> Editar
                      </Button>
                    </div>
                  </Card>
                ))}

                {filteredMixto.map((item) => (
                  <Card key={`mixto-${item.productoId}`} className="p-4 rounded-2xl border-none shadow-sm bg-card/60">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-black truncate">{item.productoNombre}</div>
                          <span className="text-[9px] bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full font-bold">MIXTO</span>
                        </div>
                        <div className="mt-1 text-xs font-bold text-muted-foreground flex gap-3">
                          <span className="text-primary">{parseInt(item.cantidadPiezas || "0")} Piezas</span>
                          <span className="text-primary">{parseFloat(item.cantidadKg || "0").toFixed(2)} KG</span>
                        </div>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-9 rounded-xl font-black uppercase text-[10px] gap-1"
                        onClick={() => openEdit(item)}
                        data-testid={`button-edit-mixto-${item.productoId}`}
                      >
                        <EditIcon className="h-4 w-4" /> Editar
                      </Button>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        <Dialog open={!!editItem} onOpenChange={(v) => !v && closeEdit()}>
          <DialogContent className="max-w-[95%] sm:max-w-[400px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-black uppercase tracking-widest text-center">
                Modificar Stock
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-muted-foreground">
                {editItem && (isMixtoItem(editItem) ? editItem.productoNombre : (editItem as InventarioItem).productoNombre)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              {editItem && isMixtoItem(editItem) ? (
                <>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold text-muted-foreground">Piezas</label>
                    <Input
                      type="number"
                      value={editPiezas}
                      onChange={(e) => setEditPiezas(e.target.value)}
                      className="h-12 rounded-2xl bg-muted/30 border-none font-bold"
                      data-testid="input-edit-piezas"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold text-muted-foreground">Kilogramos</label>
                    <Input
                      type="number"
                      step="0.001"
                      value={editKg}
                      onChange={(e) => setEditKg(e.target.value)}
                      className="h-12 rounded-2xl bg-muted/30 border-none font-bold"
                      data-testid="input-edit-kg"
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-muted-foreground">
                    {editItem && (editItem as InventarioItem).productoUnidad === "KG" ? "Kilogramos" : "Piezas"}
                  </label>
                  <Input
                    type="number"
                    step={editItem && (editItem as InventarioItem).productoUnidad === "KG" ? "0.001" : "1"}
                    value={editCantidad}
                    onChange={(e) => setEditCantidad(e.target.value)}
                    className="h-12 rounded-2xl bg-muted/30 border-none font-bold"
                    data-testid="input-edit-cantidad"
                  />
                </div>
              )}

              <div className="grid gap-2">
                <label className="text-xs font-bold text-muted-foreground">Notas (opcional)</label>
                <Input
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  placeholder="Razón del ajuste..."
                  className="h-12 rounded-2xl bg-muted/30 border-none font-bold"
                  data-testid="input-edit-notas"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="flex-1 h-12 rounded-2xl font-black uppercase text-xs gap-2"
                  onClick={closeEdit}
                >
                  <XIcon className="h-4 w-4" /> Cancelar
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-2xl font-black uppercase text-xs gap-2"
                  onClick={handleSave}
                  disabled={saving}
                  data-testid="button-save-stock"
                >
                  <SaveIcon className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
