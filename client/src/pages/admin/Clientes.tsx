import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchInput } from "@/components/SearchInput";
import { useToast } from "@/hooks/use-toast";
import { UsersIcon, PlusIcon, RefreshCwIcon, PencilIcon } from "lucide-react";

interface Cliente {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  rutaId: number;
  activo: boolean;
}

interface Ruta {
  id: number;
  nombre: string;
}

export default function ClientesAdminPage() {
  const { toast } = useToast();
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [rutas, setRutas] = React.useState<Ruta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filtroRuta, setFiltroRuta] = React.useState<string>("todas");
  
  const [form, setForm] = React.useState({
    nombre: "",
    direccion: "",
    telefono: "",
    rutaId: "",
  });
  const [editingCliente, setEditingCliente] = React.useState<Cliente | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    nombre: "",
    direccion: "",
    telefono: "",
    rutaId: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [rutasRes, clientesRes] = await Promise.all([
        fetch("/api/rutas", { headers }),
        fetch("/api/clientes/todos", { headers }),
      ]);
      
      if (!rutasRes.ok) throw new Error("Error cargando rutas");
      
      const rutasData = await rutasRes.json();
      const rutasOrdenadas = (rutasData.rutas || []).sort((a: Ruta, b: Ruta) => {
        const numA = parseInt(a.nombre.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.nombre.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      setRutas(rutasOrdenadas);
      
      if (clientesRes.ok) {
        const clientesData = await clientesRes.json();
        setClientes(clientesData.clientes || []);
      } else {
        const firstRutaId = rutasData.rutas?.[0]?.id;
        if (firstRutaId) {
          const res = await fetch(`/api/clientes?rutaId=${firstRutaId}`, { headers });
          if (res.ok) {
            const data = await res.json();
            setClientes(data.clientes || []);
          }
        }
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadClientesByRuta = async (rutaId: string) => {
    if (rutaId === "todas") {
      loadData();
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/clientes?rutaId=${rutaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Error cargando clientes");
      
      const data = await response.json();
      setClientes(data.clientes || []);
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los clientes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.rutaId) {
      toast({ title: "Validación", description: "Nombre y ruta son requeridos.", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          rutaId: parseInt(form.rutaId),
          direccion: form.direccion.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error creando cliente");
      }

      const data = await response.json();
      toast({ title: "Éxito", description: `Cliente #${data.cliente.id} creado correctamente.` });
      setOpen(false);
      setForm({ nombre: "", direccion: "", telefono: "", rutaId: "" });
      
      if (filtroRuta === "todas" || filtroRuta === form.rutaId) {
        loadClientesByRuta(filtroRuta);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const openEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setEditForm({
      nombre: cliente.nombre,
      direccion: cliente.direccion || "",
      telefono: cliente.telefono || "",
      rutaId: String(cliente.rutaId),
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCliente || !editForm.nombre.trim() || !editForm.rutaId) {
      toast({ title: "Validación", description: "Nombre y ruta son requeridos.", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/clientes/${editingCliente.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: editForm.nombre.trim(),
          rutaId: parseInt(editForm.rutaId),
          direccion: editForm.direccion.trim() || null,
          telefono: editForm.telefono.trim() || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error actualizando cliente");
      }

      toast({ title: "Éxito", description: `Cliente #${editingCliente.id} actualizado.` });
      setEditOpen(false);
      setEditingCliente(null);
      loadClientesByRuta(filtroRuta);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const filtered = clientes
    .filter((c) =>
      `${c.id} ${c.nombre} ${c.direccion || ""} ${c.telefono || ""}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.id - b.id);

  const getRutaNombre = (rutaId: number) => rutas.find((r) => r.id === rutaId)?.nombre || `Ruta ${rutaId}`;

  return (
    <AppShell title="Admin · Clientes">
      <div className="grid gap-4">
        <Card className="p-4 rounded-3xl border-none shadow-sm bg-card/60">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground" data-testid="text-clientes-header">
                  Gestión de Clientes
                </div>
                <div className="text-sm font-bold" data-testid="text-clientes-count">
                  {clientes.length} clientes
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="h-10 rounded-2xl font-black uppercase text-[10px] gap-2"
                  onClick={() => loadClientesByRuta(filtroRuta)}
                  disabled={loading}
                  data-testid="button-refresh-clientes"
                >
                  <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  className="h-10 rounded-2xl font-black uppercase text-[10px] gap-2"
                  onClick={() => setOpen(true)}
                  data-testid="button-nuevo-cliente"
                >
                  <PlusIcon className="h-4 w-4" /> Nuevo
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Filtrar por Ruta</label>
                <Select 
                  value={filtroRuta} 
                  onValueChange={(v) => {
                    setFiltroRuta(v);
                    loadClientesByRuta(v);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-none font-bold text-sm" data-testid="select-filtro-ruta">
                    <SelectValue placeholder="Todas las rutas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60 overflow-y-auto">
                    <SelectItem value="todas" className="font-bold">Todas las rutas</SelectItem>
                    {rutas.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)} className="font-bold">
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Buscar</label>
                <SearchInput value={search} onChange={setSearch} placeholder="ID, nombre, dirección..." testId="search-clientes" />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-2">
          {loading ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="loading-clientes">
              <div className="text-xs font-bold text-muted-foreground uppercase">Cargando…</div>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-10 rounded-3xl border-dashed bg-muted/20 text-center" data-testid="empty-clientes">
              <div className="text-sm font-bold">Sin clientes</div>
              <div className="mt-1 text-xs text-muted-foreground font-medium">
                {clientes.length > 0 ? "Sin coincidencias con la búsqueda." : "No hay clientes registrados."}
              </div>
            </Card>
          ) : (
            filtered.map((c) => (
              <Card key={c.id} className="p-4 rounded-2xl border-none shadow-sm bg-card/60" data-testid={`card-cliente-${c.id}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="h-5 text-[9px] font-black" data-testid={`badge-cliente-id-${c.id}`}>
                        #{c.id}
                      </Badge>
                      <Badge variant={c.activo ? "default" : "secondary"} className="h-5 text-[9px] font-black uppercase">
                        {c.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm font-black" data-testid={`text-cliente-nombre-${c.id}`}>
                      {c.nombre}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-[11px] font-bold text-muted-foreground flex-wrap">
                      <span data-testid={`text-cliente-ruta-${c.id}`}>
                        Ruta: <span className="text-foreground">{getRutaNombre(c.rutaId)}</span>
                      </span>
                      {c.telefono && (
                        <span data-testid={`text-cliente-telefono-${c.id}`}>
                          Tel: <span className="text-foreground">{c.telefono}</span>
                        </span>
                      )}
                    </div>
                    {c.direccion && (
                      <div className="mt-1 text-[11px] font-medium text-muted-foreground" data-testid={`text-cliente-direccion-${c.id}`}>
                        {c.direccion}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(c)}
                    data-testid={`button-edit-cliente-${c.id}`}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95%] sm:max-w-[420px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-center">
              Nuevo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre" className="text-xs font-bold uppercase">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre del cliente"
                className="h-12 rounded-xl bg-muted/30 border-none"
                data-testid="input-cliente-nombre"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ruta" className="text-xs font-bold uppercase">Ruta *</Label>
              <Select value={form.rutaId} onValueChange={(v) => setForm({ ...form, rutaId: v })}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none font-bold" data-testid="select-cliente-ruta">
                  <SelectValue placeholder="Seleccionar ruta..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60 overflow-y-auto">
                  {rutas.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)} className="font-bold">
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="direccion" className="text-xs font-bold uppercase">Dirección</Label>
              <Input
                id="direccion"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Dirección (opcional)"
                className="h-12 rounded-xl bg-muted/30 border-none"
                data-testid="input-cliente-direccion"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telefono" className="text-xs font-bold uppercase">Teléfono</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="Teléfono (opcional)"
                className="h-12 rounded-xl bg-muted/30 border-none"
                data-testid="input-cliente-telefono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} className="rounded-xl font-bold" data-testid="button-cancelar-cliente">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl font-bold" data-testid="button-guardar-cliente">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[95%] sm:max-w-[420px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-center">
              Editar Cliente #{editingCliente?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nombre" className="text-xs font-bold uppercase">Nombre *</Label>
              <Input
                id="edit-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                placeholder="Nombre del cliente"
                className="h-12 rounded-xl bg-muted/30 border-none"
                data-testid="input-edit-cliente-nombre"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-ruta" className="text-xs font-bold uppercase">Ruta *</Label>
              <Select value={editForm.rutaId} onValueChange={(v) => setEditForm({ ...editForm, rutaId: v })}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none font-bold" data-testid="select-edit-cliente-ruta">
                  <SelectValue placeholder="Seleccionar ruta..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60 overflow-y-auto">
                  {rutas.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)} className="font-bold">
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-direccion" className="text-xs font-bold uppercase">Dirección</Label>
              <Input
                id="edit-direccion"
                value={editForm.direccion}
                onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                placeholder="Dirección (opcional)"
                className="h-12 rounded-xl bg-muted/30 border-none"
                data-testid="input-edit-cliente-direccion"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-telefono" className="text-xs font-bold uppercase">Teléfono</Label>
              <Input
                id="edit-telefono"
                value={editForm.telefono}
                onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                placeholder="Teléfono (opcional)"
                className="h-12 rounded-xl bg-muted/30 border-none"
                data-testid="input-edit-cliente-telefono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)} className="rounded-xl font-bold" data-testid="button-cancelar-edit-cliente">
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} className="rounded-xl font-bold" data-testid="button-guardar-edit-cliente">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
