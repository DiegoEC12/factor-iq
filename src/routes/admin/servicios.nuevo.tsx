import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { WizardStepper } from "@/components/admin/wizard/WizardStepper";
import {
  Step1CompanyData,
  type CompanyData,
} from "@/components/admin/wizard/Step1CompanyData";
import {
  Step2Credentials,
  type CredentialsData,
} from "@/components/admin/wizard/Step2Credentials";
import {
  Step3ExcelImport,
  type ServiceData,
} from "@/components/admin/wizard/Step3ExcelImport";
import { Step4Confirmation } from "@/components/admin/wizard/Step4Confirmation";
import { saveNewServiceWithExcelFn } from "@/lib/admin";
import type { ParsedExcelResult } from "@/lib/excel-import";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Building2,
  KeyRound,
  FileSpreadsheet,
} from "lucide-react";

export const Route = createFileRoute("/admin/servicios/nuevo")({
  head: () => ({
    meta: [
      { title: "Nuevo Servicio (Wizard) | Factor IQ SuperAdmin" },
      {
        name: "description",
        content: "Flujo de alta guiada de empresa, credenciales e importación Excel de Mystery Shopper.",
      },
    ],
  }),
  component: NuevoServicioWizardPage,
});

function NuevoServicioWizardPage() {
  const navigate = useNavigate();

  // Wizard Navigation State
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);

  // Form State across the 4 steps
  const [company, setCompany] = useState<CompanyData>({
    nombre_comercial: "",
    slug: "",
    razon_social: "",
    ruc: "",
    rubro: "Automotriz / Retail",
    plan: "profesional",
    color_primario: "#6366f1",
    contacto_nombre: "",
    contacto_email: "",
    contacto_telefono: "",
  });

  const [credentials, setCredentials] = useState<CredentialsData>({
    usuario: "",
    nombre: "",
    email: "",
    password: "",
  });

  const [service, setService] = useState<ServiceData>({
    nombre: "",
    periodo: "2025 - Q1",
    tipo: "mystery_shopping",
  });

  const [excelResult, setExcelResult] = useState<ParsedExcelResult | null>(null);

  // Final submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (step > maxReachedStep) {
      setMaxReachedStep(step);
    }
  };

  const handleConfirmActivation = async () => {
    if (!excelResult) {
      setError("Faltan datos de evaluación del archivo Excel.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        cliente: {
          slug: company.slug.trim().toLowerCase(),
          nombre_comercial: company.nombre_comercial.trim(),
          ...(company.razon_social.trim() ? { razon_social: company.razon_social.trim() } : {}),
          ...(company.ruc.trim() ? { ruc: company.ruc.trim() } : {}),
          ...(company.rubro.trim() ? { rubro: company.rubro.trim() } : {}),
          plan: company.plan,
          color_primario: company.color_primario,
          ...(company.contacto_nombre.trim()
            ? { contacto_nombre: company.contacto_nombre.trim() }
            : {}),
          ...(company.contacto_email.trim()
            ? { contacto_email: company.contacto_email.trim() }
            : {}),
          ...(company.contacto_telefono.trim()
            ? { contacto_telefono: company.contacto_telefono.trim() }
            : {}),
        },
        credenciales: {
          usuario: credentials.usuario.trim(),
          nombre: credentials.nombre.trim(),
          ...(credentials.email.trim() ? { email: credentials.email.trim() } : {}),
          password: credentials.password,
        },
        servicio: {
          nombre: service.nombre.trim(),
          ...(service.tipo.trim() ? { tipo: service.tipo.trim() } : {}),
          ...(service.periodo.trim() ? { periodo: service.periodo.trim() } : {}),
        },
        excelData: {
          evaluaciones: excelResult.evaluations,
          indicadores: excelResult.indicators,
          preguntas: excelResult.questions,
        },
      };

      const result = await saveNewServiceWithExcelFn({ data: payload });

      if (result.success) {
        toast.success(result.message);
        setCreatedSlug(result.clienteSlug || company.slug);
        setIsSuccess(true);
      } else {
        setError(result.message || "Error al procesar la activación.");
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error inesperado al procesar la activación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Encabezado y Regreso */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/admin/empresas"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver al listado de empresas</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-6 px-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Onboarding Guiado
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Archivo'] mt-1">
            Nuevo Servicio & Carga Masiva
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Flujo paso a paso para dar de alta una empresa cliente, generar sus accesos y cargar los resultados de Mystery Shopper.
          </p>
        </div>
      </div>

      {/* Stepper de 4 Pasos */}
      <WizardStepper
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepClick={(stepId) => goToStep(stepId)}
      />

      {/* Vista de Éxito / Activado */}
      {isSuccess ? (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-8 sm:p-10 text-center space-y-6 backdrop-blur-xl shadow-2xl">
          <div className="h-16 w-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white font-['Archivo']">
              ¡Empresa y Servicio Activados!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              La empresa <span className="font-semibold text-white">{company.nombre_comercial}</span>, el usuario <span className="font-mono text-indigo-300">@{credentials.usuario}</span> y {excelResult?.stats.totalEvaluaciones} evaluaciones de Mystery Shopper han sido registrados exitosamente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/admin/empresas"
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-all cursor-pointer"
            >
              Ir a Listado de Empresas
            </Link>

            <Link
              to={`/${createdSlug}` as any}
              target="_blank"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Abrir Portal de la Empresa</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Contenido del Paso Activo */
        <div>
          {currentStep === 1 && (
            <Step1CompanyData
              data={company}
              onChange={(updated) => setCompany((prev) => ({ ...prev, ...updated }))}
              onNext={() => goToStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2Credentials
              data={credentials}
              clientSlug={company.slug}
              contactName={company.contacto_nombre}
              contactEmail={company.contacto_email}
              onChange={(updated) => setCredentials((prev) => ({ ...prev, ...updated }))}
              onNext={() => goToStep(3)}
              onBack={() => goToStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3ExcelImport
              serviceData={service}
              excelResult={excelResult}
              onServiceDataChange={(updated) => setService((prev) => ({ ...prev, ...updated }))}
              onExcelParsed={(res) => setExcelResult(res)}
              onNext={() => goToStep(4)}
              onBack={() => goToStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4Confirmation
              company={company}
              credentials={credentials}
              service={service}
              excel={excelResult}
              loading={loading}
              error={error}
              onConfirm={handleConfirmActivation}
              onBack={() => goToStep(3)}
            />
          )}
        </div>
      )}
    </div>
  );
}
