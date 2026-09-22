import { useState } from "react";
import { Building2, Hash, Sparkles, User, Mail, Phone, ArrowRight } from "lucide-react";

export interface CompanyData {
  nombre_comercial: string;
  slug: string;
  razon_social: string;
  ruc: string;
  rubro: string;
  plan: "basico" | "profesional" | "enterprise";
  color_primario: string;
  contacto_nombre: string;
  contacto_email: string;
  contacto_telefono: string;
}

interface Step1CompanyDataProps {
  data: CompanyData;
  onChange: (updated: Partial<CompanyData>) => void;
  onNext: () => void;
}

export function Step1CompanyData({ data, onChange, onNext }: Step1CompanyDataProps) {
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    const autoSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    onChange({ nombre_comercial: name, slug: autoSlug });
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.nombre_comercial.trim()) {
      setError("El nombre comercial de la empresa es obligatorio.");
      return;
    }
    if (!data.slug.trim()) {
      setError("El slug para la URL es obligatorio.");
      return;
    }
    if (data.ruc.trim() && data.ruc.trim().length !== 11) {
      setError("El RUC debe tener exactamente 11 dígitos numéricos.");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-400" />
            Paso 1: Información Corporativa de la Empresa Cliente
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Ingresa los datos generales de la empresa contratante. El slug definirá la URL de acceso a sus tableros.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Sección 1: Datos Básicos */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nombre Comercial <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={data.nombre_comercial}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej. Grupo Automotriz del Perú"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Slug / Identificador URL <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-500">/</span>
                <input
                  type="text"
                  required
                  value={data.slug}
                  onChange={(e) =>
                    onChange({
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
                    })
                  }
                  placeholder="grupo-automotriz"
                  className="w-full pl-7 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Razón Social
              </label>
              <input
                type="text"
                value={data.razon_social}
                onChange={(e) => onChange({ razon_social: e.target.value })}
                placeholder="Ej. Grupo Automotriz del Perú S.A.C."
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                RUC (11 dígitos)
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  maxLength={11}
                  value={data.ruc}
                  onChange={(e) =>
                    onChange({ ruc: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  placeholder="20601234567"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sección 2: Plan y Branding */}
        <div className="pt-4 border-t border-slate-800/80 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Configuración SaaS & Personalización
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Plan del Servicio
              </label>
              <select
                value={data.plan}
                onChange={(e) => onChange({ plan: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="basico">Básico (1 estudio / año)</option>
                <option value="profesional">Profesional (Mensual / Trimestral)</option>
                <option value="enterprise">Enterprise (Continuo con IA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Rubro o Sector
              </label>
              <input
                type="text"
                value={data.rubro}
                onChange={(e) => onChange({ rubro: e.target.value })}
                placeholder="Automotriz, Retail, Banca, Farmacias..."
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Color de Marca
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={data.color_primario}
                  onChange={(e) => onChange({ color_primario: e.target.value })}
                  className="h-10 w-12 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300">{data.color_primario}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 3: Contacto */}
        <div className="pt-4 border-t border-slate-800/80 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-400" />
            Persona de Contacto en la Empresa
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nombre y Cargo
              </label>
              <input
                type="text"
                value={data.contacto_nombre}
                onChange={(e) => onChange({ contacto_nombre: e.target.value })}
                placeholder="Ej. Laura Gómez - Gerente Comercial"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={data.contacto_email}
                  onChange={(e) => onChange({ contacto_email: e.target.value })}
                  placeholder="laura.gomez@empresa.pe"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={data.contacto_telefono}
                  onChange={(e) => onChange({ contacto_telefono: e.target.value })}
                  placeholder="+51 912 345 678"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <span>Siguiente: Credenciales de Acceso</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
