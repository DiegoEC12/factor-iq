import raw from "@/data/dataset.json";
import { includesTipoEvaluacion, normalizeTipoEvaluacion } from "@/lib/tipo-evaluacion";

export type Evaluacion = {
  id: string;
  concesionaria: string;
  marca: string;
  ubicacion: string;
  puntaje: number;
  resumen: string | null;
  recomendaciones: string | null;
  tipoEvaluacion: string;
  mes?: string | null;
  fechaEvaluacion?: string | null;
  asesorEvaluado?: string | null;
};

export type IndicadorRow = {
  ev: string;
  n: number;
  nombre: string;
  peso: number;
  cumpl: number;
};

export type PreguntaRow = {
  ev: string;
  ind: number;
  indicador: string;
  q: string;
  resp: string | null;
  nota: number | null;
  obs: string | null;
};

const data = raw as unknown as {
  evaluaciones: (Omit<Evaluacion, "tipoEvaluacion"> & { tipoEvaluacion?: string })[];
  indicadores: IndicadorRow[];
  preguntas: PreguntaRow[];
};

export const evaluaciones: Evaluacion[] = data.evaluaciones.map((e) => ({
  ...e,
  tipoEvaluacion: normalizeTipoEvaluacion(e.tipoEvaluacion ?? "Ventas"),
}));
export const indicadores = data.indicadores;
export const preguntas = data.preguntas;

export const MARCA_PROPIA = "MAQUINARIAS";

export const uniq = (values: string[]) => Array.from(new Set(values)).sort();

export const concesionarias = uniq(evaluaciones.map((e) => e.concesionaria));
export const marcas = uniq(evaluaciones.map((e) => e.marca));
export const ubicaciones = uniq(evaluaciones.map((e) => e.ubicacion));

export const indicadorCatalogo = Array.from(
  new Map(indicadores.map((i) => [i.n, { n: i.n, nombre: i.nombre, peso: i.peso }])).values(),
).sort((a, b) => a.n - b.n);

function indicatorKey(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/maquinarias$/i, "")
    .replace(/[^a-z0-9]/g, "");
}

function indicadorCatalogoPara(evs: Evaluacion[]) {
  const ids = new Set(evs.map((evaluation) => evaluation.id));
  return Array.from(
    new Map(
      indicadores
        .filter((indicator) => ids.has(indicator.ev))
        .map((indicator) => [indicatorKey(indicator.nombre), indicator]),
    ).values(),
  ).sort((a, b) => a.n - b.n);
}

export const labelOf = (e: Evaluacion) => `${title(e.concesionaria)} ${title(e.marca)}`;

function normalizeKeyPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("es");
}

export function localKey(concesionaria: string, marca: string, ubicacion: string) {
  return [concesionaria, marca, ubicacion].map(normalizeKeyPart).join("|");
}

