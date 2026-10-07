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
      <div className="bg-white border border-[#e3e8f3] rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(27,36,71,0.08)] space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[#1b2447] tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0f766e]" />
            Paso 4: Resumen de Activación y Confirmación Final
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Revisa la configuración completa antes de persistir las entidades en el sistema. Al confirmar, la empresa, usuario y datos de Mystery Shopper quedarán activos inmediatamente.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#fff1f2] border border-[#fecdd3] text-[#b42318] text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#b42318]" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tarjeta 1: Empresa */}
          <div className="p-5 rounded-2xl bg-[#f8fafc] border border-[#dfe6f7] space-y-3">
            <div className="flex items-center gap-2 text-[#1b5094] font-semibold text-xs uppercase tracking-wider">
              <Building2 className="h-4 w-4" />
              <span>Empresa Cliente</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="text-sm font-bold text-[#1b2447]">{company.nombre_comercial}</div>
              <div className="text-slate-600 flex items-center gap-1.5">
                <span>URL:</span>
                <span className="font-mono text-[#1b5094] bg-[#eef2ff] px-1.5 py-0.5 rounded">
                  /{company.slug}
                </span>
              </div>
              {company.ruc && (
                <div className="text-slate-600">
                  <span>RUC:</span> <span className="font-mono text-[#1b2447]">{company.ruc}</span>
                </div>
              )}
              <div className="text-slate-600">
                <span>Plan:</span>{" "}
                <span className="capitalize font-semibold text-[#b45309]">{company.plan}</span>
              </div>
              <div className="text-slate-600">
                <span>Rubro:</span> <span className="text-[#1b2447]">{company.rubro || "General"}</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Credenciales */}
          <div className="p-5 rounded-2xl bg-[#f8fafc] border border-[#dfe6f7] space-y-3">
            <div className="flex items-center gap-2 text-[#b45309] font-semibold text-xs uppercase tracking-wider">
              <KeyRound className="h-4 w-4" />
              <span>Credenciales de Acceso</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="text-slate-600">
                <span>Usuario:</span>{" "}
                <span className="font-mono font-bold text-[#1b2447]">@{credentials.usuario}</span>
              </div>
              <div className="text-slate-600">
                <span>Nombre:</span> <span className="text-[#1b2447]">{credentials.nombre}</span>
              </div>
              {credentials.email && (
                <div className="text-slate-600 truncate">
                  <span>Correo:</span> <span className="text-[#1b2447]">{credentials.email}</span>
                </div>
              )}
              <div className="text-slate-600 pt-1">
                <span className="block mb-1">Contraseña Generada:</span>
                <div className="flex items-center gap-1 bg-white border border-[#dfe6f7] rounded-lg px-2 py-1">
                  <span className="font-mono text-[#1b2447] text-xs flex-1 truncate">
                    {showPass ? credentials.password : "••••••••••••••••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="p-1 text-slate-500 hover:text-[#1b2447] cursor-pointer"
                  >
                    {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 text-slate-500 hover:text-[#1b2447] cursor-pointer"
                  >
                    {copiedPass ? (
                      <Check className="h-3.5 w-3.5 text-[#0f766e]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Servicio de Mystery Shopper */}
          <div className="p-5 rounded-2xl bg-[#f8fafc] border border-[#dfe6f7] space-y-3">
            <div className="flex items-center gap-2 text-[#0f766e] font-semibold text-xs uppercase tracking-wider">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Servicio & Datos Excel</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="text-sm font-bold text-[#1b2447] truncate">{service.nombre}</div>
              <div className="text-slate-600">
                <span>Periodo:</span>{" "}
                <span className="text-[#1b2447] font-medium">{service.periodo || "2025"}</span>
              </div>
              {excel && (
                <div className="space-y-1 pt-1 border-t border-[#dfe6f7]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Evaluaciones a crear:</span>
                    <span className="font-mono font-bold text-[#0f766e]">
                      {excel.stats.totalEvaluaciones}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Sucursales detectadas:</span>
                    <span className="font-mono font-bold text-[#1b2447]">
                      {excel.stats.totalSucursales}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Criterios evaluados:</span>
                    <span className="font-mono font-bold text-[#1b5094]">
                      {excel.stats.totalIndicadores}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Garantía de Transacción */}
        <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#dfe6f7] text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-[#1b2447]">
            <CheckCircle2 className="h-4 w-4 text-[#1b5094]" />
            <span>Operaciones que se ejecutarán automáticamente en MySQL:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
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
          className="flex items-center gap-2 px-5 py-2.5 text-sm text-slate-600 hover:text-[#1b2447] bg-white hover:bg-slate-100 border border-[#dfe6f7] rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Excel</span>
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#1b2447] to-[#1b5094] hover:from-[#16213b] hover:to-[#143d78] text-white font-semibold text-sm rounded-xl shadow-xl shadow-[#1b2447]/15 transition-all cursor-pointer disabled:opacity-50"
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
