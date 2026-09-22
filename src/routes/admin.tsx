import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getAuthUserFn } from "@/lib/auth";
import { getAdminStatsFn } from "@/lib/mystery/server-data";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

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
        content: "Panel de control y administración multi-cliente SaaS de Factor IQ.",
      },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const { data } = Route.useLoaderData();

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-950 text-slate-100 font-['Manrope'] antialiased">
      <AdminSidebar
        user={user}
        stats={{
          clientes: data?.stats?.clientes ?? 0,
          usuarios: data?.stats?.usuarios ?? 0,
          proyectos: data?.stats?.proyectos ?? 0,
        }}
      />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
