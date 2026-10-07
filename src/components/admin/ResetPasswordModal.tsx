import { useState, useEffect } from "react";
import {
  KeyRound,
  Dices,
  Copy,
  Check,
  Eye,
  EyeOff,
  X,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { generateSecurePassword, evaluatePasswordStrength } from "@/lib/password-utils";
import { resetUserPasswordFn } from "@/lib/admin";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    usuario: string;
    nombre: string;
    cliente_nombre?: string | null;
  } | null;
  onSuccess: (message: string) => void;
}

export function ResetPasswordModal({ isOpen, onClose, user, onSuccess }: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initial = generateSecurePassword({ length: 16 });
      setPassword(initial);
      setShowPassword(true);
      setCopied(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleGenerate = () => {
    const newPass = generateSecurePassword({ length: 16 });
    setPassword(newPass);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await resetUserPasswordFn({
        data: {
          userId: user.id,
          newPassword: password,
          usuarioName: user.usuario,
        },
      });

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setError(res.message || "Error al restablecer la contraseña.");
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al guardar la nueva contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const strength = evaluatePasswordStrength(password);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#e3e8f3] shadow-[0_20px_60px_rgba(27,36,71,0.12)] p-6 relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#1b2447]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="flex items-start justify-between pb-4 border-b border-[#e3e8f3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] border border-[#d1fae5] flex items-center justify-center text-[#0f766e]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b2447]">Restablecer Credenciales</h3>
              <p className="text-xs text-slate-600">
                Usuario: <span className="font-mono text-[#1b5094] font-semibold">{user.usuario}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-[#1b2447] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-[#fff1f2] border border-[#fecdd3] text-[#b42318] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-slate-700">Nueva Contraseña</label>
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b5094] hover:text-[#143d78] hover:underline transition-colors"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Generar Aleatoria</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa o genera una clave..."
                className="w-full font-mono text-sm bg-white border border-[#dfe6f7] rounded-xl px-3.5 py-2.5 pr-20 text-[#1b2447] placeholder-slate-400 focus:outline-none focus:border-[#d6452c] focus:ring-1 focus:ring-[#d6452c]/20 transition-all"
                required
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-500 hover:text-[#1b2447] transition-colors"
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-slate-500 hover:text-[#1b5094] transition-colors"
                  title="Copiar al portapapeles"
                >
                  {copied ? <Check className="w-4 h-4 text-[#0f766e]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Barra de Robustez */}
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Nivel de seguridad:</span>
                <span className="font-medium text-slate-700">{strength.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`rounded-full transition-all duration-300 ${
                      strength.score >= step ? strength.color : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#f5f7fc] border border-[#e3e8f3] text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 text-[#1b2447] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0f766e]" />
              <span>Recomendación de seguridad:</span>
            </div>
            <p>
              Copia la contraseña generada y entrégasela de forma segura al usuario ({user.nombre}). La clave se
              encriptará con algoritmo Hash Bcrypt inmediatamente al guardar.
            </p>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e3e8f3]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-[#1b2447] hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1b2447] hover:bg-[#16213b] rounded-lg transition-colors shadow-lg shadow-[#1b2447]/10 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Nueva Contraseña</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
