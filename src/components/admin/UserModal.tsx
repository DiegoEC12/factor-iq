import { useState, useEffect } from "react";
import {
  UserPlus,
  UserCheck,
  X,
  Loader2,
  Dices,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  Shield,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { generateSecurePassword } from "@/lib/password-utils";
import { saveUserFn, type UserInput } from "@/lib/admin";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: {
    id: number;
    usuario: string;
    nombre: string;
    email?: string | null;
    rol: string;
    estado: string;
    cliente_id?: number | null;
    cliente_nombre?: string | null;
  } | null;
  clientes: Array<{ id: number; nombre_comercial: string; slug: string }>;
  onSuccess: (message: string) => void;
}

export function UserModal({ isOpen, onClose, userToEdit, clientes, onSuccess }: UserModalProps) {
  const isEditing = Boolean(userToEdit?.id);

  const [usuario, setUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<
    "superadmin" | "admin_cliente" | "editor_web" | "soporte" | "viewer"
  >("admin_cliente");
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [estado, setEstado] = useState<"activo" | "bloqueado" | "inactivo">("activo");

  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setUsuario(userToEdit.usuario);
        setNombre(userToEdit.nombre);
        setEmail(userToEdit.email || "");
        setPassword("");
        setRol(
          (userToEdit.rol as
            "superadmin" | "admin_cliente" | "editor_web" | "soporte" | "viewer") ||
            "admin_cliente",
        );
        setClienteId(userToEdit.cliente_id || null);
        setEstado((userToEdit.estado as "activo" | "bloqueado" | "inactivo") || "activo");
      } else {
        setUsuario("");
        setNombre("");
        setEmail("");
        const initialPass = generateSecurePassword({ length: 14 });
        setPassword(initialPass);
        setRol("admin_cliente");
        setClienteId(clientes.length > 0 ? clientes[0]!.id : null);
        setEstado("activo");
        setShowPassword(true);
      }
      setCopied(false);
      setError(null);
    }
  }, [isOpen, userToEdit, clientes]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const newPass = generateSecurePassword({ length: 14 });
    setPassword(newPass);
    setShowPassword(true);
    setCopied(false);
  };

  const handleCopyPassword = async () => {
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
    if (!usuario.trim() || !nombre.trim()) {
      setError("El usuario (login) y nombre completo son obligatorios.");
      return;
    }
    if (!isEditing && (!password || password.length < 6)) {
      setError("La contraseña inicial debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: UserInput = {
        ...(userToEdit?.id ? { id: userToEdit.id } : {}),
        usuario: usuario.trim(),
        nombre: nombre.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(password.trim() ? { password: password.trim() } : {}),
        rol,
        ...(rol === "superadmin"
          ? { cliente_id: null }
          : clienteId !== null
            ? { cliente_id: clienteId }
            : {}),
        estado,
      };

      const res = await saveUserFn({ data: payload });

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al guardar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? `Editar Usuario: ${userToEdit?.usuario}` : "Crear Nuevo Usuario"}
              </h3>
              <p className="text-xs text-slate-400">
                Configura accesos, rol y pertenencia de empresa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Usuario (Login)*</span>
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ej: admMaqui"
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Nombre Completo*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej: Juan Pérez"
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ej: contacto@empresa.com"
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Rol de Usuario*</span>
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as any)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="admin_cliente">Administrador de Cliente</option>
                <option value="editor_web">Editor Web (CMS)</option>
                <option value="soporte">Soporte / Operaciones</option>
                <option value="viewer">Lector / Visualizador (Viewer)</option>
                <option value="superadmin">SuperAdmin (Factor IQ)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Empresa / Cliente Asignado</span>
              </label>
              <select
                value={rol === "superadmin" ? "" : (clienteId ?? "")}
                disabled={rol === "superadmin"}
                onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                {rol === "superadmin" ? (
                  <option value="">Factor IQ (Global)</option>
                ) : (
                  clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_comercial} (/{c.slug})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Campo Contraseña con Generador */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">
                {isEditing ? "Cambiar Contraseña (opcional)" : "Contraseña Inicial*"}
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
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
                placeholder={isEditing ? "Dejar en blanco para conservar actual" : "Contraseña..."}
                className="w-full font-mono text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-16 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                  title={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
                {password && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-1 text-slate-400 hover:text-emerald-400"
                    title="Copiar"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Estado del Usuario */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Estado de la Cuenta</label>
            <div className="grid grid-cols-3 gap-2">
              {(["activo", "bloqueado", "inactivo"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEstado(st)}
                  className={`py-1.5 text-xs font-medium rounded-lg border capitalize transition-colors ${
                    estado === st
                      ? st === "activo"
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : st === "bloqueado"
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-rose-500/20 border-rose-500/40 text-rose-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg shadow-emerald-950/50 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Guardar Cambios" : "Crear Usuario"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
