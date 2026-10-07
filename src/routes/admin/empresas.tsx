import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getAdminStatsFn } from "@/lib/mystery/server-data";
import { toggleClientStatusFn } from "@/lib/admin";
import { ClientDrawer } from "@/components/admin/ClientDrawer";
import {
  Building2,
  Search,
  Plus,
  ExternalLink,
  Pencil,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  Hash,
  Mail,
  Phone,
  Power,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/empresas")({
  loader: async () => {
    const data = await getAdminStatsFn();
    return { data };
  },
  head: () => ({
    meta: [
      { title: "Empresas Clientes | Factor IQ SuperAdmin" },
      {
        name: "description",
        content: "Gestión de empresas clientes del SaaS Factor IQ.",
      },
    ],
  }),
  component: AdminEmpresasView,
});

function AdminEmpresasView() {
  const { data } = Route.useLoaderData();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Slide-over Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);

  const clientes = data.clientes || [];

  const filteredClientes = clientes.filter((c: any) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      c.nombre_comercial.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term) ||
      (c.ruc && c.ruc.includes(term));
    const matchPlan = filterPlan === "todos" || c.plan === filterPlan;
    const matchEstado = filterEstado === "todos" || c.estado === filterEstado;
    return matchSearch && matchPlan && matchEstado;
  });

  const handleToggleEstado = async (cliente: any) => {
    const nuevoEstado = cliente.estado === "activo" ? "suspendido" : "activo";
    try {
      const res = await toggleClientStatusFn({
        data: {
          clientId: cliente.id,
          nuevoEstado,
          slug: cliente.slug,
        },
      });
      if (res.success) {
        toast.success(res.message);
        await router.invalidate();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "No se pudo cambiar el estado de la empresa.");
    }
  };

  const handleSuccess = (msg: string) => {
    toast.success(msg);
    router.invalidate();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1b2447] tracking-tight font-['Archivo']">
            Empresas Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Administra las cuentas corporativas que reciben evaluaciones de Mystery Shopper.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/servicios/nuevo"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#dfe6f7] hover:bg-[#f4f7fb] text-[#1b2447] font-medium text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            <FolderPlus className="h-4 w-4 text-[#1b2447]" />
            <span>Wizard Alta Completa</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setClientToEdit(null);
              setDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1b2447] hover:bg-[#243362] text-white font-medium text-xs sm:text-sm rounded-xl shadow-lg shadow-[#1b2447]/15 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Empresa (Drawer)</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl bg-white border border-[#e3e8f3] backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, slug o RUC..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#dfe6f7] rounded-xl text-xs sm:text-sm text-[#1b2447] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d6452c]/20 focus:border-[#d6452c] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 bg-white border border-[#dfe6f7] rounded-xl text-xs text-[#1b2447] focus:outline-none focus:ring-2 focus:ring-[#d6452c]/20"
          >
            <option value="todos">Todos los Planes</option>
            <option value="basico">Básico</option>
            <option value="profesional">Profesional</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 bg-white border border-[#dfe6f7] rounded-xl text-xs text-[#1b2447] focus:outline-none focus:ring-2 focus:ring-[#d6452c]/20"
          >
            <option value="todos">Todos los Estados</option>
            <option value="activo">Activo</option>
            <option value="suspendido">Suspendido</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla de Empresas */}
      <div className="rounded-2xl border border-[#e3e8f3] bg-white backdrop-blur-xl overflow-hidden shadow-[0_20px_60px_rgba(27,36,71,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#f4f7fb] border-b border-[#e3e8f3] text-[11px] uppercase tracking-wider text-slate-600">
              <tr>
                <th className="p-4">Empresa / Razón Social</th>
                <th className="p-4">Identificador URL</th>
                <th className="p-4">RUC</th>
                <th className="p-4">Plan SaaS</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Contacto</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7] bg-white">
              {filteredClientes.length > 0 ? (
                filteredClientes.map((c: any) => {
                  const isActivo = c.estado === "activo";
                  return (
                    <tr key={c.id} className="hover:bg-[#f5f8ff] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
                            style={{
                              backgroundColor: `${c.color_primario || "#6366f1"}20`,
                              borderColor: `${c.color_primario || "#6366f1"}40`,
                              borderWidth: 1,
                              color: c.color_primario || "#6366f1",
                            }}
                          >
                            {c.nombre_comercial.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-[#1b2447] text-sm block">
                              {c.nombre_comercial}
                            </span>
                            <span className="text-[11px] text-slate-600 block truncate max-w-xs">
                              {c.razon_social || c.rubro || "Empresa Evaluada"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-mono text-xs text-[#1b2447] bg-[#eef2ff] px-2 py-0.5 rounded-lg border border-[#dfe6f7]">
                          /{c.slug}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-700">
                        {c.ruc ? c.ruc : <span className="text-slate-500">-</span>}
                      </td>

                      <td className="p-4">
                        <span
                          className={`capitalize px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            c.plan === "enterprise"
                              ? "bg-amber-500/10 text-amber-700 border-amber-200"
                              : c.plan === "profesional"
                                ? "bg-indigo-500/10 text-indigo-700 border-indigo-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {c.plan}
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                            isActivo
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-700 border-rose-200 hover:bg-rose-500/20"
                          }`}
                          title={isActivo ? "Clic para suspender" : "Clic para activar"}
                        >
                          <Power className="h-3 w-3" />
                          <span className="capitalize">{c.estado}</span>
                        </button>
                      </td>

                      <td className="p-4">
                        {c.contacto_nombre ? (
                          <div className="text-[11px]">
                            <p className="font-medium text-[#1b2447]">{c.contacto_nombre}</p>
                            {c.contacto_email && (
                              <p className="text-slate-600 truncate max-w-xs">{c.contacto_email}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setClientToEdit(c);
                              setDrawerOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#1b2447] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar en Slide-over Drawer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <Link
                            to={`/${c.slug}` as any}
                            target="_blank"
                            className="p-1.5 text-slate-500 hover:text-[#1b5094] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver portal cliente"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No se encontraron empresas con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Drawer para Crear / Editar Empresa */}
      <ClientDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        clientToEdit={clientToEdit}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
