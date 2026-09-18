import {
  LayoutDashboard,
  Building2,
  Users,
  FileCheck2,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { logoutFn, type AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export type AdminTab = "general" | "clientes" | "usuarios" | "auditoria" | "database";

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string | undefined;
}

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  user: AuthUser;
  stats?: {
    clientes?: number;
    usuarios?: number;
    auditoria?: number;
  };
}

export function AdminSidebar({ activeTab, onSelectTab, user, stats }: AdminSidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const NAV_ITEMS: NavItem[] = [
    { id: "general", label: "Resumen General", icon: LayoutDashboard },
    { id: "clientes", label: "Directorio Clientes", icon: Building2, ...(stats?.clientes !== undefined ? { badge: stats.clientes } : {}) },
    { id: "usuarios", label: "Usuarios & Accesos", icon: Users, ...(stats?.usuarios !== undefined ? { badge: stats.usuarios } : {}) },
    { id: "auditoria", label: "Bitácora Auditoría", icon: FileCheck2, ...(stats?.auditoria !== undefined ? { badge: stats.auditoria } : {}) },
    { id: "database", label: "Salud del Sistema", icon: Database },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutFn();
      await navigate({ to: "/login" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "transition-all duration-300 border-r border-slate-800/80 sticky top-0 hidden h-screen shrink-0 flex-col bg-slate-950/95 backdrop-blur-md lg:flex z-30",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Encabezado con Marca */}
        <div className={cn("p-4 border-b border-slate-800/80 flex items-center gap-3", collapsed && "justify-center px-2")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <img src="/favicon.png" alt="Factor IQ" className="w-6 h-6 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight">Factor IQ</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">SuperAdministrador</p>
            </div>
          )}
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "w-full transition-all group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-left relative",
                  active
                    ? "bg-slate-800/90 text-white shadow-sm border border-slate-700/60"
                    : "text-slate-400 hover:bg-slate-850/60 hover:text-slate-200 border border-transparent",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-500 rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200",
                  )}
                />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}

          {/* Enlace rápido a Maquinarias */}
          <div className="pt-3 mt-3 border-t border-slate-800/60">
            <Link
              to="/maquinarias"
              title={collapsed ? "Ver Portal Maquinarias" : undefined}
              className={cn(
                "w-full group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/20 transition-all border border-slate-800/40 hover:border-emerald-500/30",
                collapsed && "justify-center px-0",
              )}
            >
              <ExternalLink className="h-4 w-4 text-emerald-400 shrink-0" />
              {!collapsed && (
                <span className="truncate">Portal Maquinarias</span>
              )}
            </Link>
          </div>
        </nav>

        {/* Footer con Usuario & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 truncate">{user.nombre}</div>
                <div className="text-[10px] text-emerald-400/80 font-mono capitalize">SuperAdmin</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title={collapsed ? "Cerrar sesión" : undefined}
              className={cn(
                "flex-1 flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400/90 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-lg transition-colors disabled:opacity-50",
                collapsed && "justify-center px-0",
              )}
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400 shrink-0" />
              ) : (
                <LogOut className="w-3.5 h-3.5 shrink-0" />
              )}
              {!collapsed && <span>{isLoggingOut ? "Saliendo..." : "Cerrar Sesión"}</span>}
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-800/60"
              title={collapsed ? "Expandir menú" : "Contraer menú"}
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Barra Móvil / Tablet */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-800"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Factor IQ" className="w-6 h-6 object-contain" />
            <span className="font-bold text-sm text-white">Factor IQ</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Admin
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="p-2 rounded-lg text-rose-400 bg-rose-950/20 border border-rose-900/30"
          title="Cerrar sesión"
        >
          {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        </button>
      </div>

      {/* Drawer Móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isLoggingOut && setMobileOpen(false)}
          />
          <aside className="absolute top-0 left-0 flex h-full w-72 flex-col bg-slate-950 border-r border-slate-800 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <img src="/favicon.png" alt="Factor IQ" className="w-6 h-6 object-contain" />
                <div>
                  <span className="font-bold text-sm text-white">Factor IQ Admin</span>
                  <p className="text-[10px] text-slate-400">Panel Central de Control</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const active = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold text-left transition-colors",
                      active
                        ? "bg-slate-800 text-white border border-slate-700"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", active ? "text-emerald-400" : "text-slate-400")} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-3 border-t border-slate-800">
                <Link
                  to="/maquinarias"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-900 rounded-lg"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Ver Portal Maquinarias</span>
                </Link>
              </div>
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-3">
              <div className="text-xs text-slate-400">
                Conectado como <strong className="text-slate-200">{user.nombre}</strong>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-900/40 rounded-lg"
              >
                {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
