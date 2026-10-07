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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#e3e8f3] shadow-[0_20px_60px_rgba(27,36,71,0.12)] p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-[#e3e8f3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eef2ff] border border-[#dfe6f7] flex items-center justify-center text-[#1b2447]">
              {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b2447]">
                {isEditing ? `Editar Usuario: ${userToEdit?.usuario}` : "Crear Nuevo Usuario"}
              </h3>
              <p className="text-xs text-slate-600">
                Configura accesos, rol y pertenencia de empresa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-[#1b2447] hover:bg-[#f4f7fb] transition-colors"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[#1b2447]" />
                <span>Usuario (Login)*</span>
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ej: admMaqui"
                className="w-full text-xs bg-white border border-[#dfe6f7] rounded-xl px-3 py-2 text-[#1b2447] placeholder-slate-400 focus:outline-none focus:border-[#d6452c] focus:ring-2 focus:ring-[#d6452c]/20 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#1b2447]" />
                <span>Nombre Completo*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej: Juan Pérez"
                className="w-full text-xs bg-white border border-[#dfe6f7] rounded-xl px-3 py-2 text-[#1b2447] placeholder-slate-400 focus:outline-none focus:border-[#d6452c] focus:ring-2 focus:ring-[#d6452c]/20"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#1b2447]" />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ej: contacto@empresa.com"
              className="w-full text-xs bg-white border border-[#dfe6f7] rounded-xl px-3 py-2 text-[#1b2447] placeholder-slate-400 focus:outline-none focus:border-[#d6452c] focus:ring-2 focus:ring-[#d6452c]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#1b2447]" />
                <span>Rol de Usuario*</span>
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as any)}
                className="w-full text-xs bg-white border border-[#dfe6f7] rounded-xl px-3 py-2 text-[#1b2447] focus:outline-none focus:border-[#d6452c] focus:ring-2 focus:ring-[#d6452c]/20"
              >
                <option value="admin_cliente">Administrador de Cliente</option>
                <option value="editor_web">Editor Web (CMS)</option>
                <option value="soporte">Soporte / Operaciones</option>
                <option value="viewer">Lector / Visualizador (Viewer)</option>
                <option value="superadmin">SuperAdmin (Factor IQ)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#1b2447]" />
                <span>Empresa / Cliente Asignado</span>
              </label>
              <select
                value={rol === "superadmin" ? "" : (clienteId ?? "")}
                disabled={rol === "superadmin"}
                onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
                className="w-full text-xs bg-white border border-[#dfe6f7] rounded-xl px-3 py-2 text-[#1b2447] focus:outline-none focus:border-[#d6452c] focus:ring-2 focus:ring-[#d6452c]/20 disabled:opacity-50"
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

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700">
                {isEditing ? "Cambiar Contraseña (opcional)" : "Contraseña Inicial*"}
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1b5094] hover:text-[#143d78] transition-colors"
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
                className="w-full font-mono text-xs bg-white border border-[#dfe6f7] rounded-xl px-3 py-2 pr-16 text-[#1b2447] placeholder-slate-400 focus:outline-none focus:border-[#d6452c] focus:ring-2 focus:ring-[#d6452c]/20"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-500 hover:text-[#1b2447]"
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
                    className="p-1 text-slate-500 hover:text-[#1b5094]"
                    title="Copiar"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-[#1b5094]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Estado de la Cuenta</label>
            <div className="grid grid-cols-3 gap-2">
              {(["activo", "bloqueado", "inactivo"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEstado(st)}
                  className={`py-1.5 text-xs font-medium rounded-lg border capitalize transition-colors ${
                    estado === st
                      ? st === "activo"
                        ? "bg-[#e8f7ee] border-[#b7e4c7] text-[#15803d]"
                        : st === "bloqueado"
                          ? "bg-[#fff7ed] border-[#fed7aa] text-[#b45309]"
                          : "bg-[#fff1f2] border-[#fecdd3] text-[#b42318]"
                      : "bg-[#f4f7fb] border-[#dfe6f7] text-slate-600 hover:border-[#cfdaf0]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e3e8f3]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-[#1b2447] hover:bg-[#f4f7fb] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1b2447] hover:bg-[#121d39] rounded-lg transition-colors shadow-lg shadow-[#1b2447]/20 disabled:opacity-50"
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
