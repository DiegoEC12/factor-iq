import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  getQuestionnaireConfigFn,
  saveQuestionnaireDraftFn,
} from "@/lib/mystery/questionnaire-data";
import { getQuestionnaireSteps } from "./cuestionarios.$tipo";

type Item = {
  id: number;
  text: string;
  options: string[];
  active: boolean;
  required: boolean;
  kind: "text" | "select" | "checks" | "scale" | "textarea";
  min?: number;
  max?: number;
};
type QuestionnaireType = "nuevos" | "postventa" | "semi_nuevos";

const TYPES: { value: QuestionnaireType; label: string }[] = [
  { value: "nuevos", label: "Nuevos" },
  { value: "postventa", label: "Post Venta" },
  { value: "semi_nuevos", label: "Semi Nuevos" },
];

function buildInitialItems(t: QuestionnaireType): Item[] {
  return getQuestionnaireSteps(t)
    .flatMap((step) => step.questions)
    .map((question, index) => ({
      id: index + 1,
      text: question.label,
      options:
        question.options ??
        (question.id === "nps"
          ? ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
          : ["1", "2", "3", "4", "5"]),
      active: true,
      required: Boolean(question.required),
      kind: question.kind ?? "select",
      min: question.id === "nps" ? 0 : 1,
      max: question.id === "nps" ? 10 : 5,
    }));
}

const initial: Record<QuestionnaireType, Item[]> = {
  nuevos: buildInitialItems("nuevos"),
  postventa: buildInitialItems("postventa"),
  semi_nuevos: buildInitialItems("semi_nuevos"),
};

export const Route = createFileRoute("/maquinarias/cuestionarios/modificar")({
  head: () => ({ meta: [{ title: "Modificar cuestionario | Maquinarias" }] }),
  loader: () => getQuestionnaireConfigFn({ data: "maquinarias" }),
  component: ModifyQuestionnairePage,
});

