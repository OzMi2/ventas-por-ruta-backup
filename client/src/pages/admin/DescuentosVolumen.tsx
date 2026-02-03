import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DataTable } from "@/components/DataTable";
import { descuentosVolumen } from "@/services/admin";

type Row = {
  id: string;
  min: number;
  max: number;
  porcentaje: number;
  nota?: string;
};

function toRow(raw: any, idx: number): Row {
  return {
    id: String(raw?.id ?? idx),
    min: Number(raw?.min ?? raw?.min_kg ?? 0),
    max: Number(raw?.max ?? raw?.max_kg ?? 0),
    porcentaje: Number(raw?.porcentaje ?? raw?.descuento ?? 0),
    nota: raw?.nota ? String(raw.nota) : "",
  };
}

export default function DescuentosVolumenPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [min, setMin] = React.useState("0");
  const [max, setMax] = React.useState("0");
  const [porcentaje, setPorcentaje] = React.useState("0");
  const [nota, setNota] = React.useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data: any = await descuentosVolumen.list();
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
      const body = {
        min: Number(min),
        max: Number(max),
        porcentaje: Number(porcentaje),
        nota: nota.trim() || null,
      };
      await descuentosVolumen.create(body);
      await load();
      setMin("0");
      setMax("0");
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
      await descuentosVolumen.remove(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "No se pudo eliminar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Admin · Descuentos por volumen">
      <div className="grid gap-4">
        {error ? (
          <Alert variant="destructive" data-testid="alert-admin-desc-volumen-error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription data-testid="text-admin-desc-volumen-error">{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="p-4 shadow-sm" data-testid="card-admin-desc-volumen-form">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="grid gap-1.5">
              <Label htmlFor="min">Min</Label>
              <Input id="min" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} data-testid="input-admin-min" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="max">Max</Label>
              <Input id="max" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} data-testid="input-admin-max" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="porcentaje">% descuento</Label>
              <Input
                id="porcentaje"
                inputMode="decimal"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                data-testid="input-admin-porcentaje-vol"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nota">Nota</Label>
              <Input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} data-testid="input-admin-nota-vol" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={create} disabled={loading} data-testid="button-admin-create-vol">
              {loading ? "Guardando..." : "Crear"}
            </Button>
            <Button onClick={load} variant="secondary" disabled={loading} data-testid="button-admin-refresh-vol">
              Refrescar
            </Button>
          </div>
        </Card>

        <DataTable
          testId="table-desc-volumen"
          rows={rows}
          rowKey={(r: Row) => r.id}
          empty={loading ? "Cargando..." : "Sin registros"}
          columns={[
            { key: "min", header: "Min", cell: (r: Row) => <span data-testid={`text-row-min-${r.id}`}>{r.min}</span> },
            { key: "max", header: "Max", cell: (r: Row) => <span data-testid={`text-row-max-${r.id}`}>{r.max}</span> },
            { key: "pct", header: "%", cell: (r: Row) => <span data-testid={`text-row-pct-vol-${r.id}`}>{r.porcentaje}</span> },
            { key: "nota", header: "Nota", cell: (r: Row) => <span data-testid={`text-row-nota-vol-${r.id}`}>{r.nota || "-"}</span> },
            {
              key: "acciones",
              header: "Acciones",
              cell: (r: Row) => (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => remove(r.id)}
                  data-testid={`button-admin-delete-vol-${r.id}`}
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
