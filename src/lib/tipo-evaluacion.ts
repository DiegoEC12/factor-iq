function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export const CANONICAL_TIPOS_EVALUACION = [
  "Call Center",
  "Seminuevos",
  "Ventas",
  "Posventa",
] as const;

export type CanonicalTipoEvaluacion = (typeof CANONICAL_TIPOS_EVALUACION)[number];

export function normalizeTipoEvaluacion(value: unknown, fallback = "Ventas"): string {
  const raw = String(value ?? "").trim();
  const key = normalizeKey(raw);

  if (!key) return fallback;
  if (key.includes("callcenter") || key === "call") return "Call Center";
  if (key.includes("seminuevo") || key.includes("seminuevos")) return "Seminuevos";
  if (key.includes("posventa") || key.includes("postventa") || key.includes("aftersales"))
    return "Posventa";
  if (key.includes("venta") || key.includes("ventas")) return "Ventas";

  return fallback;
}

export function includesTipoEvaluacion(selected: string[] | null, value: unknown): boolean {
  if (!selected) return true;
  const currentKey = normalizeKey(normalizeTipoEvaluacion(value));
  return selected.some((item) => normalizeKey(normalizeTipoEvaluacion(item)) === currentKey);
}

export function coerceSingleTipoEvaluacion(
  values: string[] | null,
  _fallback = "Ventas",
): string[] | null {
  if (values === null) return null;
  const cleaned = [...new Set(values.map((item) => normalizeTipoEvaluacion(item)).filter(Boolean))];
  return cleaned.length ? cleaned : null;
}