function ModifyQuestionnairePage() {
  const config = Route.useLoaderData();
  const [type, setType] = useState<QuestionnaireType>("nuevos");
  const [items, setItems] = useState<Record<QuestionnaireType, Item[]>>(() => ({
    nuevos:
      config["nuevos"] && config["nuevos"].length >= initial["nuevos"].length
        ? (config["nuevos"] as Item[])
        : initial["nuevos"],
    postventa:
      config["postventa"] && config["postventa"].length >= initial["postventa"].length
        ? (config["postventa"] as Item[])
        : initial["postventa"],
    semi_nuevos:
      config["semi_nuevos"] && config["semi_nuevos"].length >= initial["semi_nuevos"].length
        ? (config["semi_nuevos"] as Item[])
        : initial["semi_nuevos"],
  }));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>(
    Object.fromEntries(getQuestionnaireSteps(type).map((block) => [block.title, true])),
  );
  const current = items[type] ?? [];
  const update = (id: number, changes: Partial<Item>) => {
    setSaved(false);
    setSaveMessage(null);
    setItems((previous) => ({
      ...previous,
      [type]: (previous[type] ?? []).map((item) => (item.id === id ? { ...item, ...changes } : item)),
    }));
  };
  const add = () => {
    setSaved(false);
    setSaveMessage(null);
    setItems((previous) => ({
      ...previous,
      [type]: [
        ...(previous[type] ?? []),
        {
          id: Date.now(),
          text: "Nueva pregunta",
          options: ["Opción 1", "Opción 2"],
          active: true,
          required: false,
          kind: "select",
          min: 1,
          max: 5,
        },
      ],
    }));
  };
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-300 space-y-6 px-4 py-8 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Configuración
          </p>
          <h1 className="mt-2 text-2xl font-bold">Modificar cuestionario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edita preguntas y opciones antes de publicar una nueva versión.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
          {TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${type === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <section className="rounded-xl border border-border bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Preguntas del cuestionario</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Las respuestas históricas conservarán la versión con la que fueron respondidas.
              </p>
            </div>
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              Agregar pregunta
            </button>
          </div>
          <div className="mt-5 space-y-6">
            {(() => {
              let cursor = 0;
              return getQuestionnaireSteps(type).map((block) => {
                const blockItems = current.slice(cursor, cursor + block.questions.length);
                cursor += block.questions.length;
                const isOpen = openBlocks[block.title] ?? true;
                return (
                  <section
                    key={block.title}
                    className="rounded-xl border border-border bg-muted/20 p-4 md:p-5"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenBlocks((previous) => ({ ...previous, [block.title]: !isOpen }))
                      }
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                          {block.eyebrow}
                        </span>
                        <span className="mt-1 block font-semibold">{block.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {blockItems.length} preguntas configuradas
                        </span>
                      </span>
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="mt-4 space-y-4 border-t border-border pt-4">
                        {blockItems.map((item, index) => (
                          <QuestionEditor
                            key={item.id}
                            item={item}
                            number={index + 1}
                            update={update}
                            onDelete={() => (
                              setSaved(false),
                              setSaveMessage(null),
                              setItems((previous) => ({
                                ...previous,
                                [type]: (previous[type] ?? []).filter((entry) => entry.id !== item.id),
                              }))
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              });
            })()}
          </div>
          <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={async () => {
                setSaving(true);
                setSaveMessage(null);
                try {
                  await saveQuestionnaireDraftFn({
                    data: {
                      clientSlug: "maquinarias",
                      code: type as "nuevos" | "postventa" | "semi_nuevos",
                      questions: current,
                    },
                  });
                  setSaved(true);
                  setSaveMessage("Cambios guardados correctamente en la BD.");
                } catch (error) {
                  setSaved(false);
                  setSaveMessage(
                    error instanceof Error
                      ? error.message
                      : "No se pudieron guardar los cambios en la BD.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {saveMessage && (
              <span className={`text-sm ${saved ? "text-emerald-700" : "text-red-700"}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function QuestionEditor({
  item,
  number,
  update,
  onDelete,
}: {
  item: Item;
  number: number;
  update: (id: number, changes: Partial<Item>) => void;
  onDelete: () => void;
}) {
  const hasOptions = item.kind === "select" || item.kind === "checks";
  const updateOption = (index: number, value: string) =>
    update(item.id, {
      options: item.options.map((option, optionIndex) => (optionIndex === index ? value : option)),
    });
  const removeOption = (index: number) =>
    update(item.id, { options: item.options.filter((_, optionIndex) => optionIndex !== index) });
  const addOption = () =>
    update(item.id, { options: [...item.options, `Opción ${item.options.length + 1}`] });
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold">
          {number}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <label className="block text-xs font-semibold text-muted-foreground">
            Texto de la pregunta
            <input
              value={item.text}
              onChange={(event) => update(item.id, { text: event.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={item.required}
              onChange={(event) => update(item.id, { required: event.target.checked })}
            />
            Respuesta obligatoria
          </label>
          <div className="grid gap-3 lg:grid-cols-[210px_1fr] lg:items-start">
            <label className="block text-xs font-semibold text-muted-foreground">
              Tipo de respuesta
              <select
                value={item.kind}
                onChange={(event) => {
                  const kind = event.target.value as Item["kind"];
                  update(item.id, {
                    kind,
                    options: kind === "text" || kind === "textarea" ? [] : item.options,
                  });
                }}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal"
              >
                <option value="select">Combo box (una opción)</option>
                <option value="checks">Selección múltiple (varias opciones)</option>
                <option value="scale">Escala / rango</option>
                <option value="text">Texto corto</option>
                <option value="textarea">Texto largo</option>
              </select>
            </label>
            {item.kind === "scale" ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-foreground">Rango de respuesta</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Define los límites que verá el cliente.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Mínimo
                    <input
                      type="number"
                      value={item.min ?? 1}
                      onChange={(event) => update(item.id, { min: Number(event.target.value) })}
                      className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Máximo
                    <input
                      type="number"
                      value={item.max ?? 5}
                      onChange={(event) => update(item.id, { max: Number(event.target.value) })}
                      className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal"
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Array.from(
                    { length: Math.min((item.max ?? 5) - (item.min ?? 1) + 1, 11) },
                    (_, index) => (item.min ?? 1) + index,
                  ).map((value) => (
                    <span
                      key={value}
                      className="grid h-7 min-w-7 place-items-center rounded-md border border-border bg-card px-1 text-xs font-semibold"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            ) : hasOptions ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Respuestas disponibles</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Edita cada opción por separado.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addOption}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {item.options.map((option, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-card text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <input
                        value={option}
                        onChange={(event) => updateOption(index, event.target.value)}
                        className="h-9 min-w-0 flex-1 rounded-md border border-input bg-card px-2.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        aria-label="Eliminar opción"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold text-foreground">Campo libre</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  El cliente responderá escribiendo directamente. No necesita opciones
                  configurables.
                </p>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={item.active}
              onChange={(event) => update(item.id, { active: event.target.checked })}
            />
            Pregunta activa
          </label>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
          aria-label="Eliminar pregunta"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
