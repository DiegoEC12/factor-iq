# Factor IQ — Plataforma de Insights

Factor IQ reúne el portal ejecutivo de Mystery Shopping de Maquinarias y un panel central para administrar la plataforma multi-cliente.

## Funcionalidades

- Resumen Ejecutivo con KPIs, benchmark, ranking, mapa de calor y preguntas críticas.
- Módulo Indicadores con los 12 indicadores, porcentajes, barras de progreso, locales, fortalezas y oportunidades.
- Módulo Benchmark para comparar Maquinarias contra la competencia.
- Módulo Concesionarias con ranking, mapa por indicador y detalle por local.
- Filtros globales con selección múltiple mediante checkboxes:
  - Concesionaria
  - Marca
  - Ubicación
  - Indicador
  - Tipo de evaluación: Venta, Callcenter, Seminuevos y Posventa
- Estado inicial de filtros en `Todas`, mostrando el universo completo.
- Deduplicación de locales por la combinación `concesionaria + marca + ubicación`.
- Importación de archivos `.xlsx` y `.xls` desde la interfaz.
- Restauración del dataset original después de una importación.
- Panel SuperAdmin protegido en `/admin`, con una interfaz alineada al sistema visual claro del portal Maquinarias y los acentos institucionales azul marino y coral de Factor IQ.
- Gestión de clientes, usuarios y accesos, bitácora de auditoría y estado de la base de datos.

## Panel de administración

La ruta `/admin` es exclusiva para cuentas con rol `superadmin`. Organiza la operación en cuatro frentes:

- **Clientes:** empresas, portales, plan y estado de cuenta.
- **Usuarios y accesos:** cuentas, roles, credenciales, último acceso y bloqueo/activación.
- **Bitácora:** trazabilidad de inicios de sesión y cambios administrativos.
- **Salud del sistema:** conectividad MySQL, conteo de registros y archivos de esquema/seed.

La siguiente evolución sugerida, antes de añadir nuevos módulos, es incorporar filtros por fecha y cliente en la bitácora, métricas temporales de uso (usuarios activos, inicios de sesión y evaluaciones) y alertas configurables para fallas de conexión o cuentas suspendidas. Así se mantiene el panel centrado en operación y no solo en mantenimiento técnico.

## Operación central: proyectos y soporte

El panel incorpora los módulos **Proyectos e importación** y **Soporte y tickets**. El primero registra estudios por empresa y valida archivos Excel mediante las hojas y encabezados requeridos; la carga validada se mantiene actualmente en la sesión del navegador. El segundo permite crear tickets y cambiar su estado entre `abierto`, `en_analisis` y `resuelto`.

Para una instalación MySQL que ya existe, ejecutar una sola vez [database/migrations/002_admin_operaciones.sql](database/migrations/002_admin_operaciones.sql). La migración es incremental: amplía los roles y añade tickets, comentarios y la base de contenidos web sin eliminar información existente. Las instalaciones nuevas ya reciben esas tablas desde [database/schema.sql](database/schema.sql).

El esquema de CMS está incluido en la base de datos, pero aún no se enlaza a los bloques públicos: antes de publicar ediciones desde el panel debe definirse el flujo editorial y qué secciones de la landing quedan administrables.

## Datos

El dataset base está en [src/data/mystery-shopping-imported.json](src/data/mystery-shopping-imported.json). El Excel de origen actual es `Base_Mystery_Shopping_Consolidada (8).xlsx` y contiene:

- 42 evaluaciones.
- 434 filas de indicadores.
- 2494 preguntas.
- 9756 opciones de respuesta.
- 12 indicadores únicos.

El snapshot normalizado se genera en [src/data/mystery-shopping-imported.json](src/data/mystery-shopping-imported.json). Para regenerarlo después de reemplazar el Excel:

```bash
npm run data:excel
```

El script [scripts/generate-imported-json.cjs](scripts/generate-imported-json.cjs) transforma las hojas `Evaluaciones`, `Indicadores` y `Preguntas` al formato lógico consumido por la aplicación. La hoja `Opciones` se conserva en el Excel para futuras necesidades de auditoría y detalle.

## Importación desde la aplicación

En el Resumen Ejecutivo se puede seleccionar **Importar Excel**. La aplicación valida las hojas requeridas y reemplaza los datos activos en memoria. Si el archivo no cumple la estructura mínima, conserva los datos actuales y muestra el error.

El botón **Restaurar datos** elimina los datos importados de la sesión y vuelve al dataset original. Esta restauración no modifica los archivos del proyecto.

La lógica está aislada en [src/lib/excel-import.ts](src/lib/excel-import.ts), para que en el futuro el mismo modelo pueda alimentarse desde una API o base de datos sin cambiar la UI.

## Desarrollo local

Requisitos: Node.js y npm.

```bash
npm install
npm run dev
```

El servidor de desarrollo queda disponible en la URL que indique Vite, normalmente `http://localhost:5173`.

## Validación

```bash
npx tsc --noEmit
npx prettier --check .
npm run build
```

## Tecnologías

- React 19 y TypeScript
- TanStack Start y TanStack Router
- Vite
- Tailwind CSS 4
- Radix UI
- Recharts
- `xlsx` para lectura de Excel
