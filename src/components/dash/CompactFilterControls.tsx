import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useFilters } from "@/lib/mystery/filter-context";
import { MultiFilterSelect } from "./MultiFilterSelect";

import { CANONICAL_TIPOS_EVALUACION, normalizeTipoEvaluacion } from "@/lib/tipo-evaluacion";

export function CompactFilterControls({ showIndicator = true }: { showIndicator?: boolean }) {
  const {
    filters,
    setFilter,
    clearFilters,
    hasFilters,
    activeLabel,
    options,
    openIndicador,
    clearIndicador,
  } = useFilters();

  const activeCount = useMemo(
    () => (hasFilters ? activeLabel.split(" · ").length : 0),
    [hasFilters, activeLabel],
  );

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
    <div className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-300 items-center gap-3 px-4 py-3 lg:px-8">
        <div className={`grid w-full grid-cols-2 gap-2 ${showIndicator ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
          <MultiFilterSelect
            label="Concesionaria"
            values={filters.concesionaria}
            options={options.concesionarias.map((c) => ({ value: c, label: c }))}
            onChange={(values) => setFilter("concesionaria", values)}
          />
          <MultiFilterSelect
            label="Marca"
            values={filters.marca}
            options={options.marcas.map((m) => ({ value: m, label: m }))}
            onChange={(values) => setFilter("marca", values)}
          />
          <MultiFilterSelect
            label="Ubicación"
            values={filters.ubicacion}
            options={options.ubicaciones.map((u) => ({ value: u, label: u }))}
            onChange={(values) => setFilter("ubicacion", values)}
          />
          {showIndicator && <MultiFilterSelect
            label="Indicador"
            values={filters.indicador}
            options={options.indicadores}
            onChange={(values) => setFilter("indicador", values)}
          />}
          <MultiFilterSelect
            label="Tipo de evaluación"
            shortLabel="Tipo"
            values={filters.tipoEvaluacion}
            options={tipoEvaluacionOptions}
            singleSelect={true}
            showAllOption={false}
            onChange={(values) => setFilter("tipoEvaluacion", values)}
          />
        </div>

        <div className="ml-4 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearFilters();
              clearIndicador();
            }}
            disabled={!hasFilters}
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
    </div>
  );
}

export default CompactFilterControls;
