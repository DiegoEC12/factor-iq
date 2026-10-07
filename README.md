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
- Corrección del filtro de tipo de evaluación: no se fuerza `Ventas` ni un único valor al cargar; el selector sigue siendo multi-select y conserva todas las opciones seleccionadas por defecto hasta que el usuario las modifique.
- Deduplicación de locales por la combinación `concesionaria + marca + ubicación`.
- Importación de archivos `.xlsx` y `.xls` desde la interfaz.
- Restauración del dataset original después de una importación.
- Panel SuperAdmin protegido en `/admin`, con una interfaz alineada al sistema visual claro del portal Maquinarias y los acentos institucionales azul marino y coral de Factor IQ.
- Ajuste reciente del tema light administrativo para que el panel use la paleta corporativa de Factor IQ, manteniendo la estructura de navegación y los módulos operativos con un estilo más claro y coherente con la web pública.
- Revisión final de formularios, drawers y wizard del panel: fondo blanco, textos oscuros y bordes claros para garantizar legibilidad sin perder la identidad de marca del módulo administrativo.
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

La importación operativa se realiza desde **Administración → Importación segura** (`/admin/importar`). La selección del Excel solo genera una vista previa: no altera MySQL, el dashboard ni `localStorage`.

El flujo verifica las hojas `Evaluaciones`, `Indicadores` y `Preguntas`, muestra errores bloqueantes, advertencias, tipos de evaluación, asesor, fecha, duplicados dentro del archivo y códigos ya existentes en MySQL. Solo se habilita **Guardar nuevas evaluaciones en MySQL** cuando no hay errores y el esquema del proyecto Maquinarias (`id = 1`) está verificado.

El guardado es transaccional: inserta exclusivamente códigos nuevos y sus relaciones. Los códigos existentes se omiten por completo, sin actualizar evaluaciones, indicadores ni respuestas. MySQL es la fuente única de datos del dashboard; si no está disponible, el portal muestra un estado explícito y no usa JSON como respaldo operativo.

El JSON incluido en el repositorio se conserva como referencia de desarrollo y no se utiliza como respaldo silencioso de las consultas operativas.

El parser aislado de la vista previa vive en [src/lib/safe-excel-import.ts](src/lib/safe-excel-import.ts) y el guardado protegido en [src/lib/admin.ts](src/lib/admin.ts).

## Desarrollo local

Requisitos: Node.js y npm.

```bash
npm install
npm run dev
```

El servidor de desarrollo queda disponible en la URL que indique Vite, normalmente `http://localhost:5173`.

## Reset de datos y seed MySQL

Cuando se vuelve a cargar `database/seed_maquinarias.sql`, hay que respetar el orden de dependencias de las tablas para no romper las claves foráneas.

- Las tablas hijas se limpian antes que las tablas padre.
- No se recomienda `TRUNCATE TABLE` en este esquema porque `evaluaciones` tiene dependencias en `evaluacion_indicadores` y `evaluacion_preguntas`.
- El script del seed usa `DELETE` en orden correcto y luego reinicia los `AUTO_INCREMENT`.

```sql
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM evaluacion_preguntas;
DELETE FROM evaluacion_indicadores;
DELETE FROM evaluaciones;
DELETE FROM indicadores;
DELETE FROM sucursales;
DELETE FROM proyectos;
DELETE FROM usuarios;
DELETE FROM clientes;
SET FOREIGN_KEY_CHECKS = 1;
```

Ejecuta el esquema y después el seed así:

```bash
mysql -u root -p factoriq < database/schema.sql
mysql -u root -p factoriq < database/seed_maquinarias.sql
```

## Acceso temporal sin MySQL

Cuando `DB_HOST`, `DB_NAME` y `DB_USER` no están configurados —por ejemplo, durante el despliegue inicial en Vercel— la aplicación utiliza acceso temporal de demostración:

- `superadmin` / `admin123` abre `/admin`.
- `admMaqui` / `adm123` abre `/maquinarias`.

En Vercel se debe configurar igualmente `SESSION_SECRET` con una cadena aleatoria de al menos 32 caracteres. Reemplaza estas credenciales al habilitar MySQL; no son apropiadas para una instancia pública definitiva.

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
