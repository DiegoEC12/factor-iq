import {
  LayoutDashboard,
  Building2,
  Users,
  FolderPlus,
  FileUp,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { logoutFn, type AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  user: AuthUser;
  stats?: {
    clientes?: number;
    usuarios?: number;
    proyectos?: number;
  };
}

export function AdminSidebar({ user, stats }: AdminSidebarProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navLinks = [
    {
      to: "/admin/dashboard",
      label: "Panel Principal",
      icon: LayoutDashboard,
      match: (p: string) => p === "/admin" || p === "/admin/dashboard",
    },
    {
      to: "/admin/empresas",
      label: "Empresas Clientes",
      icon: Building2,
      badge: stats?.clientes,
      match: (p: string) => p.startsWith("/admin/empresas"),
    },
    {
      to: "/admin/servicios/nuevo",
      label: "Nuevo Servicio (Wizard)",
      icon: FolderPlus,
      highlight: true,
      match: (p: string) => p.startsWith("/admin/servicios"),
    },
    {
      to: "/admin/importar",
      label: "Importación segura",
      icon: FileUp,
      match: (p: string) => p.startsWith("/admin/importar"),
    },
    {
      to: "/admin/usuarios",
      label: "Usuarios y Accesos",
      icon: Users,
      badge: stats?.usuarios,
      match: (p: string) => p.startsWith("/admin/usuarios"),
    },
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

  const renderNavLinks = (compact: boolean, closeMobile?: () => void) => (
    <nav className="flex flex-col gap-1 px-3">
      {!compact && (
        <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
          Módulos SaaS Factor IQ
        </p>
      )}
      {navLinks.map((item) => {
        const isActive = item.match(currentPath);
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to as any}
            onClick={closeMobile}
            title={compact ? item.label : undefined}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all",
              isActive
                ? "bg-[#1b2447] text-white shadow-lg shadow-[#1b2447]/15 font-semibold"
                : item.highlight
                  ? "bg-[#eef2ff] text-[#1b2447] border border-[#dfe6f7] hover:bg-[#eaf1ff] hover:text-[#1b2447]"
                  : "text-slate-600 hover:bg-[#f4f7fb] hover:text-[#1b2447]",
              compact && "justify-center px-0",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive
                  ? "text-white"
                  : item.highlight
                    ? "text-[#d6452c]"
                    : "text-slate-500 group-hover:text-[#1b2447]",
              )}
            />
            {!compact && <span className="flex-1 truncate tracking-tight">{item.label}</span>}
            {!compact && item.badge !== undefined && item.badge > 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold font-mono transition-colors",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#eef2f9] text-[#1b2447] border border-[#dfe6f7]",
                )}
              >
                {item.badge}
              </span>
            )}
            {!compact && item.highlight && !isActive && (
              <span className="rounded-full bg-[#fff2ee] border border-[#f7d9d1] px-1.5 py-0.5 text-[9px] font-bold text-[#d6452c] flex items-center gap-0.5">
                <Sparkles className="h-2.5 w-2.5" />
                Nuevo
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Topbar móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#e3e8f3] bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-[#f4f7fb] hover:text-[#1b2447] transition-colors"
            aria-label="Abrir navegación"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-['Archivo'] font-bold text-sm tracking-tight text-[#1b2447]">
              FACTOR <span className="text-[#d6452c]">IQ</span>
            </span>
            <span className="rounded-full bg-[#eef2ff] border border-[#dfe6f7] px-2 py-0.5 text-[10px] font-semibold text-[#1b2447]">
              SuperAdmin
            </span>
          </div>
        </div>

        <Link
          to="/maquinarias"
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#1b2447] transition-colors"
        >
          <span>Portal Cliente</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Drawer móvil con overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white border-r border-[#e3e8f3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e3e8f3] p-4">
              <div className="flex items-center gap-2">
                <span className="font-['Archivo'] font-bold text-base tracking-tight text-[#1b2447]">
                  FACTOR <span className="text-[#d6452c]">IQ</span>
                </span>
                <span className="rounded-full bg-[#eef2ff] border border-[#dfe6f7] px-2 py-0.5 text-[10px] font-semibold text-[#1b2447]">
                  SuperAdmin
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-[#f4f7fb] hover:text-[#1b2447]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {renderNavLinks(false, () => setMobileOpen(false))}
            </div>

            <div className="border-t border-[#e3e8f3] p-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#fff4f1] border border-[#f7d9d1] px-3 py-2.5 text-xs font-medium text-[#d6452c] hover:bg-[#fff0ec] hover:border-[#f1cabd] transition-all"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar escritorio */}
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen shrink-0 border-r border-[#e3e8f3] bg-white/95 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Cabecera Sidebar */}
        <div className="flex items-center justify-between border-b border-[#e3e8f3] px-4 py-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#eef2ff] border border-[#dfe6f7] flex items-center justify-center text-[#1b2447] font-bold text-sm">
                F
              </div>
              <div>
                <span className="font-['Archivo'] font-bold text-sm tracking-tight text-[#1b2447] block">
                  FACTOR <span className="text-[#d6452c]">IQ</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase block">
                  SaaS Multi-Tenant
                </span>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-[#f4f7fb] hover:text-[#1b2447] transition-colors"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Links principales */}
        <div className="flex-1 overflow-y-auto py-4">{renderNavLinks(collapsed)}</div>

        {/* Sección inferior: Usuario y Logout */}
        <div className="border-t border-[#e3e8f3] p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-3 rounded-xl bg-[#f4f7fb] border border-[#e3e8f3] p-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] border border-[#dfe6f7] text-xs font-bold text-[#1b2447]">
                {user.nombre.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#1b2447]">{user.nombre}</p>
                <div className="flex items-center gap-1 text-[10px] text-[#d6452c]">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Super Admin</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-[#fff4f1] hover:text-[#d6452c] hover:border-[#f4d4ca] border border-transparent transition-all cursor-pointer",
              collapsed && "justify-center px-0",
            )}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#d6452c]" />
            ) : (
              <LogOut className="h-4 w-4 text-slate-600 group-hover:text-[#d6452c]" />
            )}
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
