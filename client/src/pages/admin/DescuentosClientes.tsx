import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DataTable } from "@/components/DataTable";
import { descuentosClientes } from "@/services/admin";

type Row = {
  id: string;
  cliente_id: string;
  porcentaje: number;
  nota?: string;
};

function toRow(raw: any, idx: number): Row {
  return {
    id: String(raw?.id ?? idx),
    cliente_id: String(raw?.cliente_id ?? raw?.cliente ?? ""),
    porcentaje: Number(raw?.porcentaje ?? raw?.descuento ?? 0),
    nota: raw?.nota ? String(raw.nota) : "",
  };
}

export default function DescuentosClientesPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [clienteId, setClienteId] = React.useState("");
  const [porcentaje, setPorcentaje] = React.useState("0");
  const [nota, setNota] = React.useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data: any = await descuentosClientes.list();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setRows(list.map(toRow));
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    setLoading(true);
    try {
      const body = { cliente_id: clienteId.trim(), porcentaje: Number(porcentaje), nota: nota.trim() || null };
      await descuentosClientes.create(body);
      await load();
      setClienteId("");
      setPorcentaje("0");
      setNota("");
    } catch (e: any) {
      setError(e?.message || "No se pudo crear.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    setLoading(true);
    try {
      await descuentosClientes.remove(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo eliminar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Admin · Descuentos por cliente">
      <div className="grid gap-4">
        {error ? (
          <Alert variant="destructive" data-testid="alert-admin-desc-clientes-error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription data-testid="text-admin-desc-clientes-error">{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="p-4 shadow-sm" data-testid="card-admin-desc-clientes-form">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="clienteId">Cliente ID</Label>
              <Input
                id="clienteId"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                data-testid="input-admin-cliente-id"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="porcentaje">% descuento</Label>
              <Input
                id="porcentaje"
                inputMode="decimal"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                data-testid="input-admin-porcentaje"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nota">Nota</Label>
              <Input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} data-testid="input-admin-nota" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={create} disabled={loading} data-testid="button-admin-create">
              {loading ? "Guardando..." : "Crear"}
            </Button>
            <Button onClick={load} variant="secondary" disabled={loading} data-testid="button-admin-refresh">
              Refrescar
            </Button>
          </div>
        </Card>

        <DataTable
          testId="table-desc-clientes"
          rows={rows}
          rowKey={(r: Row) => r.id}
          empty={loading ? "Cargando..." : "Sin registros"}
          columns={[
            { key: "cliente", header: "Cliente", cell: (r: Row) => <span data-testid={`text-row-cliente-${r.id}`}>{r.cliente_id}</span> },
            { key: "pct", header: "%", cell: (r: Row) => <span data-testid={`text-row-pct-${r.id}`}>{r.porcentaje}</span> },
            { key: "nota", header: "Nota", cell: (r: Row) => <span data-testid={`text-row-nota-${r.id}`}>{r.nota || "-"}</span> },
            {
              key: "acciones",
              header: "Acciones",
              cell: (r: Row) => (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => remove(r.id)}
                  data-testid={`button-admin-delete-${r.id}`}
                >
                  Eliminar
                </Button>
              ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
