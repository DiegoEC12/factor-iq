# AVANCES — Integración Benchmark y Concesionarias

## Unificación de la web pública y acceso al dashboard

- [x] Se corrigió el reset del seed de MySQL para evitar `TRUNCATE` sobre tablas con claves foráneas; ahora la limpieza se hace en orden de dependencias con `DELETE` y reinicio de `AUTO_INCREMENT`.
- [x] Se consolidó la web corporativa y el dashboard de Maquinarias en la misma aplicación React, TypeScript y TanStack Start.
- [x] La ruta principal `/` muestra la web pública de Factor IQ; `/index.html` se mantiene como acceso compatible y redirige al inicio.
- [x] Se migraron las páginas públicas a rutas de la aplicación: Inicio, Nosotros, Servicios y Contacto.
- [x] Se conservaron las URLs públicas históricas bajo `/pages/*.html`, incluyendo `/pages/servicio_nube.html`, para evitar enlaces rotos durante el despliegue.
- [x] `/pages/servicio_nube.html` muestra el inicio de sesión; `/login` ofrece el mismo acceso mediante una URL moderna.
- [x] Se implementó una autenticación temporal del lado servidor con sesión mediante cookie `HttpOnly`, `SameSite=Lax` y expiración de ocho horas.
- [x] Se agregó `.env.example`; producción exige un `SESSION_SECRET` de al menos 32 caracteres y `.env` queda excluido del control de versiones.
- [x] Se usaron, solo mientras se conecta la base de datos, las credenciales de prueba heredadas: usuario `admMaqui` y contraseña `adm123`.
- [x] Al autenticarse correctamente, el usuario de Maquinarias es dirigido a `/maquinarias`.
- [x] Las rutas del dashboard (`/maquinarias`, Benchmark, Concesionarias e Indicadores) requieren una sesión válida y del cliente Maquinarias; sin ella redirigen al acceso de plataforma.
- [x] Los accesos antiguos `/benchmark`, `/concesionarias` e `/indicadores` redirigen a sus equivalentes protegidos dentro de `/maquinarias`.
- [x] El cierre de sesión elimina la sesión y devuelve al usuario a `/pages/servicio_nube.html`.
- [x] Validaciones realizadas: comprobación de TypeScript sin emisión y build de producción completados sin errores.
- [x] Corregida la separación cliente/servidor de autenticación: las funciones RPC se encuentran en `src/lib/auth.ts`, evitando el bloqueo de Vite al importar desde `src/server/` en rutas del navegador.
- [x] Revisión visual local realizada: portada pública y pantalla de acceso alineadas; inicio de sesión probado de extremo a extremo hasta el dashboard de Maquinarias.
- [x] Identidad visual separada: `icon-logo.png` se conserva para el módulo Maquinarias y su favicon; `Isotipo IQ.png` se muestra en el encabezado, pie y acceso de la web pública de Factor IQ.
- [x] El favicon cambia según el módulo activo: Factor IQ para la parte pública y el icono de Maquinarias dentro de `/maquinarias`.
- [x] Ajustada la vista de acceso: cabecera de altura estable, formulario de columna clara desde tablet y diseño de dos columnas solo en pantallas amplias para evitar cortes en laptop y tablet.
- [x] Logotipo público ajustado: solo el isotipo en móvil y solo el logotipo completo de Factor IQ desde tablet en adelante, con una altura máxima de `h-14`.
- [x] Configurado el destino de compilación para Vercel (`nitro.preset = vercel`) y añadida detección explícita de TanStack Start mediante `vercel.json`; corrige la salida previa dirigida a Cloudflare Workers.
- [x] Excluida la salida generada `.vercel/` para que Vercel compile desde el código fuente y no despliegue artefactos locales versionados.
- [x] Preparado despliegue dual: Vercel conserva su preset propio y GoDaddy compila con `node-server`, generando `.output/server/index.mjs` para `npm start`. Se añadió `GODADDY_DEPLOY.md` con los pasos de cPanel.
- [x] `npm start` ahora compila antes de iniciar, compatible con el flujo de GoDaddy Node.js Hosting (`npm install` seguido por `npm start`).

Pendiente para la siguiente fase:

- [ ] Reemplazar las credenciales temporales por usuarios, contraseñas con hash y sesiones respaldadas por MySQL.
- [ ] Configurar `SESSION_SECRET` como secreto de producción y el dominio de cookie cuando se despliegue en `factor-iq.com`.
- [ ] Incorporar roles, permisos y aislamiento de datos para nuevos clientes.

