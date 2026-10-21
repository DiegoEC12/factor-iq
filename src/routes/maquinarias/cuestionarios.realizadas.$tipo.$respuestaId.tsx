import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { getQuestionnaireResponseDetailFn } from "@/lib/mystery/questionnaire-data";
import { getQuestionnaireSteps } from "./cuestionarios.$tipo";

type QuestionnaireCode = "nuevos" | "postventa" | "semi_nuevos";
const labels: Record<QuestionnaireCode, string> = {
  nuevos: "Nuevos",
  postventa: "Post Venta",
  semi_nuevos: "Semi Nuevos",
};

export const Route = createFileRoute("/maquinarias/cuestionarios/realizadas/$tipo/$respuestaId")({
  head: () => ({ meta: [{ title: "Detalle de cuestionario | Maquinarias" }] }),
  loader: ({ params }) =>
    getQuestionnaireResponseDetailFn({
      data: {
        clientSlug: "maquinarias",
        code: params.tipo as QuestionnaireCode,
        responseId: Number(params.respuestaId),
      },
    }),
  component: QuestionnaireResponsePage,
});

function QuestionnaireResponsePage() {
  const params = Route.useParams();
  const detail = Route.useLoaderData();
  const code = params.tipo as QuestionnaireCode;
  if (!detail)
    return <main className="mx-auto max-w-300 px-4 py-10">No se encontró el cuestionario.</main>;
  const configuredQuestions = getQuestionnaireSteps(code).flatMap((step) => step.questions);
  const identityValues = [
    detail.email,
    detail.edad,
    detail.sexo,
    detail.distritoResidencia,
    detail.distritoLaboral,
    detail.sede,
    detail.motivo,
  ];
  const withIdentityValue = (answer: (typeof detail.answers)[number], answerIndex: number) => {
    const match = answer.code.match(/_p_(\d+)$/);
    const codeIndex = match ? Number(match[1]) - 1 : -1;
    const index = codeIndex >= 0 && codeIndex < identityValues.length ? codeIndex : answerIndex;
    const identityValue =
      index >= 0 && index < identityValues.length ? identityValues[index] : null;
    // El campo general es la fuente preferida, pero nunca debe borrar una respuesta
    // que sí exista en el ítem cuando el registro general está incompleto.
    return identityValue?.trim() ? { ...answer, value: identityValue } : answer;
  };
  const normalizedAnswers = detail.answers.map(withIdentityValue);
  const questions =
    normalizedAnswers.length < configuredQuestions.length
      ? configuredQuestions.map((question, index) => {
          const stored = normalizedAnswers.find((answer) => {
            const code = answer.code.toLowerCase();
            if (question.id === "nps") return code.includes("nps");
            if (question.id === "csat") return code.includes("csat");
            return answer.question.trim().toLowerCase() === question.label.trim().toLowerCase();
          });
          return {
            id: stored?.id ?? index,
            question: stored?.question ?? question.label,
            value: stored?.value ?? "—",
            kind:
              stored?.kind ??
              (question.kind === "scale"
                ? "likert"
                : question.kind === "checks"
                  ? "seleccion_multiple"
                  : question.kind === "text" || question.kind === "textarea"
                    ? "texto"
                    : "seleccion_unica"),
            options: stored?.options ?? question.options ?? [],
          };
        })
      : normalizedAnswers;
  const questionsWithIdentity = questions.map((answer, index) => {
    const identityValue = identityValues[index];
    return index < identityValues.length && identityValue?.trim()
      ? { ...answer, value: identityValue }
      : answer;
  });
  let questionOffset = 0;
  const questionBlocks = getQuestionnaireSteps(code).map((block) => {
    const start = questionOffset;
    const blockQuestions = questionsWithIdentity.slice(
      questionOffset,
      questionOffset + block.questions.length,
    );
    questionOffset += block.questions.length;
    return { ...block, questions: blockQuestions, start };
  });
  if (questionOffset < questionsWithIdentity.length && questionBlocks.length) {
    const lastBlockIndex = questionBlocks.length - 1;
    const lastBlock = questionBlocks[lastBlockIndex];
    if (lastBlock) {
      questionBlocks[lastBlockIndex] = {
        ...lastBlock,
        questions: [...lastBlock.questions, ...questionsWithIdentity.slice(questionOffset)],
      };
    }
  }
  const getDisplayedAnswer = (answer: (typeof questionsWithIdentity)[number], index: number) => {
    const normalizedLabel = answer.question.trim().toLowerCase();
    const labelIndex = normalizedLabel.includes("correo")
      ? 0
      : normalizedLabel === "edad"
        ? 1
        : normalizedLabel === "sexo"
          ? 2
          : normalizedLabel.includes("distrito de residencia")
            ? 3
            : normalizedLabel.includes("distrito donde labora")
              ? 4
              : normalizedLabel.includes("sede de atención")
                ? 5
                : normalizedLabel.includes("motivo principal")
                  ? 6
                  : index;
    const identityValue = identityValues[labelIndex];
    return labelIndex < identityValues.length && identityValue?.trim()
      ? { ...answer, value: identityValue }
      : answer;
  };
  return (
    <main className="min-h-screen bg-background px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-275 space-y-6">
        <Link
          to="/maquinarias/cuestionarios/realizadas/$tipo"
          params={{ tipo: code }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a {labels[code]}
        </Link>
        <header className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Cuestionario realizado · Solo lectura
              </p>
              <h1 className="mt-1 text-2xl font-bold">Respuesta #{detail.id}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {labels[code]} · {detail.completedAt || "Fecha no disponible"}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Info label="Correo" value={detail.email || "Sin correo"} />
            <Info label="Edad" value={detail.edad || "—"} />
            <Info label="Distrito residencia" value={detail.distritoResidencia || "—"} />
            <Info label="Distrito laboral" value={detail.distritoLaboral || "—"} />
            <Info label="NPS" value={detail.nps?.toString() || "—"} />
            <Info label="Sede" value={detail.sede || "—"} />
          </div>
        </header>
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div>
            <h2 className="text-lg font-bold">Preguntas y respuestas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Detalle completo del cuestionario respondido. Esta vista no permite modificar datos.
            </p>
          </div>
          <div className="mt-6 space-y-5">
            {questionBlocks.map((block) => (
              <section
                key={block.title}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="border-b border-border pb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    {block.eyebrow}
                  </p>
                  <h3 className="mt-1 font-bold">{block.title}</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {block.questions.map((answer, index) => {
                    const displayedAnswer = getDisplayedAnswer(answer, block.start + index);
                    return (
                      <article
                        key={`${displayedAnswer.id}-${block.start + index}`}
                        className="rounded-xl border border-border bg-muted/15 p-4 md:p-5"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Pregunta {block.start + index + 1}
                        </p>
                        <p className="mt-1 text-sm font-semibold">{displayedAnswer.question}</p>
                        <AnswerValue answer={displayedAnswer} />
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function AnswerValue({ answer }: { answer: { value: string; kind: string; options: string[] } }) {
  const kind = answer.kind.toLowerCase();
  const isScale = kind === "likert" || kind === "nps" || kind === "scale";
  const selected = answer.value.trim();
  if (isScale) {
    const values =
      kind === "nps" || selected === "10"
        ? Array.from({ length: 11 }, (_, index) => String(index))
        : ["1", "2", "3", "4", "5"];
    return (
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-semibold ${selected === value || selected === `${value}.00` ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}
          >
            {value}
          </span>
        ))}
      </div>
    );
  }
  if (kind === "seleccion_multiple" || kind === "checks") {
    let selectedValues: string[] = [];
    try {
      selectedValues = JSON.parse(answer.value);
    } catch {
      selectedValues = answer.value === "—" ? [] : [answer.value];
    }
    return (
      <div className="space-y-2">
        {(answer.options.length ? answer.options : selectedValues).map((option) => (
          <div key={option} className="flex items-center gap-2 text-sm">
            <span
              className={`grid h-4 w-4 place-items-center rounded border ${selectedValues.includes(option) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted"}`}
            >
              {selectedValues.includes(option) ? "✓" : ""}
            </span>
            {option}
          </div>
        ))}
      </div>
    );
  }
  if ((kind === "seleccion_unica" || kind === "select") && answer.options.length) {
    return (
      <select
        disabled
        value={selected === "—" ? "" : selected}
        className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2.5 text-sm text-foreground"
      >
        <option value="">Sin respuesta</option>
        {answer.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  return <div className="text-sm text-foreground">{answer.value}</div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
