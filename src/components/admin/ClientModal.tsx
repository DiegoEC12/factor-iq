import { useState, useEffect } from "react";
import {
  Building2,
  X,
  Loader2,
  Check,
  AlertCircle,
  Hash,
  Globe,
  Mail,
  Phone,
  User,
  Sparkles,
} from "lucide-react";
import { saveClientFn, type ClientInput } from "@/lib/admin";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: {
    id: number;
    slug: string;
    nombre_comercial: string;
    razon_social?: string | null;
    ruc?: string | null;
    rubro?: string | null;
    plan: string;
    estado: string;
    color_primario?: string | null;
    contacto_nombre?: string | null;
    contacto_email?: string | null;
    contacto_telefono?: string | null;
  } | null;
  onSuccess: (message: string) => void;
}

export function ClientModal({ isOpen, onClose, clientToEdit, onSuccess }: ClientModalProps) {
  const isEditing = Boolean(clientToEdit?.id);

  const [nombreComercial, setNombreComercial] = useState("");
  const [slug, setSlug] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [ruc, setRuc] = useState("");
  const [rubro, setRubro] = useState("Automotriz / Retail");
  const [plan, setPlan] = useState<"basico" | "profesional" | "enterprise">("profesional");
  const [estado, setEstado] = useState<"activo" | "suspendido" | "inactivo">("activo");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoEmail, setContactoEmail] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setNombreComercial(clientToEdit.nombre_comercial);
        setSlug(clientToEdit.slug);
        setRazonSocial(clientToEdit.razon_social || "");
        setRuc(clientToEdit.ruc || "");
        setRubro(clientToEdit.rubro || "Automotriz / Retail");
        setPlan((clientToEdit.plan as "basico" | "profesional" | "enterprise") || "profesional");
        setEstado((clientToEdit.estado as "activo" | "suspendido" | "inactivo") || "activo");
        setContactoNombre(clientToEdit.contacto_nombre || "");
        setContactoEmail(clientToEdit.contacto_email || "");
        setContactoTelefono(clientToEdit.contacto_telefono || "");
      } else {
        setNombreComercial("");
        setSlug("");
        setRazonSocial("");
        setRuc("");
        setRubro("Automotriz / Concesionarios");
        setPlan("profesional");
        setEstado("activo");
        setContactoNombre("");
        setContactoEmail("");
        setContactoTelefono("");
      }
      setError(null);
    }
  }, [isOpen, clientToEdit]);

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setNombreComercial(name);
    if (!isEditing) {
      const generatedSlug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreComercial.trim() || !slug.trim()) {
      setError("El nombre comercial y slug de URL son obligatorios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: ClientInput = {
        ...(clientToEdit?.id ? { id: clientToEdit.id } : {}),
        nombre_comercial: nombreComercial.trim(),
        slug: slug.trim().toLowerCase(),
        ...(razonSocial.trim() ? { razon_social: razonSocial.trim() } : {}),
        ...(ruc.trim() ? { ruc: ruc.trim() } : {}),
        ...(rubro.trim() ? { rubro: rubro.trim() } : {}),
        plan,
        estado,
        ...(contactoNombre.trim() ? { contacto_nombre: contactoNombre.trim() } : {}),
        ...(contactoEmail.trim() ? { contacto_email: contactoEmail.trim() } : {}),
        ...(contactoTelefono.trim() ? { contacto_telefono: contactoTelefono.trim() } : {}),
      };

      const res = await saveClientFn({ data: payload });

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || "Error al registrar o actualizar el cliente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? `Editar Cliente: ${clientToEdit?.nombre_comercial}` : "Registrar Nuevo Cliente / Empresa"}
              </h3>
              <p className="text-xs text-slate-400">Configura portal multi-tenant y aislamiento de datos</p>
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
              <label className="text-xs font-semibold text-slate-300">Nombre Comercial*</label>
              <input
                type="text"
                value={nombreComercial}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="ej: Maquinarias"
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Slug de URL (Ruta Portal)*</span>
              </label>
              <div className="flex items-center">
                <span className="text-xs font-mono text-slate-500 bg-slate-850 px-2.5 py-2 border border-r-0 border-slate-700 rounded-l-xl">
                  /
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                  placeholder="ej: maquinarias"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-r-xl px-3 py-2 text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Razón Social</label>
              <input
                type="text"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="ej: Maquinarias S.A."
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>RUC</span>
              </label>
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                placeholder="ej: 20100055411"
                maxLength={11}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Rubro / Sector</label>
              <input
                type="text"
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                placeholder="ej: Automotriz"
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Plan de Servicio</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as any)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="basico">Básico</option>
                <option value="profesional">Profesional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Sección de Contacto */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contacto Principal</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>Persona Contacto</span>
                </label>
                <input
                  type="text"
                  value={contactoNombre}
                  onChange={(e) => setContactoNombre(e.target.value)}
                  placeholder="ej: Lic. Carlos Soto"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  value={contactoEmail}
                  onChange={(e) => setContactoEmail(e.target.value)}
                  placeholder="ej: csoto@empresa.pe"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Teléfono</span>
                </label>
                <input
                  type="text"
                  value={contactoTelefono}
                  onChange={(e) => setContactoTelefono(e.target.value)}
                  placeholder="ej: +51 987 654 321"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
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
                  <span>{isEditing ? "Guardar Cambios" : "Crear Cliente"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
