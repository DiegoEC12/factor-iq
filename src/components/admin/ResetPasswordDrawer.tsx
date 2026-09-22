import { useState, useEffect } from "react";
import {
  KeyRound,
  Dices,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { generateSecurePassword, evaluatePasswordStrength } from "@/lib/password-utils";
import { resetUserPasswordFn } from "@/lib/admin";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface ResetPasswordDrawerProps {
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

export function ResetPasswordDrawer({
  isOpen,
  onClose,
  user,
  onSuccess,
}: ResetPasswordDrawerProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initial = generateSecurePassword(16);
      setPassword(initial);
      setShowPassword(true);
      setCopied(false);
      setError(null);
    }
  }, [isOpen]);

  if (!user) return null;

  const handleGenerate = () => {
    const newPass = generateSecurePassword(16);
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
      // ignore
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
        setError(res.message || "Error al actualizar la contraseña.");
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error inesperado al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const strength = evaluatePasswordStrength(password);

  const strengthColors: Record<number, { text: string; bg: string }> = {
    0: { text: "text-rose-400", bg: "bg-rose-500" },
    1: { text: "text-rose-400", bg: "bg-rose-500" },
    2: { text: "text-amber-400", bg: "bg-amber-500" },
    3: { text: "text-emerald-400", bg: "bg-emerald-500" },
    4: { text: "text-indigo-400", bg: "bg-indigo-500" },
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-slate-950 border-l border-slate-800 text-slate-100 p-0 flex flex-col h-full shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold text-white tracking-tight">
                  Restablecer Contraseña
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-400">
                  {user.nombre} (@{user.usuario})
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Usuario afectado:</span>
              <span className="font-mono text-slate-200">@{user.usuario}</span>
            </div>
            {user.cliente_nombre && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Empresa vinculada:</span>
                <span className="text-slate-200 font-medium">{user.cliente_nombre}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Nueva Contraseña Generada
              </label>
              <button
                type="button"
                onClick={handleGenerate}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
              >
                <Dices className="h-3.5 w-3.5" />
                Generar Otra
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-20 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copiar contraseña"
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Barra de Fuerza */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Fortaleza estimada:</span>
                <span className={`font-semibold uppercase tracking-wider ${strengthColors[strength.score]?.text ?? "text-slate-400"}`}>
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
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="h-3 w-3" />
                ¡Contraseña copiada al portapapeles! Envíala al cliente antes de cerrar.
              </p>
            )}
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Al aplicar el cambio, los intentos fallidos del usuario se restablecerán a 0 y la sesión previa quedará invalidada.
            </span>
          </div>
        </form>

        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-amber-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Aplicar Nueva Contraseña
              </>
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
