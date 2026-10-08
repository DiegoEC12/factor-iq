import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { dataset } from "@/lib/mystery/dataset";
import { buildTrendSeries } from "@/lib/mystery/trends";
import type { GlobalFilters } from "@/lib/mystery/calculations";
import { fmtPct } from "@/lib/mystery/format";

export function HistoricalTrendsChart({ filters }: { filters: GlobalFilters }) {
  const [hovered, setHovered] = useState<{ period: string; label: string; value: number } | null>(null);
  const trend = useMemo(() => buildTrendSeries(dataset.evaluations, filters), [filters]);
  const data = trend.periods.map((period) => Object.fromEntries([
    ["period", period.label],
    ...trend.series.map((series) => [series.id, series.points.find((point) => point.key === period.key)?.value === null ? undefined : (series.points.find((point) => point.key === period.key)?.value ?? 0) * 100]),
  ]));

  return (
    <section className="panel rise-in overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold tracking-tight">Tendencias históricas</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Evolución mensual por canal e indicador seleccionado.</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">Meta 80%</span>
      </div>
      {!trend.series.length || !trend.periods.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No hay datos históricos con los filtros actuales.</p>
      ) : (
        <div className="relative h-80 w-full">
          <div className={`pointer-events-none absolute left-1/2 top-1 z-10 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}>
            {hovered && (
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-semibold">{hovered.period}</span>
                <span>{hovered.label}</span>
                <span className="font-bold">{fmtPct(hovered.value / 100)}</span>
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "Meta 80%", fill: "#EF4444", fontSize: 11, position: "right" }} />
              {trend.series.map((series) => (
                <Line
                  key={series.id}
                  type="monotone"
                  dataKey={series.id}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={series.label === "Maquinarias" ? 3 : 2}
                  connectNulls
                  dot={(props) => {
                    const { cx, cy, value, payload } = props as { cx?: number; cy?: number; value?: number; payload?: { period?: string } };
                    if (cx === undefined || cy === undefined || typeof value !== "number") return <circle cx={0} cy={0} r={0} />;
                    return <circle cx={cx} cy={cy} r={4} fill={series.color} stroke="white" strokeWidth={1.5} onMouseEnter={() => setHovered({ period: payload?.period ?? "", label: series.label, value })} onMouseLeave={() => setHovered(null)} />;
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
