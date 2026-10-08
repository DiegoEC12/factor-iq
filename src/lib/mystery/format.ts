export function fmtPct(v: number | null | undefined, digits = 1) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

export function fmtPp(v: number | null | undefined) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const sign = v >= 0 ? "+" : "−";
  return `${sign}${Math.abs(v * 100).toFixed(1)} pp`;
}

export const MES_A_NUMERO: Record<string, number> = {
  ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6,
  JULIO: 7, AGOSTO: 8, SETIEMBRE: 9, SEPTIEMBRE: 9, OCTUBRE: 10,
  NOVIEMBRE: 11, DICIEMBRE: 12,
};

export function normalizarPeriodo(mesRaw?: string | null, fecha?: string | null, periodo?: string | null) {
  if (fecha) {
    const date = new Date(fecha);
    if (!Number.isNaN(date.getTime())) {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      return { key: `${year}-${String(month).padStart(2, "0")}`, label: date.toLocaleDateString("es-PE", { month: "short", year: "numeric" }), timestamp: date.getTime() };
    }
  }
  const raw = (mesRaw || periodo || "AGOSTO").trim().toUpperCase();
  const month = MES_A_NUMERO[raw] ?? Number(raw.match(/\d+/)?.[0] ?? 8);
  const year = 2026;
  const date = new Date(Date.UTC(year, month - 1, 1));
  return { key: `${year}-${String(month).padStart(2, "0")}`, label: date.toLocaleDateString("es-PE", { month: "short", year: "numeric", timeZone: "UTC" }), timestamp: date.getTime() };
}
