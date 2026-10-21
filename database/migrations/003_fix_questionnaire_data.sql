-- 003_fix_questionnaire_data.sql
-- Repara los datos corruptos en cuestionario_preguntas:
--   1. Elimina preguntas 28-30 de 'nuevos' y 'semi_nuevos' (son exclusivas de postventa)
--   2. Restaura tipo_respuesta y opciones correctas para 'nuevos'
--   3. Restaura opciones correctas para 'postventa' y 'semi_nuevos'
-- Ejecutar después de migration_cuestionarios.sql y migration_cuestionarios_versionado.sql.
--
-- NOTA: este script es idempotente; ejecutarlo múltiples veces no rompe nada.

USE factoriq;
START TRANSACTION;

SET @cliente_id = (SELECT id FROM clientes WHERE slug = 'maquinarias' LIMIT 1);

-- ═══════════════════════════════════════════════════════════════════════
-- PASO 1: Eliminar preguntas 28-30 de 'nuevos' y 'semi_nuevos'.
--         Estas preguntas (claridad_servicio, alternativas_solucion,
--         puntualidad_entrega) son exclusivas de postventa.
-- ═══════════════════════════════════════════════════════════════════════

-- Primero eliminar cualquier respuesta asociada a esas preguntas incorrectas
DELETE ri FROM cuestionario_respuesta_items ri
JOIN cuestionario_preguntas p ON p.id = ri.pregunta_id
JOIN cuestionarios q ON q.id = p.cuestionario_id
WHERE q.cliente_id = @cliente_id
  AND q.codigo IN ('nuevos', 'semi_nuevos')
  AND p.orden >= 28;

-- Ahora eliminar las preguntas incorrectas
DELETE p FROM cuestionario_preguntas p
JOIN cuestionarios q ON q.id = p.cuestionario_id
WHERE q.cliente_id = @cliente_id
  AND q.codigo IN ('nuevos', 'semi_nuevos')
  AND p.orden >= 28;

-- ═══════════════════════════════════════════════════════════════════════
-- PASO 2: Restaurar tipo_respuesta y opciones para 'nuevos' (27 preguntas)
-- ═══════════════════════════════════════════════════════════════════════

SET @q_nuevos = (SELECT q.id FROM cuestionarios q WHERE q.cliente_id = @cliente_id AND q.codigo = 'nuevos');

-- P1: Correo electrónico -> text, sin opciones
UPDATE cuestionario_preguntas SET tipo_respuesta = 'text', opciones = NULL
WHERE cuestionario_id = @q_nuevos AND orden = 1;

-- P2: Edad -> select, con rangos
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["18-25","26-35","36-45","46-60","61 a más"]'
WHERE cuestionario_id = @q_nuevos AND orden = 2;

-- P3: Sexo -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Femenino","Masculino","Prefiero no decirlo"]'
WHERE cuestionario_id = @q_nuevos AND orden = 3;

-- P4: Distrito de residencia -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Ate","Comas","La Molina","Miraflores","San Isidro","Surco","Surquillo","Otro"]'
WHERE cuestionario_id = @q_nuevos AND orden = 4;

-- P5: Distrito donde labora -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Ate","Comas","La Molina","Miraflores","San Isidro","Surco","Surquillo","Otro"]'
WHERE cuestionario_id = @q_nuevos AND orden = 5;

-- P6: Sede de atención -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Maquinarias Nissan - Surquillo","Maquinarias Hyundai - Surquillo","Maquinarias Honda - La Molina","Maquinarias C&P","Maquinarias Seminuevos - Surquillo","Maquinarias Seminuevos - Tomás Valle"]'
WHERE cuestionario_id = @q_nuevos AND orden = 6;

-- P7: Motivo principal de visita -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Compra de vehículo nuevo / Cotización","Compra de vehículo semi nuevo / Cotización","Servicio de Posventa / Mantenimiento / Reparación","Consulta de financiamiento","Carrocería y Pintura","Otro"]'
WHERE cuestionario_id = @q_nuevos AND orden = 7;

-- P8-P11: Instalaciones (scale/likert)
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_nuevos AND orden IN (8, 9, 10, 11);

-- P12: ¿Le ofrecieron agua...? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Sí","No","No fue necesario"]'
WHERE cuestionario_id = @q_nuevos AND orden = 12;

