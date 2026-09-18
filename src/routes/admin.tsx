import { useState, useCallback } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAuthUserFn } from "@/lib/auth";
import { getAdminStatsFn, type AdminStatsPayload } from "@/lib/mystery/server-data";
import { toggleUserStatusFn, toggleClientStatusFn } from "@/lib/admin";
import { AdminSidebar, type AdminTab } from "@/components/admin/AdminSidebar";
import { ResetPasswordModal } from "@/components/admin/ResetPasswordModal";
import { UserModal } from "@/components/admin/UserModal";
import { ClientModal } from "@/components/admin/ClientModal";
import {
  Building2,
  Users,
  FileCheck2,
  Activity,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  Plus,
  KeyRound,
  Pencil,
  ToggleRight,
  ToggleLeft,
  TrendingUp,
  Shield,
  Clock,
  Server,
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

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

// ─── Tipos ────────────────────────────────────────────────────────────────────
type UsuarioRow = AdminStatsPayload["usuarios"][0];
type ClienteRow = AdminStatsPayload["clientes"][0];
type AuditoriaRow = AdminStatsPayload["auditoria"][0];

// ─── Componente Principal ─────────────────────────────────────────────────────
function AdminDashboard() {
  const { user } = Route.useRouteContext();
  const { data } = Route.useLoaderData();

  const [activeTab, setActiveTab] = useState<AdminTab>("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modales
  const [resetModal, setResetModal] = useState<{ open: boolean; user: UsuarioRow | null }>({ open: false, user: null });
  const [userModal, setUserModal] = useState<{ open: boolean; user: UsuarioRow | null }>({ open: false, user: null });
  const [clientModal, setClientModal] = useState<{ open: boolean; client: ClienteRow | null }>({ open: false, client: null });

  // Estado local de datos (para actualizaciones optimistas)
  const [localUsuarios, setLocalUsuarios] = useState<UsuarioRow[]>(data.usuarios);
  const [localClientes, setLocalClientes] = useState<ClienteRow[]>(data.clientes);
  const [localAuditoria] = useState<AuditoriaRow[]>(data.auditoria);

  const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  const handleToggleUserStatus = async (u: UsuarioRow) => {
    const next = u.estado === "activo" ? "bloqueado" : "activo";
    try {
      await toggleUserStatusFn({ data: { userId: u.id, nuevoEstado: next, usuarioName: u.usuario } });
      setLocalUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, estado: next } : x)));
      showToast(`Usuario ${u.usuario} ahora está ${next}.`);
    } catch (err: any) {
      showToast(err?.message || "Error al cambiar el estado del usuario.", "error");
    }
  };

  const handleToggleClientStatus = async (c: ClienteRow) => {
    const next = c.estado === "activo" ? "suspendido" : "activo";
    try {
      await toggleClientStatusFn({ data: { clientId: c.id, nuevoEstado: next, slug: c.slug } });
      setLocalClientes((prev) => prev.map((x) => (x.id === c.id ? { ...x, estado: next } : x)));
      showToast(`Cliente ${c.nombre_comercial} ahora está ${next}.`);
    } catch (err: any) {
      showToast(err?.message || "Error al cambiar el estado del cliente.", "error");
    }
  };

  const handleUserSaved = (msg: string) => {
    showToast(msg);
    // Recargar datos
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleClientSaved = (msg: string) => {
    showToast(msg);
    setTimeout(() => window.location.reload(), 1000);
  };

  const filteredUsuarios = localUsuarios.filter(
    (u) =>
      u.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.cliente_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredClientes = localClientes.filter(
    (c) =>
      c.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.rubro || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchTerm("");
        }}
        user={user}
        stats={{
          clientes: data.stats.clientes,
          usuarios: data.stats.usuarios,
          auditoria: data.stats.auditoria,
        }}
      />

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header de sección */}
        <SectionHeader activeTab={activeTab} data={data} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <main className="flex-1 p-4 lg:p-6 space-y-5 overflow-auto">
          {/* KPIs Siempre Visibles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <AdminKpiCard
              title="Clientes"
              value={data.stats.clientes}
              icon={<Building2 className="w-4 h-4 text-sky-400" />}
              accent="border-sky-500/20 bg-sky-950/15"
              active={activeTab === "clientes"}
              onClick={() => setActiveTab("clientes")}
            />
            <AdminKpiCard
              title="Usuarios"
              value={data.stats.usuarios}
              icon={<Users className="w-4 h-4 text-violet-400" />}
              accent="border-violet-500/20 bg-violet-950/15"
              active={activeTab === "usuarios"}
              onClick={() => setActiveTab("usuarios")}
            />
            <AdminKpiCard
              title="Proyectos"
              value={data.stats.proyectos}
              icon={<Layers className="w-4 h-4 text-blue-400" />}
              accent="border-blue-500/20 bg-blue-950/15"
            />
            <AdminKpiCard
              title="Locales"
              value={data.stats.sucursales}
              icon={<Building2 className="w-4 h-4 text-amber-400" />}
              accent="border-amber-500/20 bg-amber-950/15"
            />
            <AdminKpiCard
              title="Evaluaciones"
              value={data.stats.evaluaciones}
              icon={<FileCheck2 className="w-4 h-4 text-emerald-400" />}
              accent="border-emerald-500/20 bg-emerald-950/15"
            />
            <AdminKpiCard
              title="Auditorías"
              value={data.stats.auditoria}
              icon={<Activity className="w-4 h-4 text-rose-400" />}
              accent="border-rose-500/20 bg-rose-950/15"
              active={activeTab === "auditoria"}
              onClick={() => setActiveTab("auditoria")}
            />
          </div>

          {/* Vista General */}
          {activeTab === "general" && (
            <GeneralView data={data} onGoToClientes={() => setActiveTab("clientes")} />
          )}

          {/* Vista Clientes */}
          {activeTab === "clientes" && (
            <ClientesView
              clientes={filteredClientes}
              searchTerm={searchTerm}
              onEdit={(c) => setClientModal({ open: true, client: c })}
              onToggleStatus={handleToggleClientStatus}
              onNew={() => setClientModal({ open: true, client: null })}
            />
          )}

          {/* Vista Usuarios */}
          {activeTab === "usuarios" && (
            <UsuariosView
              usuarios={filteredUsuarios}
              searchTerm={searchTerm}
              onEdit={(u) => setUserModal({ open: true, user: u })}
              onResetPassword={(u) => setResetModal({ open: true, user: u })}
              onToggleStatus={handleToggleUserStatus}
              onNew={() => setUserModal({ open: true, user: null })}
            />
          )}

          {/* Vista Auditoría */}
          {activeTab === "auditoria" && <AuditoriaView auditoria={localAuditoria} />}

          {/* Vista Database */}
          {activeTab === "database" && <DatabaseView data={data} />}
        </main>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-bottom-4 duration-200 ${
            toastMsg.type === "success"
              ? "bg-emerald-950 border-emerald-700/60 text-emerald-200"
              : "bg-rose-950 border-rose-700/60 text-rose-200"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Modales */}
      <ResetPasswordModal
        isOpen={resetModal.open}
        onClose={() => setResetModal({ open: false, user: null })}
        user={resetModal.user}
        onSuccess={(msg) => showToast(msg)}
      />

      <UserModal
        isOpen={userModal.open}
        onClose={() => setUserModal({ open: false, user: null })}
        userToEdit={userModal.user}
        clientes={localClientes.map((c) => ({ id: c.id, nombre_comercial: c.nombre_comercial, slug: c.slug }))}
        onSuccess={handleUserSaved}
      />

      <ClientModal
        isOpen={clientModal.open}
        onClose={() => setClientModal({ open: false, client: null })}
        clientToEdit={clientModal.client}
        onSuccess={handleClientSaved}
      />
    </div>
  );
}

