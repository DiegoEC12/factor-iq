import { useState } from "react";
import {
  ShieldCheck,
  Building2,
  KeyRound,
  FileSpreadsheet,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import type { CompanyData } from "./Step1CompanyData";
import type { CredentialsData } from "./Step2Credentials";
import type { ServiceData } from "./Step3ExcelImport";
import type { ParsedExcelResult } from "@/lib/excel-import";

interface Step4ConfirmationProps {
  company: CompanyData;
  credentials: CredentialsData;
  service: ServiceData;
  excel: ParsedExcelResult | null;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

export function Step4Confirmation({
  company,
  credentials,
  service,
  excel,
  loading,
  error,
  onConfirm,
  onBack,
}: Step4ConfirmationProps) {
  const [showPass, setShowPass] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(credentials.password);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Paso 4: Resumen de Activación y Confirmación Final
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Revisa la configuración completa antes de persistir las entidades en el sistema. Al confirmar, la empresa, usuario y datos de Mystery Shopper quedarán activos inmediatamente.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjeta 1: Empresa */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <Building2 className="h-4 w-4" />
              <span>Empresa Cliente</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="text-sm font-bold text-white">{company.nombre_comercial}</div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <span>URL:</span>
                <span className="font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  /{company.slug}
                </span>
              </div>
              {company.ruc && (
                <div className="text-slate-400">
                  <span>RUC:</span> <span className="font-mono text-slate-200">{company.ruc}</span>
                </div>
              )}
              <div className="text-slate-400">
                <span>Plan:</span>{" "}
                <span className="capitalize font-semibold text-amber-400">{company.plan}</span>
              </div>
              <div className="text-slate-400">
                <span>Rubro:</span> <span className="text-slate-200">{company.rubro || "General"}</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Credenciales */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <KeyRound className="h-4 w-4" />
              <span>Credenciales de Acceso</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="text-slate-400">
                <span>Usuario:</span>{" "}
                <span className="font-mono font-bold text-slate-100">@{credentials.usuario}</span>
              </div>
              <div className="text-slate-400">
                <span>Nombre:</span> <span className="text-slate-200">{credentials.nombre}</span>
              </div>
              {credentials.email && (
                <div className="text-slate-400 truncate">
                  <span>Correo:</span> <span className="text-slate-200">{credentials.email}</span>
                </div>
              )}
              <div className="text-slate-400 pt-1">
                <span className="block mb-1">Contraseña Generada:</span>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                  <span className="font-mono text-slate-200 text-xs flex-1 truncate">
                    {showPass ? credentials.password : "••••••••••••••••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {copiedPass ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Servicio de Mystery Shopper */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Servicio & Datos Excel</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="text-sm font-bold text-white truncate">{service.nombre}</div>
              <div className="text-slate-400">
                <span>Periodo:</span>{" "}
                <span className="text-slate-200 font-medium">{service.periodo || "2025"}</span>
              </div>
              {excel && (
                <div className="space-y-1 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Evaluaciones a crear:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {excel.stats.totalEvaluaciones}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Sucursales detectadas:</span>
                    <span className="font-mono font-bold text-white">
                      {excel.stats.totalSucursales}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Criterios evaluados:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {excel.stats.totalIndicadores}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Garantía de Transacción */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-indigo-300">
            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            <span>Operaciones que se ejecutarán automáticamente en MySQL:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
            <div>✓ Alta de registro en tabla `clientes`</div>
            <div>✓ Creación de credenciales hasheadas en `usuarios`</div>
            <div>✓ Registro de nuevo servicio en `proyectos`</div>
            <div>✓ Upsert automático en `sucursales`</div>
            <div>✓ Inserción masiva en `evaluaciones`</div>
            <div>✓ Trazabilidad registrada en `auditoria`</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Excel</span>
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Persistiendo Datos en MySQL...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              <span>Confirmar y Activar Empresa y Servicio</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
