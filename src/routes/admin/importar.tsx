import { useMemo, useRef, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Save,
  UploadCloud,
} from "lucide-react";
import { getIncrementalImportContextFn, saveIncrementalImportFn } from "@/lib/admin";
import { parseSafeImportExcel, type SafeImportPayload } from "@/lib/safe-excel-import";

export const Route = createFileRoute("/admin/importar")({
  loader: async () => ({ context: await getIncrementalImportContextFn() }),
  head: () => ({ meta: [{ title: "Importación segura | Factor IQ" }] }),
  component: IncrementalImportPage,
});

function IncrementalImportPage() {
  const { context } = Route.useLoaderData();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<SafeImportPayload | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const analysis = useMemo(() => {
    if (!preview) return null;
    const existing = new Set(context.existingCodes);
    const newRows = preview.evaluations.filter((item) => !existing.has(item.codigo));
    const duplicates = preview.evaluations.filter((item) => existing.has(item.codigo));
    const types = new Map<string, number>();
    for (const item of preview.evaluations)
      types.set(item.tipoEvaluacion, (types.get(item.tipoEvaluacion) ?? 0) + 1);
    return {
      newRows,
      duplicates,
      types,
      branches: new Set(
        preview.evaluations.map((item) => `${item.concesionaria}|${item.marca}|${item.ubicacion}`),
      ).size,
    };
  }, [context.existingCodes, preview]);

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    setNotice(null);
    try {
      setPreview(await parseSafeImportExcel(file));
      setFileName(file.name);
    } catch (error) {
      setPreview(null);
      setNotice(error instanceof Error ? error.message : "No se pudo analizar el Excel.");
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    if (!preview || !analysis) return;
    setSaving(true);
    setNotice(null);
    try {
      const result = await saveIncrementalImportFn({ data: preview });
      setNotice(result.message);
      await router.invalidate();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar la importación.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-400">
          Proyecto autorizado · {context.projectName ?? "Maquinarias"}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">Importación incremental segura</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          La vista previa no modifica MySQL ni los datos del dashboard. Al confirmar se insertan
          únicamente códigos nuevos en el proyecto Maquinarias (id 1), dentro de una transacción.
        </p>
      </header>
      {!context.ready && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Guardado deshabilitado</p>
              <p className="mt-1 text-xs">{context.message}</p>
            </div>
          </div>
        </div>
      )}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(event) => {
            void selectFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/50 p-10 text-center transition-colors hover:border-indigo-500 disabled:opacity-60"
        >
          <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
            {loading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <UploadCloud className="h-7 w-7" />
            )}
          </div>
          <div>
            <p className="font-semibold text-white">{fileName || "Seleccionar archivo Excel"}</p>
            <p className="mt-1 text-xs text-slate-400">
              Se requieren Evaluaciones, Indicadores y Preguntas. La selección no guarda datos.
            </p>
          </div>
        </button>
      </section>
      {notice && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">
          {notice}
        </div>
      )}
      {preview && analysis && (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat label="Leídas" value={preview.evaluations.length} />
            <Stat label="Nuevas" value={analysis.newRows.length} tone="text-emerald-400" />
            <Stat label="Existentes" value={analysis.duplicates.length} tone="text-amber-400" />
            <Stat label="Sucursales" value={analysis.branches} />
            <Stat
              label="Errores"
              value={preview.errors.length}
              tone={preview.errors.length ? "text-rose-400" : "text-emerald-400"}
            />
          </section>
          <section className="grid gap-6 lg:grid-cols-2">
            <Panel title="Distribución por tipo">
              <div className="flex flex-wrap gap-2">
                {[...analysis.types].map(([type, count]) => (
                  <span
                    key={type}
                    className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200"
                  >
                    {type}: {count}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Asesor: {preview.columns.asesor ? "columna detectada" : "no detectado"} · Fecha:{" "}
                {preview.columns.fecha ? "columna detectada" : "no detectada"}
              </p>
            </Panel>
            <Panel title="Relaciones detectadas">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <p className="text-xl font-bold text-white">{preview.indicators.length}</p>
                  <p className="text-slate-400">Indicadores</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{preview.questions.length}</p>
                  <p className="text-slate-400">Preguntas</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{analysis.branches}</p>
                  <p className="text-slate-400">Sucursales</p>
                </div>
              </div>
            </Panel>
          </section>
          {(preview.errors.length > 0 || preview.warnings.length > 0) && (
            <section className="grid gap-4 lg:grid-cols-2">
              {preview.errors.length > 0 && (
                <Issues title="Errores bloqueantes" issues={preview.errors} tone="rose" />
              )}
              {preview.warnings.length > 0 && (
                <Issues title="Advertencias" issues={preview.warnings} tone="amber" />
              )}
            </section>
          )}
          <Panel title="Evaluaciones revisables">
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Sucursal</th>
                    <th className="p-3">Fecha / asesor</th>
                    <th className="p-3">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {preview.evaluations.map((item) => {
                    const exists = context.existingCodes.includes(item.codigo);
                    return (
                      <tr key={item.codigo}>
                        <td className="p-3 font-mono text-slate-200">{item.codigo}</td>
                        <td className="p-3">{item.tipoEvaluacion}</td>
                        <td className="p-3">
                          {item.concesionaria || "Sin concesionaria"}
                          <span className="block text-slate-500">
                            {item.marca} · {item.ubicacion}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.fechaEvaluacion || "Sin fecha"}
                          <span className="block text-slate-500">
                            {item.asesorEvaluado || "Sin asesor"}
                          </span>
                        </td>
                        <td
                          className={`p-3 font-semibold ${exists ? "text-amber-400" : "text-emerald-400"}`}
                        >
                          {exists ? "Omitir" : "Insertar"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs text-slate-400">
              La confirmación vuelve a verificar duplicados en el servidor. Las evaluaciones
              existentes nunca se actualizan.
            </p>
            <button
              onClick={() => void save()}
              disabled={
                !context.ready ||
                preview.errors.length > 0 ||
                analysis.newRows.length === 0 ||
                saving
              }
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar nuevas evaluaciones en MySQL
            </button>
          </div>
        </>
      )}
    </div>
  );
}
function Stat({
  label,
  value,
  tone = "text-white",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
        {title}
      </h2>
      {children}
    </section>
  );
}
function Issues({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: string[];
  tone: "rose" | "amber";
}) {
  const cls =
    tone === "rose"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
      : "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return (
    <section className={`rounded-2xl border p-5 ${cls}`}>
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-4 w-4" />
        {title}
      </h2>
      <ul className="mt-3 max-h-40 list-disc space-y-1 overflow-auto pl-4 text-xs">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </section>
  );
}
