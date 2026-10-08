# 📈 Plan de Implementación: Gráfico Dinámico de Tendencias Históricas

> **Módulo:** Panel Ejecutivo — Mystery Shopping (`/maquinarias`)  
> **Objetivo:** Visualización interactiva y reactiva de la evolución temporal multicanal (> 3 meses) integrada con 5 filtros globales, línea de benchmark al 80% y deduplicación segura de datos.  
> **Disposición en UI:** Reemplazo en el layout de la sección *Fortalezas y Oportunidades* (`StrengthsOpportunities`), manteniéndola comentada/oculta sin borrarla del código fuente.

---

## 📌 1. Resumen Ejecutivo y Diagnóstico Técnico

### 🎯 La Necesidad de Negocio
Maquinarias necesita comparar su desempeño y el de la competencia a lo largo del tiempo. Tras culminar **Agosto (42 evaluaciones)** e ingresar el nuevo periodo de **Septiembre (41 evaluaciones)**, el Panel Ejecutivo debe permitir evaluar si la calidad de atención está mejorando o decayendo, identificar brechas críticas por pilar y auditar el avance mensual manteniendo el aislamiento por canal.

### 🔍 Diagnóstico del Repositorio y Base de Datos (`factor-iq`)
1. **Pérdida de fechas en evaluaciones históricas:** En la base original (Agosto), las 42 evaluaciones tienen `fecha_visita = NULL`. Por ello, agrupar únicamente por `fecha_evaluacion` dejaría fuera a Agosto.
2. **Incorporación del campo `mes`:** El nuevo consolidado Excel (`Base_Mystery_Shopping_Consolidada.xlsx`) incorpora `mes` (`SETIEMBRE`), `numero_mes` (`9`) y `anio`. Este campo se convertirá en la columna clave para agrupar periodos en MySQL y en el frontend.
3. **Stack Tecnológico Real:** El proyecto opera con **TanStack Start (React 19) + MySQL (mysql2) + Tailwind CSS + Recharts**. Toda la agregación de series se ejecuta en TypeScript en milisegundos en el cliente, aprovechando el estado reactivo de `FilterContext`.
4. **Disposición Visual:** El gráfico ocupará el espacio donde actualmente reside `<StrengthsOpportunities />` en `src/routes/maquinarias/index.tsx` (columna izquierda de 2 columnas `lg:col-span-2`, justo debajo del Mapa de Calor).

---

## 🗄️ 2. Modelo de Datos y Ajustes en MySQL

### 2.1. Alteración de Tabla `evaluaciones`
Para evitar inconsistencias y soportar evaluaciones sin fecha exacta de visita, se agrega la columna `mes` a `evaluaciones` y se asigna el valor histórico a los registros existentes:

```sql
-- 1. Agregar columna mes después de fecha_evaluacion
ALTER TABLE evaluaciones 
  ADD COLUMN mes VARCHAR(30) NULL AFTER fecha_evaluacion;

-- 2. Regularizar los 42 registros existentes de Agosto en el proyecto Maquinarias
UPDATE evaluaciones 
   SET mes = 'AGOSTO' 
 WHERE (mes IS NULL OR mes = '') 
   AND proyecto_id = 1;

-- 3. Crear índice para acelerar agrupaciones temporales por canal
ALTER TABLE evaluaciones 
  ADD INDEX ix_eval_mes_tipo (mes, tipo_evaluacion);
```

### 2.2. Normalización Temporal Cronológica (TypeScript)
Para evitar el orden alfabético defectuoso (*ej: Diciembre antes de Septiembre*), el motor de frontend traduce los nombres de mes a claves cronológicas (`YYYY-MM`):