export function title(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export type Filters = {
  concesionaria: string[] | null;
  marca: string[] | null;
  ubicacion: string[] | null;
  indicador: string[] | null;
  tipoEvaluacion: string[] | null;
};

export const EMPTY_FILTERS: Filters = {
  concesionaria: null,
  marca: null,
  ubicacion: null,
  indicador: null,
  tipoEvaluacion: ["Ventas"],
};

export function filterEvaluaciones(f: Filters) {
  return evaluaciones.filter(
    (e) =>
      (f.concesionaria === null || f.concesionaria.includes(e.concesionaria)) &&
      (f.marca === null || f.marca.includes(e.marca)) &&
      (f.ubicacion === null || f.ubicacion.includes(e.ubicacion)) &&
      (f.tipoEvaluacion === null || includesTipoEvaluacion(f.tipoEvaluacion, e.tipoEvaluacion)) &&
      (f.indicador === null ||
        f.indicador.some((indicatorId) => {
          const match = indicatorId.match(/(\d+)$/);
          return (
            match !== null &&
            indicadores.some(
              (indicator) => indicator.ev === e.id && indicator.n === Number(match[1]),
            )
          );
        })),
  );
}

/** Score of one evaluation, respecting an optional indicator focus. */
export function scoreOf(ev: Evaluacion, indicadorFiltro: string) {
  if (!indicadorFiltro || indicadorFiltro === "all") return ev.puntaje;

  // Try direct match by indicator number
  // Handles: "IND_01" → 1, "IND_CAL_03" → 3, plain "5" → 5
  const numMatch = indicadorFiltro.match(/(\d+)$/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (Number.isFinite(n)) {
      const row = indicadores.find((i) => i.ev === ev.id && i.n === n);
      if (row) return row.cumpl;
    }
  }

  // Fallback: match by indicator name key (for edge cases)
  return 0;
}

export const avg = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

const avgNullable = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

export const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

export type Tone = "alto" | "medio" | "critico";

export function toneOf(value: number): Tone {
  if (value > 0.7) return "alto";
  if (value >= 0.5) return "medio";
  return "critico";
}

export const toneColor: Record<Tone, string> = {
  alto: "var(--good)",
  medio: "var(--warn)",
  critico: "var(--bad)",
};

export const toneLabel: Record<Tone, string> = {
  alto: "Alto",
  medio: "Medio",
  critico: "Crítico",
};

/** Average per indicator across a set of evaluations. */
export function indicadorAverages(evs: Evaluacion[]) {
  const ids = new Set(evs.map((e) => e.id));
  const catalogo = indicadorCatalogoPara(evs);
  return catalogo.map((c) => {
    const rows = indicadores.filter((i) => ids.has(i.ev) && i.n === c.n);
    return { ...c, valor: avg(rows.map((r) => r.cumpl)) };
  });
}

export function benchmark(evs: Evaluacion[]) {
  const propias = evs.filter((e) => e.concesionaria === MARCA_PROPIA);
  const otras = evs.filter((e) => e.concesionaria !== MARCA_PROPIA);
  const maquinarias = avg(propias.map((e) => e.puntaje));
  const competencia = avg(otras.map((e) => e.puntaje));
  return {
    maquinarias,
    competencia,
    brecha: maquinarias - competencia,
    nPropias: propias.length,
    nOtras: otras.length,
  };
}

/** Gap per indicator: Maquinarias vs competencia (percentage points). */
export function brechaPorIndicador(evs: Evaluacion[]) {
  const propias = new Set(evs.filter((e) => e.concesionaria === MARCA_PROPIA).map((e) => e.id));
  const otras = new Set(evs.filter((e) => e.concesionaria !== MARCA_PROPIA).map((e) => e.id));
  const catalogo = indicadorCatalogoPara(evs);
  return catalogo
    .map((c) => {
      const key = indicatorKey(c.nombre);
      const own = avgNullable(
        indicadores
          .filter((i) => propias.has(i.ev) && indicatorKey(i.nombre) === key)
          .map((i) => i.cumpl),
      );
      const rival = avgNullable(
        indicadores
          .filter((i) => otras.has(i.ev) && indicatorKey(i.nombre) === key)
          .map((i) => i.cumpl),
      );
      return { ...c, own, rival, gap: own !== null && rival !== null ? own - rival : null };
    })
    .sort((a, b) => (b.own ?? -Infinity) - (a.own ?? -Infinity));
}

/**
 * Devuelve el texto de recomendaciones de una evaluación.
 *
 * Algunas importaciones llegan sin la columna `recomendaciones` pero sí con las
 * recomendaciones embebidas en el resumen de la visita (como lista de puntos o
 * como frases de cierre). En ese caso se extraen para no dejar la sección vacía.
 */
export function recommendationsForEvaluation(ev: Evaluacion | null | undefined): {
  text: string | null;
  derived: boolean;
} {
  if (!ev) return { text: null, derived: false };
  if (ev.recomendaciones?.trim()) return { text: ev.recomendaciones.trim(), derived: false };

  const summary = String(ev.resumen ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!summary) return { text: null, derived: false };

  // 1) Lista de puntos embebida en el resumen (* punto 1 * punto 2 ...)
  const bulletPoints = summary
    .split(/\s*\*\s*/)
    .slice(1)
    .map((point) => point.replace(/^recomendaciones[:\s-]*/i, "").trim())
    .filter((point) => point.length > 20);
  if (bulletPoints.length >= 2) {
    return { text: bulletPoints.join("\n"), derived: true };
  }

  // 2) Frases con verbos/sesgo de recomendación al final del resumen
  const sentences = summary
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const recommendationCue =
    /se recomienda|se sugiere|es importante|es fundamental|se debe|deber[íi]a|fortalecer|reforzar|mejorar|implementar|garantizar|capacitar|incorporar|potenciar|recomendable/i;
  const picks = sentences.filter((sentence) => recommendationCue.test(sentence));
  if (picks.length) {
    return { text: picks.slice(-5).join("\n"), derived: true };
  }

  return { text: null, derived: false };
}

export type PreguntaAgg = {
  q: string;
  indicador: string;
  ind: number;
  valor: number;
  respuestas: {
    ev: string;
    local: string;
    resp: string | null;
    nota: number | null;
    obs: string | null;
  }[];
};

export function preguntasAgregadas(evs: Evaluacion[]): PreguntaAgg[] {
  const byId = new Map(evs.map((e) => [e.id, e]));
  const map = new Map<string, PreguntaAgg>();
  for (const p of preguntas) {
    const ev = byId.get(p.ev);
    if (!ev || p.nota === null) continue;
    const key = `${p.ind}|${p.q}`;
    let entry = map.get(key);
    if (!entry) {
      entry = { q: p.q, indicador: p.indicador, ind: p.ind, valor: 0, respuestas: [] };
      map.set(key, entry);
    }
    entry.respuestas.push({
      ev: p.ev,
      local: labelOf(ev),
      resp: p.resp,
      nota: p.nota,
      obs: p.obs,
    });
  }
  const list = Array.from(map.values());
  for (const entry of list) {
    entry.valor = avg(entry.respuestas.map((r) => r.nota ?? 0));
  }
  return list.sort((a, b) => a.valor - b.valor);
}
