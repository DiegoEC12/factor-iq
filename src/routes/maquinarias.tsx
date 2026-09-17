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
    if (user.clienteId !== "maquinarias") {
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
    if (data && data.evaluaciones && data.evaluaciones.length > 0) {
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
          <Outlet />
        </main>
      </div>
    </FilterProvider>
  );
}
