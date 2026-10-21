import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import logoAsset from "@/assets/logo-maquinarias.png.asset.json";
import {
  getQuestionnaireConfigFn,
  submitQuestionnaireResponseFn,
  POSTVENTA_TEMPLATE_ORDER,
  type QuestionnaireQuestionPayload,
} from "@/lib/mystery/questionnaire-data";

export const Route = createFileRoute("/maquinarias/cuestionarios/$tipo")({
  head: () => ({ meta: [{ title: "Cuestionario | Maquinarias" }] }),
  loader: () => getQuestionnaireConfigFn({ data: "maquinarias" }),
  component: InternalQuestionnairePage,
});

type Answers = Record<string, string | string[]>;
export type Question = {
  id: string;
  label: string;
  kind?: "scale" | "select" | "checks" | "textarea" | "text" | undefined;
  options?: string[] | undefined;
  required?: boolean | undefined;
};

export const QUESTIONNAIRE_STEPS: { eyebrow: string; title: string; questions: Question[] }[] = [
  {
    eyebrow: "Información general",
    title: "Conozcamos tu visita",
    questions: [
      {
        id: "email",
        label: "Correo electrónico",
        kind: "text",
        required: true,
      },
      {
        id: "edad",
        label: "Edad",
        kind: "select",
        options: ["18-25", "26-35", "36-45", "46-60", "61 a más"],
        required: true,
      },
      {
        id: "sexo",
        label: "Sexo",
        kind: "select",
        required: true,
        options: ["Femenino", "Masculino", "Prefiero no decirlo"],
      },
      {
        id: "distrito_residencia",
        label: "Distrito de residencia",
        kind: "select",
        required: true,
        options: [
          "Ate",
          "Comas",
          "La Molina",
          "Miraflores",
          "San Isidro",
          "Surco",
          "Surquillo",
          "Otro",
        ],
      },
      {
        id: "distrito_laboral",
        label: "Distrito donde labora",
        kind: "select",
        required: true,
        options: [
          "Ate",
          "Comas",
          "La Molina",
          "Miraflores",
          "San Isidro",
          "Surco",
          "Surquillo",
          "Otro",
        ],
      },
      {
        id: "sede",
        label: "Sede de atención",
        kind: "select",
        required: true,
        options: [
          "Maquinarias Nissan - Surquillo",
          "Maquinarias Hyundai - Surquillo",
          "Maquinarias Honda - La Molina",
          "Maquinarias C&P",
          "Maquinarias Seminuevos - Surquillo",
          "Maquinarias Seminuevos - Tomás Valle",
        ],
      },
      {
        id: "motivo",
        label: "Motivo principal de visita",
        kind: "select",
        required: true,
        options: [
          "Compra de vehículo nuevo / Cotización",
          "Compra de vehículo semi nuevo / Cotización",
          "Servicio de Posventa / Mantenimiento / Reparación",
          "Consulta de financiamiento",
          "Carrocería y Pintura",
          "Otro",
        ],
      },
    ],
  },
  {
    eyebrow: "Bloque 1",
    title: "Instalaciones y recepción",
    questions: [
      {
        id: "limpieza",
        label: "Limpieza y orden de la sala de ventas o espera",
        kind: "scale",
        required: true,
      },
      { id: "confort", label: "Confort y comodidad del ambiente", kind: "scale" },
      {
        id: "senalizacion",
        label: "Claridad de la señalización e información visible",
        kind: "scale",
      },
      { id: "bienvenida", label: "Protocolo de bienvenida al ingreso", kind: "scale" },
      {
        id: "cortesia",
        label: "¿Te ofrecieron agua, café o sala de espera?",
        kind: "select",
        options: ["Sí", "No", "No fue necesario"],
      },
    ],
  },
  {
    eyebrow: "Bloque 2",
    title: "Atención del asesor",
    questions: [
      {
        id: "profesionalismo",
        label: "Presentación personal y profesionalismo",
        kind: "scale",
        required: true,
      },
      { id: "escucha", label: "Escucha atenta para entender tus necesidades", kind: "scale" },
      { id: "trato", label: "Trato personalizado y amable", kind: "scale" },
      { id: "dominio", label: "Dominio técnico y/o comercial", kind: "scale" },
      {
        id: "tipo_atencion",
        label: "¿Cómo describirías la atención?",
        kind: "select",
        options: [
          "Altamente personalizada",
          "Personalizada",
          "Aceptable",
          "Estandarizada / De rutina",
          "Poco deseo de atender",
        ],
      },
    ],
  },
  {
    eyebrow: "Bloque 3",
    title: "Proceso y resolución",
    questions: [
      {
        id: "transparencia",
        label: "Transparencia en precios, cotizaciones o presupuesto",
        kind: "select",
        options: [
          "Totalmente clara y transparente",
          "Clara, requerí explicaciones",
          "Aceptable, requerí varias explicaciones",
          "Confusa / poco transparente",
          "Completamente confusa",
        ],
      },
      {
        id: "resolucion",
        label: "¿Tu necesidad fue resuelta en esta visita?",
        kind: "select",
        options: [
          "Sí, 100% resuelta",
          "Parcialmente, requiere seguimiento",
          "No, debo regresar o contactar",
        ],
      },
      { id: "facilidad", label: "Facilidad general del proceso", kind: "scale" },
      {
        id: "opciones",
        label: "¿Qué opciones o servicios te presentaron?",
        kind: "checks",
        options: [
          "Financiamiento / crédito",
          "Plan de retoma",
          "Prueba de manejo",
          "Mantenimiento / garantía / accesorios",
          "Cronograma y tiempos",
          "Ninguna de las anteriores",
        ],
      },
      {
        id: "comentario_proceso",
        label: "¿Qué podríamos mejorar en el proceso?",
        kind: "textarea",
      },
    ],
  },
  {
    eyebrow: "Bloque 4",
    title: "Experiencia y recomendación",
    questions: [
      { id: "csat", label: "Evaluación general de tu experiencia", kind: "scale", required: true },
      {
        id: "inconveniente",
        label: "¿Hubo algún momento de molestia o inconveniente?",
        kind: "select",
        options: ["No, todo estuvo perfecto", "Sí"],
      },
      { id: "sugerencia", label: "Sugerencia para mejorar la atención", kind: "textarea" },
      {
        id: "nps",
        label: "¿Qué tan probable es que recomiendes Maquinarias? (0 a 10)",
        kind: "scale",
        required: true,
      },
      {
        id: "recompra",
        label: "Probabilidad de realizar tu próxima compra en Maquinarias",
        kind: "select",
        options: [
          "Definitivamente sí",
          "Probablemente sí",
          "Incierto / dependerá",
          "Probablemente no",
          "Definitivamente no",
        ],
      },
    ],
  },
];