-- P13-P16: Atención del asesor (scale/likert)
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_nuevos AND orden IN (13, 14, 15, 16);

-- P17: ¿Cómo describirías la atención? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Altamente personalizada","Personalizada","Aceptable","Estandarizada / De rutina","Poco deseo de atender"]'
WHERE cuestionario_id = @q_nuevos AND orden = 17;

-- P18: Transparencia -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Totalmente clara y transparente","Clara, requerí explicaciones","Aceptable, requerí varias explicaciones","Confusa / poco transparente","Completamente confusa"]'
WHERE cuestionario_id = @q_nuevos AND orden = 18;

-- P19: ¿Tu necesidad fue resuelta? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Sí, 100% resuelta","Parcialmente, requiere seguimiento","No, debo regresar o contactar"]'
WHERE cuestionario_id = @q_nuevos AND orden = 19;

-- P20: Facilidad general -> scale
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_nuevos AND orden = 20;

-- P21: ¿Qué opciones te presentaron? -> checks
UPDATE cuestionario_preguntas SET tipo_respuesta = 'checks',
  opciones = '["Financiamiento / crédito","Plan de retoma","Prueba de manejo","Mantenimiento / garantía / accesorios","Cronograma y tiempos","Ninguna de las anteriores"]'
WHERE cuestionario_id = @q_nuevos AND orden = 21;

-- P22: ¿Qué podríamos mejorar? -> textarea
UPDATE cuestionario_preguntas SET tipo_respuesta = 'textarea', opciones = NULL
WHERE cuestionario_id = @q_nuevos AND orden = 22;

-- P23: CSAT -> scale
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_nuevos AND orden = 23;

-- P24: ¿Hubo inconveniente? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["No, todo estuvo perfecto","Sí"]'
WHERE cuestionario_id = @q_nuevos AND orden = 24;

-- P25: Sugerencia -> textarea
UPDATE cuestionario_preguntas SET tipo_respuesta = 'textarea', opciones = NULL
WHERE cuestionario_id = @q_nuevos AND orden = 25;

-- P26: NPS -> scale (0-10)
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_nuevos AND orden = 26;

-- P27: Probabilidad de recompra -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Definitivamente sí","Probablemente sí","Incierto / dependerá","Probablemente no","Definitivamente no"]'
WHERE cuestionario_id = @q_nuevos AND orden = 27;

-- ═══════════════════════════════════════════════════════════════════════
-- PASO 3: Restaurar tipo_respuesta y opciones para 'postventa' (30 preguntas)
--         Postventa tiene las mismas 27 base + 3 extra (28=claridad, 29=alternativas, 30=puntualidad)
-- ═══════════════════════════════════════════════════════════════════════

SET @q_post = (SELECT q.id FROM cuestionarios q WHERE q.cliente_id = @cliente_id AND q.codigo = 'postventa');

-- P1: Correo electrónico -> text
UPDATE cuestionario_preguntas SET tipo_respuesta = 'text', opciones = NULL
WHERE cuestionario_id = @q_post AND orden = 1;

-- P2: Edad -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["18-25","26-35","36-45","46-60","61 a más"]'
WHERE cuestionario_id = @q_post AND orden = 2;

-- P3: Sexo -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Femenino","Masculino","Prefiero no decirlo"]'
WHERE cuestionario_id = @q_post AND orden = 3;

-- P4: Distrito de residencia -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Ate","Comas","La Molina","Miraflores","San Isidro","Surco","Surquillo","Otro"]'
WHERE cuestionario_id = @q_post AND orden = 4;

-- P5: Distrito donde labora -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Ate","Comas","La Molina","Miraflores","San Isidro","Surco","Surquillo","Otro"]'
WHERE cuestionario_id = @q_post AND orden = 5;

-- P6: Sede de atención -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Maquinarias Nissan - Surquillo","Maquinarias Hyundai - Surquillo","Maquinarias Honda - La Molina","Maquinarias C&P","Maquinarias Seminuevos - Surquillo","Maquinarias Seminuevos - Tomás Valle"]'
WHERE cuestionario_id = @q_post AND orden = 6;

-- P7: Motivo principal de visita -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Compra de vehículo nuevo / Cotización","Compra de vehículo semi nuevo / Cotización","Servicio de Posventa / Mantenimiento / Reparación","Consulta de financiamiento","Carrocería y Pintura","Otro"]'
WHERE cuestionario_id = @q_post AND orden = 7;