```typescript
// src/lib/mystery/format.ts
export const MES_A_NUMERO: Record<string, number> = {
  ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6,
  JULIO: 7, AGOSTO: 8, SETIEMBRE: 9, SEPTIEMBRE: 9, OCTUBRE: 10,
  NOVIEMBRE: 11, DICIEMBRE: 12
};

export function normalizarPeriodo(mesRaw?: string | null, fecha?: string | null): { key: string; label: string; timestamp: number } {
  if (fecha) {
    const d = new Date(fecha);
    const m = d.getUTCMonth() + 1;
    const y = d.getUTCFullYear();
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' });
    return { key, label, timestamp: d.getTime() };
  }
  const mesClean = (mesRaw ?? 'AGOSTO').trim().toUpperCase();
  const numMes = MES_A_NUMERO[mesClean] ?? 8;
  const anio = 2026;
  const key = `${anio}-${String(numMes).padStart(2, '0')}`;
  const fechaObj = new Date(anio, numMes - 1, 1);
  const label = fechaObj.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' });
  return { key, label, timestamp: fechaObj.getTime() };
}
```

---

## 🎛️ 3. Reglas de Filtrado y Catálogo Real de Indicadores por Canal

El gráfico responde de manera reactiva al estado global de `useFilters()`:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [ TIPO: Ventas ▾ ] [ CONCESIONARIA: Todas ▾ ] [ MARCA: Todas ▾ ] [ UBICACIÓN: Todas ▾ ] [ INDICADOR: Todas ▾ ]│
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1. Regla Maestra: Aislamiento Estricto por Canal (`TIPO`)
Cada canal cuenta con su propia matriz de indicadores, ponderaciones y preguntas según el consolidado de datos. Al alternar el selector `TIPO`, el gráfico recalcula sus series desde cero para evitar mezclas métricas entre áreas operativas distintas:

#### 📞 A. Call Center (7 Indicadores — 100% Total)
1. **Acceso al canal** (Peso: 10%)
2. **Calidad de Atención** (Peso: 15%)
3. **Gestión de la Consulta** (Peso: 15%)
4. **Conversión Comercial** (Peso: 15%)
5. **Experiencia Digital** (Peso: 15%)
6. **Experiencia** (Peso: 15%)
7. **Seguimiento** (Peso: 15%)

#### 🔧 B. Posventa (10 Indicadores — 100% Total)
1. **Instalaciones y Ambiente General** (Peso: 5%)
2. **Protocolo de atención** (Peso: 10%)
3. **Recepción** (Peso: 10%)
4. **Confianza y Asesoría Técnica** (Peso: 10%)
5. **Oferta de servicio y Valor agregado** (Peso: 10%)
6. **Cierre Comercial** (Peso: 10%)
7. **Valor marca** (Peso: 10%)
8. **Entrega** (Peso: 10%)
9. **Experiencia** (Peso: 15%)
10. **Seguimiento** (Peso: 10%)

#### 🚗 C. Seminuevos (12 Indicadores — 100% Total)
1. **Instalaciones y Ambiente General** (Peso: 5%)
2. **Protocolo de atención** (Peso: 10%)
3. **Identificación de necesidades** (Peso: 10%)
4. **Presentación del producto** (Peso: 10%)
5. **Propuesta de valor y diferenciación** (Peso: 5%)
6. **Generación de confianza** (Peso: 10%)
7. **Estrategia comercial** (Peso: 10%)
8. **Cierre Comercial** (Peso: 10%)
9. **Omisiones al Discurso Comercial** (Peso: 5%)
10. **Valor marca Maquinarias** (Peso: 10%)
11. **Experiencia** (Peso: 10%)
12. **Seguimiento** (Peso: 5%)

#### 🏢 D. Ventas (12 Indicadores — 100% Total)
1. **Instalaciones y Ambiente General** (Peso: 5%)
2. **Protocolo de atención** (Peso: 10%)
3. **Identificación de necesidades** (Peso: 10%)
4. **Presentación del producto** (Peso: 10%)
5. **Propuesta de valor y diferenciación** (Peso: 5%)
6. **Generación de confianza** (Peso: 10%)
7. **Estrategia comercial** (Peso: 10%)
8. **Cierre Comercial** (Peso: 10%)
9. **Omisiones al Discurso Comercial** (Peso: 5%)
10. **Valor marca Maquinarias** (Peso: 10%)
11. **Experiencia** (Peso: 10%)
12. **Seguimiento** (Peso: 5%)

