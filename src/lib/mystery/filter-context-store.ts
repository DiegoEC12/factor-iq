import { createContext, useContext } from "react";
import type { GlobalFilters } from "./calculations";

export interface FilterContextValue {
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
  openIndicador: (
    id: string,
    context?: Partial<
      Pick<GlobalFilters, "periodo" | "concesionaria" | "marca" | "ubicacion" | "tipoEvaluacion">
    >,
  ) => void;
  clearIndicador: () => void;
  selectedEvaluacionId: string | null;
  openEvaluacion: (id: string) => void;
  selectedPreguntaId: string | null;
  openPregunta: (indicadorId: string, preguntaId: string) => void;
  clearPregunta: () => void;
  dataVersion: number;
}

export const FilterContext = createContext<FilterContextValue | null>(null);

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters debe usarse dentro de FilterProvider");
  return context;
}