// ─── Sub-componentes de Layout ────────────────────────────────────────────────

function SectionHeader({
  activeTab,
  data,
  searchTerm,
  setSearchTerm,
}: {
  activeTab: AdminTab;
  data: AdminStatsPayload & { connected: boolean };
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}) {
  const titles: Record<AdminTab, { label: string; sub: string }> = {
    general: { label: "Resumen General", sub: "Estado de la plataforma Factor IQ" },
    clientes: { label: "Directorio de Clientes", sub: "Gestiona empresas y portales multi-tenant" },
    usuarios: { label: "Usuarios & Credenciales", sub: "Administra cuentas, roles y contraseñas" },
    auditoria: { label: "Bitácora de Auditoría", sub: "Registro de eventos y acciones del sistema" },
    database: { label: "Salud del Sistema", sub: "Diagnóstico de base de datos MySQL" },
  };

  const { label, sub } = titles[activeTab];
  const showSearch = activeTab === "clientes" || activeTab === "usuarios";

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-20 px-4 lg:px-6 py-3.5 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-sm font-bold text-white">{label}</h1>
        <p className="text-xs text-slate-400 hidden sm:block">{sub}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicador MySQL */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <div
            className={`w-1.5 h-1.5 rounded-full ${data.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
          />
          <span className="font-mono">{data.connected ? "MySQL: OK" : "Fallback JSON"}</span>
        </div>

        {/* Buscador */}
        {showSearch && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={activeTab === "clientes" ? "Buscar cliente..." : "Buscar usuario..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-56"
            />
          </div>
        )}
      </div>
    </header>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function AdminKpiCard({
  title,
  value,
  icon,
  accent,
  active,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border ${accent} flex flex-col gap-2 transition-all duration-200 ${
        onClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-lg" : ""
      } ${active ? "ring-1 ring-white/10 shadow-lg" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
    </div>
  );
}

// ─── Vista General ────────────────────────────────────────────────────────────
function GeneralView({
  data,
  onGoToClientes,
}: {
  data: AdminStatsPayload & { connected: boolean };
  onGoToClientes: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Banner de conexión MySQL */}
      <div
        className={`rounded-xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden ${
          data.connected
            ? "bg-emerald-950/20 border-emerald-800/40"
            : "bg-amber-950/20 border-amber-800/40"
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-56 h-24 blur-3xl rounded-full pointer-events-none ${
            data.connected ? "bg-emerald-500/10" : "bg-amber-500/10"
          }`}
        />
        <div className="flex items-center gap-3">
          {data.connected ? (
            <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div>
            <h2 className="text-sm font-bold text-white">
              {data.connected ? "MySQL Conectado — Base de Datos Activa" : "Modo Fallback — Sin conexión MySQL"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {data.connected
                ? "Todos los módulos operando con datos en tiempo real desde la base de datos factoriq."
                : "Las operaciones están usando datos JSON embebidos. Verifica la configuración del .env para activar MySQL."}
            </p>
          </div>
        </div>
        <Link
          to="/maquinarias"
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow"
        >
          <span>Ver Portal Maquinarias</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Paneles de Infraestructura y Cliente en Producción */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Infraestructura MySQL */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Infraestructura y Conectividad MySQL
          </h2>
          <div className="space-y-0 divide-y divide-slate-800/60 text-xs text-slate-300">
            <InfoRow label="Estado de Conexión" value={data.connected ? "✅ Conectado a MySQL" : "⚠️ Fallback JSON"} mono={false} />
            <InfoRow label="Base de Datos" value="factoriq" mono />
            <InfoRow label="Indicadores Registrados" value="19 indicadores (12 Ventas + 7 Call Center)" mono={false} />
            <InfoRow label="Esquema Relacional" value="database/schema.sql" mono />
            <InfoRow label="Seed de Datos" value="database/seed_maquinarias.sql" mono />
          </div>
        </div>

        {/* Cliente en producción */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              Cliente en Producción: Maquinarias
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Activo
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Primer cliente migrado al esquema multi-tenant con acceso dedicado y aislamiento de datos.
          </p>
          <div className="space-y-0 divide-y divide-slate-800/60 text-xs text-slate-300">
            <InfoRow label="Ruta de acceso" value="/maquinarias" mono accent />
            <InfoRow label="Tipo de Estudio" value="Mystery Shopping Automotriz" mono={false} />
            <InfoRow label="Evaluaciones Totales" value="42 evaluaciones (Venta, Call Center, Seminuevos)" mono={false} />
            <InfoRow label="Administrador" value="admMaqui" mono />
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickActionCard
          icon={<Building2 className="w-5 h-5 text-sky-400" />}
          title="Nuevo Cliente"
          desc="Registrar empresa en la plataforma"
          accent="bg-sky-950/15 border-sky-800/30 hover:border-sky-600/50"
          onClick={onGoToClientes}
        />
        <QuickActionCard
          icon={<Users className="w-5 h-5 text-violet-400" />}
          title="Nuevo Usuario"
          desc="Crear acceso a un cliente o global"
          accent="bg-violet-950/15 border-violet-800/30 hover:border-violet-600/50"
          onClick={onGoToClientes}
        />
        <QuickActionCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          title="Ver Estadísticas"
          desc="Dashboard de análisis Maquinarias"
          accent="bg-emerald-950/15 border-emerald-800/30 hover:border-emerald-600/50"
          onClick={onGoToClientes}
        />
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2 gap-4">
      <span className="text-slate-400 shrink-0">{label}:</span>
      <span
        className={`${mono ? "font-mono" : ""} ${accent ? "text-emerald-400" : "text-slate-200"} text-right`}
      >
        {value}
      </span>
    </div>
  );
}

function QuickActionCard({
  icon,
  title,
  desc,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all text-left group ${accent}`}
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-xs font-bold text-white group-hover:text-white">{title}</span>
      </div>
      <p className="text-[11px] text-slate-400 group-hover:text-slate-300">{desc}</p>
    </button>
  );
}

