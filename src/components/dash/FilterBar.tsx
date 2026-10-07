import { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiFilterSelect } from "./MultiFilterSelect";
import { useFilters } from "@/lib/mystery/filter-context";
import { title, type Filters } from "@/lib/analytics";

type Props = {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  activeCount: number;
};

function FilterSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string[] | null;
  options: { value: string; label: string }[];
  onValueChange: (value: string[] | null) => void;
}) {
  return (
    <MultiFilterSelect label={label} values={value} options={options} onChange={onValueChange} />
  );
}

import { CANONICAL_TIPOS_EVALUACION, normalizeTipoEvaluacion } from "@/lib/tipo-evaluacion";

export function FilterBar({ filters, onChange, onReset, activeCount }: Props) {
  const { options } = useFilters();

  const tipoEvaluacionOptions = useMemo(() => {
    const dynamicTipos = new Set(
      (options.tiposEvaluacion.length > 0
        ? options.tiposEvaluacion
        : CANONICAL_TIPOS_EVALUACION
      ).map((item) => normalizeTipoEvaluacion(item)),
    );

    return CANONICAL_TIPOS_EVALUACION
      .filter((tipo) => dynamicTipos.size === 0 || dynamicTipos.has(tipo))
      .map((type) => ({ value: type, label: type }));
  }, [options.tiposEvaluacion]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-350 flex-col gap-3 px-4 py-3 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 border-l border-border pl-3 sm:block">
              <p className="truncate text-2xl font-display font-semibold tracking-tight">
                Panel Ejecutivo
              </p>
              <p className="truncate text-sm text-muted-foreground">Mystery Shopping</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={activeCount === 0}
              className="shrink-0 gap-2 rounded-full text-muted-foreground hover:text-primary"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Limpiar filtros</span>
              {activeCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <FilterSelect
            label="Concesionaria"
            value={filters.concesionaria}
            onValueChange={(v) => onChange({ concesionaria: v })}
            options={options.concesionarias.map((c) => ({ value: c, label: title(c) }))}
          />
          <FilterSelect
            label="Marca"
            value={filters.marca}
            onValueChange={(v) => onChange({ marca: v })}
            options={options.marcas.map((m) => ({ value: m, label: title(m) }))}
          />
          <FilterSelect
            label="Ubicación"
            value={filters.ubicacion}
            onValueChange={(v) => onChange({ ubicacion: v })}
            options={options.ubicaciones.map((u) => ({ value: u, label: title(u) }))}
          />
          <FilterSelect
            label="Indicador"
            value={filters.indicador}
            onValueChange={(v) => onChange({ indicador: v })}
            options={options.indicadores}
          />
          <MultiFilterSelect
            label="Tipo de evaluación"
            shortLabel="Tipo"
            values={filters.tipoEvaluacion}
            options={tipoEvaluacionOptions}
            singleSelect={true}
            showAllOption={false}
            onChange={(values) => onChange({ tipoEvaluacion: values })}
          />
        </div>
      </div>
    </header>
  );
}
