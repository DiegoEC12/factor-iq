import type { Evaluation } from "./types";
import type { GlobalFilters } from "./calculations";
import { availableIndicators, filterEvaluations, indicatorScore } from "./calculations";
import { normalizarPeriodo } from "./format";

export type TrendPoint = { key: string; label: string; value: number | null; n: number };
export type TrendSeries = { id: string; label: string; color: string; points: TrendPoint[] };

const COLORS = ["#0284C7", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#64748B"];

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

/** Construye series históricas usando el mismo universo ya filtrado por el dashboard. */
export function buildTrendSeries(evaluations: Evaluation[], filters: GlobalFilters): { periods: TrendPoint[]; series: TrendSeries[] } {
  const filtered = filterEvaluations(evaluations, filters);
  const periods = [...new Map(filtered.map((evaluation) => {
    const period = normalizarPeriodo(evaluation.mes, evaluation.fechaEvaluacion, evaluation.periodo);
    return [period.key, { key: period.key, label: period.label, value: null, n: 0 }];
  })).values()].sort((a, b) => a.key.localeCompare(b.key));
  const ids = filtered.map((evaluation) => evaluation.id);
  const indicators = availableIndicators(ids);
  const selected = filters.indicador === null ? indicators : indicators.filter((indicator) => filters.indicador?.includes(indicator.id));
  const byPeriod = new Map<string, Evaluation[]>();
  filtered.forEach((evaluation) => {
    const key = normalizarPeriodo(evaluation.mes, evaluation.fechaEvaluacion, evaluation.periodo).key;
    byPeriod.set(key, [...(byPeriod.get(key) ?? []), evaluation]);
  });

  const entities = filters.indicador !== null && filters.indicador.length > 0
    ? [...new Set(filtered.map((evaluation) => evaluation.concesionaria))]
    : selected;
  const series = entities.map((entity, index) => {
    const id = typeof entity === "string" ? entity : entity.id;
    const label = typeof entity === "string" ? entity : entity.nombre;
    // Con todos los indicadores, cada línea representa un único indicador.
    // Con un indicador seleccionado, cada línea representa una concesionaria.
    const seriesIndicatorIds = typeof entity === "string" ? new Set(selected.map((indicator) => indicator.id)) : new Set([entity.id]);
    const points = periods.map((period) => {
      const scoped = (byPeriod.get(period.key) ?? []).filter((evaluation) => typeof entity === "string" ? evaluation.concesionaria === entity : true);
      const values = scoped.flatMap((evaluation) => [...seriesIndicatorIds].map((indicatorId) => indicatorScore([evaluation.id], indicatorId)).filter((value): value is number => value !== null));
      return { ...period, value: average(values), n: scoped.length };
    });
    return { id, label, color: COLORS[index % COLORS.length] ?? "#0284C7", points };
  });
  return { periods, series };
}