const postVentaSteps = QUESTIONNAIRE_STEPS.map((block) => {
  if (block.title === "Atención del asesor") {
    const questions = block.questions.map((question) =>
      question.id === "escucha"
        ? { ...question, label: "Escucha atenta para entender exactamente lo que necesitaba" }
        : question.id === "dominio"
          ? { ...question, label: "Dominio técnico y/o comercial claro y preciso" }
          : question,
    );
    questions.splice(
      4,
      0,
      {
        id: "claridad_servicio",
        label: "Claridad y conocimiento sobre el vehículo o servicio",
        kind: "scale",
      },
      {
        id: "alternativas_solucion",
        label: "Más de una alternativa para solucionar mis consultas o problemas",
        kind: "scale",
      },
    );
    return { ...block, title: "Atención del asesor y asesoría técnica", questions };
  }
  if (block.title === "Proceso y resolución") {
    const questions = block.questions.map((question) =>
      question.id === "opciones"
        ? {
            ...question,
            label: "¿Qué opciones o servicios te presentaron?",
            options: [
              "Diagnóstico y prioridad de trabajos",
              "Trabajos adicionales o accesorios",
              "Explicación de cotización y riesgos",
              "Presupuesto y tiempos de entrega",
              "Confianza en el servicio",
              "Experiencia de Maquinarias",
              "Ninguna de las anteriores",
            ],
          }
        : question,
    );
    questions.splice(3, 0, {
      id: "puntualidad_entrega",
      label: "¿El vehículo fue entregado en la hora y fecha comprometida?",
      kind: "select",
      options: ["Sí, a tiempo", "Antes de la hora acordada", "Con retraso"],
    });
    return { ...block, title: "Servicio, entrega y resolución", questions };
  }
  if (block.title === "Experiencia y recomendación") {
    return { ...block, title: "Experiencia emocional, diferenciación y NPS" };
  }
  return block;
});

const semiNuevosSteps = QUESTIONNAIRE_STEPS.map((block) => ({
  ...block,
  questions: block.questions.map((question) =>
    question.id === "opciones"
      ? { ...question, label: "¿Qué alternativas o servicios te presentaron?" }
      : question.id === "recompra"
        ? {
            ...question,
            label: "Probabilidad de realizar tu próxima compra nuevamente en Maquinarias",
          }
        : question,
  ),
}));