Fecha: (actualizar)

Resumen

- Base: proyecto `dashboardMaquinarias` usado como base.
- Objetivo: agregar módulos "Benchmark" y "Concesionarias" y dejar documentado el proceso.

Archivos añadidos

- `src/routes/benchmark.tsx` — nueva ruta de Benchmark (gráficos y descripción comparativa).
- `src/routes/concesionarias.tsx` — nueva ruta para ranking y drill-down por concesionaria.

Componentes y librerías reutilizadas

- `src/components/mystery/*` — `page-header`, `charts`, `primitives`, `app-sidebar` (ya integrados).
- `src/lib/mystery/*` — `calculations`, `dataset`, `filter-context`, `format`, `types` (ya integrados).

Próximos pasos / recomendaciones

1. Ejecutar instalación y levantar dev server:
   - `pnpm install` o `npm install`
   - `pnpm dev` o `npm run dev` (inicia Vite)
2. Verificar rutas en `routeTree.gen.ts` y regenerar si es necesario (TanStack Router file-routes).
3. Revisar assets y alias `@/` si hay errores de import (ajustar `tsconfig.json` / Vite).
4. Realizar pruebas manuales de navegación y filtros (abrir Benchmark y Concesionarias, probar filtrado y drill).

Notas

- Las páginas nuevas usan `useFilters()` para aplicar y navegar filtros. Al hacer click en una concesionaria se aplica el filtro de concesionaria.
- Documentar cambios adicionales que surjan durante la validación (errores runtime, assets faltantes).

Si quieres, continuo con:

- regenerar `routeTree.gen.ts` y probar `vite dev`.
- ajustar imports de assets/logo si aparece algún error.

Cambios recientes:

- Reemplazados los filtros en las páginas `Benchmark` y `Concesionarias` por un componente compacto de filtros (solo selects y botón "Limpiar filtros"). El `Resumen Ejecutivo` conserva la barra completa con logo y título.
- Eliminado el ítem "Hallazgos" del sidebar y redirigida la acción de abrir una evaluación al resumen ejecutivo.
- Eliminado el ítem "Hallazgos" del sidebar y redirigida la acción de abrir una evaluación al resumen ejecutivo.
- Eliminado el conjunto de selects de filtro embebidos en `PageHeader` (ahora el header solo muestra título y descripción). Las páginas usan ahora:

  - `Resumen Ejecutivo`: `FilterBar` (barra completa con logo y título)
  - `Benchmark` y `Concesionarias`: `CompactFilterControls` (solo selects + botón limpiar)

- `Concesionarias`: portada completa desde `insight-navigator-bk` — ranking, drill-down y panel analítico portados. El mapa de calor original fue reemplazado por el mapa usado en `Resumen Ejecutivo` (component `Heatmap` en `src/components/dash/Heatmap.tsx`), y las evaluaciones se adaptaron al formato esperado. `useFilters` se usa como fuente única de filtros. TypeScript checks pasan (`npx tsc --noEmit`).
- `Indicadores`: añadido módulo que agrupa los 12 indicadores, permite seleccionar un indicador para ver su desglose por local y muestra un sidebar con las preguntas que explican la nota (promedio y muestras). Colores de estado aplicados a los indicadores y a los locales (alto/medio/crítico). TypeScript checks pasan (`npx tsc --noEmit`).
- `Indicadores`: añadido módulo que agrupa los 12 indicadores, permite seleccionar un indicador para ver su desglose por local y muestra un sidebar con las preguntas que explican la nota (promedio y muestras). Se añadió `CompactFilterControls` para exponer los filtros globales aquí. Colores de estado aplicados a los indicadores y a los locales (óptimo ≥85%, observación 70–84%, crítico <70%). TypeScript checks pasan (`npx tsc --noEmit`).

Cambios transversales:

- Umbrales globales de estado actualizados en `src/lib/mystery/calculations.ts`: `ALTO = 0.85`, `MEDIO = 0.7` para alinear colores/semáforo en todos los módulos.

Prueba realizada: servidor dev iniciado en http://localhost:8081/ — verificar que los filtros compactos aparecen en `Benchmark` y `Concesionarias` y que el `Resumen Ejecutivo` mantiene su cabecera original.