// ─── Vista Clientes ───────────────────────────────────────────────────────────
function ClientesView({
  clientes,
  searchTerm,
  onEdit,
  onToggleStatus,
  onNew,
}: {
  clientes: ClienteRow[];
  searchTerm: string;
  onEdit: (c: ClienteRow) => void;
  onToggleStatus: (c: ClienteRow) => void;
  onNew: () => void;
}) {
  const planColors: Record<string, string> = {
    basico: "bg-slate-700/40 text-slate-300 border-slate-600/40",
    profesional: "bg-blue-900/40 text-blue-300 border-blue-700/40",
    enterprise: "bg-violet-900/40 text-violet-300 border-violet-700/40",
  };

  const estadoColors: Record<string, string> = {
    activo: "bg-emerald-900/30 text-emerald-400 border-emerald-700/30",
    suspendido: "bg-amber-900/30 text-amber-400 border-amber-700/30",
    inactivo: "bg-rose-900/30 text-rose-400 border-rose-700/30",
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
        <div>
          <h2 className="text-sm font-bold text-white">Directorio de Empresas / Clientes</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
            {searchTerm && " (filtrados)"}
          </p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Slug / Portal</th>
              <th className="px-4 py-3">RUC</th>
              <th className="px-4 py-3">Rubro</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  {searchTerm ? "No se encontraron clientes con ese término." : "No hay clientes registrados aún."}
                </td>
              </tr>
            ) : (
              clientes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">#{c.id}</td>
                  <td className="px-4 py-3 font-semibold text-white">{c.nombre_comercial}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/${c.slug}` as "/maquinarias"}
                      className="font-mono text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                    >
                      <span>/{c.slug}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{c.ruc || "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{c.rubro || "General"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold capitalize ${planColors[c.plan] || "bg-slate-800 text-slate-300"}`}>
                      {c.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold capitalize ${estadoColors[c.estado] || "bg-slate-800 text-slate-300"}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(c)}
                        title="Editar cliente"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(c)}
                        title={c.estado === "activo" ? "Suspender cliente" : "Activar cliente"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          c.estado === "activo"
                            ? "text-amber-400 hover:bg-amber-950/40"
                            : "text-emerald-400 hover:bg-emerald-950/40"
                        }`}
                      >
                        {c.estado === "activo" ? (
                          <ToggleRight className="w-3.5 h-3.5" />
                        ) : (
                          <ToggleLeft className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Vista Usuarios ───────────────────────────────────────────────────────────
function UsuariosView({
  usuarios,
  searchTerm,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onNew,
}: {
  usuarios: UsuarioRow[];
  searchTerm: string;
  onEdit: (u: UsuarioRow) => void;
  onResetPassword: (u: UsuarioRow) => void;
  onToggleStatus: (u: UsuarioRow) => void;
  onNew: () => void;
}) {
  const rolColors: Record<string, string> = {
    superadmin: "bg-purple-900/40 text-purple-300 border-purple-700/40",
    admin_cliente: "bg-blue-900/40 text-blue-300 border-blue-700/40",
    viewer: "bg-slate-700/40 text-slate-300 border-slate-600/40",
  };

  const estadoColors: Record<string, string> = {
    activo: "bg-emerald-900/30 text-emerald-400 border-emerald-700/30",
    bloqueado: "bg-amber-900/30 text-amber-400 border-amber-700/30",
    inactivo: "bg-rose-900/30 text-rose-400 border-rose-700/30",
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
        <div>
          <h2 className="text-sm font-bold text-white">Cuentas de Usuario y Credenciales</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {usuarios.length} {usuarios.length === 1 ? "usuario" : "usuarios"}
            {searchTerm && " (filtrados)"}
          </p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Último Acceso</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  {searchTerm ? "No se encontraron usuarios con ese término." : "No hay usuarios registrados."}
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">#{u.id}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-white">{u.usuario}</td>
                  <td className="px-4 py-3 text-slate-200">{u.nombre}</td>
                  <td className="px-4 py-3 text-slate-400">{u.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {u.cliente_nombre && u.cliente_nombre !== "Factor IQ Global" ? (
                      <span className="font-mono text-emerald-400/80">{u.cliente_nombre}</span>
                    ) : (
                      <span className="text-slate-500 italic">Global (Factor IQ)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold capitalize ${rolColors[u.rol] || "bg-slate-800 text-slate-300"}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold capitalize ${estadoColors[u.estado] || "bg-slate-800 text-slate-300"}`}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                    {u.ultimo_acceso ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(u.ultimo_acceso).toLocaleDateString("es-PE")}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic">Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(u)}
                        title="Editar usuario"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onResetPassword(u)}
                        title="Restablecer contraseña"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(u)}
                        title={u.estado === "activo" ? "Bloquear usuario" : "Activar usuario"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.estado === "activo"
                            ? "text-amber-400 hover:bg-amber-950/30"
                            : "text-emerald-400 hover:bg-emerald-950/30"
                        }`}
                      >
                        {u.estado === "activo" ? (
                          <ToggleRight className="w-3.5 h-3.5" />
                        ) : (
                          <ToggleLeft className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Vista Auditoría ──────────────────────────────────────────────────────────
function AuditoriaView({ auditoria }: { auditoria: AuditoriaRow[] }) {
  const actionColors: Record<string, string> = {
    login: "text-emerald-400 bg-emerald-950/30 border-emerald-800/40",
    login_fallido: "text-rose-400 bg-rose-950/30 border-rose-800/40",
    reset_password: "text-amber-400 bg-amber-950/30 border-amber-800/40",
    crear_usuario: "text-blue-400 bg-blue-950/30 border-blue-800/40",
    actualizar_usuario: "text-sky-400 bg-sky-950/30 border-sky-800/40",
    crear_cliente: "text-violet-400 bg-violet-950/30 border-violet-800/40",
    actualizar_cliente: "text-purple-400 bg-purple-950/30 border-purple-800/40",
    cambio_clave_admin: "text-orange-400 bg-orange-950/30 border-orange-800/40",
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-rose-400" />
            Bitácora de Eventos y Auditoría
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Últimas {auditoria.length} acciones registradas en el sistema
          </p>
        </div>
        <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Actualizar">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {auditoria.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <FileCheck2 className="w-8 h-8 text-slate-700 mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Sin eventos registrados</p>
          <p className="text-xs text-slate-600">Los accesos, cambios de clave y acciones del sistema quedarán aquí.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Detalle</th>
                <th className="px-4 py-3">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditoria.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">#{a.id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${actionColors[a.accion] || "text-slate-300 bg-slate-800 border-slate-700"}`}>
                      {a.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-200">{a.usuario}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                    {typeof a.detalle === "string" ? a.detalle : JSON.stringify(a.detalle)}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    {new Date(a.created_at).toLocaleString("es-PE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Vista Base de Datos ──────────────────────────────────────────────────────
function DatabaseView({ data }: { data: AdminStatsPayload & { connected: boolean } }) {
  const tables = [
    { name: "clientes", count: data.stats.clientes, icon: <Building2 className="w-3.5 h-3.5 text-sky-400" />, color: "text-sky-400" },
    { name: "usuarios", count: data.stats.usuarios, icon: <Users className="w-3.5 h-3.5 text-violet-400" />, color: "text-violet-400" },
    { name: "proyectos", count: data.stats.proyectos, icon: <Layers className="w-3.5 h-3.5 text-blue-400" />, color: "text-blue-400" },
    { name: "sucursales", count: data.stats.sucursales, icon: <Server className="w-3.5 h-3.5 text-amber-400" />, color: "text-amber-400" },
    { name: "evaluaciones", count: data.stats.evaluaciones, icon: <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />, color: "text-emerald-400" },
    { name: "auditoria", count: data.stats.auditoria, icon: <Shield className="w-3.5 h-3.5 text-rose-400" />, color: "text-rose-400" },
  ];

  return (
    <div className="space-y-5">
      {/* Estado de conexión */}
      <div className={`rounded-xl border p-5 space-y-4 ${data.connected ? "border-emerald-800/40 bg-emerald-950/10" : "border-amber-800/40 bg-amber-950/10"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${data.connected ? "border-emerald-700/50 bg-emerald-950/30 text-emerald-400" : "border-amber-700/50 bg-amber-950/30 text-amber-400"}`}>
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Base de Datos MySQL — Factoriq</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${data.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-xs text-slate-400">
                {data.connected ? "Conectado y operativo" : "Sin conexión — Usando fallback JSON"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <InfoRow label="Host" value="localhost (WAMP64)" mono />
          <InfoRow label="Base de datos" value="factoriq" mono />
          <InfoRow label="Motor" value="InnoDB — MySQL 8.x" mono={false} />
          <InfoRow label="Charset" value="utf8mb4_unicode_ci" mono />
        </div>
      </div>

      {/* Tablas */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" />
            Estado de Tablas y Registros
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-800/60">
          {tables.map((t) => (
            <div key={t.name} className="bg-slate-900/80 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {t.icon}
                </div>
                <div>
                  <span className="text-xs font-mono text-slate-300">{t.name}</span>
                  <div className="text-[10px] text-slate-500">tabla</div>
                </div>
              </div>
              <div className={`text-lg font-bold font-mono ${t.color}`}>{t.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info de Archivos SQL */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-400" />
          Archivos de Esquema y Seed
        </h3>
        <div className="space-y-0 divide-y divide-slate-800/60 text-xs">
          <InfoRow label="Esquema principal" value="database/schema.sql" mono />
          <InfoRow label="Datos de prueba" value="database/seed_maquinarias.sql" mono />
          <InfoRow label="Variable de entorno" value=".env (DB_HOST, DB_USER, DB_PASS, DB_NAME)" mono />
          <InfoRow label="Librerías" value="mysql2/promise, bcryptjs" mono />
        </div>
      </div>
    </div>
  );
}