-- P8-P11: Instalaciones (scale/likert)
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_post AND orden IN (8, 9, 10, 11);

-- P12: ¿Le ofrecieron agua...? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Sí","No","No fue necesario"]'
WHERE cuestionario_id = @q_post AND orden = 12;

-- P13-P16: Atención del asesor (scale/likert)
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_post AND orden IN (13, 14, 15, 16);

-- P17: ¿Cómo describirías la atención? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Altamente personalizada","Personalizada","Aceptable","Estandarizada / De rutina","Poco deseo de atender"]'
WHERE cuestionario_id = @q_post AND orden = 17;

-- P18: Transparencia -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Totalmente clara y transparente","Clara, requerí explicaciones","Aceptable, requerí varias explicaciones","Confusa / poco transparente","Completamente confusa"]'
WHERE cuestionario_id = @q_post AND orden = 18;

-- P19: ¿Tu necesidad fue resuelta? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Sí, 100% resuelta","Parcialmente, requiere seguimiento","No, debo regresar o contactar"]'
WHERE cuestionario_id = @q_post AND orden = 19;

-- P20: Facilidad general -> scale
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_post AND orden = 20;

-- P21: ¿Qué opciones o servicios te presentaron? (Post Venta specific options) -> checks
UPDATE cuestionario_preguntas SET tipo_respuesta = 'checks',
  opciones = '["Diagnóstico y prioridad de trabajos","Trabajos adicionales o accesorios","Explicación de cotización y riesgos","Presupuesto y tiempos de entrega","Confianza en el servicio","Experiencia de Maquinarias","Ninguna de las anteriores"]'
WHERE cuestionario_id = @q_post AND orden = 21;

-- P22: ¿Qué podríamos mejorar? -> textarea
UPDATE cuestionario_preguntas SET tipo_respuesta = 'textarea', opciones = NULL
WHERE cuestionario_id = @q_post AND orden = 22;

-- P23: CSAT -> scale
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_post AND orden = 23;

-- P24: ¿Hubo inconveniente? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["No, todo estuvo perfecto","Sí"]'
WHERE cuestionario_id = @q_post AND orden = 24;

-- P25: Sugerencia -> textarea
UPDATE cuestionario_preguntas SET tipo_respuesta = 'textarea', opciones = NULL
WHERE cuestionario_id = @q_post AND orden = 25;

-- P26: NPS -> scale (0-10)
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_post AND orden = 26;

-- P27: Probabilidad de recompra -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Definitivamente sí","Probablemente sí","Incierto / dependerá","Probablemente no","Definitivamente no"]'
WHERE cuestionario_id = @q_post AND orden = 27;

-- P28: Claridad y conocimiento sobre el vehículo (exclusiva postventa) -> scale
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_post AND orden = 28;

-- P29: Más de una alternativa (exclusiva postventa) -> scale
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_post AND orden = 29;

-- P30: ¿Vehículo entregado a tiempo? (exclusiva postventa) -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Sí, a tiempo","Antes de la hora acordada","Con retraso"]'
WHERE cuestionario_id = @q_post AND orden = 30;

-- ═══════════════════════════════════════════════════════════════════════
-- PASO 4: Restaurar tipo_respuesta y opciones para 'semi_nuevos' (27 preguntas)
-- ═══════════════════════════════════════════════════════════════════════

SET @q_semi = (SELECT q.id FROM cuestionarios q WHERE q.cliente_id = @cliente_id AND q.codigo = 'semi_nuevos');

-- P1: Correo electrónico -> text
UPDATE cuestionario_preguntas SET tipo_respuesta = 'text', opciones = NULL
WHERE cuestionario_id = @q_semi AND orden = 1;

-- P2: Edad -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["18-25","26-35","36-45","46-60","61 a más"]'
WHERE cuestionario_id = @q_semi AND orden = 2;

-- P3: Sexo -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Femenino","Masculino","Prefiero no decirlo"]'
WHERE cuestionario_id = @q_semi AND orden = 3;

-- P4: Distrito de residencia -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Ate","Comas","La Molina","Miraflores","San Isidro","Surco","Surquillo","Otro"]'
WHERE cuestionario_id = @q_semi AND orden = 4;

-- P5: Distrito donde labora -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Ate","Comas","La Molina","Miraflores","San Isidro","Surco","Surquillo","Otro"]'
WHERE cuestionario_id = @q_semi AND orden = 5;