- Corrección reciente del filtro de tipo de evaluación: se eliminó la coerción que forzaba `Ventas` al cargar y la conversión a selección simple. El selector queda en modo multi-select real con estado “Todas” por defecto, y la normalización deja preservar combinaciones válidas como `Ventas + Posventa`. Verificación: `coerceSingleTipoEvaluacion(['Ventas','Posventa'])` devuelve ambos valores y `npm run build` termina correctamente.

- Ajuste visual reciente: añadido mapeo en `src/styles.css` para las clases legacy `bg-alto|bg-medio|bg-bajo` y aliases `bg-success|bg-warning|bg-danger`, más selectores catch-all para variantes con sufijos (p. ej. `bg-danger/15`). Esto asegura que los progress bars y barras de resultado muestren los colores semáforo correctamente.
- `Indicadores`: reemplazado el listado de preguntas por los 12 indicadores del dataset. Cada indicador despliega los locales disponibles y su nota con progress bar y porcentaje.
- `Indicadores`: el aside ahora resume el indicador y local seleccionados, muestra la nota del indicador y separa las preguntas con menor resultado como puntos por mejorar y las de mayor resultado como fortalezas.
- `Indicadores`: la selección de un local ya no altera los filtros globales, conservando el contexto completo de indicadores y locales.
- Validación: `npx tsc --noEmit`, `npm run build` y ESLint aislado sobre `src/routes/indicadores.tsx` pasan correctamente. `npm run lint` global todavía reporta problemas de formato y advertencias preexistentes en otros archivos del proyecto.
- `Filtros globales`: convertidos Concesionaria, Marca, Ubicación, Indicador y Tipo de evaluación a selectores con checkboxes y selección múltiple.
- `Filtros globales`: la opción “Todas” selecciona o deselecciona el conjunto completo; el estado sin filtro se conserva como “todas” y las selecciones parciales muestran su cantidad.
- `Tipo de evaluación`: agregado con las opciones Venta, Callcenter, Seminuevos y Posventa. Las evaluaciones actuales se normalizan como Venta para preparar futuras importaciones.
- `Filtros globales`: la selección de varios indicadores filtra las evaluaciones que contienen cualquiera de esos indicadores y mantiene el cálculo de métricas existente.
- Validación de esta iteración: `npx tsc --noEmit`, `npm run build` y `npx prettier --check` pasan. ESLint dirigido conserva únicamente reglas `any` y una advertencia de Fast Refresh ya presentes en módulos existentes.
- Corrección de carga inicial: `EMPTY_FILTERS` en `src/lib/analytics.ts` vuelve a iniciar cada filtro en estado `Todas`, evitando que arrays vacíos oculten todos los datos del Resumen Ejecutivo. Al cargar la página se muestran nuevamente las métricas y las casillas aparecen marcadas.

## Cierre de tareas

- [x] Mostrar todos los datos del Resumen Ejecutivo al cargar la aplicación.
- [x] Dejar los filtros globales inicialmente en estado “Todas” con todas sus casillas marcadas.
- [x] Validar la corrección con TypeScript, diagnósticos del editor y build de producción.

## Importación Excel

- [x] Agregada la dependencia `xlsx` para leer workbooks en el navegador.
- [x] Creado `src/lib/excel-import.ts` como adaptador aislado Excel -> modelo interno.
- [x] El importador acepta encabezados normalizados en español o inglés y asigna `Venta` por defecto cuando falta el tipo de evaluación.
- [x] Agregado el control `Importar Excel` en la barra existente, sin cambiar la estructura visual de los módulos.
- [x] La carga reemplaza el dataset en memoria, actualiza filtros y recalcula el Resumen Ejecutivo.
- [x] Generado `src/data/mystery-shopping-imported.json` con el mismo formato lógico del dataset actual.
- [x] Procesado `Base_Mystery_Shopping_Consolidada (8).xlsx`: 42 evaluaciones, 434 filas de indicadores y 2494 preguntas.
- [x] Agregada la acción para restaurar el dataset original y quitar los datos importados de la sesión.
- [x] Validaciones ejecutadas: `npx tsc --noEmit`, `npx prettier --check`, `npm run data:excel` y `npm run build`.
- [x] Corrección en módulo de indicadores: discriminación única de indicadores por tipo de evaluación (`Call Center` 7 indicadores vs `Ventas/Seminuevos` 12 indicadores) evitando colisión y desfase de nombres y pesos.
- [x] Agregado botón de "Cerrar sesión" en la barra de navegación lateral (`AppSidebar`) con feedback "Cerrando sesión..." y redirección a `https://factor-iq.com/pages/servicio_nube.html`.
- [ ] Revisar visualmente los datos importados en cada ruta y definir el proveedor de base de datos.