---

### 3.2. Matriz de Reconfiguración de Leyenda y Series

| Filtro `INDICADOR` | Filtro `CONCESIONARIA / MARCA` | Eje X | Líneas en el Gráfico (Series) |
| :--- | :--- | :--- | :--- |
| **"Todas"** | **"Todas"** | Meses (`Ago`, `Set`, ...) | **Pilares del Checklist** del canal activo (7 en Call Center, 10 en Posventa, 12 en Seminuevos/Ventas). |
| **"Todas"** | Específica *(ej: Ford)* | Meses (`Ago`, `Set`, ...) | **Pilares del Checklist** exclusivos de esa marca o concesionaria. |
| Pilar Específico *(ej: Cierre)* | **"Todas"** | Meses (`Ago`, `Set`, ...) | **Marcas o Concesionarias** compitiendo en ese pilar (`Maquinarias` resaltada en azul). |
| Pilar Específico *(ej: Cierre)* | Específica *(ej: Maquinarias)* | Meses (`Ago`, `Set`, ...) | **Sedes / Locales** compitiendo en ese pilar. |

---

## 🎨 4. Diseño UI y Reemplazo en el Panel Ejecutivo

### 4.1. Ubicación en `src/routes/maquinarias/index.tsx`
El nuevo componente `<HistoricalTrendsChart />` se coloca en el grid principal de dos columnas, exactamente en el lugar que ocupaba `<StrengthsOpportunities />`. La sección de fortalezas y oportunidades queda preservada en el código fuente (comentada) para poder reactivarla o reubicarla cuando se desee:

```tsx
// src/routes/maquinarias/index.tsx (Líneas ~215-225)
<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <div className="space-y-6 lg:col-span-2">
    {/* 1. Mapa de Calor por Local */}
    <Heatmap
      rows={heatmapRows}
      indicadores={catalogoHeatmap}
      selected={selectedHeatmapRowId}
      onSelect={(rowId, indicator) => {
        const representativeId = representativeByHeatmapRow.get(rowId) ?? rowId;
        setSelectedId(representativeId);
        setSelectedHeatmapIndicator(
          indicator ? { n: indicator.n, nombre: indicator.nombre } : null,
        );
      }}
      delay={180}
    />

    {/* 2. NUEVO: Gráfico Dinámico de Tendencias Históricas */}
    <HistoricalTrendsChart
      evs={evs}
      indicadores={indicadores}
      activeFilters={filters}
      benchmarkScore={0.80}
      delay={240}
    />

    {/* Fortalezas y Oportunidades: Oculto temporalmente (preservado sin borrar) */}
    {/* <StrengthsOpportunities rows={indicadorRows} delay={240} /> */}
  </div>

  <div className="lg:col-span-1">
    {/* 3. Panel de Detalle del Evaluador */}
    <EvaluatorPanel
      evs={evs}
      selected={selected}
      filtrosIndicador={filters.indicador}
      selectedIndicator={selectedHeatmapIndicator}
      delay={160}
    />
  </div>
</div>
```

### 4.2. Especificaciones de Visualización (Recharts)
* **Librería:** `recharts` (usando `ResponsiveContainer`, `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ReferenceLine`).
* **Eje Y:** Escala fija de `0%` a `100%`, con marcas claras en `20%`, `40%`, `60%`, `80%`, `100%`.
* **Línea de Benchmark:** `<ReferenceLine y={80} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Meta 80%', fill: '#EF4444', position: 'right' }} />`.
* **Paleta de Colores Institucional:**
  * Maquinarias: `#0284C7` (Sky-600 / Azul corporativo destacado con trazo más grueso).
  * Pilares del Checklist: Paleta multicromática balanceada (Azul, Esmeralda, Ámbar, Violeta, Fucsia, Cian).
  * Competencia: `#94A3B8` (Slate-400 neutro cuando compiten marcas).
* **Tooltip Enriquecido:** Muestra mes, nombre de la serie, valor porcentual y cantidad de evaluaciones (`n = ...`).

---

## 🔒 5. Flujo de Carga e Importación Segura (`/admin/importar`)

