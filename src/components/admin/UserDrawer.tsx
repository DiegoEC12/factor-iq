import { useState, useEffect } from "react";
import {
  UserPlus,
  UserCheck,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface UserDrawerProps {
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

export function UserDrawer({ isOpen, onClose, userToEdit, clientes, onSuccess }: UserDrawerProps) {
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
        setRol(
          (userToEdit.rol as
            | "superadmin"
            | "admin_cliente"
            | "editor_web"
            | "soporte"
            | "viewer") || "admin_cliente",
        );
        setClienteId(userToEdit.cliente_id || null);
        setEstado((userToEdit.estado as "activo" | "bloqueado" | "inactivo") || "activo");
        setPassword("");
      } else {
        setUsuario("");
        setNombre("");
        setEmail("");
        const initialPass = generateSecurePassword(16);
        setPassword(initialPass);
        setRol("admin_cliente");
        setClienteId(clientes.length > 0 ? (clientes[0]?.id ?? null) : null);
        setEstado("activo");
      }
      setShowPassword(false);
      setCopied(false);
      setError(null);
    }
  }, [isOpen, userToEdit, clientes]);

  const handleGeneratePassword = () => {
    const newPass = generateSecurePassword(16);
    setPassword(newPass);
    setShowPassword(true);
    setCopied(false);
  };

  const handleCopyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !nombre.trim()) {
      setError("El usuario y nombre completo son obligatorios.");
      return;
    }
    if (!isEditing && (!password || password.length < 6)) {
      setError("La contraseña inicial es requerida (mínimo 6 caracteres).");
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
        cliente_id: rol === "superadmin" ? null : clienteId,
        estado,
      };

      const result = await saveUserFn({ data: payload });
      if (result.success) {
        onSuccess(result.message);
        onClose();
      } else {
        setError(result.message || "Error al procesar la solicitud.");
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error inesperado al guardar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-slate-950 border-l border-slate-800 text-slate-100 p-0 flex flex-col h-full shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                {isEditing ? <UserCheck className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold text-white tracking-tight">
                  {isEditing ? `Editar Usuario: ${userToEdit?.usuario}` : "Crear Nuevo Usuario"}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-400">
                  {isEditing
                    ? "Modifica rol, empresa vinculada o genera una nueva clave de acceso."
                    : "Asigna credenciales y permisos para el panel de Factor IQ o portal cliente."}
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre de Usuario (Login) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                placeholder="ej. adm_maquinarias"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre y Apellido <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Carlos Mendoza"
              className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej. carlos@empresa.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Rol del Sistema <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as any)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="admin_cliente">Admin Cliente</option>
                  <option value="viewer">Visualizador</option>
                  <option value="superadmin">SuperAdmin (Factor IQ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="activo">Activo</option>
                <option value="bloqueado">Bloqueado</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {rol !== "superadmin" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Empresa Cliente Asignada <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  value={clienteId ?? ""}
                  onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="" disabled>
                    Selecciona una empresa...
                  </option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_comercial} ({c.slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Campo de Contraseña */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                {isEditing ? "Nueva Contraseña (opcional)" : "Contraseña Inicial"}
                {!isEditing && <span className="text-rose-400"> *</span>}
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
              >
                <Dices className="h-3.5 w-3.5" />
                Generar Aleatoria
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? "Dejar vacío para no cambiar" : "Contraseña segura"}
                className="w-full px-3 py-2 pr-20 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {password && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    title="Copiar contraseña"
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {copied && <p className="text-[11px] text-emerald-400 mt-1">¡Copiada al portapapeles!</p>}
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
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {isEditing ? "Guardar Cambios" : "Crear Usuario"}
              </>
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
