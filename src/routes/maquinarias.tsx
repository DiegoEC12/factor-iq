import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/mystery/app-sidebar";
import { FilterProvider } from "@/lib/mystery/filter-context";
import { getAuthUserFn } from "@/lib/auth";
import { getMysteryShoppingDataFn } from "@/lib/mystery/server-data";
import { applyImportedPayload, buildDatasetFromAnalytics } from "@/lib/excel-import";

export const Route = createFileRoute("/maquinarias")({
  beforeLoad: async () => {
    const user = await getAuthUserFn();
    if (!user) {
      throw redirect({ to: "/pages/servicio_nube.html" });
    }
    if (user.rol !== "superadmin" && user.clienteId !== "maquinarias") {
      throw redirect({ to: "/pages/servicio_nube.html" });
    }
    return { user };
  },
  loader: async () => {
    const data = await getMysteryShoppingDataFn({ data: "maquinarias" });
    return { data };
  },
  component: MaquinariasLayout,
});

function MaquinariasLayout() {
  const { data } = Route.useLoaderData();

  useEffect(() => {
    if (data) {
      const analytics = {
        evaluations: data.evaluaciones,
        indicators: data.indicadores,
        questions: data.preguntas,
      };
      applyImportedPayload({
        dataset: buildDatasetFromAnalytics(analytics, data.meta.source),
        analytics,
      });
    }
  }, [data]);

  return (
    <FilterProvider>
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          {data.meta.status !== "ready" && (
            <div className="m-4 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>{data.meta.message}</span>
              {data.meta.status === "unavailable" && (
                <button
                  onClick={() => window.location.reload()}
                  className="shrink-0 rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-semibold"
                >
                  Reintentar
                </button>
              )}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </FilterProvider>
  );
}
