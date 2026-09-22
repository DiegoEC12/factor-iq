import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getAdminStatsFn } from "@/lib/mystery/server-data";
import { toggleUserStatusFn } from "@/lib/admin";
import { UserDrawer } from "@/components/admin/UserDrawer";
import { ResetPasswordDrawer } from "@/components/admin/ResetPasswordDrawer";
import {
  Users,
  Search,
  Plus,
  KeyRound,
  Pencil,
  ShieldCheck,
  Building2,
  Mail,
  Power,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({
  loader: async () => {
    const data = await getAdminStatsFn();
    return { data };
  },
  head: () => ({
    meta: [
      { title: "Usuarios y Accesos | Factor IQ SuperAdmin" },
      {
        name: "description",
        content: "Gestión de usuarios y credenciales del SaaS Factor IQ.",
      },
    ],
  }),
  component: AdminUsuariosView,
});

function AdminUsuariosView() {
  const { data } = Route.useLoaderData();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Slide-over Drawers state
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);

  const [resetDrawerOpen, setResetDrawerOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<any | null>(null);

  const usuarios = data.usuarios || [];
  const clientes = data.clientes || [];

  const filteredUsuarios = usuarios.filter((u: any) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      u.usuario.toLowerCase().includes(term) ||
      u.nombre.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.cliente_nombre && u.cliente_nombre.toLowerCase().includes(term));
    const matchRol = filterRol === "todos" || u.rol === filterRol;
    const matchEstado = filterEstado === "todos" || u.estado === filterEstado;
    return matchSearch && matchRol && matchEstado;
  });

  const handleToggleEstado = async (user: any) => {
    const nuevoEstado = user.estado === "activo" ? "bloqueado" : "activo";
    try {
      const res = await toggleUserStatusFn({
        data: {
          userId: user.id,
          nuevoEstado,
          usuarioName: user.usuario,
        },
      });
      if (res.success) {
        toast.success(res.message);
        await router.invalidate();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "No se pudo cambiar el estado del usuario.");
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Archivo']">
            Usuarios y Credenciales
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Control de cuentas, asignación de roles y restablecimiento de contraseñas de acceso.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setUserToEdit(null);
              setUserDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Usuario (Drawer)</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, nombre o empresa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="todos">Todos los Roles</option>
            <option value="superadmin">SuperAdmin</option>
            <option value="admin_cliente">Admin Cliente</option>
            <option value="viewer">Viewer</option>
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="activo">Activo</option>
            <option value="bloqueado">Bloqueado</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Usuario (Login)</th>
                <th className="p-4">Nombre y Correo</th>
                <th className="p-4">Rol Asignado</th>
                <th className="p-4">Empresa Vinculada</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsuarios.length > 0 ? (
                filteredUsuarios.map((u: any) => {
                  const isActivo = u.estado === "activo";
                  const isSuperAdmin = u.rol === "superadmin";

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs">
                            @{u.usuario.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="font-mono font-semibold text-slate-100">
                            @{u.usuario}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-white">{u.nombre}</p>
                        {u.email && <p className="text-[11px] text-slate-400">{u.email}</p>}
                      </td>

                      <td className="p-4">
                        <span
                          className={`capitalize px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isSuperAdmin
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              : u.rol === "admin_cliente"
                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {isSuperAdmin ? "SuperAdmin" : u.rol === "admin_cliente" ? "Admin Cliente" : "Visualizador"}
                        </span>
                      </td>

                      <td className="p-4">
                        {isSuperAdmin ? (
                          <span className="text-[11px] text-slate-400 italic">Factor IQ (Global)</span>
                        ) : u.cliente_nombre ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-200">
                            <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                            <span>{u.cliente_nombre}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                            isActivo
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                          }`}
                          title={isActivo ? "Clic para bloquear" : "Clic para activar"}
                        >
                          <Power className="h-3 w-3" />
                          <span className="capitalize">{u.estado}</span>
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setUserToReset(u);
                              setResetDrawerOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Restablecer Contraseña (Drawer)"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setUserToEdit(u);
                              setUserDrawerOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Editar Usuario (Drawer)"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No se encontraron usuarios con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Drawer para Crear / Editar Usuario */}
      <UserDrawer
        isOpen={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
        userToEdit={userToEdit}
        clientes={clientes}
        onSuccess={handleSuccess}
      />

      {/* Slide-over Drawer para Restablecer Contraseña */}
      <ResetPasswordDrawer
        isOpen={resetDrawerOpen}
        onClose={() => setResetDrawerOpen(false)}
        user={userToReset}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
