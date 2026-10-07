# Plan de implementación
## Importación segura de Mystery Shopping a MySQL

**Proyecto:** Factor-IQ · Mystery Shopping Maquinarias  
**Propósito:** incorporar nuevas evaluaciones —incluida Posventa— sin sobrescribir registros existentes ni cambiar el comportamiento de los módulos actuales.

---

## 1. Contexto y objetivo

Factor-IQ ya tiene un flujo para leer archivos Excel y mostrar una previsualización, además de un cargador de datos conectado a MySQL. La nueva base de Excel incorpora evaluaciones de Posventa y campos de **asesor** y **fecha de atención**.

El cambio buscado es que la app use **MySQL como fuente única al consultar los datos operativos**. El JSON se utilizará exclusivamente como representación temporal de la importación para revisar el Excel antes de guardarlo. La carga del archivo no debe modificar MySQL ni reemplazar los datos visibles de forma persistente hasta que una persona confirme el guardado.

La carga se hará sobre el proyecto existente **Mystery Shopping Maquinarias** (el proyecto mostrado en la consulta tenía `id = 1`), no creando otro cliente o proyecto.

### Principios de seguridad

- Conservar todas las evaluaciones que ya existen.
- Identificar duplicados por el código único de evaluación y omitirlos; nunca actualizarlos durante una importación incremental.
- Guardar evaluación, indicadores y respuestas como una sola operación transaccional.
- No recurrir silenciosamente a datos JSON si MySQL está caído o devuelve cero registros.
- Mantener el formato de datos que consumen los dashboards, filtros, tablas y gráficos actuales.
- No ejecutar seeds destructivos ni recrear tablas para esta carga.

---

## 2. Estado de la base de datos

### Cambios reportados y respaldados por la consulta compartida

La salida de `SHOW COLUMNS FROM evaluaciones` que se compartió mostró:

| Campo | Estado observado | Uso previsto |
|---|---|---|
| `fecha_evaluacion` | Existe como `DATE`, permite `NULL` | Guardar la fecha de atención, si esa es la semántica confirmada para el Excel. |
| `asesor_evaluado` | Existe como `VARCHAR(150)`, permite `NULL` | Guardar el asesor asociado a la evaluación. |

También se confirmó que el proyecto existente es `Mystery Shopping Maquinarias`, tipo `mystery_shopping`, con `id = 1`. **No se debe cambiar `proyectos.tipo` a Posventa**: el área corresponde a cada evaluación y debe distinguirse mediante `evaluaciones.tipo_evaluacion`.

### Verificación pendiente antes de escribir datos

En la salida de columnas de `evaluaciones` que se compartió **no aparecía `tipo_evaluacion`**. Luego se propuso agregarla, pero no tenemos una consulta posterior que confirme que ya existe en el MySQL desplegado. Antes de habilitar el guardado, verificar:

```sql
SHOW COLUMNS FROM evaluaciones;
SHOW INDEX FROM evaluaciones;
```

Confirmar que:

1. Existe `evaluaciones.tipo_evaluacion` y permite registrar `Ventas`, `Call Center`, `Seminuevos` y `Posventa`.
2. `evaluaciones.fecha_evaluacion` y `evaluaciones.asesor_evaluado` siguen presentes.
3. `evaluaciones.codigo` tiene una restricción única, para impedir duplicados también a nivel de base.
4. Las tablas `evaluacion_indicadores`, `evaluacion_preguntas` e `indicadores` tienen las claves y relaciones que espera el importador.
5. El usuario MySQL del despliegue tiene permisos de lectura e inserción sobre las tablas necesarias.

La tabla de control de calidad relacionada con evaluaciones se recomendó anteriormente, pero **su creación no quedó confirmada**. Tratarla como una mejora separada: no bloquear la importación base salvo que se decida que esas alertas deban guardarse desde esta primera versión.

---

## 3. Hallazgos del estado actual de la app

Revisión del código del repositorio `DiegoEC12/factor-iq`:

- `src/lib/mystery/server-data.ts` consulta MySQL, pero hoy usa el JSON empaquetado cuando la conexión no está configurada, ocurre un error o no encuentra evaluaciones para el cliente. Eso puede presentar datos de respaldo como si fueran los datos vigentes.
- `src/lib/excel-import.ts` ya tiene un parser de previsualización que puede validar un Excel sin modificar el estado global. Sin embargo, existen otras rutas de importación que aplican datos al estado de la app y los guardan en `localStorage`; hay que separarlas del flujo incremental a MySQL.
- El asistente de administración actual está orientado a crear cliente, usuario y proyecto. No se debe reutilizar para esta carga porque el destino es el proyecto existente.
- El modelo analítico actual incluye tipo de evaluación, indicadores y respuestas, pero debe ampliarse de manera compatible para incluir asesor y fecha.
- La capa de consulta MySQL debe devolver los campos nuevos y conservar las propiedades que usan hoy los módulos existentes.

---

## 4. Plan de implementación

### Fase 0 · Confirmar el esquema y el entorno

1. Ejecutar las consultas de verificación de columnas, índices y tablas indicadas arriba en **la misma base usada por el despliegue**.
2. Confirmar el nombre exacto de la base, el proyecto destino y que `proyecto_id = 1` corresponde al proyecto Maquinarias en ese entorno.
3. Hacer una copia de seguridad y probar primero con una copia o entorno de prueba si está disponible.
4. No volver a cargar el Excel manualmente hasta terminar el flujo incremental.

**Salida de la fase:** esquema real documentado y precondiciones del importador acordadas.

### Fase 1 · MySQL como fuente de verdad

1. Cambiar la consulta normal del dashboard para que obtenga datos de MySQL únicamente.
2. Si MySQL no está configurado o falla, devolver un estado de error comprensible con opción de reintentar; no entregar el JSON como si fueran datos reales.
3. Si la consulta funciona y no hay evaluaciones, mostrar un estado vacío, no un fallback.
4. Mantener el JSON empaquetado fuera de la carga normal de los módulos.
5. Mostrar estados distintos para cargando, error de conexión y consulta válida sin resultados.

**Criterio de aceptación:** desconectar o romper MySQL nunca hace que aparezcan silenciosamente los datos del JSON empaquetado.

### Fase 2 · Flujo de importación separado para el proyecto existente

1. Añadir un flujo de importación incremental orientado al proyecto Maquinarias existente.
2. Leer el Excel en memoria y generar un payload temporal para la vista previa.
3. No alterar MySQL, el estado analítico en uso ni `localStorage` al seleccionar o previsualizar el archivo.
4. Mantener las hojas y relaciones existentes —evaluaciones, indicadores y preguntas— y aceptar las hojas de control de calidad si se decide almacenarlas.
5. Reconocer explícitamente los tipos: Ventas, Call Center, Seminuevos y Posventa.
6. Extraer las columnas nuevas del asesor y la fecha de atención; normalizar fechas a `DATE` sin conversión ambigua por zona horaria.
7. Permitir que asesor y fecha sean nulos cuando el archivo legítimamente no los tenga, señalándolo en la vista previa cuando sea relevante.

**Criterio de aceptación:** abrir el archivo y navegar su vista previa no cambia la base ni altera los datos que ya ve el dashboard.

### Fase 3 · Validación y vista previa antes de guardar

La pantalla previa debe presentar:

- Total de evaluaciones leídas y distribución por tipo, incluyendo Posventa.
- Nuevas evaluaciones que podrían insertarse.
- Códigos que ya existen en MySQL y se omitirán.
- Duplicados dentro del mismo Excel.
- Conteos de sucursales, indicadores y preguntas/respuestas.
- Columnas detectadas de asesor y fecha, con ejemplos legibles.
- Errores bloqueantes separados de advertencias corregibles o informativas.
- Una tabla revisable de evaluaciones y, en pestañas o paneles, sus indicadores y respuestas.

Validaciones recomendadas:

- Código de evaluación obligatorio, único dentro del archivo y con formato compatible con `VARCHAR(30)`.
- Tipo de evaluación reconocido; no inferir Posventa a partir del nombre de proyecto.
- Sucursal resoluble o claramente reportada antes de guardar.
- Fechas válidas y dentro del rango aceptado por MySQL.
- Indicadores y preguntas asociados a códigos de evaluación presentes.
- Puntajes y cumplimientos dentro del rango y escala acordados por el esquema actual; no convertir silenciosamente escalas.
- Evaluaciones duplicadas ya guardadas se omiten completas. No se actualizan puntaje, fecha, asesor, resumen, recomendaciones, indicadores ni respuestas.

**Criterio de aceptación:** antes de confirmar, la persona puede distinguir qué se insertará, qué se omitirá y qué impide continuar.

### Fase 4 · Guardado incremental y transaccional

