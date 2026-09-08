import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/mystery/app-sidebar";
import { FilterProvider } from "@/lib/mystery/filter-context";
import { getAuthUserFn } from "@/lib/auth";

export const Route = createFileRoute("/maquinarias")({
  beforeLoad: async () => {
    const user = await getAuthUserFn();
    if (!user) {
      throw redirect({ to: "/pages/servicio_nube.html" });
    }
    if (user.clienteId !== "maquinarias") {
      throw redirect({ to: "/pages/servicio_nube.html" });
    }
    return { user };
  },
  component: MaquinariasLayout,
});

function MaquinariasLayout() {
  return (
    <FilterProvider>
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </FilterProvider>
  );
}
