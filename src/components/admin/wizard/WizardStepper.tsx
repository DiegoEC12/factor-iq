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
    <div className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-xl">
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-2">
        {/* Línea de conexión detrás de los pasos en desktop */}
        <div className="hidden md:block absolute left-12 right-12 top-7 h-0.5 bg-slate-800 -z-0" />
        <div
          className="hidden md:block absolute left-12 top-7 h-0.5 bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 transition-all duration-500 -z-0"
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
                    ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400"
                    : isCurrent
                      ? "bg-indigo-600 border-2 border-indigo-400 text-white shadow-indigo-500/30 shadow-lg ring-4 ring-indigo-500/20 scale-105"
                      : "bg-slate-800/90 border border-slate-700/80 text-slate-400 group-hover:border-slate-600"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 stroke-[2.5]" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-mono flex items-center justify-center text-slate-300">
                  {step.id}
                </span>
              </div>

              <div className="flex flex-col">
                <span
                  className={`text-sm font-semibold tracking-tight transition-colors ${
                    isCurrent
                      ? "text-white"
                      : isCompleted
                        ? "text-emerald-400"
                        : "text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  {step.title}
                </span>
                <span className="text-xs text-slate-400 font-normal">{step.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