1. Agregar un botón explícito **Guardar nuevas evaluaciones en MySQL**, habilitado solo si no hay errores bloqueantes y hay nuevas evaluaciones.
2. Enviar al servidor solo los registros nuevos y el identificador fijo del proyecto autorizado; no aceptar `proyecto_id` arbitrarios sin validación del servidor.
3. Volver a comprobar códigos duplicados en el servidor justo antes de insertar; la verificación del navegador no basta para evitar carreras.
4. En una transacción:
   - Resolver o crear únicamente sucursales según la regla acordada y las claves reales del esquema.
   - Resolver los indicadores por proyecto, tipo y orden/código sin cruzar catálogos de áreas distintas.
   - Insertar evaluación con código, proyecto, sucursal, tipo, puntaje, resumen, recomendaciones, fecha y asesor.
   - Insertar sus resultados por indicador y sus respuestas.
   - Registrar la importación o auditoría si la tabla y el flujo actuales lo permiten.
5. Confirmar toda la transacción solo si todos los registros relacionados se guardaron. Ante un error, revertirla y reportar el detalle útil sin exponer credenciales.
6. Responder con resumen real: insertadas, omitidas por duplicado y fallidas. No informar éxito parcial si la transacción se revirtió.

**Criterio de aceptación:** volver a importar el mismo archivo no duplica ni modifica registros y sus relaciones; si falla una relación, no quedan evaluaciones a medio guardar.

### Fase 5 · Recarga, compatibilidad y pruebas de no regresión

1. Tras un guardado confirmado, volver a consultar MySQL y actualizar la vista desde esa respuesta.
2. Extender el modelo de evaluación con asesor y fecha como campos compatibles y opcionales donde haga falta.
3. Mantener filtros y métricas existentes; la incorporación de Posventa no debe cambiar el valor predeterminado de filtros de Ventas ni mezclar escalas o catálogos entre tipos.
4. Asegurar que cualquier vista que muestre fecha o asesor lo haga solo cuando el módulo lo requiera y el dato exista.
5. Probar estos escenarios:
   - Excel válido con registros nuevos de Ventas, Seminuevos y Posventa.
   - Registros existentes mezclados con nuevos.
   - Mismo Excel importado por segunda vez.
   - Código duplicado dentro del archivo.
   - Asesor o fecha vacíos, fecha inválida y encabezados variantes admitidos.
   - Sucursal o indicador desconocido.
   - Caída de MySQL y respuesta válida sin datos.
   - Error durante el guardado de indicadores o preguntas.
   - Dashboards actuales de Ventas, Call Center y Seminuevos, filtros, tablas y gráficos.

**Criterio de aceptación:** los datos guardados aparecen después de recargar porque proceden de MySQL, y los módulos preexistentes conservan sus resultados y comportamiento.

---

## 5. Alcance y fuera de alcance inicial

### Incluido

- MySQL como fuente exclusiva para lectura normal.
- Vista previa temporal del archivo antes de guardar.
- Carga incremental al proyecto existente.
- Detección de duplicados sin sobrescritura.
- Tipo Posventa, asesor y fecha.
- Escritura transaccional de evaluación y relaciones.
- Pruebas de regresión para los módulos actuales.

### No incluido sin decisión adicional

- Cambiar proyectos, clientes o usuarios existentes.
- Actualizar evaluaciones ya guardadas cuando el Excel traiga el mismo código.
- Usar JSON local como modo offline o como réplica persistente.
- Crear reportes analíticos nuevos de Posventa, salvo adaptar los módulos actuales para que la nueva categoría se filtre y consulte correctamente.
- Guardar alertas de `Control_Calidad` en una tabla adicional si el esquema de esa tabla aún no está confirmado.

---

## 6. Orden recomendado para empezar

1. Confirmar el esquema desplegado, especialmente `tipo_evaluacion`, el índice único de `codigo` y las relaciones de indicadores/preguntas.
2. Implementar el cambio de fuente de verdad para quitar el fallback silencioso.
3. Construir la importación independiente con vista previa de nuevas, existentes y errores.
4. Implementar el guardado transaccional en el proyecto existente.
5. Ejecutar pruebas de duplicados, fallo y regresión antes de cargar el Excel actualizado en producción.

> **Regla de seguridad:** la importación nunca debe borrar, truncar ni actualizar evaluaciones existentes. Solo inserta códigos nuevos luego de la confirmación explícita.
