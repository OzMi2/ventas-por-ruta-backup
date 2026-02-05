import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusIcon, PencilIcon, TrashIcon, MapPinIcon, Loader2Icon, UserIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Ruta = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
};

type Vendedor = {
  id: number;
  nombre: string;
  username: string;
  rutaId: number | null;
};

async function fetchRutas(): Promise<Ruta[]> {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    console.error("No token found");
    return [];
  }
  const res = await fetch("/api/rutas?all=true", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error("Fetch rutas failed:", res.status, res.statusText);
    throw new Error("Error fetching rutas");
  }
  const data = await res.json();
  return data.rutas || [];
}

async function fetchVendedores(): Promise<Vendedor[]> {
  const token = localStorage.getItem("auth_token");
  if (!token) return [];
  const res = await fetch("/api/usuarios/vendedores", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.vendedores || [];
}

async function createRuta(data: { nombre: string; descripcion: string; vendedorId?: number; vendedorNombre?: string; vendedorPassword?: string }) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch("/api/rutas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error creating ruta");
  return res.json();
}

async function updateRuta(id: number, data: { nombre: string; descripcion: string; activa: boolean; vendedorId?: number; vendedorNombre?: string; vendedorPassword?: string }) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`/api/rutas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error updating ruta");
  return res.json();
}

async function deleteRuta(id: number) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`/api/rutas/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error deleting ruta");
  return res.json();
}