Para garantizar que la subida del nuevo archivo no sobreescriba datos existentes:

1. **Lectura en memoria:** Al arrastrar `Base_Mystery_Shopping_Consolidada.xlsx`, el navegador procesa las 41 evaluaciones.
2. **Detección de periodo y canal:**
   - Detecta `mes = 'SETIEMBRE'`, `numero_mes = 9`.
   - Clasifica los canales: 22 Ventas, 10 Call Center, 6 Seminuevos, 3 Postventa.
   - Lee asesores y fechas individuales.
3. **Control de duplicidad:**
   - Compara contra los códigos ya existentes en MySQL (`EV_CAL_09_...`, `EV_VEN_...`).
   - Muestra badge: **"41 Evaluaciones Nuevas (Septiembre 2026) — 0 Existentes"**.
4. **Guardado Atómico Transaccional:**
   - Al presionar **"Guardar en Base de Datos"**, ejecuta una sola transacción en MySQL insertando `evaluaciones` (con `mes = 'SETIEMBRE'`), `evaluacion_indicadores` y `evaluacion_preguntas`.
   - No trunca tablas ni borra las 42 evaluaciones de Agosto.
5. **Resultado Inmediato:** El dashboard `/maquinarias` ahora dispone de 83 evaluaciones consolidadas (42 de Agosto + 41 de Septiembre) y dibuja la tendencia histórica de 2 puntos en el tiempo.

---

## 📅 6. Cronograma de Construcción

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     FASE 1      │ ──► │     FASE 2      │ ──► │     FASE 3      │ ──► │     FASE 4      │
│  Base de Datos  │     │ Motor de Series │     │ Componente UI   │     │ QA y Pruebas    │
│  y Migración    │     │  en TypeScript  │     │  en Dashboard   │     │  Multicanal     │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

* **Fase 1: Base de Datos & Backend (Día 1)**
  - Ejecutar script SQL en phpMyAdmin (`ALTER TABLE evaluaciones ADD COLUMN mes ...` y regularización de Agosto).
  - Actualizar `src/lib/mystery/server-data.ts` para proyectar `e.mes` en el payload de TanStack Start.
  - Actualizar interfaces `Evaluacion` y `Evaluation` en `src/lib/mystery/types.ts` y `src/lib/analytics.ts`.

* **Fase 2: Motor de Agregación Temporal (Día 2)**
  - Crear `src/lib/mystery/trends.ts` con funciones puras para calcular promedios por mes según la matriz de filtros y los indicadores de cada canal.
  - Soportar el conmutador de leyenda (Pilares vs. Entidades).

* **Fase 3: Componente Visual `HistoricalTrendsChart` (Día 3)**
  - Crear el componente con Recharts en `src/components/dash/HistoricalTrendsChart.tsx`.
  - Integrarlo en `src/routes/maquinarias/index.tsx` reemplazando visualmente `StrengthsOpportunities` (ocultándolo).

* **Fase 4: Conexión con Importador y Pruebas (Día 4)**
  - Adaptar `/admin/importar` para persistir `mes` al subir el Excel.
  - Validar combinaciones de filtros: `Tipo: Ventas`, `Tipo: Postventa`, `Marca: Ford`, `Indicador: Todas` vs. `Indicador: Específico`.

---

## 🎯 7. Criterios de Aceptación

- [x] **Agrupación Confiable:** Las evaluaciones de Agosto (sin fecha de visita) y Septiembre (con fecha) se visualizan cronológicamente en sus respectivos meses.
- [x] **Aislamiento Multicanal Estricto:** Call Center muestra 7 indicadores, Posventa 10, Seminuevos 12 y Ventas 12, con sus respectivos pesos al 100%.
- [x] **Reemplazo Limpio en UI:** El componente ocupa la posición de `StrengthsOpportunities` sin romper el grid de 3 columnas (`lg:col-span-2` + `lg:col-span-1`).
- [x] **Cero Sobreescritura:** La importación de Septiembre no borra ni modifica las 42 evaluaciones de Agosto en MySQL.
