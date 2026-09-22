import { createFileRoute, Link } from "@tanstack/react-router";
import { getAdminStatsFn, type AdminStatsPayload } from "@/lib/mystery/server-data";
import {
  Building2,
  Users,
  FileCheck2,
  FolderKanban,
  Database,
  CheckCircle2,
  TrendingUp,
  Server,
  HardDrive,
  Wifi,
  WifiOff,
  ArrowRight,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  loader: async () => {
    const data = await getAdminStatsFn();
    return { data };
  },
  head: () => ({
    meta: [
      { title: "Dashboard SaaS | Factor IQ SuperAdmin" },
      {
        name: "description",
        content: "Métricas principales y estado de la plataforma SaaS de Factor IQ.",
      },
    ],
  }),
  component: AdminDashboardView,
});

function AdminDashboardView() {
  const { data } = Route.useLoaderData();
  const stats = data.stats;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Plataforma Operativa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Archivo']">
            Panel Principal SaaS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitoreo global de empresas evaluadas, servicios de Mystery Shopper e infraestructura.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/servicios/nuevo"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Servicio (Wizard)</span>
          </Link>
        </div>
      </div>

      {/* Grid de KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Clientes */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Empresas Clientes
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{stats.clientes}</span>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              Activas
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <Link
              to="/admin/empresas"
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Ver empresas</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <span className="text-slate-500 text-[11px]">Multi-Tenant</span>
          </div>
        </div>

        {/* KPI Evaluaciones */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Evaluaciones Totales
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{stats.evaluaciones}</span>
            <span className="text-xs text-slate-400">visitas registradas</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">{stats.sucursales} sucursales</span>
            <span className="text-emerald-400 font-mono text-[11px]">MySQL 8.x</span>
          </div>
        </div>

        {/* KPI Proyectos / Servicios */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Servicios Contratados
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{stats.proyectos}</span>
            <span className="text-xs text-amber-400 font-medium">Estudios</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <Link
              to="/admin/servicios/nuevo"
              className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>+ Nuevo estudio</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* KPI Usuarios */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Usuarios con Acceso
            </span>
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{stats.usuarios}</span>
            <span className="text-xs text-slate-400">cuentas activas</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <Link
              to="/admin/usuarios"
              className="text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Gestionar accesos</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <span className="text-slate-500 text-[11px]">Bcrypt</span>
          </div>
        </div>
      </div>

      {/* Módulo Banner Wizard Onboarding */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/40 border border-indigo-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Flujo Unificado de Onboarding</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Archivo']">
              Alta de Empresa + Servicio + Carga Masiva Excel
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Registra una nueva empresa cliente, genera sus credenciales de acceso, valida el archivo .xlsx de Mystery Shopper con pre-visualización y activa el portal en 4 sencillos pasos.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              to="/admin/servicios/nuevo"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <span>Iniciar Wizard de Alta</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Dos Columnas: Salud del Sistema & Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salud del Sistema / Base de Datos */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-400" />
              <span>Infraestructura & Base de Datos</span>
            </h3>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                data.connected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {data.connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{data.connected ? "Conectado a MySQL" : "Modo Transición (JSON)"}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Motor de Base de Datos</span>
              <span className="font-semibold text-white mt-0.5 block">MySQL 8.x / InnoDB</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Esquema de Tablas</span>
              <span className="font-semibold text-white mt-0.5 block">10 tablas relacionales</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Aislamiento Multi-Tenant</span>
              <span className="font-semibold text-emerald-400 mt-0.5 block">
                Row-Level (cliente_id)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Cifrado de Credenciales</span>
              <span className="font-semibold text-indigo-400 mt-0.5 block">Bcrypt (cost factor 10)</span>
            </div>
          </div>
        </div>

        {/* Auditoría y Trazabilidad */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Bitácora de Auditoría Reciente</span>
            </h3>
            <span className="text-xs text-slate-400">Últimos eventos</span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {data.auditoria && data.auditoria.length > 0 ? (
              data.auditoria.slice(0, 5).map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-200 capitalize">
                      {log.accion.replace(/_/g, " ")}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Por: <span className="text-indigo-400 font-mono">{log.usuario || "Sistema"}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                No hay registros de auditoría aún.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
