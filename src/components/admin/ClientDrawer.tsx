import { useState, useEffect } from "react";
import {
  Building2,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

interface ClientDrawerProps {
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

export function ClientDrawer({ isOpen, onClose, clientToEdit, onSuccess }: ClientDrawerProps) {
  const isEditing = Boolean(clientToEdit?.id);

  const [nombreComercial, setNombreComercial] = useState("");
  const [slug, setSlug] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [ruc, setRuc] = useState("");
  const [rubro, setRubro] = useState("Automotriz / Retail");
  const [plan, setPlan] = useState<"basico" | "profesional" | "enterprise">("profesional");
  const [estado, setEstado] = useState<"activo" | "suspendido" | "inactivo">("activo");
  const [colorPrimario, setColorPrimario] = useState("#6366f1");
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
        setColorPrimario(clientToEdit.color_primario || "#6366f1");
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
        setColorPrimario("#6366f1");
        setContactoNombre("");
        setContactoEmail("");
        setContactoTelefono("");
      }
      setError(null);
    }
  }, [isOpen, clientToEdit]);

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
      setError("El nombre comercial y el slug son requeridos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: ClientInput = {
        ...(clientToEdit?.id ? { id: clientToEdit.id } : {}),
        slug: slug.trim().toLowerCase(),
        nombre_comercial: nombreComercial.trim(),
        ...(razonSocial.trim() ? { razon_social: razonSocial.trim() } : {}),
        ...(ruc.trim() ? { ruc: ruc.trim() } : {}),
        ...(rubro.trim() ? { rubro: rubro.trim() } : {}),
        plan,
        estado,
        color_primario: colorPrimario,
        ...(contactoNombre.trim() ? { contacto_nombre: contactoNombre.trim() } : {}),
        ...(contactoEmail.trim() ? { contacto_email: contactoEmail.trim() } : {}),
        ...(contactoTelefono.trim() ? { contacto_telefono: contactoTelefono.trim() } : {}),
      };

      const result = await saveClientFn({ data: payload });
      if (result.success) {
        onSuccess(result.message);
        onClose();
      } else {
        setError(result.message || "Error al procesar la solicitud.");
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error inesperado al guardar la empresa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-slate-950 border-l border-slate-800 text-slate-100 p-0 flex flex-col h-full shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold text-white tracking-tight">
                  {isEditing ? `Editar Empresa: ${clientToEdit?.nombre_comercial}` : "Nueva Empresa Cliente"}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-400">
                  {isEditing
                    ? "Actualiza la configuración corporativa, plan y datos de contacto de la cuenta."
                    : "Configura una nueva empresa para el servicio de Mystery Shopper."}
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
          {/* Identificación Principal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              Identificación Corporativa
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre Comercial <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={nombreComercial}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej. Maquinarias S.A."
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Slug / URL del Portal <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                    placeholder="maquinarias"
                    className="w-full pl-6 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  RUC (11 dígitos)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    maxLength={11}
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="20100123456"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Razón Social
              </label>
              <input
                type="text"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Ej. Distribuidora y Concesionaria Maquinarias S.A."
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Configuración SaaS y Plan */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Suscripción & Marca
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="basico">Básico</option>
                  <option value="profesional">Profesional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Color Marca</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                    className="h-9 w-9 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-400">{colorPrimario}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Rubro / Sector</label>
              <input
                type="text"
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                placeholder="Automotriz, Retail, Banca, Restaurantes..."
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Contacto Principal */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-emerald-400" />
              Contacto Principal de la Empresa
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={contactoNombre}
                onChange={(e) => setContactoNombre(e.target.value)}
                placeholder="Ej. Roberto Morales - Gerente de Calidad"
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={contactoEmail}
                    onChange={(e) => setContactoEmail(e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={contactoTelefono}
                    onChange={(e) => setContactoTelefono(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
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
                {isEditing ? "Guardar Cambios" : "Registrar Empresa"}
              </>
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