Recomendación: mantener `mystery-shopping-imported.json` como snapshot reproducible de desarrollo y encapsular después la lectura de JSON, Excel y API detrás de un único proveedor de datos. Así la UI no dependerá del formato de origen y será posible auditar cada importación.

## Favicon público de Factor IQ

- [x] Reemplazado `public/favicon.png` por el isotipo de Factor IQ provisto para el sitio.
- [x] Configurado el cliente para conservar `/favicon.png` como URL estable en las rutas públicas; esto coincide con el favicon declarado en el HTML inicial y permite que los rastreadores lo descubran sin depender de JavaScript.
- [x] Conservado `icon-logo.png` únicamente para la experiencia interna de Maquinarias.
- [x] Verificado que el archivo público mide 48×48 px, formato admitido por Google.
- [!] `npm run lint` no pudo iniciarse por una instalación global rota de npm en el equipo (`npm-cli.js` no encontrado); no corresponde a un error del proyecto.

## Migración a Base de Datos MySQL y Arquitectura Multi-Tenant

## Refinamiento UI — Panel SuperAdmin Factor IQ

- [x] Reorganizada la interfaz de `/admin` con la misma estructura visual del portal Maquinarias: barra lateral clara, encabezado fijo, tarjetas de resumen y tablas sobre superficies blancas.
- [x] Aplicada la identidad de Factor IQ al panel administrativo: azul marino como color rector y coral como acento; se retiraron los acentos cian/violeta que no correspondían a la marca.
- [x] Ajuste final del tema light para `/admin`: la capa visual del panel usa ahora la paleta institucional de Factor IQ y el contraste claro del portal público, sin perder la estructura operativa del dashboard interno.
- [x] Revisión final de formularios y modales: drawers, wizard y ventanas de edición pasan a fondo blanco, labels oscuros y bordes claros para mantener legibilidad en light mode sin romper los bloques corporativos de marca.
- [x] Clarificados los módulos operativos: Clientes, Usuarios y accesos, Bitácora y Salud del sistema; las acciones rápidas ahora direccionan correctamente a la gestión de clientes o de accesos.
- [x] Actualizado `README.md` con alcance, módulos actuales y evolución sugerida del panel administrativo.
- [ ] Próxima iteración sugerida: filtros por fecha/cliente en bitácora, métricas temporales de uso y alertas configurables de operación.

- [x] **Detección y corrección de inconsistencias en scripts SQL (`database/`)**:
  - Se identificó que `evaluaciones` omitía el campo `tipo_evaluacion`, lo que rompía la segmentación en BD de las 22 evaluaciones de Ventas, 14 de Call Center y 6 de Seminuevos.
  - Se corrigió el catálogo truncado de `indicadores`: el seed previo contenía solo 12 registros mezclando Call Center con Ventas, perdiendo los indicadores 1..7 de Ventas (_Instalaciones y Ambiente General_, _Protocolo de atención_, etc.) y vinculando relaciones a indicadores erróneos.
  - Se actualizó `database/schema.sql` con `tipo_evaluacion` y `codigo` en `indicadores`, clave única compuesta `(proyecto_id, tipo_evaluacion, orden)` y `tipo_evaluacion` en `evaluaciones`.
- [x] **Generador reproducible de Seed SQL (`scripts/generate-sql-seed.cjs`)**:
  - Creado script que lee directamente `src/data/mystery-shopping-imported.json` (la fuente de verdad del dashboard).
  - Regenerado `database/seed_maquinarias.sql` con integridad relacional 100% verificada:
    - 1 cliente (`Maquinarias`)
    - 2 usuarios con hashes bcrypt operativos (`superadmin` con `admin123` y `admMaqui` con `adm123`)
    - 1 proyecto (`Mystery Shopping Maquinarias`)
    - 29 sucursales normalizadas
    - 19 indicadores (12 Ventas + 7 Call Center aislados por prefijo `IND_` y `IND_CAL_`)
    - 42 evaluaciones con su `tipo_evaluacion` real
    - 434 resultados en `evaluacion_indicadores`
    - 2,494 respuestas en `evaluacion_preguntas`
- [x] **Validación en MySQL Local (WAMP)**:
  - Se ejecutaron `schema.sql` y `seed_maquinarias.sql` en la base `factoriq` de MySQL 8.2 local.
  - Validada la integridad con consultas de verificación cruzada (`JOIN` de evaluaciones, indicadores y preguntas).
