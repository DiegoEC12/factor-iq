import { useState, useCallback } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAuthUserFn } from "@/lib/auth";
import { getAdminStatsFn, type AdminStatsPayload } from "@/lib/mystery/server-data";
import {
  createTicketFn,
  saveProjectFn,
  toggleUserStatusFn,
  toggleClientStatusFn,
  updateTicketStatusFn,
} from "@/lib/admin";
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
  Bell,
  Moon,
  Sun,
  FolderKanban,
  LifeBuoy,
  Upload,
  UserRound,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
type ProyectoRow = AdminStatsPayload["proyectos"][0];
type TicketRow = AdminStatsPayload["tickets"][0];

// ─── Componente Principal ─────────────────────────────────────────────────────
function AdminDashboard() {
  const { user } = Route.useRouteContext();
  const { data } = Route.useLoaderData();

  const [activeTab, setActiveTab] = useState<AdminTab>("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(
    null,
  );

  // Modales
  const [resetModal, setResetModal] = useState<{ open: boolean; user: UsuarioRow | null }>({
    open: false,
    user: null,
  });
  const [userModal, setUserModal] = useState<{ open: boolean; user: UsuarioRow | null }>({
    open: false,
    user: null,
  });
  const [clientModal, setClientModal] = useState<{ open: boolean; client: ClienteRow | null }>({
    open: false,
    client: null,
  });
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  // Estado local de datos (para actualizaciones optimistas)
  const [localUsuarios, setLocalUsuarios] = useState<UsuarioRow[]>(data.usuarios);
  const [localClientes, setLocalClientes] = useState<ClienteRow[]>(data.clientes);
  const [localAuditoria] = useState<AuditoriaRow[]>(data.auditoria);
  const [localTickets, setLocalTickets] = useState<TicketRow[]>(data.tickets);

  const showToast = useCallback((text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  const handleToggleUserStatus = async (u: UsuarioRow) => {
    const next = u.estado === "activo" ? "bloqueado" : "activo";
    try {
      await toggleUserStatusFn({
        data: { userId: u.id, nuevoEstado: next, usuarioName: u.usuario },
      });
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

  const handleTicketStatus = async (
    ticket: TicketRow,
    estado: "abierto" | "en_analisis" | "resuelto",
  ) => {
    try {
      await updateTicketStatusFn({ data: { ticketId: ticket.id, estado } });
      setLocalTickets((current) =>
        current.map((item) => (item.id === ticket.id ? { ...item, estado } : item)),
      );
      showToast("Estado del ticket actualizado.");
    } catch (err: any) {
      showToast(err?.message || "No se pudo actualizar el ticket.", "error");
    }
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
    <div className="factor-admin min-h-screen flex">
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
          proyectos: data.stats.proyectos,
          usuarios: data.stats.usuarios,
          tickets: data.stats.tickets,
          auditoria: data.stats.auditoria,
        }}
      />

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header de sección */}
        <SectionHeader
          activeTab={activeTab}
          data={data}
          user={user}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <main className="flex-1 p-4 lg:p-6 space-y-5 overflow-auto">
          {/* KPIs Siempre Visibles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <AdminKpiCard
              title="Clientes"
              value={data.stats.clientes}
              icon={<Building2 className="w-4 h-4 text-[#1b2447]" />}
              accent="border-[#d8dcec] bg-white"
              active={activeTab === "clientes"}
              onClick={() => setActiveTab("clientes")}
            />
            <AdminKpiCard
              title="Usuarios"
              value={data.stats.usuarios}
              icon={<Users className="w-4 h-4 text-[#d6452c]" />}
              accent="border-[#f3d4cd] bg-white"
              active={activeTab === "usuarios"}
              onClick={() => setActiveTab("usuarios")}
            />
            <AdminKpiCard
              title="Proyectos"
              value={data.stats.proyectos}
              icon={<Layers className="w-4 h-4 text-[#1b2447]" />}
              accent="border-[#d8dcec] bg-white"
            />
            <AdminKpiCard
              title="Locales"
              value={data.stats.sucursales}
              icon={<Building2 className="w-4 h-4 text-[#d6452c]" />}
              accent="border-[#f3d4cd] bg-white"
            />
            <AdminKpiCard
              title="Evaluaciones"
              value={data.stats.evaluaciones}
              icon={<FileCheck2 className="w-4 h-4 text-[#1b2447]" />}
              accent="border-[#d8dcec] bg-white"
            />
            <AdminKpiCard
              title="Auditorías"
              value={data.stats.auditoria}
              icon={<Activity className="w-4 h-4 text-[#d6452c]" />}
              accent="border-[#f3d4cd] bg-white"
              active={activeTab === "auditoria"}
              onClick={() => setActiveTab("auditoria")}
            />
          </div>

          {/* Vista General */}
          {activeTab === "general" && (
            <GeneralView
              data={data}
              onGoToClientes={() => setActiveTab("clientes")}
              onGoToUsuarios={() => setActiveTab("usuarios")}
              onGoToProyectos={() => setActiveTab("proyectos")}
              onGoToTickets={() => setActiveTab("tickets")}
            />
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

          {activeTab === "proyectos" && (
            <ProyectosView
              proyectos={data.proyectos}
              onNew={() => setProjectModalOpen(true)}
              showToast={showToast}
            />
          )}

          {activeTab === "tickets" && (
            <TicketsView
              tickets={localTickets}
              onNew={() => setTicketModalOpen(true)}
              onStatusChange={handleTicketStatus}
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
        clientes={localClientes.map((c) => ({
          id: c.id,
          nombre_comercial: c.nombre_comercial,
          slug: c.slug,
        }))}
        onSuccess={handleUserSaved}
      />

      <ClientModal
        isOpen={clientModal.open}
        onClose={() => setClientModal({ open: false, client: null })}
        clientToEdit={clientModal.client}
        onSuccess={handleClientSaved}
      />
      <ProjectModal
        isOpen={projectModalOpen}
        clientes={localClientes}
        onClose={() => setProjectModalOpen(false)}
        onSuccess={handleClientSaved}
      />
      <TicketModal
        isOpen={ticketModalOpen}
        clientes={localClientes}
        onClose={() => setTicketModalOpen(false)}
        onSuccess={handleClientSaved}
      />
    </div>
  );
}

// ─── Sub-componentes de Layout ────────────────────────────────────────────────

function SectionHeader({
  activeTab,
  data,
  user,
  searchTerm,
  setSearchTerm,
}: {
  activeTab: AdminTab;
  data: AdminStatsPayload & { connected: boolean };
  user: { nombre: string; rol: string };
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}) {
  const titles: Record<AdminTab, { label: string; sub: string }> = {
    general: { label: "Resumen general", sub: "Visión operativa de la plataforma Factor IQ" },
    clientes: { label: "Clientes", sub: "Empresas, portales y estado de la cuenta" },
    usuarios: { label: "Usuarios y accesos", sub: "Cuentas, roles, credenciales y actividad" },
    proyectos: {
      label: "Proyectos e importación",
      sub: "Estudios aislados, periodos y validación de archivos",
    },
    tickets: {
      label: "Soporte y tickets",
      sub: "Incidencias, prioridades y seguimiento operativo",
    },
    auditoria: {
      label: "Bitácora de Auditoría",
      sub: "Registro de eventos y acciones del sistema",
    },
    database: { label: "Salud del Sistema", sub: "Diagnóstico de base de datos MySQL" },
  };

  const { label, sub } = titles[activeTab];
  const showSearch = activeTab === "clientes" || activeTab === "usuarios";

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-20 px-4 lg:px-6 py-3.5 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-sm font-bold text-[#1b2447]">{label}</h1>
        <p className="text-xs text-slate-500 hidden sm:block">{sub}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicador MySQL */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#eef0f8] border border-[#d8dcec] text-[11px] text-slate-600">
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
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#d6452c] w-48 sm:w-56"
            />
          </div>
        )}
        <SwitchTheme />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative rounded-lg p-2 text-slate-500 transition-ui hover:bg-[#eef0f8] hover:text-[#1b2447]"
              aria-label="Ver notificaciones"
            >
              <Bell className="h-4 w-4" />
              {!data.connected && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#d6452c]" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 border-slate-200 bg-white p-2 text-slate-700"
          >
            <DropdownMenuLabel className="text-xs text-[#1b2447]">Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-3 text-xs text-slate-500">
              {data.connected
                ? "No hay alertas operativas pendientes."
                : "MySQL no está disponible: la plataforma usa el respaldo JSON."}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 sm:flex">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef0f8] text-[#d6452c]">
            <UserRound className="h-3.5 w-3.5" />
          </div>
          <div className="max-w-28">
            <p className="truncate text-[11px] font-semibold text-[#1b2447]">{user.nombre}</p>
            <p className="text-[9px] text-slate-500">{user.rol}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function SwitchTheme() {
  const [dark, setDark] = useState(false);
  const toggle = (enabled: boolean) => {
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  };
  return (
    <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 sm:flex">
      <Sun className="h-3.5 w-3.5 text-amber-500" />
      <Switch checked={dark} onCheckedChange={toggle} aria-label="Alternar modo oscuro" />
      <Moon className="h-3.5 w-3.5 text-[#1b2447]" />
    </div>
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
      <div className="text-2xl font-bold tracking-tight text-[#1b2447]">{value}</div>
    </div>
  );
}

// ─── Vista General ────────────────────────────────────────────────────────────
function GeneralView({
  data,
  onGoToClientes,
  onGoToUsuarios,
  onGoToProyectos,
  onGoToTickets,
}: {
  data: AdminStatsPayload & { connected: boolean };
  onGoToClientes: () => void;
  onGoToUsuarios: () => void;
  onGoToProyectos: () => void;
  onGoToTickets: () => void;
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
              {data.connected
                ? "MySQL Conectado — Base de Datos Activa"
                : "Modo Fallback — Sin conexión MySQL"}
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
            <InfoRow
              label="Estado de Conexión"
              value={data.connected ? "✅ Conectado a MySQL" : "⚠️ Fallback JSON"}
              mono={false}
            />
            <InfoRow label="Base de Datos" value="factoriq" mono />
            <InfoRow
              label="Indicadores Registrados"
              value="19 indicadores (12 Ventas + 7 Call Center)"
              mono={false}
            />
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
            Primer cliente migrado al esquema multi-tenant con acceso dedicado y aislamiento de
            datos.
          </p>
          <div className="space-y-0 divide-y divide-slate-800/60 text-xs text-slate-300">
            <InfoRow label="Ruta de acceso" value="/maquinarias" mono accent />
            <InfoRow label="Tipo de Estudio" value="Mystery Shopping Automotriz" mono={false} />
            <InfoRow
              label="Evaluaciones Totales"
              value="42 evaluaciones (Venta, Call Center, Seminuevos)"
              mono={false}
            />
            <InfoRow label="Administrador" value="admMaqui" mono />
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <QuickActionCard
          icon={<Building2 className="w-5 h-5 text-[#1b2447]" />}
          title="Gestionar clientes"
          desc="Registrar empresas, portales y planes"
          accent="bg-white border-[#d8dcec] hover:border-[#1b2447]"
          onClick={onGoToClientes}
        />
        <QuickActionCard
          icon={<Users className="w-5 h-5 text-[#d6452c]" />}
          title="Gestionar accesos"
          desc="Crear cuentas, roles y credenciales"
          accent="bg-white border-[#f3d4cd] hover:border-[#d6452c]"
          onClick={onGoToUsuarios}
        />
        <QuickActionCard
          icon={<FolderKanban className="w-5 h-5 text-[#1b2447]" />}
          title="Nuevo proyecto"
          desc="Preparar un estudio y validar su Excel"
          accent="bg-white border-[#d8dcec] hover:border-[#1b2447]"
          onClick={onGoToProyectos}
        />
        <QuickActionCard
          icon={<LifeBuoy className="w-5 h-5 text-[#d6452c]" />}
          title="Crear ticket"
          desc="Registrar una incidencia operativa"
          accent="bg-white border-[#f3d4cd] hover:border-[#d6452c]"
          onClick={onGoToTickets}
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
                  {searchTerm
                    ? "No se encontraron clientes con ese término."
                    : "No hay clientes registrados aún."}
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
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] font-semibold capitalize ${planColors[c.plan] || "bg-slate-800 text-slate-300"}`}
                    >
                      {c.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] font-semibold capitalize ${estadoColors[c.estado] || "bg-slate-800 text-slate-300"}`}
                    >
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
                  {searchTerm
                    ? "No se encontraron usuarios con ese término."
                    : "No hay usuarios registrados."}
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
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] font-semibold capitalize ${rolColors[u.rol] || "bg-slate-800 text-slate-300"}`}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] font-semibold capitalize ${estadoColors[u.estado] || "bg-slate-800 text-slate-300"}`}
                    >
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
        <button
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {auditoria.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <FileCheck2 className="w-8 h-8 text-slate-700 mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Sin eventos registrados</p>
          <p className="text-xs text-slate-600">
            Los accesos, cambios de clave y acciones del sistema quedarán aquí.
          </p>
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
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${actionColors[a.accion] || "text-slate-300 bg-slate-800 border-slate-700"}`}
                    >
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
    {
      name: "clientes",
      count: data.stats.clientes,
      icon: <Building2 className="w-3.5 h-3.5 text-sky-400" />,
      color: "text-sky-400",
    },
    {
      name: "usuarios",
      count: data.stats.usuarios,
      icon: <Users className="w-3.5 h-3.5 text-violet-400" />,
      color: "text-violet-400",
    },
    {
      name: "proyectos",
      count: data.stats.proyectos,
      icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
      color: "text-blue-400",
    },
    {
      name: "sucursales",
      count: data.stats.sucursales,
      icon: <Server className="w-3.5 h-3.5 text-amber-400" />,
      color: "text-amber-400",
    },
    {
      name: "evaluaciones",
      count: data.stats.evaluaciones,
      icon: <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />,
      color: "text-emerald-400",
    },
    {
      name: "auditoria",
      count: data.stats.auditoria,
      icon: <Shield className="w-3.5 h-3.5 text-rose-400" />,
      color: "text-rose-400",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Estado de conexión */}
      <div
        className={`rounded-xl border p-5 space-y-4 ${data.connected ? "border-emerald-800/40 bg-emerald-950/10" : "border-amber-800/40 bg-amber-950/10"}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center ${data.connected ? "border-emerald-700/50 bg-emerald-950/30 text-emerald-400" : "border-amber-700/50 bg-amber-950/30 text-amber-400"}`}
          >
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Base de Datos MySQL — Factoriq</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${data.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
              />
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
          <InfoRow
            label="Variable de entorno"
            value=".env (DB_HOST, DB_USER, DB_PASS, DB_NAME)"
            mono
          />
          <InfoRow label="Librerías" value="mysql2/promise, bcryptjs" mono />
        </div>
      </div>
    </div>
  );
}

function ProyectosView({
  proyectos,
  onNew,
  showToast,
}: {
  proyectos: ProyectoRow[];
  onNew: () => void;
  showToast: (text: string, type?: "success" | "error") => void;
}) {
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      showToast("Selecciona un archivo Excel (.xlsx o .xls).", "error");
      return;
    }
    try {
      const { importExcelFile } = await import("@/lib/excel-import");
      const result = await importExcelFile(file);
      showToast(
        `Archivo validado: ${result.dataset.meta["evaluationCount"]} evaluaciones cargadas en la sesión local.`,
      );
    } catch (err: any) {
      showToast(err?.message || "No se pudo validar el archivo.", "error");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#d8dcec] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1b2447]">Proyectos y estudios</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Cada proyecto se vincula a una empresa y conserva su periodo operativo.
            </p>
          </div>
          <button
            onClick={onNew}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1b2447] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2b396d]"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo proyecto
          </button>
        </div>
      </section>
      <section className="overflow-hidden rounded-xl border border-[#d8dcec] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-[#eef0f8] text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Tipo / periodo</th>
                <th className="px-4 py-3">Fechas</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {proyectos.map((project) => (
                <tr key={project.id}>
                  <td className="px-4 py-3 font-semibold text-[#1b2447]">{project.nombre}</td>
                  <td className="px-4 py-3">{project.cliente_nombre}</td>
                  <td className="px-4 py-3">
                    <p>{project.tipo.replaceAll("_", " ")}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {project.periodo || "Sin periodo"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {project.fecha_inicio || "—"}{" "}
                    {project.fecha_fin ? `— ${project.fecha_fin}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={project.estado} />
                  </td>
                </tr>
              ))}
              {!proyectos.length && (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={5}>
                    No hay proyectos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-xl border border-dashed border-[#d8dcec] bg-[#f7f8fc] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#1b2447]">
              <Upload className="h-4 w-4 text-[#d6452c]" />
              Validar e importar Excel
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              Se verifican las hojas <code>Evaluaciones</code>, <code>Indicadores</code> y{" "}
              <code>Preguntas</code> por encabezado, sin depender de la posición de sus columnas. La
              carga queda disponible en la sesión local; la persistencia masiva se habilita al
              ejecutar la migración y definir el flujo de aprobación.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#d6452c] bg-white px-3 py-2 text-xs font-semibold text-[#b63320] transition-colors hover:bg-[#fff0ec]">
            <Upload className="h-3.5 w-3.5" />
            Seleccionar Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>
        </div>
      </section>
    </div>
  );
}

function TicketsView({
  tickets,
  onNew,
  onStatusChange,
}: {
  tickets: TicketRow[];
  onNew: () => void;
  onStatusChange: (ticket: TicketRow, estado: "abierto" | "en_analisis" | "resuelto") => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#d8dcec] bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <div>
          <h2 className="text-sm font-bold text-[#1b2447]">Bandeja de soporte</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Incidencias y solicitudes registradas por empresa.
          </p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1b2447] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2b396d]"
        >
          <Plus className="h-3.5 w-3.5" />
          Crear ticket
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-[#eef0f8] text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Creado</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#1b2447]">
                    #{ticket.id} · {ticket.asunto}
                  </p>
                </td>
                <td className="px-4 py-3">{ticket.cliente_nombre || "Factor IQ"}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={ticket.prioridad} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(ticket.created_at).toLocaleDateString("es-PE")}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={ticket.estado}
                    onChange={(event) =>
                      onStatusChange(
                        ticket,
                        event.target.value as "abierto" | "en_analisis" | "resuelto",
                      )
                    }
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-[#1b2447] focus:border-[#d6452c] focus:outline-none"
                  >
                    <option value="abierto">Abierto</option>
                    <option value="en_analisis">En análisis</option>
                    <option value="resuelto">Resuelto</option>
                  </select>
                </td>
              </tr>
            ))}
            {!tickets.length && (
              <tr>
                <td className="px-4 py-12 text-center text-slate-500" colSpan={5}>
                  No hay tickets abiertos. Crea uno para iniciar el seguimiento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    activo: "bg-emerald-50 text-emerald-700 border-emerald-200",
    abierto: "bg-[#fff0ec] text-[#b63320] border-[#f3d4cd]",
    en_analisis: "bg-amber-50 text-amber-700 border-amber-200",
    resuelto: "bg-emerald-50 text-emerald-700 border-emerald-200",
    alta: "bg-rose-50 text-rose-700 border-rose-200",
    media: "bg-amber-50 text-amber-700 border-amber-200",
    baja: "bg-[#eef0f8] text-[#1b2447] border-[#d8dcec]",
    borrador: "bg-[#eef0f8] text-[#1b2447] border-[#d8dcec]",
    cerrado: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${colors[value] || colors["borrador"]}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function ProjectModal({
  isOpen,
  clientes,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  clientes: ClienteRow[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!isOpen) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await saveProjectFn({
        data: { cliente_id: Number(clienteId), nombre, periodo, estado: "borrador" },
      });
      onSuccess(response.message);
      onClose();
    } catch (err: any) {
      setError(err?.message || "No se pudo crear el proyecto.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <AdminModal title="Crear proyecto" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
        <label className="block text-xs font-semibold text-slate-600">
          Empresa
          <select
            required
            value={clienteId}
            onChange={(event) => setClienteId(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700"
          >
            <option value="">Seleccionar empresa</option>
            {clientes.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nombre_comercial}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Nombre del proyecto
          <input
            required
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-700"
            placeholder="Ej. Mystery Shopping 2026"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Periodo
          <input
            value={periodo}
            onChange={(event) => setPeriodo(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-700"
            placeholder="Ej. Q1 2026"
          />
        </label>
        <ModalActions loading={loading} label="Crear proyecto" onClose={onClose} />
      </form>
    </AdminModal>
  );
}

function TicketModal({
  isOpen,
  clientes,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  clientes: ClienteRow[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [asunto, setAsunto] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<"alta" | "media" | "baja">("media");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!isOpen) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await createTicketFn({
        data: { cliente_id: clienteId ? Number(clienteId) : null, asunto, descripcion, prioridad },
      });
      onSuccess(response.message);
      onClose();
    } catch (err: any) {
      setError(err?.message || "No se pudo crear el ticket.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <AdminModal title="Crear ticket de soporte" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
        <label className="block text-xs font-semibold text-slate-600">
          Empresa
          <select
            value={clienteId}
            onChange={(event) => setClienteId(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700"
          >
            <option value="">Factor IQ (interno)</option>
            {clientes.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nombre_comercial}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Asunto
          <input
            required
            value={asunto}
            onChange={(event) => setAsunto(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-700"
            placeholder="Describe brevemente la incidencia"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Detalle
          <textarea
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-700"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          Prioridad
          <select
            value={prioridad}
            onChange={(event) => setPrioridad(event.target.value as "alta" | "media" | "baja")}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700"
          >
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </label>
        <ModalActions loading={loading} label="Crear ticket" onClose={onClose} />
      </form>
    </AdminModal>
  );
}

function AdminModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b2447]/35 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1b2447]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ModalActions({
  loading,
  label,
  onClose,
}: {
  loading: boolean;
  label: string;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
      >
        Cancelar
      </button>
      <button
        disabled={loading}
        className="rounded-lg bg-[#1b2447] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Guardando..." : label}
      </button>
    </div>
  );
}
