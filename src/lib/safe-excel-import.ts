import * as XLSX from "xlsx";
import { normalizeTipoEvaluacion } from "@/lib/tipo-evaluacion";

export type SafeImportEvaluation = {
  codigo: string;
  concesionaria: string;
  marca: string;
  ubicacion: string;
  tipoEvaluacion: "Ventas" | "Call Center" | "Seminuevos" | "Posventa";
  puntaje: number;
  resumen: string | null;
  recomendaciones: string | null;
  fechaEvaluacion: string | null;
  asesorEvaluado: string | null;
};

export type SafeImportIndicator = {
  codigoEvaluacion: string;
  orden: number;
  nombre: string;
  peso: number;
  cumplimiento: number;
};

export type SafeImportQuestion = {
  codigoEvaluacion: string;
  ordenIndicador: number;
  indicador: string;
  pregunta: string;
  respuesta: string | null;
  nota: number | null;
  observacion: string | null;
};

export type SafeImportPayload = {
  evaluations: SafeImportEvaluation[];
  indicators: SafeImportIndicator[];
  questions: SafeImportQuestion[];
  columns: { asesor: boolean; fecha: boolean };
  warnings: string[];
  errors: string[];
};

const sheetAliases = {
  evaluations: ["evaluaciones", "evaluations", "visitas", "mystery", "evaluacion", "datos", "base"],
  indicators: ["indicadores", "indicators", "indicatorresults", "resultados"],
  questions: ["preguntas", "questions", "respuestas", "items", "checklist"],
} as const;

function key(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}
function findValue(row: Record<string, unknown>, names: string[]) {
  return Object.entries(row).find(([name]) => names.includes(key(name)))?.[1] ?? null;
}
function number(value: unknown, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim().replace(",", ".");
  if (str.endsWith("%")) {
    const num = Number(str.slice(0, -1).trim());
    return Number.isFinite(num) ? num / 100 : fallback;
  }
  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function sheetRows(workbook: XLSX.WorkBook, aliases: readonly string[]) {
  const name = workbook.SheetNames.find((candidate) => aliases.includes(key(candidate)));
  return name
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name]!, {
        defval: null,
        raw: false,
      })
    : [];
}

function toMysqlDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 20000 && value < 60000) {
    const d = new Date((value - 25569) * 86400 * 1000);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const raw = text(value);
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;
  const latam = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!latam) return null;
  const day = Number(latam[1]);
  const month = Number(latam[2]);
  const year = Number(latam[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function strictType(value: string): SafeImportEvaluation["tipoEvaluacion"] | null {
  const normalized = normalizeTipoEvaluacion(value);
  return (["Ventas", "Call Center", "Seminuevos", "Posventa"] as const).includes(
    normalized as SafeImportEvaluation["tipoEvaluacion"],
  )
    ? (normalized as SafeImportEvaluation["tipoEvaluacion"])
    : null;
}

/** Lee y valida un Excel sin escribir ni cambiar el estado de la aplicación. */
export async function parseSafeImportExcel(file: File): Promise<SafeImportPayload> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const evaluationRows = sheetRows(workbook, sheetAliases.evaluations);
  const indicatorRows = sheetRows(workbook, sheetAliases.indicators);
  const questionRows = sheetRows(workbook, sheetAliases.questions);
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!evaluationRows.length || !indicatorRows.length || !questionRows.length) {
    return {
      evaluations: [],
      indicators: [],
      questions: [],
      columns: { asesor: false, fecha: false },
      warnings,
      errors: ["El archivo debe incluir las hojas Evaluaciones, Indicadores y Preguntas."],
    };
  }

  const first = evaluationRows[0] ?? {};
  const asesorNames = [
    "asesor",
    "asesorevaluado",
    "asesorevaluado",
    "asesorcomercial",
    "evaluado",
    "advisor",
    "ejecutivocomercial",
    "responsableevaluacion",
  ];
  const fechaNames = [
    "fecha",
    "fechaevaluacion",
    "fechavisita",
    "fechaatencion",
    "date",
    "fechadeterminada",
    "fechadeevaluacion",
    "fechadevisita",
    "fechaevaluada",
  ];
  const columns = {
    asesor: Object.keys(first).some((name) => asesorNames.includes(key(name))),
    fecha: Object.keys(first).some((name) => fechaNames.includes(key(name))),
  };
  const codes = new Set<string>();
  const evaluations = evaluationRows.map((row, index) => {
    const codigo = text(
      findValue(row, ["codigo", "id", "idevaluacion", "id_evaluacion", "evaluacionid"]),
    );
    const typeRaw = text(
      findValue(row, [
        "tipoevaluacion",
        "origencanal",
        "origencanal",
        "canalorigen",
        "tipo",
        "evaluationtype",
      ]),
    );
    const tipoEvaluacion = strictType(typeRaw);
    const fechaRaw = findValue(row, fechaNames);
    const fechaEvaluacion = toMysqlDate(fechaRaw);
    if (!codigo) errors.push(`Fila ${index + 2}: falta el código de evaluación.`);
    else if (codigo.length > 30)
      errors.push(`Fila ${index + 2}: el código "${codigo}" supera 30 caracteres.`);
    else if (codes.has(codigo))
      errors.push(`Fila ${index + 2}: el código "${codigo}" está duplicado dentro del Excel.`);
    else codes.add(codigo);
    if (!tipoEvaluacion)
      errors.push(`Fila ${index + 2}: tipo de evaluación no reconocido (${typeRaw || "vacío"}).`);
    if (text(fechaRaw) && !fechaEvaluacion)
      errors.push(
        `Fila ${index + 2}: fecha inválida (${text(fechaRaw)}). Usa DD/MM/AAAA o AAAA-MM-DD.`,
      );
    const puntaje = number(findValue(row, ["puntaje", "puntajetotal", "score", "resultado"]));
    if (puntaje < 0 || puntaje > 1)
      errors.push(`Fila ${index + 2}: el puntaje debe estar entre 0 y 1.`);
    return {
      codigo,
      concesionaria: text(findValue(row, ["concesionaria", "dealer", "cliente", "empresa"])),
      marca: text(findValue(row, ["marca", "brand"])),
      ubicacion: text(findValue(row, ["ubicacion", "local", "sede", "location"])),
      tipoEvaluacion: tipoEvaluacion ?? "Ventas",
      puntaje,
      resumen: text(findValue(row, ["resumen", "resumenvisita", "summary"])) || null,
      recomendaciones: text(findValue(row, ["recomendaciones", "recommendations"])) || null,
      fechaEvaluacion,
      asesorEvaluado: text(findValue(row, asesorNames)) || null,
    };
  });

  const validCodes = new Set(evaluations.map((item) => item.codigo).filter(Boolean));
  const indicators = indicatorRows.map((row, index) => {
    const codigoEvaluacion = text(findValue(row, ["ev", "codigo", "idevaluacion", "evaluacionid"]));
    const orden = number(findValue(row, ["n", "orden", "numero", "indicadorn", "noindicador"]));
    const cumplimiento = number(
      findValue(row, ["cumpl", "cumplimiento", "resultado", "score", "nota"]),
    );
    if (!validCodes.has(codigoEvaluacion))
      errors.push(
        `Indicadores, fila ${index + 2}: la evaluación "${codigoEvaluacion || "vacía"}" no existe.`,
      );
    if (!orden) errors.push(`Indicadores, fila ${index + 2}: falta el orden del indicador.`);
    if (cumplimiento < 0 || cumplimiento > 1)
      errors.push(`Indicadores, fila ${index + 2}: cumplimiento fuera del rango 0–1.`);
    return {
      codigoEvaluacion,
      orden,
      nombre: text(findValue(row, ["nombre", "nombreindicador", "indicador", "name"])),
      peso: number(findValue(row, ["peso", "weight"])),
      cumplimiento,
    };
  });
  const questions = questionRows.map((row, index) => {
    const codigoEvaluacion = text(findValue(row, ["ev", "codigo", "idevaluacion", "evaluacionid"]));
    const ordenIndicador = number(findValue(row, ["ind", "n", "indicadorn", "noindicador"]));
    const pregunta = text(findValue(row, ["q", "pregunta", "question"]));
    const noteValue = findValue(row, ["nota", "puntaje", "score"]);
    const nota = noteValue === null ? null : number(noteValue);
    if (!validCodes.has(codigoEvaluacion))
      errors.push(
        `Preguntas, fila ${index + 2}: la evaluación "${codigoEvaluacion || "vacía"}" no existe.`,
      );
    if (!ordenIndicador || !pregunta)
      errors.push(`Preguntas, fila ${index + 2}: faltan indicador o pregunta.`);
    return {
      codigoEvaluacion,
      ordenIndicador,
      indicador: text(findValue(row, ["indicador", "nombreindicador", "indicator"])),
      pregunta,
      respuesta: text(findValue(row, ["resp", "respuesta", "answer"])) || null,
      nota,
      observacion: text(findValue(row, ["obs", "observacion", "comentario", "comment"])) || null,
    };
  });
  if (!columns.asesor)
    warnings.push("No se detectó una columna de asesor; se guardará como valor nulo.");
  if (!columns.fecha)
    warnings.push("No se detectó una columna de fecha; se guardará como valor nulo.");
  return { evaluations, indicators, questions, columns, warnings, errors };
}
