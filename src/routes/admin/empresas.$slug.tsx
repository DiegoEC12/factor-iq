import { useRef, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Database,
  Eye,
  Loader2,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  clearClientOperationalDataFn,
  dropDatabaseTableFn,
  getClientDatabaseFn,
  getClientTablePreviewFn,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/empresas/$slug")({
  loader: async ({ params }) => {
    try {
      return { data: await getClientDatabaseFn({ data: { slug: params.slug } }) };
    } catch (error) {
      return {
        data: {
          ready: false,
          message:
            error instanceof Error
              ? error.message
              : "No se pudo cargar la administración de datos.",
          client: null,
          tables: [],
        },
      };
    }
  },
  pendingComponent: () => (
    <div className="rounded-2xl border border-[#dfe6f7] bg-white p-8 text-sm text-slate-600">
      Cargando administración de datos…
    </div>
  ),
  head: () => ({ meta: [{ title: "Administración de datos | Factor IQ" }] }),
  component: ClientDatabasePage,
});

type Preview = { table: string; columns: string[]; rows: Record<string, unknown>[] };

function ClientDatabasePage() {
  const { data } = Route.useLoaderData();
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingTable, setLoadingTable] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [clearing, setClearing] = useState(false);
  const [dropTable, setDropTable] = useState<string | null>(null);
  const [dropConfirmation, setDropConfirmation] = useState("");
  const [dropping, setDropping] = useState(false);
  const confirmationInputRef = useRef<HTMLInputElement>(null);

  if (!data.client) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        {data.message}
      </div>
    );
  }

  const client = data.client;
  const showPreview = async (table: string) => {
    setLoadingTable(table);
    try {
      const result = await getClientTablePreviewFn({ data: { slug: client.slug, table } });
      setPreview({ table, columns: result.columns, rows: result.rows });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo leer la tabla.");
    } finally {
      setLoadingTable(null);
    }
  };

  const clearData = async () => {
    setClearing(true);
    try {
      const submittedConfirmation = confirmationInputRef.current?.value ?? confirmation;
      const normalizedConfirmation = submittedConfirmation
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();
      const result = await clearClientOperationalDataFn({
        data: { slug: client.slug, confirmation: normalizedConfirmation },
      });
      toast.success(result.message);
      setClearOpen(false);
      setConfirmation("");
      setPreview(null);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo vaciar la información.");
    } finally {
      setClearing(false);
    }
  };

  const dropTableAction = async () => {
    if (!dropTable) return;
    setDropping(true);
    try {
      const result = await dropDatabaseTableFn({
        data: { table: dropTable, confirmation: dropConfirmation },
      });
      toast.success(result.message);
      setDropTable(null);
      setDropConfirmation("");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la tabla.");
    } finally {
      setDropping(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/admin/empresas"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b5094] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a Empresas Clientes
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#eef2ff] p-3 text-[#1b2447]">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1b5094]">
                Administración de datos
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-[#1b2447]">
                {client.nombre_comercial}
              </h1>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Consulta rápida del contenido conectado a este cliente. Las operaciones destructivas
            requieren una confirmación escrita y quedan registradas en auditoría.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setClearOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
        >
          <Trash2 className="h-4 w-4" /> Vaciar datos operativos
        </button>
      </div>

      {!data.ready && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {data.message}
        </div>
      )}

      <section className="rounded-2xl border border-[#dfe6f7] bg-white p-5 shadow-[0_20px_60px_rgba(27,36,71,0.05)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[#1b2447]">Tablas del cliente</h2>
            <p className="mt-1 text-xs text-slate-500">
              Se muestran solo filas relacionadas con {client.nombre_comercial}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.invalidate()}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1b2447]"
            title="Actualizar conteos"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.tables.map((table) => (
            <div key={table.name} className="rounded-xl border border-[#e3e8f3] bg-[#f8fafc] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-slate-500">{table.name}</p>
                  <h3 className="mt-1 font-semibold text-[#1b2447]">{table.label}</h3>
                </div>
                <span className="rounded-full bg-white px-2 py-1 font-mono text-xs font-semibold text-[#1b5094]">
                  {table.rows}
                </span>
              </div>
              <p className="mt-2 min-h-8 text-xs text-slate-500">{table.description}</p>
              <button
                type="button"
                onClick={() => void showPreview(table.name)}
                disabled={loadingTable === table.name}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b5094] hover:underline disabled:opacity-50"
              >
                {loadingTable === table.name ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}{" "}
                Ver contenido simplificado
              </button>
              {table.canDrop && (
                <button
                  type="button"
                  onClick={() => setDropTable(table.name)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar tabla
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="font-semibold text-amber-900">Preparar una nueva importación</h2>
            <p className="mt-1 text-sm text-amber-800">
              “Vaciar datos operativos” elimina evaluaciones, respuestas, resultados, indicadores y
              sucursales, pero conserva el cliente, sus usuarios, el proyecto y la estructura de las
              tablas. Después puedes usar Importación segura.
            </p>
            <Link
              to="/admin/importar"
              className="mt-3 inline-block text-sm font-semibold text-amber-900 underline"
            >
              Ir a Importación segura
            </Link>
          </div>
        </div>
      </section>

      {preview && <PreviewPanel preview={preview} onClose={() => setPreview(null)} />}

      {clearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#1b2447]">Vaciar datos operativos</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Esta acción no elimina tablas ni accesos. Sí elimina los datos cargados de
                  Maquinarias y no se puede deshacer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClearOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mt-5 block text-xs font-semibold text-slate-700">
              Escribe VACIAR MAQUINARIAS para continuar
              <input
                ref={confirmationInputRef}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                placeholder="VACIAR MAQUINARIAS"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setClearOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void clearData()}
                disabled={clearing}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {clearing && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar vaciado
              </button>
            </div>
          </div>
        </div>
      )}
      {dropTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#1b2447]">Eliminar tabla adicional</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Se eliminará permanentemente{" "}
                  <span className="font-mono font-semibold text-rose-700">{dropTable}</span> del
                  esquema conectado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDropTable(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mt-5 block text-xs font-semibold text-slate-700">
              Escribe ELIMINAR TABLA {dropTable} para continuar
              <input
                value={dropConfirmation}
                onChange={(event) => setDropConfirmation(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                placeholder={`ELIMINAR TABLA ${dropTable}`}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDropTable(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void dropTableAction()}
                disabled={dropConfirmation !== `ELIMINAR TABLA ${dropTable}` || dropping}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {dropping && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewPanel({ preview, onClose }: { preview: Preview; onClose: () => void }) {
  return (
    <section className="rounded-2xl border border-[#dfe6f7] bg-white p-5 shadow-[0_20px_60px_rgba(27,36,71,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-slate-500">{preview.table}</p>
          <h2 className="font-semibold text-[#1b2447]">
            Contenido simplificado · primeras {preview.rows.length} filas
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          title="Cerrar vista previa"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#e3e8f3]">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-[#f4f7fb] text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              {preview.columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-3 py-2">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf2f7]">
            {preview.rows.length ? (
              preview.rows.map((row, index) => (
                <tr key={index} className="hover:bg-[#f8fafc]">
                  {preview.columns.map((column) => (
                    <td
                      key={column}
                      className="max-w-xs truncate whitespace-nowrap px-3 py-2 font-mono text-[11px] text-slate-600"
                    >
                      {formatCell(row[column])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={preview.columns.length}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  No hay filas para este cliente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
