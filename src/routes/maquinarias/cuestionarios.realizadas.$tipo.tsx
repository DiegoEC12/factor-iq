import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getQuestionnaireResponsesFn } from "@/lib/mystery/questionnaire-data";

type QuestionnaireCode = "nuevos" | "postventa" | "semi_nuevos";
const labels: Record<QuestionnaireCode, string> = {
  nuevos: "Nuevos",
  postventa: "Post Venta",
  semi_nuevos: "Semi Nuevos",
};

export const Route = createFileRoute("/maquinarias/cuestionarios/realizadas/$tipo")({
  head: () => ({ meta: [{ title: "Cuestionarios realizadas | Maquinarias" }] }),
  loader: ({ params }) =>
    getQuestionnaireResponsesFn({
      data: { clientSlug: "maquinarias", code: (params.tipo as QuestionnaireCode) || "nuevos" },
    }),
  component: CompletedQuestionnairesPage,
});

function CompletedQuestionnairesPage() {
  const params = Route.useParams();
  const code = (params.tipo as QuestionnaireCode) || "nuevos";
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const responses = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return responses;
    return responses.filter((item) =>
      [
        item.email,
        item.edad,
        item.distritoResidencia,
        item.distritoLaboral,
        item.sede,
        item.nps?.toString(),
      ].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [responses, search]);
  if (pathname.startsWith(`/maquinarias/cuestionarios/realizadas/${code}/`)) {
    return <Outlet />;
  }
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-300 space-y-6 px-4 py-8 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Cuestionarios · Solo lectura
          </p>
          <h1 className="mt-2 text-2xl font-bold">Cuestionarios realizadas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta las respuestas recibidas sin modificar el historial del cliente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
          {(Object.entries(labels) as [QuestionnaireCode, string][]).map(([value, label]) => (
            <Link
              key={value}
              to="/maquinarias/cuestionarios/realizadas/$tipo"
              params={{ tipo: value }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${code === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <section className="rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Personas evaluadas · {labels[code]}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {responses.length} encuesta{responses.length === 1 ? "" : "s"} completada
                {responses.length === 1 ? "" : "s"}.
              </p>
            </div>
            <label className="relative block w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por correo, distrito o NPS"
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring"
              />
            </label>
          </div>
          <div className="mt-5 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-270 text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Correo electrónico</th>
                  <th className="px-4 py-3 font-semibold">Edad</th>
                  <th className="px-4 py-3 font-semibold">Distrito residencia</th>
                  <th className="px-4 py-3 font-semibold">Distrito laboral</th>
                  <th className="px-4 py-3 font-semibold">NPS</th>
                  <th className="px-4 py-3 font-semibold">Sede</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-right font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{item.email || "Sin correo"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.edad || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.distritoResidencia || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.distritoLaboral || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold">{item.nps ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.sede || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.completedAt || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/maquinarias/cuestionarios/realizadas/$tipo/$respuestaId"
                        params={{ tipo: code, respuestaId: String(item.id) }}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" /> Ver cuestionario
                      </Link>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      {responses.length
                        ? "No hay resultados para esa búsqueda."
                        : "Aún no hay cuestionarios realizados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