export const QUESTIONNAIRE_STEPS_BY_TYPE = {
  nuevos: QUESTIONNAIRE_STEPS,
  postventa: postVentaSteps,
  semi_nuevos: semiNuevosSteps,
} as const;

export function getQuestionnaireSteps(tipo: string) {
  return (
    QUESTIONNAIRE_STEPS_BY_TYPE[tipo as keyof typeof QUESTIONNAIRE_STEPS_BY_TYPE] ??
    QUESTIONNAIRE_STEPS
  );
}

function InternalQuestionnairePage() {
  const { tipo } = Route.useParams();
  const config = Route.useLoaderData();
  return (
    <QuestionnairePage tipo={tipo} configuredQuestions={config[tipo as keyof typeof config]} />
  );
}

export function QuestionnairePage({
  tipo,
  publicMode = false,
  configuredQuestions,
}: {
  tipo: string;
  publicMode?: boolean;
  configuredQuestions?: QuestionnaireQuestionPayload[];
}) {
  const label =
    tipo === "postventa" ? "Post Venta" : tipo === "semi_nuevos" ? "Semi Nuevos" : "Nuevos";
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const questionnaireSteps = getQuestionnaireSteps(tipo);
  const formSteps =
    configuredQuestions?.length === questionnaireSteps.flatMap((item) => item.questions).length
      ? questionnaireSteps.map((block, blockIndex) => {
          const offset = questionnaireSteps
            .slice(0, blockIndex)
            .reduce((sum, item) => sum + item.questions.length, 0);
          return {
            ...block,
            questions: block.questions.map((question, index) => {
              const configured = configuredQuestions[offset + index];
              return {
                ...question,
                label: configured?.text ?? question.label,
                kind: (configured?.kind as Question["kind"]) ?? question.kind,
                options: configured?.options?.length
                  ? configured.options
                  : question.options,
                required: question.required || Boolean(configured?.required),
              };
            }),
          };
        })
      : questionnaireSteps;
  const current = formSteps[step] ?? formSteps[0];
  if (!current) return null;
  const progress = Math.round(((step + 1) / formSteps.length) * 100);
  const setAnswer = (id: string, value: string | string[]) =>
    setAnswers((previous) => ({ ...previous, [id]: value }));
  const next = () => {
    const missing = current.questions.find((question) => isQuestionMissing(question, answers));
    if (missing) {
      setError(`Completa: ${missing.label}`);
      return;
    }
    setError(null);
    setStep((value) => Math.min(value + 1, formSteps.length - 1));
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-250 px-4 py-8 lg:px-8">
        {publicMode ? (
          <div className="mb-6 flex justify-center">
            <img src={logoAsset.url} alt="Maquinarias" className="h-12 w-auto object-contain" />
          </div>
        ) : (
          <Link
            to="/maquinarias/cuestionarios"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Volver a Cuestionarios
          </Link>
        )}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Encuesta virtual · {label}
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              {submitted
                ? "¡Gracias por tu respuesta!"
                : publicMode
                  ? "Queremos conocer tu experiencia"
                  : "Cuéntanos sobre tu experiencia"}
            </h1>
            {publicMode && !submitted && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Somos Factor IQ, por encargo de Maquinarias. Queremos conocer tu opinión sincera
                sobre tu visita. Tus respuestas son confidenciales y nos ayudarán a mejorar.
              </p>
            )}
          </div>
          {!submitted && (
            <span className="text-sm text-muted-foreground">
              Paso {step + 1} de {formSteps.length}
            </span>
          )}
        </div>
        {submitted ? (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <h2 className="text-lg font-bold">¡Encuesta completada y registrada!</h2>
            <p className="mt-2 text-sm leading-6">
              Tu respuesta ha sido guardada en la base de datos de Maquinarias. Las métricas de
              satisfacción, CSAT, NPS y promedios se han actualizado automáticamente.
            </p>
            {!publicMode && (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/maquinarias/cuestionarios"
                  className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Volver al dashboard
                </Link>
                <Link
                  to="/maquinarias/cuestionarios/realizadas/$tipo"
                  params={{ tipo: (tipo === "postventa" || tipo === "semi_nuevos" ? tipo : "nuevos") }}
                  className="inline-flex rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Ver en cuestionarios realizados
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
                <span>{current.eyebrow}</span>
                <span>{progress}% completado</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <section className="mt-8 rounded-xl border border-border bg-card p-5 md:p-8">
              <h2 className="text-xl font-bold">{current.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Responde según tu experiencia reciente. Puedes avanzar y volver sin perder tus
                respuestas.
              </p>
              <div className="mt-7 grid gap-6 md:grid-cols-2">
                {current.questions.map((question) => (
                  <QuestionField
                    key={question.id}
                    question={question}
                    value={answers[question.id]}
                    onChange={setAnswer}
                  />
                ))}
              </div>
              {error && (
                <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <div className="mt-8 flex justify-between gap-3 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                {step === formSteps.length - 1 ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      const missing = current.questions.find((question) =>
                        isQuestionMissing(question, answers),
                      );
                      if (missing) {
                        setError(`Completa: ${missing.label}`);
                        return;
                      }
                      setSubmitting(true);
                      setError(null);
                      try {
                        const items = formSteps
                          .flatMap((block) => block.questions)
                          .map((q, idx) => ({
                            orden:
                              tipo === "postventa" && idx < POSTVENTA_TEMPLATE_ORDER.length
                                ? (POSTVENTA_TEMPLATE_ORDER[idx] as number)
                                : idx + 1,
                            value: answers[q.id] ?? null,
                          }));

                        await submitQuestionnaireResponseFn({
                          data: {
                            clientSlug: "maquinarias",
                            code: (tipo === "postventa" || tipo === "semi_nuevos" ? tipo : "nuevos") as
                              | "nuevos"
                              | "postventa"
                              | "semi_nuevos",
                            answers,
                            items,
                          },
                        });
                        await router.invalidate();
                        setSubmitted(true);
                      } catch {
                        setError("Ocurrió un error al guardar la encuesta. Intenta nuevamente.");
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {submitting ? "Guardando..." : "Finalizar"} <Check className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Continuar <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value?: string | string[] | undefined;
  onChange: (id: string, value: string | string[]) => void;
}) {
  const base =
    "mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring";
  if (question.kind === "scale")
    return (
      <fieldset className="md:col-span-2">
        <legend className="text-sm font-medium">
          {question.label}
          {question.required && <span className="text-red-600"> *</span>}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(question.id === "nps"
            ? Array.from({ length: 11 }, (_, index) => String(index))
            : ["1", "2", "3", "4", "5"]
          ).map((option) => (
            <label
              key={option}
              className={`grid h-10 w-10 cursor-pointer place-items-center rounded-lg border text-sm font-semibold ${value === option ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
            >
              <input
                className="sr-only"
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={() => onChange(question.id, option)}
              />
              {option}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {question.id === "nps"
            ? "0 = nada probable · 10 = totalmente probable"
            : "1 = muy malo · 5 = excelente"}
        </p>
      </fieldset>
    );
  if (question.kind === "textarea")
    return (
      <label className="grid gap-1 text-sm font-medium md:col-span-2">
        {question.label}
        <textarea
          className={`${base} resize-none`}
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(question.id, event.target.value)}
        />
      </label>
    );
  if (question.kind === "checks")
    return (
      <fieldset className="grid gap-2 text-sm md:col-span-2">
        <legend className="mb-1 font-medium">{question.label}</legend>
        {question.options?.map((option) => {
          const selected = Array.isArray(value) && value.includes(option);
          return (
            <label key={option} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => {
                  const current = Array.isArray(value) ? value : [];
                  onChange(
                    question.id,
                    selected ? current.filter((item) => item !== option) : [...current, option],
                  );
                }}
              />
              {option}
            </label>
          );
        })}
      </fieldset>
    );
  if (question.kind === "text")
    return (
      <label className="grid gap-1 text-sm font-medium">
        {question.label}
        {question.required && <span className="text-red-600"> *</span>}
        <input
          type={question.id === "email" ? "email" : "text"}
          className={base}
          value={typeof value === "string" ? value : ""}
          required={question.required}
          placeholder={question.id === "email" ? "cliente@correo.com" : undefined}
          onChange={(event) => onChange(question.id, event.target.value)}
        />
      </label>
    );
  return (
    <label className="grid gap-1 text-sm font-medium">
      {question.label}
      {(question.required || question.kind === "select") && (
        <span className="text-red-600"> *</span>
      )}
      <select
        className={base}
        value={typeof value === "string" ? value : ""}
        required={question.required || question.kind === "select"}
        onChange={(event) => onChange(question.id, event.target.value)}
      >
        <option value="">Selecciona una opción</option>
        {question.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function isAnswerFilled(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
}

function isQuestionMissing(question: Question, answers: Answers) {
  // Todo combo debe tener una selección distinta del placeholder vacío.
  return (question.required || question.kind === "select") && !isAnswerFilled(answers[question.id]);
}