- [x] **Dependencias y Pool de Conexiones**:
  - Instalados `mysql2`, `bcryptjs` y `@types/bcryptjs`.
  - Corregido `src/lib/db.ts` con tipado estricto `exactOptionalPropertyTypes` y pool seguro para hosting compartido.
- [x] **Capa de Datos Híbrida (`src/lib/mystery/server-data.ts`)**:
  - Creada función de servidor `getMysteryShoppingDataFn` con consultas SQL dinámicas por cliente.
  - Implementado fallback automático y transparente a `mystery-shopping-imported.json` cuando `isDbEnabled()` sea falso o haya error de red, garantizando cero caídas.
  - Integrada la carga y rehidratación de datos en `src/routes/maquinarias.tsx`.
- [x] **Panel SuperAdmin (`src/routes/admin.tsx`)**:
  - Nueva ruta `/admin` protegida con `beforeLoad`: acceso exclusivo para usuarios con `rol === 'superadmin'`.
  - Panel visual de monitoreo: estado de MySQL, métricas relacionales (clientes, usuarios, proyectos, locales, evaluaciones, auditoría), directorio de clientes con enlaces directos a sus paneles, listado de usuarios con roles y visualizador de bitácora de auditoría.
- [x] **Validación de Compilación**:
  - `npx tsc --noEmit` completado con 0 errores.
  - `npm run build` ejecutado exitosamente generando el bundle Nitro para producción (`.output/server/index.mjs`).

## Implementación base del plan: operación central

- [x] Incorporado el módulo **Proyectos e importación**: tabla de estudios por empresa, alta de proyectos aislados y validación de Excel por hojas y encabezados existentes.
- [x] Incorporado el módulo **Soporte y tickets**: bandeja operativa, creación de tickets, prioridad y transición entre `abierto`, `en_analisis` y `resuelto`.
- [x] Añadidos controles de cabecera para perfil, estado de conexión, notificaciones y conmutador de tema mediante componentes accesibles de Radix UI.
- [x] Añadida la migración incremental `database/migrations/002_admin_operaciones.sql`; agrega roles de Editor Web y Soporte, tickets, comentarios y la estructura de contenidos web sin borrar datos.
- [x] Actualizado `database/schema.sql` para que instalaciones nuevas partan con el modelo ampliado.
- [!] La importación actual valida y conserva los datos en la sesión local. La persistencia masiva a MySQL y su aprobación editorial requieren definir la política de reemplazo/versionado del proyecto.
- [!] El modelo de CMS está preparado en base de datos, pero todavía no publica contenido en la landing: falta elegir los bloques editables y su flujo de revisión.
- [x] Validado con `npx tsc --noEmit` y `npm run build`.

## Acceso temporal del SuperAdmin en Vercel sin MySQL

- [x] Agregada la cuenta de respaldo `superadmin` / `admin123` al modo sin base de datos; crea una sesión con rol `superadmin` y redirige correctamente a `/admin`.
- [x] Conservado el acceso temporal existente `admMaqui` / `adm123` para el portal Maquinarias.
- [!] Vercel debe contar con `SESSION_SECRET` de mínimo 32 caracteres, incluso mientras MySQL no esté habilitado; las credenciales temporales deben reemplazarse antes de abrir el panel a usuarios finales.

## Importación segura e incremental de Mystery Shopping

- [x] Implementada la pantalla `/admin/importar` para el proyecto Maquinarias existente (`proyecto_id = 1`), independiente del wizard de alta de nuevas empresas.
- [x] La selección del Excel es una previsualización aislada: no escribe MySQL, no altera el dashboard y no persiste datos en `localStorage`.
- [x] La previsualización valida hojas, relaciones, códigos únicos del archivo, tipos (Ventas, Call Center, Seminuevos y Posventa), rango de puntajes/cumplimientos, fechas, asesor y referencias de indicadores/preguntas.
- [x] Se comparan códigos contra MySQL y se informa cuáles se insertarán y cuáles se omitirán; el servidor vuelve a verificar duplicados antes de escribir.
- [x] El guardado usa una transacción y solo crea evaluaciones nuevas, sucursales requeridas, indicadores por tipo y sus relaciones; ante cualquier fallo revierte toda la carga.
- [x] Eliminado el fallback silencioso del dashboard a JSON: MySQL es la fuente operativa y los estados sin conexión o sin registros se muestran explícitamente.
- [x] Extendidos los modelos compatibles con `fecha_evaluacion` y `asesor_evaluado`; el esquema de instalaciones nuevas ahora incluye `asesor_evaluado` e índice `(proyecto_id, tipo_evaluacion, fecha_evaluacion)`.
- [!] Antes de la primera importación, el módulo verifica el esquema real, la unicidad de `evaluaciones.codigo` y el proyecto `id = 1`; no habilita el guardado si alguna precondición falla.

