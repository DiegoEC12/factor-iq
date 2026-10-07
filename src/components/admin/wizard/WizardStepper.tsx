import { Check, Building2, KeyRound, FileSpreadsheet, ShieldCheck } from "lucide-react";

export interface StepItem {
  id: number;
  title: string;
  subtitle: string;
  icon: typeof Building2;
}

export const WIZARD_STEPS: StepItem[] = [
  {
    id: 1,
    title: "Empresa Cliente",
    subtitle: "Datos corporativos y plan",
    icon: Building2,
  },
  {
    id: 2,
    title: "Credenciales",
    subtitle: "Usuario administrador",
    icon: KeyRound,
  },
  {
    id: 3,
    title: "Importación Excel",
    subtitle: "Carga y validación previa",
    icon: FileSpreadsheet,
  },
  {
    id: 4,
    title: "Confirmación",
    subtitle: "Activación del servicio",
    icon: ShieldCheck,
  },
];

interface WizardStepperProps {
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  maxReachedStep: number;
}

export function WizardStepper({ currentStep, onStepClick, maxReachedStep }: WizardStepperProps) {
  return (
    <div className="w-full bg-white border border-[#e3e8f3] rounded-2xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(27,36,71,0.08)]">
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-2">
        {/* Línea de conexión detrás de los pasos en desktop */}
        <div className="hidden md:block absolute left-12 right-12 top-7 h-0.5 bg-[#dfe6f7] -z-0" />
        <div
          className="hidden md:block absolute left-12 top-7 h-0.5 bg-gradient-to-r from-[#1b2447] via-[#1b5094] to-[#0f766e] transition-all duration-500 -z-0"
          style={{
            width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100))}%`,
          }}
        />

        {WIZARD_STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = onStepClick && step.id <= maxReachedStep;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              onClick={() => isClickable && onStepClick?.(step.id)}
              className={`flex items-center gap-3.5 z-10 transition-all ${
                isClickable ? "cursor-pointer group" : "cursor-default"
              }`}
            >
              <div
                className={`relative flex items-center justify-center h-12 w-12 rounded-2xl font-semibold text-sm transition-all duration-300 shadow-md ${
                  isCompleted
                    ? "bg-[#ecfdf5] border-2 border-[#86efac] text-[#0f766e]"
                    : isCurrent
                      ? "bg-[#1b2447] border-2 border-[#1b5094] text-white shadow-[#1b2447]/20 shadow-lg ring-4 ring-[#1b2447]/10 scale-105"
                      : "bg-[#f8fafc] border border-[#dfe6f7] text-slate-500 group-hover:border-[#c7d3ef]"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 stroke-[2.5]" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white border border-[#dfe6f7] text-[10px] font-mono flex items-center justify-center text-[#1b2447]">
                  {step.id}
                </span>
              </div>

              <div className="flex flex-col">
                <span
                  className={`text-sm font-semibold tracking-tight transition-colors ${
                    isCurrent
                      ? "text-[#1b2447]"
                      : isCompleted
                        ? "text-[#0f766e]"
                        : "text-slate-500 group-hover:text-[#1b2447]"
                  }`}
                >
                  {step.title}
                </span>
                <span className="text-xs text-slate-500 font-normal">{step.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
