import { useState, useEffect } from "react";
import {
  KeyRound,
  User,
  Mail,
  Dices,
  Copy,
  Check,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { generateSecurePassword, evaluatePasswordStrength } from "@/lib/password-utils";

export interface CredentialsData {
  usuario: string;
  nombre: string;
  email: string;
  password: string;
}

interface Step2CredentialsProps {
  data: CredentialsData;
  clientSlug: string;
  contactName: string;
  contactEmail: string;
  onChange: (updated: Partial<CredentialsData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Credentials({
  data,
  clientSlug,
  contactName,
  contactEmail,
  onChange,
  onNext,
  onBack,
}: Step2CredentialsProps) {
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-llenar valores sugeridos si están vacíos
  useEffect(() => {
    if (!data.usuario && clientSlug) {
      onChange({ usuario: `admin_${clientSlug.replace(/[^a-z0-9]/g, "")}` });
    }
    if (!data.nombre && contactName) {
      onChange({ nombre: contactName });
    }
    if (!data.email && contactEmail) {
      onChange({ email: contactEmail });
    }
    if (!data.password) {
      const initialPass = generateSecurePassword(16);
      onChange({ password: initialPass });
    }
  }, [clientSlug, contactName, contactEmail]);

  const handleGeneratePassword = () => {
    const newPass = generateSecurePassword(16);
    onChange({ password: newPass });
    setCopied(false);
  };

  const handleCopyPassword = async () => {
    if (!data.password) return;
    try {
      await navigator.clipboard.writeText(data.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.usuario.trim()) {
      setError("El nombre de usuario para el inicio de sesión es obligatorio.");
      return;
    }
    if (!data.nombre.trim()) {
      setError("El nombre del administrador es obligatorio.");
      return;
    }
    if (!data.password || data.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError(null);
    onNext();
  };

  const strength = evaluatePasswordStrength(data.password);

  const strengthColors: Record<number, { text: string; bg: string }> = {
    0: { text: "text-rose-400", bg: "bg-rose-500" },
    1: { text: "text-rose-400", bg: "bg-rose-500" },
    2: { text: "text-amber-400", bg: "bg-amber-500" },
    3: { text: "text-emerald-400", bg: "bg-emerald-500" },
    4: { text: "text-indigo-400", bg: "bg-indigo-500" },
  };

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-400" />
            Paso 2: Credenciales de Acceso para la Empresa
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Genera la cuenta de administrador con la que los representantes de la empresa accederán al portal privado de reportes.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nombre de Usuario (Login) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={data.usuario}
                onChange={(e) =>
                  onChange({
                    usuario: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""),
                  })
                }
                placeholder="admin_empresa"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Se usará en la pantalla de inicio de sesión (/login).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nombre de la Persona Responsable <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={data.nombre}
              onChange={(e) => onChange({ nombre: e.target.value })}
              placeholder="Ej. Juan Pérez - Administrador"
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Correo Electrónico de Notificaciones
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="email"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="admin@empresa.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Generador de Contraseña */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">
              Contraseña de Acceso <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <Dices className="h-4 w-4" />
              Generar Contraseña Aleatoria Segura
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={data.password}
              onChange={(e) => onChange({ password: e.target.value })}
              className="w-full px-4 py-3 pr-24 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyPassword}
                title="Copiar contraseña"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Medidor de Fortaleza */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Nivel de Seguridad:</span>
              <span
                className={`font-semibold uppercase tracking-wider text-[11px] ${
                  strengthColors[strength.score]?.text ?? "text-slate-400"
                }`}
              >
                {strength.label}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
              {[1, 2, 3, 4].map((step) => {
                const active = strength.score >= step;
                return (
                  <div
                    key={step}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      active
                        ? (strengthColors[strength.score]?.bg ?? "bg-slate-800")
                        : "bg-slate-800"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {copied && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <Check className="h-4 w-4" />
              ¡Contraseña copiada al portapapeles! Guárdala de forma segura para entregarla al cliente.
            </p>
          )}

          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-400" />
            <span>
              La contraseña se almacenará hasheada con bcrypt en la base de datos MySQL (nunca en texto plano).
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Paso 1</span>
        </button>

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <span>Siguiente: Importación Excel</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
