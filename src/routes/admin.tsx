import { useState } from "react";
import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { getAuthUserFn, logoutFn } from "@/lib/auth";
import { getAdminStatsFn, type AdminStatsPayload } from "@/lib/mystery/server-data";
import {
  ShieldAlert,
  Database,
  Users,
  Building2,
  FileCheck2,
  Activity,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const user = await getAuthUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (user.rol !== "superadmin") {
      throw redirect({ to: (user.redirectTo || "/login") as "/login" });
    }
    return { user };
  },
  loader: async () => {
    const data = await getAdminStatsFn();
    return { data };
  },
  head: () => ({
    meta: [
      { title: "Panel SuperAdmin | Factor IQ" },
      {
        name: "description",
        content: "Panel de control y administración multi-cliente de Factor IQ.",
      },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user } = Route.useRouteContext();
  const { data } = Route.useLoaderData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"general" | "clientes" | "usuarios" | "auditoria">("general");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutFn();
      navigate({ to: "/login" });
    } catch {
      setIsLoggingOut(false);
    }
  };

  const filteredClientes = data.clientes.filter((c) =>
    c.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredUsuarios = data.usuarios.filter((u) =>
    u.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Barra superior de navegación */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white">Factor IQ</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                SuperAdmin
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Gestión central de clientes, accesos y base de datos MySQL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <div className={`w-2 h-2 rounded-full ${data.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span>{data.connected ? "MySQL: Conectado (factoriq)" : "Modo Híbrido: Fallback JSON"}</span>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-slate-200">{user.nombre}</div>
              <div className="text-[10px] text-slate-400 capitalize">{user.rol}</div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700 disabled:opacity-50"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? "Saliendo..." : "Salir"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Banner de estado de la migración */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h1 className="text-lg font-bold text-white">Estado de la Base de Datos y Multi-Tenant</h1>
              </div>
              <p className="text-sm text-slate-400 max-w-2xl">
                La arquitectura multi-cliente de Factor IQ centraliza datos en MySQL manteniendo compatibilidad
                con fallback automático a los datos de prueba cuando la base remota no esté disponible.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/maquinarias"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              >
                <span>Ver Dashboard Maquinarias</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <KpiCard
            title="Clientes"
            value={data.stats.clientes}
            icon={<Building2 className="w-4 h-4 text-sky-400" />}
            color="border-sky-500/30 bg-sky-950/20"
          />
          <KpiCard
            title="Usuarios"
            value={data.stats.usuarios}
            icon={<Users className="w-4 h-4 text-violet-400" />}
            color="border-violet-500/30 bg-violet-950/20"
          />
          <KpiCard
            title="Proyectos"
            value={data.stats.proyectos}
            icon={<Layers className="w-4 h-4 text-blue-400" />}
            color="border-blue-500/30 bg-blue-950/20"
          />
          <KpiCard
            title="Locales"
            value={data.stats.sucursales}
            icon={<Building2 className="w-4 h-4 text-amber-400" />}
            color="border-amber-500/30 bg-amber-950/20"
          />
          <KpiCard
            title="Evaluaciones"
            value={data.stats.evaluaciones}
            icon={<FileCheck2 className="w-4 h-4 text-emerald-400" />}
            color="border-emerald-500/30 bg-emerald-950/20"
          />
          <KpiCard
            title="Auditorías"
            value={data.stats.auditoria}
            icon={<Activity className="w-4 h-4 text-rose-400" />}
            color="border-rose-500/30 bg-rose-950/20"
          />
        </div>

        {/* Navegación por pestañas */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-1 text-sm font-medium">
          <TabButton
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
            label="Vista General & Migración"
          />
          <TabButton
            active={activeTab === "clientes"}
            onClick={() => setActiveTab("clientes")}
            label={`Clientes (${data.clientes.length})`}
          />
          <TabButton
            active={activeTab === "usuarios"}
            onClick={() => setActiveTab("usuarios")}
            label={`Usuarios (${data.usuarios.length})`}
          />
          <TabButton
            active={activeTab === "auditoria"}
            onClick={() => setActiveTab("auditoria")}
            label={`Auditoría (${data.auditoria.length})`}
          />
        </div>

        {/* Contenido según pestaña */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detalle de Infraestructura */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Conectividad y Servidor MySQL
              </h2>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Estado de Conexión:</span>
                  <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {data.connected ? "Conectado a MySQL" : "Usando Fallback Estático JSON"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Nombre de la Base:</span>
                  <span className="font-mono text-slate-200">factoriq</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Indicadores Registrados:</span>
                  <span className="text-slate-200 font-medium">
                    19 indicadores (12 Ventas + 7 Call Center con códigos aislados)
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Esquema Relacional:</span>
                  <span className="text-slate-200 font-mono">database/schema.sql</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Seed Integrado:</span>
                  <span className="text-slate-200 font-mono">database/seed_maquinarias.sql</span>
                </div>
              </div>
            </div>

            {/* Resumen del Cliente Principal */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                Cliente en Producción: Maquinarias
              </h2>
              <p className="text-xs text-slate-400">
                Primer cliente migrado al esquema multi-tenant con acceso dedicado y aislamiento de datos.
              </p>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Ruta de acceso:</span>
                  <span className="font-mono text-emerald-400">/maquinarias</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Tipo de Estudio:</span>
                  <span className="text-slate-200 font-medium">Mystery Shopping Automotriz</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Evaluaciones Totales:</span>
                  <span className="text-slate-200 font-medium">42 evaluaciones (22 Venta, 14 Call Center, 6 Seminuevos)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Usuario Administrador:</span>
                  <span className="font-mono text-slate-200">admMaqui</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña Clientes */}
        {activeTab === "clientes" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">Directorio de Clientes</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-850 border border-slate-700 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Empresa</th>
                    <th className="p-3">Slug URL</th>
                    <th className="p-3">RUC</th>
                    <th className="p-3">Rubro</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredClientes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-slate-400">#{c.id}</td>
                      <td className="p-3 font-medium text-white">{c.nombre_comercial}</td>
                      <td className="p-3 font-mono text-emerald-400">/{c.slug}</td>
                      <td className="p-3 font-mono text-slate-400">{c.ruc || "—"}</td>
                      <td className="p-3 text-slate-400">{c.rubro || "General"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize font-medium">
                          {c.plan}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize font-medium">
                          {c.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          to={`/${c.slug}` as "/maquinarias"}
                          className="inline-flex items-center gap-1 text-slate-300 hover:text-white font-medium hover:underline"
                        >
                          <span>Abrir panel</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pestaña Usuarios */}
        {activeTab === "usuarios" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">Cuentas y Accesos de Usuario</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-850 border border-slate-700 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Usuario (Login)</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Cliente Asignado</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Último Acceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredUsuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-slate-400">#{u.id}</td>
                      <td className="p-3 font-mono font-medium text-white">{u.usuario}</td>
                      <td className="p-3">{u.nombre}</td>
                      <td className="p-3 text-slate-400">{u.email || "—"}</td>
                      <td className="p-3 text-slate-300">{u.cliente_nombre || "Global"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-medium ${
                            u.rol === "superadmin"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {u.rol}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                          {u.estado}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString() : "Pendiente"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pestaña Auditoría */}
        {activeTab === "auditoria" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden space-y-4 p-5">
            <h2 className="text-base font-semibold text-white">Bitácora de Auditoría y Accesos</h2>
            {data.auditoria.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No hay eventos de auditoría registrados en la base de datos hasta el momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Acción</th>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Detalle</th>
                      <th className="p-3">Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {data.auditoria.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-400">#{a.id}</td>
                        <td className="p-3 font-semibold text-emerald-400">{a.accion}</td>
                        <td className="p-3 font-mono text-slate-200">{a.usuario}</td>
                        <td className="p-3 font-mono text-xs text-slate-400 max-w-md truncate">
                          {typeof a.detalle === "string" ? a.detalle : JSON.stringify(a.detalle)}
                        </td>
                        <td className="p-3 text-slate-400">{new Date(a.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`p-4 rounded-xl border ${color} flex flex-col justify-between space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
        active
          ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
      }`}
    >
      {label}
    </button>
  );
}
