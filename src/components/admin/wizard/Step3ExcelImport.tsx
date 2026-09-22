import { useState, useRef } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building,
  Target,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileCheck,
} from "lucide-react";
import { parseExcelFile, type ParsedExcelResult } from "@/lib/excel-import";

export interface ServiceData {
  nombre: string;
  periodo: string;
  tipo: string;
}

interface Step3ExcelImportProps {
  serviceData: ServiceData;
  excelResult: ParsedExcelResult | null;
  onServiceDataChange: (updated: Partial<ServiceData>) => void;
  onExcelParsed: (result: ParsedExcelResult) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3ExcelImport({
  serviceData,
  excelResult,
  onServiceDataChange,
  onExcelParsed,
  onNext,
  onBack,
}: Step3ExcelImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<"evaluaciones" | "indicadores" | "preguntas">(
    "evaluaciones",
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Por favor selecciona un archivo Excel válido (.xlsx o .xls).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsed = await parseExcelFile(file);
      onExcelParsed(parsed);
      if (!serviceData.nombre) {
        onServiceDataChange({
          nombre: `Estudio Mystery Shopper - ${file.name.replace(/\.[^/.]+$/, "")}`,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al procesar el archivo Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceData.nombre.trim()) {
      setError("El nombre del servicio o estudio de Mystery Shopper es obligatorio.");
      return;
    }
    if (!excelResult || excelResult.evaluations.length === 0) {
      setError("Debes subir y validar un archivo Excel con evaluaciones antes de continuar.");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
            Paso 3: Carga y Validación del Archivo Excel de Mystery Shopper
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            El sistema inspeccionará el archivo .xlsx, verificará las hojas relacionales (Evaluaciones, Indicadores, Preguntas) y generará una previsualización interactiva antes de persistir en base de datos.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Datos del Proyecto/Servicio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nombre del Servicio / Proyecto <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={serviceData.nombre}
              onChange={(e) => onServiceDataChange({ nombre: e.target.value })}
              placeholder="Ej. Mystery Shopping Red Nacional 2025"
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Periodo del Levantamiento
            </label>
            <input
              type="text"
              value={serviceData.periodo}
              onChange={(e) => onServiceDataChange({ periodo: e.target.value })}
              placeholder="Ej. 2025 - Q1 / Base Consolidada"
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Zona Drag & Drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
              : excelResult
                ? "border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-400"
                : "border-slate-700 hover:border-slate-600 bg-slate-950/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${
              excelResult
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
            }`}
          >
            {loading ? (
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
            ) : excelResult ? (
              <FileCheck className="h-7 w-7" />
            ) : (
              <UploadCloud className="h-7 w-7" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              {excelResult ? (
                <span className="text-emerald-400">
                  Archivo cargado: {excelResult.fileName} ({Math.round(excelResult.fileSize / 1024)} KB)
                </span>
              ) : (
                "Arrastra tu archivo Excel aquí o haz clic para examinar"
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Formato soportado: .xlsx (requiere hojas: Evaluaciones, Indicadores, Preguntas)
            </p>
          </div>

          {excelResult && (
            <span className="text-xs text-slate-400 underline hover:text-slate-200">
              Haz clic para seleccionar otro archivo
            </span>
          )}
        </div>

        {/* Etapa de Pre-importación / Preview */}
        {excelResult && (
          <div className="space-y-5 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Resumen de Pre-importación y Métricas Detectadas
              </h4>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                Estructura Validada
              </span>
            </div>

            {/* Tarjetas de Métricas Pre-importación */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <FileCheck className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Evaluaciones</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {excelResult.stats.totalEvaluaciones}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Building className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Sucursales</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {excelResult.stats.totalSucursales}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Target className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Criterios / Ind.</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {excelResult.stats.totalIndicadores}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                  <span>Preguntas</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {excelResult.stats.totalPreguntas}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
                  <span>Promedio Calc.</span>
                </div>
                <div className="text-lg font-bold text-indigo-300">
                  {excelResult.stats.promedioPuntaje}%
                </div>
              </div>
            </div>

            {/* Inconsistencias o Advertencias */}
            {excelResult.stats.inconsistencias.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Advertencias de datos detectadas ({excelResult.stats.inconsistencias.length}):</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-300 text-[11px]">
                  {excelResult.stats.inconsistencias.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pestañas de Vista Previa Tabular */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("evaluaciones")}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                    activePreviewTab === "evaluaciones"
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Vista Previa: Evaluaciones ({excelResult.evaluations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("indicadores")}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                    activePreviewTab === "indicadores"
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Vista Previa: Indicadores ({excelResult.indicators.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("preguntas")}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                    activePreviewTab === "preguntas"
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Vista Previa: Checklist / Preguntas ({excelResult.questions.length})
                </button>
              </div>

              {/* Contenedor con scroll para la tabla */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80">
                {activePreviewTab === "evaluaciones" && (
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="p-2.5">Código / ID</th>
                        <th className="p-2.5">Sucursal / Concesionaria</th>
                        <th className="p-2.5">Marca</th>
                        <th className="p-2.5">Ubicación</th>
                        <th className="p-2.5">Canal</th>
                        <th className="p-2.5 text-right">Puntaje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {excelResult.evaluations.slice(0, 10).map((ev: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-2.5 text-indigo-400 font-semibold">{ev.id}</td>
                          <td className="p-2.5 font-sans text-slate-200">{ev.concesionaria}</td>
                          <td className="p-2.5 font-sans">{ev.marca}</td>
                          <td className="p-2.5 font-sans">{ev.ubicacion}</td>
                          <td className="p-2.5 font-sans">{ev.tipoEvaluacion}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-400">
                            {Math.round(ev.puntaje * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activePreviewTab === "indicadores" && (
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="p-2.5">Ev. ID</th>
                        <th className="p-2.5">N°</th>
                        <th className="p-2.5">Criterio / Indicador</th>
                        <th className="p-2.5">Peso</th>
                        <th className="p-2.5 text-right">Cumplimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {excelResult.indicators.slice(0, 10).map((ind, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-2.5 text-indigo-400">{ind.ev}</td>
                          <td className="p-2.5">{ind.n}</td>
                          <td className="p-2.5 font-sans text-slate-200">{ind.nombre}</td>
                          <td className="p-2.5">{Math.round(ind.peso * 100)}%</td>
                          <td className="p-2.5 text-right font-bold text-emerald-400">
                            {Math.round(ind.cumpl * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activePreviewTab === "preguntas" && (
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="p-2.5">Ev. ID</th>
                        <th className="p-2.5">Criterio</th>
                        <th className="p-2.5">Pregunta</th>
                        <th className="p-2.5">Respuesta</th>
                        <th className="p-2.5 text-right">Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {excelResult.questions.slice(0, 10).map((q, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-2.5 text-indigo-400">{q.ev}</td>
                          <td className="p-2.5 font-sans">{q.indicador}</td>
                          <td className="p-2.5 font-sans text-slate-200 truncate max-w-xs">{q.q}</td>
                          <td className="p-2.5 font-sans">{q.resp || "-"}</td>
                          <td className="p-2.5 text-right font-bold text-slate-200">
                            {q.nota !== null ? `${Math.round(q.nota * 100)}%` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <p className="text-[11px] text-slate-500 text-right">
                Mostrando primeras 10 filas de muestra para previsualización.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Credenciales</span>
        </button>

        <button
          type="submit"
          disabled={!excelResult}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <span>Siguiente: Confirmación y Activación</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
