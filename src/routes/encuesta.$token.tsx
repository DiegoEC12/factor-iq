import { createFileRoute } from "@tanstack/react-router";
import { QuestionnairePage } from "./maquinarias/cuestionarios.$tipo";
import { getQuestionnaireConfigFn } from "@/lib/mystery/questionnaire-data";

export const Route = createFileRoute("/encuesta/$token")({
  head: () => ({ meta: [{ title: "Encuesta | Maquinarias" }] }),
  loader: () => getQuestionnaireConfigFn({ data: "maquinarias" }),
  component: PublicSurveyPage,
});

function PublicSurveyPage() {
  const { token } = Route.useParams();
  const type = token.startsWith("mqi-") ? token.split("-")[1] : "nuevos";
  const tipo = type === "postventa" || type === "semi_nuevos" ? type : "nuevos";
  const config = Route.useLoaderData();
  return <QuestionnairePage tipo={tipo} configuredQuestions={config[tipo]} publicMode />;
}
