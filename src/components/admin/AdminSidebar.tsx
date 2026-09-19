import {
  LayoutDashboard,
  Building2,
  Users,
  FileCheck2,
  Database,
  FolderKanban,
  LifeBuoy,
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

export type AdminTab =
  "general" | "clientes" | "proyectos" | "usuarios" | "tickets" | "auditoria" | "database";

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
    proyectos?: number;
    usuarios?: number;
    tickets?: number;
    auditoria?: number;
  };
}

export function AdminSidebar({ activeTab, onSelectTab, user, stats }: AdminSidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navItems: NavItem[] = [
    { id: "general", label: "Resumen general", icon: LayoutDashboard },
    { id: "clientes", label: "Clientes", icon: Building2, badge: stats?.clientes },
    {
      id: "proyectos",
      label: "Proyectos e importación",
      icon: FolderKanban,
      badge: stats?.proyectos,
    },
    { id: "usuarios", label: "Usuarios y accesos", icon: Users, badge: stats?.usuarios },
    { id: "tickets", label: "Soporte y tickets", icon: LifeBuoy, badge: stats?.tickets },
    { id: "auditoria", label: "Bitácora", icon: FileCheck2, badge: stats?.auditoria },
    { id: "database", label: "Salud del sistema", icon: Database },
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

  const nav = (compact: boolean, onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1 px-3">
      {!compact && (
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-[0.16em] text-slate-400">
          GESTIÓN DE PLATAFORMA
        </p>
      )}
      {navItems.map((item) => {
        const active = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              onSelectTab(item.id);
              onNavigate?.();
            }}
            title={compact ? item.label : undefined}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-ui",
              active
                ? "bg-[#eef0f8] text-[#1b2447] shadow-[inset_2px_0_0_0_#d6452c]"
                : "text-slate-500 hover:bg-slate-100 hover:text-[#1b2447]",
              compact && "justify-center px-0",
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-[#d6452c]" : "text-slate-400 group-hover:text-[#1b2447]",
              )}
            />
            {!compact && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
            {!compact && item.badge !== undefined && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
      <div className="mt-3 border-t border-sidebar-border pt-3">
        <Link
          to="/maquinarias"
          onClick={onNavigate}
          title={compact ? "Abrir portal Maquinarias" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-ui hover:bg-slate-100 hover:text-[#1b2447]",
            compact && "justify-center px-0",
          )}
        >
          <ExternalLink className="h-[18px] w-[18px] shrink-0 text-[#d6452c]" />
          {!compact && <span className="truncate">Portal Maquinarias</span>}
        </Link>
      </div>
    </nav>
  );

  const brand = (compact: boolean) => (
    <div className={cn("flex items-center gap-3 px-4 pt-5 pb-4", compact && "justify-center px-2")}>
      <img src="/favicon.png" alt="Factor IQ" className="h-9 w-9 shrink-0 object-contain" />
      {!compact && (
        <div className="min-w-0">
          <p className="text-[13px] font-bold tracking-[0.18em] text-[#1b2447]">FACTOR IQ</p>
          <div className="mt-1 flex items-center gap-2 border-t border-sidebar-border pt-2">
            <span className="text-[10px] font-semibold tracking-[0.13em] text-[#d6452c]">
              CONTROL CENTRAL
            </span>
            <span className="rounded bg-[#fff0ec] px-1.5 py-0.5 text-[9px] font-bold text-[#b63320]">
              ADMIN
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-2 bg-sidebar lg:flex",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        {brand(collapsed)}
        <div className="mt-2 flex-1 overflow-y-auto">{nav(collapsed)}</div>
        <div className="space-y-2 border-t border-sidebar-border p-3">
          {!collapsed && (
            <div className="flex items-center gap-2.5 rounded-lg bg-[#eef0f8] px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#d6452c] shadow-sm">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#1b2447]">{user.nombre}</p>
                <p className="text-[10px] text-slate-500">Superadministrador</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#b63320] transition-ui hover:bg-[#fff0ec] disabled:opacity-60",
              collapsed && "justify-center px-0",
            )}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {!collapsed && <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>}
          </button>
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-ui hover:bg-sidebar-accent hover:text-[#1b2447]"
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Contraer menú</span>
              </>
            )}
          </button>
        </div>
      </aside>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-[#1b2447] hover:bg-sidebar-accent"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/favicon.png" alt="Factor IQ" className="h-6 w-6" />
          <span className="text-sm font-bold tracking-[0.12em] text-[#1b2447]">FACTOR IQ</span>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-md p-2 text-[#b63320] hover:bg-[#fff0ec]"
          aria-label="Cerrar sesión"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
        </button>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#1b2447]/30"
            onClick={() => !isLoggingOut && setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar shadow-2xl">
            <div className="flex items-start justify-between">
              {brand(false)}
              <button
                onClick={() => setMobileOpen(false)}
                className="m-3 rounded-md p-2 text-slate-500 hover:bg-sidebar-accent"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav(false, () => setMobileOpen(false))}</div>
            <div className="border-t border-sidebar-border p-4">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#fff0ec] px-3 py-2 text-xs font-medium text-[#b63320]"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