async function toggleRutaActiva(id: number, activa: boolean) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`/api/rutas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ activa }),
  });
  if (!res.ok) throw new Error("Error toggling ruta");
  return res.json();
}

export default function AdminRutas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRuta, setEditingRuta] = React.useState<Ruta | null>(null);
  const [formData, setFormData] = React.useState({ 
    nombre: "", 
    descripcion: "", 
    activa: true, 
    vendedorId: "",
    vendedorNombre: "",
    vendedorPassword: ""
  });

  const { data: rutas = [], isLoading } = useQuery({
    queryKey: ["rutas-admin"],
    queryFn: fetchRutas,
  });

  const { data: vendedores = [] } = useQuery({
    queryKey: ["vendedores"],
    queryFn: fetchVendedores,
  });

  const createMutation = useMutation({
    mutationFn: createRuta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rutas-admin"] });
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      toast({ title: "Ruta creada correctamente" });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast({ title: "Error al crear ruta", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nombre: string; descripcion: string; activa: boolean; vendedorId?: number; vendedorNombre?: string; vendedorPassword?: string } }) =>
      updateRuta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rutas-admin"] });
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      toast({ title: "Ruta actualizada correctamente" });
      setDialogOpen(false);
      setEditingRuta(null);
      resetForm();
    },
    onError: () => toast({ title: "Error al actualizar ruta", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRuta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rutas-admin"] });
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      toast({ title: "Ruta eliminada correctamente" });
    },
    onError: () => toast({ title: "Error al eliminar ruta", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) => toggleRutaActiva(id, activa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rutas-admin"] });
      toast({ title: "Estado de ruta actualizado" });
    },
    onError: () => toast({ title: "Error al cambiar estado", variant: "destructive" }),
  });

  function resetForm() {
    setFormData({ nombre: "", descripcion: "", activa: true, vendedorId: "", vendedorNombre: "", vendedorPassword: "" });
  }

  function openCreate() {
    setEditingRuta(null);
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(ruta: Ruta) {
    setEditingRuta(ruta);
    const vendedorAsignado = vendedores.find(v => v.rutaId === ruta.id);
    setFormData({ 
      nombre: ruta.nombre, 
      descripcion: ruta.descripcion || "", 
      activa: ruta.activa, 
      vendedorId: vendedorAsignado ? String(vendedorAsignado.id) : "",
      vendedorNombre: vendedorAsignado?.nombre || "",
      vendedorPassword: ""
    });
    setDialogOpen(true);
  }

  function handleDelete(ruta: Ruta) {
    deleteMutation.mutate(ruta.id);
  }

  function handleToggleActiva(ruta: Ruta) {
    toggleMutation.mutate({ id: ruta.id, activa: !ruta.activa });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast({ title: "El nombre es requerido", variant: "destructive" });
      return;
    }
    const vendedorId = formData.vendedorId ? parseInt(formData.vendedorId) : undefined;
    const payload = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      activa: formData.activa,
      vendedorId,
      vendedorNombre: formData.vendedorNombre || undefined,
      vendedorPassword: formData.vendedorPassword || undefined,
    };
    
    if (editingRuta) {
      updateMutation.mutate({ id: editingRuta.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function getVendedorForRuta(rutaId: number): Vendedor | undefined {
    return vendedores.find(v => v.rutaId === rutaId);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AppShell title="Gestionar Rutas">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" data-testid="text-rutas-title">Rutas ({rutas.length})</h2>
          <Button onClick={openCreate} data-testid="button-create-ruta">
            <PlusIcon className="mr-2 h-4 w-4" />
            Nueva Ruta
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rutas.map((ruta) => {
              const vendedor = getVendedorForRuta(ruta.id);
              return (
                <Card key={ruta.id} className={!ruta.activa ? "opacity-60" : ""} data-testid={`card-ruta-${ruta.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPinIcon className="h-4 w-4 text-primary" />
                        {ruta.nombre}
                      </CardTitle>
                      <Badge 
                        variant={ruta.activa ? "default" : "secondary"}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => handleToggleActiva(ruta)}
                        data-testid={`badge-toggle-${ruta.id}`}
                      >
                        {ruta.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {ruta.descripcion || "Sin descripción"}
                    </p>
                    {vendedor && (
                      <div className="flex items-center gap-1 text-sm text-primary mb-3">
                        <UserIcon className="h-3 w-3" />
                        <span>{vendedor.nombre}</span>
                        <span className="text-muted-foreground">({vendedor.username})</span>
                      </div>
                    )}
                    {!vendedor && (
                      <p className="text-sm text-orange-500 mb-3">Sin vendedor asignado</p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(ruta)} data-testid={`button-edit-ruta-${ruta.id}`}>
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(ruta)} 
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-ruta-${ruta.id}`}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <TrashIcon className="h-3 w-3 mr-1" />
                        )}
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRuta ? "Editar Ruta" : "Nueva Ruta"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Ruta</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Ruta Centro"
                    data-testid="input-ruta-nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción opcional"
                    data-testid="input-ruta-descripcion"
                  />
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Vendedor Asignado</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="vendedor">Seleccionar Vendedor</Label>
                      <Select
                        value={formData.vendedorId}
                        onValueChange={(value) => {
                          const vendedor = vendedores.find(v => String(v.id) === value);
                          setFormData({ 
                            ...formData, 
                            vendedorId: value,
                            vendedorNombre: vendedor?.nombre || ""
                          });
                        }}
                      >
                        <SelectTrigger data-testid="select-vendedor">
                          <SelectValue placeholder="Seleccionar vendedor..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {vendedores
                            .filter(v => !v.rutaId || (editingRuta && v.rutaId === editingRuta.id))
                            .map((v) => (
                              <SelectItem key={v.id} value={String(v.id)}>
                                {v.nombre} ({v.username})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.vendedorId && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="vendedorNombre">Nombre del Vendedor</Label>
                          <Input
                            id="vendedorNombre"
                            value={formData.vendedorNombre}
                            onChange={(e) => setFormData({ ...formData, vendedorNombre: e.target.value })}
                            placeholder="Nombre del vendedor"
                            data-testid="input-vendedor-nombre"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vendedorPassword">Nueva Contraseña (dejar vacío para no cambiar)</Label>
                          <Input
                            id="vendedorPassword"
                            type="password"
                            value={formData.vendedorPassword}
                            onChange={(e) => setFormData({ ...formData, vendedorPassword: e.target.value })}
                            placeholder="••••••••"
                            data-testid="input-vendedor-password"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} data-testid="button-save-ruta">
                  {isSaving && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRuta ? "Guardar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
