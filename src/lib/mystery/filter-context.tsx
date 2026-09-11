import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { EMPTY_FILTERS, type GlobalFilters } from "./calculations";
import { dataset } from "./dataset";
import {
  applyImportedPayload,
  hydrateImportedDataFromStorage,
  importExcelFile,
  loadPersistedImportedPayload,
  resetImportedData,
} from "@/lib/excel-import";
import { coerceSingleTipoEvaluacion, includesTipoEvaluacion } from "@/lib/tipo-evaluacion";

const didHydrateAtStartup = hydrateImportedDataFromStorage();

interface FilterContextValue {
  filters: GlobalFilters;
  setFilter: (key: keyof GlobalFilters, value: string[] | null) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  activeLabel: string;
  options: {
    periodos: string[];
    concesionarias: string[];
    marcas: string[];
    ubicaciones: string[];
    tiposEvaluacion: string[];
    indicadores: { value: string; label: string }[];
  };
  selectedIndicadorId: string | null;
  openIndicador: (id: string) => void;
  clearIndicador: () => void;
  selectedEvaluacionId: string | null;
  openEvaluacion: (id: string) => void;
  selectedPreguntaId: string | null;
  openPregunta: (indicadorId: string, preguntaId: string) => void;
  clearPregunta: () => void;
  importExcel: (file: File) => Promise<void>;
  importError: string | null;
  dataVersion: number;
  resetImportedData: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(EMPTY_FILTERS);
  const [selectedIndicadorId, setSelectedIndicadorId] = useState<string | null>(null);
  const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<string | null>(null);
  const [selectedPreguntaId, setSelectedPreguntaId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(didHydrateAtStartup ? 1 : 0);
  const navigate = useNavigate();

  useEffect(() => {
    if (didHydrateAtStartup) return;
    const persistedPayload = loadPersistedImportedPayload();
    if (!persistedPayload) return;
    applyImportedPayload(persistedPayload);
    setDataVersion((version) => version + 1);
  }, []);

  const setFilter = useCallback((key: keyof GlobalFilters, value: string[] | null) => {
    setFilters((prev) => {
      const next: GlobalFilters = {
        ...prev,
        [key]: key === "tipoEvaluacion" ? coerceSingleTipoEvaluacion(value, "Ventas") : value,
      };

      const matchesActive = (
        evaluation: (typeof dataset.evaluations)[number],
        criteria: Partial<GlobalFilters>,
      ) =>
        (!criteria.periodo?.length || criteria.periodo.includes(evaluation.periodo)) &&
        (!criteria.concesionaria?.length || criteria.concesionaria.includes(evaluation.concesionaria)) &&
        (!criteria.marca?.length || criteria.marca.includes(evaluation.marca)) &&
        (!criteria.ubicacion?.length || criteria.ubicacion.includes(evaluation.ubicacion)) &&
        (criteria.tipoEvaluacion === null ||
          criteria.tipoEvaluacion === undefined ||
          includesTipoEvaluacion(criteria.tipoEvaluacion, evaluation.tipoEvaluacion));

      const getActiveOptionsFor = (filterKey: keyof GlobalFilters) => {
        const criteria: Partial<GlobalFilters> = { ...next, [filterKey]: null };
        return new Set(
          dataset.evaluations
            .filter((evaluation) => matchesActive(evaluation, criteria))
            .map((evaluation) => evaluation[filterKey as keyof typeof evaluation])
            .filter((val): val is string => typeof val === "string" && val.trim().length > 0),
        );
      };

      const prune = (filterKey: "periodo" | "concesionaria" | "marca" | "ubicacion") => {
        const current = next[filterKey];
        if (current === null || current.length === 0) return;
        const allowed = getActiveOptionsFor(filterKey);
        const compatible = current.filter((item) => allowed.has(item));
        next[filterKey] = compatible;
      };

      prune("periodo");
      prune("concesionaria");
      prune("marca");
      prune("ubicacion");

      if (next.indicador !== null && next.indicador.length > 0) {
        const criteria: Partial<GlobalFilters> = { ...next, indicador: null };
        const evals = dataset.evaluations.filter((evaluation) => matchesActive(evaluation, criteria));
        const evalIds = new Set(evals.map((evaluation) => evaluation.id));
        const allowedIndicatorIds = new Set(
          dataset.indicatorResults
            .filter((result) => evalIds.has(result.idEvaluacion))
            .map((result) => result.idIndicador),
        );
        const filtered = next.indicador.filter((indicatorVal) =>
          allowedIndicatorIds.has(indicatorVal),
        );
        next.indicador = filtered;
      }

      return next;
    });
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const options = useMemo(() => {
    const matchesActive = (
      evaluation: (typeof dataset.evaluations)[number],
      criteria: Partial<GlobalFilters>,
    ) =>
      (!criteria.periodo?.length || criteria.periodo.includes(evaluation.periodo)) &&
      (!criteria.concesionaria?.length || criteria.concesionaria.includes(evaluation.concesionaria)) &&
      (!criteria.marca?.length || criteria.marca.includes(evaluation.marca)) &&
      (!criteria.ubicacion?.length || criteria.ubicacion.includes(evaluation.ubicacion)) &&
      (criteria.tipoEvaluacion === null ||
        criteria.tipoEvaluacion === undefined ||
        includesTipoEvaluacion(criteria.tipoEvaluacion, evaluation.tipoEvaluacion));

    const optionsFor = (
      key: "periodo" | "concesionaria" | "marca" | "ubicacion" | "tipoEvaluacion",
    ) => {
      const criteria: Partial<GlobalFilters> = { ...filters };
      criteria[key] = null;

      return [
        ...new Set(
          dataset.evaluations
            .filter((evaluation) => matchesActive(evaluation, criteria))
            .map((evaluation) => evaluation[key])
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0),
        ),
      ].sort((a, b) => a.localeCompare(b, "es"));
    };

    const baseCriteria: Partial<GlobalFilters> = {
      ...filters,
      indicador: null,
    };
    const baseEvaluations = dataset.evaluations.filter((evaluation) => matchesActive(evaluation, baseCriteria));
    const baseIds = new Set(baseEvaluations.map((evaluation) => evaluation.id));
    const availableIndicatorIds = new Set(
      dataset.indicatorResults
        .filter((result) => baseIds.has(result.idEvaluacion))
        .map((result) => result.idIndicador),
    );
    const indicadores = dataset.indicators
      .filter((indicator) => availableIndicatorIds.has(indicator.id))
      .sort((a, b) => a.orden - b.orden)
      .map((indicator) => ({
        value: indicator.id,
        label: indicator.nombre,
      }));

    return {
      periodos: optionsFor("periodo"),
      concesionarias: optionsFor("concesionaria"),
      marcas: optionsFor("marca"),
      ubicaciones: optionsFor("ubicacion"),
      tiposEvaluacion: optionsFor("tipoEvaluacion"),
      indicadores,
    };
  }, [
    dataVersion,
    filters.periodo,
    filters.concesionaria,
    filters.marca,
    filters.ubicacion,
    filters.tipoEvaluacion,
  ]);

  const hasFilters =
    filters.periodo !== null ||
    filters.concesionaria !== null ||
    filters.marca !== null ||
    filters.ubicacion !== null ||
    filters.indicador !== null ||
    ((filters.tipoEvaluacion?.[0] ?? "Ventas") !== "Ventas");

  const activeLabel = hasFilters
    ? [
        ...(filters.periodo !== null
          ? [filters.periodo.length ? filters.periodo.join(", ") : "Ningún período"]
          : []),
        ...(filters.concesionaria !== null
          ? [filters.concesionaria.length ? filters.concesionaria.join(", ") : "Ninguna concesionaria"]
          : []),
        ...(filters.marca !== null
          ? [filters.marca.length ? filters.marca.join(", ") : "Ninguna marca"]
          : []),
        ...(filters.ubicacion !== null
          ? [filters.ubicacion.length ? filters.ubicacion.join(", ") : "Ninguna ubicación"]
          : []),
        ...(filters.indicador !== null
          ? [filters.indicador.length ? filters.indicador.join(", ") : "Ningún indicador"]
          : []),
        ...((filters.tipoEvaluacion?.[0] ?? "Ventas") !== "Ventas"
          ? [filters.tipoEvaluacion?.join(", ") ?? ""]
          : []),
      ]
        .filter(Boolean)
        .join(" · ")
    : "Todas las evaluaciones";

  const openIndicador = useCallback(
    (id: string) => {
      setSelectedIndicadorId(id);
      void navigate({ to: "/maquinarias/indicadores" });
    },
    [navigate],
  );

  const clearIndicador = useCallback(() => setSelectedIndicadorId(null), []);

  const openEvaluacion = useCallback(
    (id: string) => {
      setSelectedEvaluacionId(id);
      void navigate({ to: "/maquinarias" });
    },
    [navigate],
  );

  const openPregunta = useCallback(
    (indicadorId: string, preguntaId: string) => {
      setSelectedIndicadorId(indicadorId);
      setSelectedPreguntaId(preguntaId);
      void navigate({ to: "/maquinarias/indicadores" });
    },
    [navigate],
  );

  const clearPregunta = useCallback(() => setSelectedPreguntaId(null), []);

  const importExcel = useCallback(async (file: File) => {
    try {
      setImportError(null);
      await importExcelFile(file);
      setDataVersion((version) => version + 1);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "No se pudo importar el Excel.");
    }
  }, []);

  const restoreDataset = useCallback(() => {
    resetImportedData();
    setImportError(null);
    setDataVersion((version) => version + 1);
  }, []);

  const value: FilterContextValue = {
    filters,
    setFilter,
    clearFilters,
    hasFilters,
    activeLabel,
    options,
    selectedIndicadorId,
    openIndicador,
    clearIndicador,
    selectedEvaluacionId,
    openEvaluacion,
    selectedPreguntaId,
    openPregunta,
    clearPregunta,
    importExcel,
    importError,
    dataVersion,
    resetImportedData: restoreDataset,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters debe usarse dentro de FilterProvider");
  return ctx;
}
