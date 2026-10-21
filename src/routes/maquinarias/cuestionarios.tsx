import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { ClipboardList, Globe2, MessageSquareText, Users, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/mystery/page-header";
import { SectionHeader } from "@/components/mystery/primitives";
import { getQuestionnaireDashboardFn } from "@/lib/mystery/questionnaire-data";

export const Route = createFileRoute("/maquinarias/cuestionarios")({
  head: () => ({ meta: [{ title: "Cuestionarios | Maquinarias" }] }),
  loader: () => getQuestionnaireDashboardFn({ data: "maquinarias" }),
  component: QuestionnairesPage,
});

function QuestionnairesPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const dashboard = Route.useLoaderData();
  if (pathname !== "/maquinarias/cuestionarios") return <Outlet />;
  const averageCsat =
    dashboard.csatPromedio ?? dashboard.cuestionarios.find((item) => item.csat !== null)?.csat;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Cuestionarios"
        description="Resumen de entrevistas virtuales y experiencia reportada por los clientes."
      />
      <main className="mx-auto max-w-300 space-y-6 px-4 py-6 lg:px-8">
        {dashboard.meta.message && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            {dashboard.meta.message}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Users} label="Personas evaluadas" value={dashboard.totalCompletas} />
          <MetricCard
            icon={ClipboardList}
            label="Respuestas completas"
            value={dashboard.totalRespuestas}
          />
          <MetricCard
            icon={TrendingUp}
            label="CSAT promedio"
            value={averageCsat === null || averageCsat === undefined ? "—" : `${averageCsat}/5`}
          />
          <MetricCard
            icon={MessageSquareText}
            label="NPS promedio"
            value={dashboard.nps === null || dashboard.nps === undefined ? "—" : `${dashboard.nps}/10`}
          />
        </section>

        <section>
          <SectionHeader
            title="Tus cuestionarios"
            description="Elige un segmento para consultar sus resultados y respuestas."
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {dashboard.cuestionarios.map((item) => (
              <article
                key={item.codigo}
                className="card-suave flex min-h-55 flex-col justify-between p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        Encuesta virtual
                      </p>
                      <h2 className="mt-2 text-xl font-bold">{item.nombre}</h2>
                    </div>
                    <span className="rounded-lg bg-muted px-2.5 py-1 text-sm font-semibold tabular-nums">
                      {item.respuestas}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.descripcion}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      CSAT: <strong className="text-foreground">{item.csat !== null && item.csat !== undefined ? `${item.csat}/5` : "—"}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      NPS: <strong className="text-foreground">{item.nps !== null && item.nps !== undefined ? `${item.nps}/10` : "—"}</strong>
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Link
                    to="/maquinarias/cuestionarios/$tipo"
                    params={{ tipo: item.codigo }}
                    className="inline-flex w-fit items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Ver cuestionario
                  </Link>
                  <a
                    href={`/encuesta/mqi-${item.codigo}-2026`}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir vista pública"
                    aria-label={`Abrir vista pública de ${item.nombre}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-primary"
                  >
                    <Globe2 className="h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <SectionHeader
            title="Respuestas por sede"
            description="Distribución de entrevistas completas registradas."
          />
          {dashboard.sedes.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {dashboard.sedes.map((item) => (
                <div
                  key={item.sede}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm"
                >
                  <span className="truncate pr-4">{item.sede}</span>
                  <strong className="tabular-nums">{item.respuestas}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              La distribución aparecerá cuando se registren entrevistas.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