## Corrección de Filtro Resumen Ejecutivo y Cálculo Posventa (Excel Import)

- [x] **Filtro Tipo de Evaluación**:
  - Se configuró como selección única (`singleSelect={true}`) sin opción "Todas" (`showAllOption={false}`), predeterminado a **Ventas**.
  - **Eliminación de la opción duplicada "Venta"**: Se identificó que valores vacíos o no definidos usaban fallback `"Venta"` en lugar de `"Ventas"`, y que la lista de opciones no normalizaba contra el catálogo canónico. Se estableció la lista canónica estricta `CANONICAL_TIPOS_EVALUACION` (`Call Center`, `Seminuevos`, `Ventas`, `Posventa`) y se actualizó `normalizeTipoEvaluacion` con fallback `"Ventas"`, impidiendo cualquier aparición de "Venta".
  - **Visualización clara en el botón trigger**: Se añadió `shortLabel="Tipo"` a `MultiFilterSelect.tsx` para evitar que el texto se trunque como `TI PO DE EVALUACI...`. Ahora el botón muestra de manera legible y destacada: **`TIPO: Ventas`** (o `Ventas` en pantallas pequeñas) y se actualiza inmediatamente al seleccionar cualquier canal, cerrando automáticamente el menú al elegir una opción.
  - **Sincronización reactiva del Dataset**: Se agregó `subscribeDataset` y control de versión en `filter-context.tsx` para que los filtros y el dataset reaccionen inmediatamente al cargar los datos desde MySQL.
- [x] **Causa de Posventa en 0%**: Al importar desde Excel (`safe-excel-import.ts` y `excel-import.ts`), `XLSX.utils.sheet_to_json` con `raw: false` entregaba strings formateados como `"71.35%"`. La conversión directa `Number("71.35%")` producía `NaN`, cayendo al fallback `0`.
- [x] **Corrección del Importador**:
  - Función `number()` mejorada para detectar strings con `%`, limpiar el símbolo y dividir entre 100 automáticamente.
  - Soporte de fechas en formato serial numérico de Excel en `toMysqlDate()`.
  - Actualización de pesos y nombres de indicadores en `admin.ts` con `ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), peso = VALUES(peso)`.
- [x] **Reparación de Datos en MySQL**:
  - Se ejecutó script de reparación en la base local `factoriq`: se corrigieron los puntajes de las 41 evaluaciones importadas, pesos de 41 definiciones de indicadores y 436 registros de `evaluacion_indicadores`.
  - Posventa verificado con sus 3 evaluaciones: 55.00%, 63.82% y 71.35% (promedio general: **63.39%**).
  - Seminuevos: 12 evaluaciones (promedio: **35.14%**).
  - Call Center: 24 evaluaciones (promedio: **55.86%**).
  - Ventas: 44 evaluaciones (promedio: **51.47%**).
- [x] Validado con `npx tsc --noEmit` y `npm run build` sin errores.

### Sugerencias para Producción en GoDaddy

1. **Variables de Entorno en cPanel**:
   En el panel de GoDaddy Node.js Hosting, configurar:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=factoriq
   DB_USER=usuario_cpanel
   DB_PASSWORD=password_cpanel
   SESSION_SECRET=generar_cadena_secreta_minimo_32_caracteres_produccion
   ```
2. **Importación inicial en GoDaddy**:
   En cPanel → phpMyAdmin (o terminal SSH):
   - Importar primero `database/schema.sql`.
   - Importar luego `database/seed_maquinarias.sql`.
3. **Credenciales iniciales**:
   - SuperAdmin: usuario `superadmin` / contraseña `admin123` (cambiar contraseña en producción).
   - Cliente Maquinarias: usuario `admMaqui` / contraseña `adm123`.
4. **Respaldo Automático**:
   Configurar una tarea cron en cPanel para ejecutar un volcado diario de la base `factoriq`:
   `mysqldump -u factoriq_user -p'password' factoriq > /home/user/backups/factoriq_$(date +\%F).sql`.