-- P6: Sede de atención -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Maquinarias Nissan - Surquillo","Maquinarias Hyundai - Surquillo","Maquinarias Honda - La Molina","Maquinarias C&P","Maquinarias Seminuevos - Surquillo","Maquinarias Seminuevos - Tomás Valle"]'
WHERE cuestionario_id = @q_semi AND orden = 6;

-- P7: Motivo principal de visita -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Compra de vehículo nuevo / Cotización","Compra de vehículo semi nuevo / Cotización","Servicio de Posventa / Mantenimiento / Reparación","Consulta de financiamiento","Carrocería y Pintura","Otro"]'
WHERE cuestionario_id = @q_semi AND orden = 7;

-- P8-P11: Instalaciones (scale/likert)
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_semi AND orden IN (8, 9, 10, 11);

-- P12: ¿Le ofrecieron agua...? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Sí","No","No fue necesario"]'
WHERE cuestionario_id = @q_semi AND orden = 12;

-- P13-P16: Atención del asesor (scale/likert)
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_semi AND orden IN (13, 14, 15, 16);

-- P17: ¿Cómo describirías la atención? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Altamente personalizada","Personalizada","Aceptable","Estandarizada / De rutina","Poco deseo de atender"]'
WHERE cuestionario_id = @q_semi AND orden = 17;

-- P18: Transparencia -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Totalmente clara y transparente","Clara, requerí explicaciones","Aceptable, requerí varias explicaciones","Confusa / poco transparente","Completamente confusa"]'
WHERE cuestionario_id = @q_semi AND orden = 18;

-- P19: ¿Tu necesidad fue resuelta? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Sí, 100% resuelta","Parcialmente, requiere seguimiento","No, debo regresar o contactar"]'
WHERE cuestionario_id = @q_semi AND orden = 19;

-- P20: Facilidad general -> scale
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_semi AND orden = 20;

-- P21: ¿Qué alternativas te presentaron? (Semi Nuevos label) -> checks
UPDATE cuestionario_preguntas SET tipo_respuesta = 'checks',
  opciones = '["Financiamiento / crédito","Plan de retoma","Prueba de manejo","Mantenimiento / garantía / accesorios","Cronograma y tiempos","Ninguna de las anteriores"]'
WHERE cuestionario_id = @q_semi AND orden = 21;

-- P22: ¿Qué podríamos mejorar? -> textarea
UPDATE cuestionario_preguntas SET tipo_respuesta = 'textarea', opciones = NULL
WHERE cuestionario_id = @q_semi AND orden = 22;

-- P23: CSAT -> scale
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_semi AND orden = 23;

-- P24: ¿Hubo inconveniente? -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["No, todo estuvo perfecto","Sí"]'
WHERE cuestionario_id = @q_semi AND orden = 24;

-- P25: Sugerencia -> textarea
UPDATE cuestionario_preguntas SET tipo_respuesta = 'textarea', opciones = NULL
WHERE cuestionario_id = @q_semi AND orden = 25;

-- P26: NPS -> scale (0-10)
UPDATE cuestionario_preguntas SET tipo_respuesta = 'scale', opciones = NULL
WHERE cuestionario_id = @q_semi AND orden = 26;

-- P27: Probabilidad de recompra (Semi Nuevos) -> select
UPDATE cuestionario_preguntas SET tipo_respuesta = 'select',
  opciones = '["Definitivamente sí","Probablemente sí","Incierto / dependerá","Probablemente no","Definitivamente no"]'
WHERE cuestionario_id = @q_semi AND orden = 27;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════════════

SELECT q.codigo,
       COUNT(*) AS total_preguntas,
       SUM(CASE WHEN p.tipo_respuesta IS NOT NULL THEN 1 ELSE 0 END) AS con_tipo_respuesta,
       SUM(CASE WHEN p.opciones IS NOT NULL AND p.opciones != '[]' THEN 1 ELSE 0 END) AS con_opciones
FROM cuestionario_preguntas p
JOIN cuestionarios q ON q.id = p.cuestionario_id
WHERE q.cliente_id = @cliente_id AND p.activo = 1
GROUP BY q.codigo
ORDER BY FIELD(q.codigo, 'nuevos', 'postventa', 'semi_nuevos');

COMMIT;
