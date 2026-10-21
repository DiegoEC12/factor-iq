-- SCRIPT FINAL EJECUTABLE: 10 cuestionarios completos para Maquinarias.
-- Ejecutar después de migration_cuestionarios.sql y migration_cuestionarios_versionado.sql.
-- ATENCIÓN: elimina todas las respuestas existentes del cliente Maquinarias
-- y carga 10 respuestas completas de demostración.

USE factoriq;
START TRANSACTION;

SET @cliente_id = (SELECT id FROM clientes WHERE slug = 'maquinarias' LIMIT 1);

INSERT INTO cuestionarios (cliente_id, codigo, nombre, descripcion)
VALUES
  (@cliente_id, 'nuevos', 'Nuevos', 'Experiencia de compra de vehículos nuevos.'),
  (@cliente_id, 'postventa', 'Post Venta', 'Experiencia de taller y mantenimiento.'),
  (@cliente_id, 'semi_nuevos', 'Semi Nuevos', 'Experiencia de compra de vehículos seminuevos.')
ON DUPLICATE KEY UPDATE estado = 'activo';

DROP TEMPORARY TABLE IF EXISTS demo_preguntas;
CREATE TEMPORARY TABLE demo_preguntas (
  orden SMALLINT UNSIGNED NOT NULL,
  texto VARCHAR(700) NOT NULL,
  tipo ENUM('texto','seleccion_unica','seleccion_multiple','likert','nps','email','numero') NOT NULL,
  bloque VARCHAR(160) NOT NULL,
  PRIMARY KEY (orden)
);

INSERT INTO demo_preguntas VALUES
  (1, 'Correo electrónico', 'email', 'Información general'),
  (2, 'Edad', 'seleccion_unica', 'Información general'),
  (3, 'Sexo', 'seleccion_unica', 'Información general'),
  (4, 'Distrito de residencia', 'seleccion_unica', 'Información general'),
  (5, 'Distrito donde labora', 'seleccion_unica', 'Información general'),
  (6, 'Sede de atención', 'seleccion_unica', 'Información general'),
  (7, 'Motivo principal de visita', 'seleccion_unica', 'Información general'),
  (8, 'Limpieza y orden de la sala de ventas o espera', 'likert', 'Instalaciones, ambiente y recepción'),
  (9, 'Confort y comodidad del ambiente', 'likert', 'Instalaciones, ambiente y recepción'),
  (10, 'Claridad de la señalización e información visible', 'likert', 'Instalaciones, ambiente y recepción'),
  (11, 'Protocolo de bienvenida al ingreso', 'likert', 'Instalaciones, ambiente y recepción'),
  (12, '¿Le ofrecieron agua, café o sala de espera?', 'seleccion_unica', 'Instalaciones, ambiente y recepción'),
  (13, 'Presentación personal y profesionalismo', 'likert', 'Atención del asesor'),
  (14, 'Escucha atenta para entender necesidades', 'likert', 'Atención del asesor'),
  (15, 'Trato personalizado y amable', 'likert', 'Atención del asesor'),
  (16, 'Dominio técnico y/o comercial', 'likert', 'Atención del asesor'),
  (17, '¿Cómo describirías la atención?', 'seleccion_unica', 'Atención del asesor'),
  (18, 'Transparencia en precios, cotizaciones o presupuesto', 'seleccion_unica', 'Proceso y resolución'),
  (19, '¿Tu necesidad fue resuelta en esta visita?', 'seleccion_unica', 'Proceso y resolución'),
  (20, 'Facilidad general del proceso', 'likert', 'Proceso y resolución'),
  (21, '¿Qué opciones o servicios te presentaron?', 'seleccion_multiple', 'Proceso y resolución'),
  (22, '¿Qué podríamos mejorar en el proceso?', 'texto', 'Proceso y resolución'),
  (23, 'Evaluación general de tu experiencia', 'likert', 'Experiencia y recomendación'),
  (24, '¿Hubo algún momento de molestia o inconveniente?', 'seleccion_unica', 'Experiencia y recomendación'),
  (25, 'Sugerencia para mejorar la atención', 'texto', 'Experiencia y recomendación'),
  (26, '¿Qué tan probable es que recomiendes Maquinarias?', 'nps', 'Experiencia y recomendación'),
  (27, 'Probabilidad de realizar tu próxima compra en Maquinarias', 'seleccion_unica', 'Experiencia y recomendación');

-- Post Venta agrega preguntas propias de asesoría técnica y entrega.
INSERT INTO demo_preguntas VALUES
  (28, 'Claridad y conocimiento sobre el vehículo o servicio', 'likert', 'Atención del asesor y asesoría técnica'),
  (29, 'Más de una alternativa para solucionar mis consultas o problemas', 'likert', 'Atención del asesor y asesoría técnica'),
  (30, '¿El vehículo fue entregado en la hora y fecha comprometida?', 'seleccion_unica', 'Servicio, entrega y resolución');

INSERT INTO cuestionario_preguntas
  (cuestionario_id, codigo, bloque, texto, tipo, opciones, orden, obligatorio, activo)
SELECT q.id, CONCAT(q.codigo, '_p_', d.orden), d.bloque, d.texto, d.tipo, NULL, d.orden, 0, 1
FROM cuestionarios q CROSS JOIN demo_preguntas d
WHERE q.cliente_id = @cliente_id
  AND (q.codigo = 'postventa' OR d.orden <= 27)
ON DUPLICATE KEY UPDATE texto = VALUES(texto), bloque = VALUES(bloque), tipo = VALUES(tipo), orden = VALUES(orden), activo = 1;

-- Evita que el catálogo antiguo de pruebas se mezcle con la configuración completa.
UPDATE cuestionario_preguntas p
JOIN cuestionarios q ON q.id = p.cuestionario_id
SET p.activo = 0
WHERE q.cliente_id = @cliente_id
  AND p.codigo NOT LIKE CONCAT(q.codigo, '_p_%');

DELETE i FROM cuestionario_respuesta_items i
JOIN cuestionario_respuestas r ON r.id = i.respuesta_id
JOIN cuestionarios q ON q.id = r.cuestionario_id
WHERE q.cliente_id = @cliente_id;

DELETE r FROM cuestionario_respuestas r
JOIN cuestionarios q ON q.id = r.cuestionario_id
WHERE q.cliente_id = @cliente_id;

INSERT INTO cuestionario_respuestas
  (cuestionario_id, respondente_email, edad, sexo, distrito_residencia, distrito_laboral, motivo_visita, sede_atencion, estado, started_at, completed_at)
SELECT q.id, v.email, v.edad, v.sexo, v.residencia, v.laboral, v.motivo, v.sede, 'completa', NOW(), NOW()
FROM (
  SELECT 'nuevos' codigo, 'demo.cuestionario01@factoriq.test' email, '26-35' edad, 'Femenino' sexo, 'Surquillo' residencia, 'Miraflores' laboral, 'Compra de vehículo nuevo / Cotización' motivo, 'Maquinarias Nissan - Surquillo' sede
  UNION ALL SELECT 'nuevos', 'demo.cuestionario02@factoriq.test', '36-45', 'Masculino', 'San Miguel', 'Lince', 'Compra de vehículo nuevo / Cotización', 'Maquinarias Hyundai - Surquillo'
  UNION ALL SELECT 'nuevos', 'demo.cuestionario03@factoriq.test', '18-25', 'Femenino', 'Ate', 'San Isidro', 'Compra de vehículo nuevo / Cotización', 'Maquinarias C&P'
  UNION ALL SELECT 'nuevos', 'demo.cuestionario04@factoriq.test', '46-60', 'Masculino', 'Surco', 'La Molina', 'Consulta de financiamiento', 'Maquinarias Honda - La Molina'
  UNION ALL SELECT 'postventa', 'demo.cuestionario05@factoriq.test', '46-60', 'Femenino', 'La Molina', 'Ate', 'Servicio de Posventa / Mantenimiento / Reparación (Taller)', 'Maquinarias Honda - La Molina'
  UNION ALL SELECT 'postventa', 'demo.cuestionario06@factoriq.test', '26-35', 'Masculino', 'Surco', 'Surco', 'Servicio de Posventa / Mantenimiento / Reparación (Taller)', 'Maquinarias C&P'
  UNION ALL SELECT 'postventa', 'demo.cuestionario07@factoriq.test', '61 a más', 'Prefiero no decirlo', 'Comas', 'Surquillo', 'Servicio de Posventa / Mantenimiento / Reparación (Taller)', 'Maquinarias Seminuevos - Tomás Valle'
  UNION ALL SELECT 'postventa', 'demo.cuestionario08@factoriq.test', '36-45', 'Femenino', 'Miraflores', 'Ate', 'Servicio de Posventa / Mantenimiento / Reparación (Taller)', 'Maquinarias Nissan - Surquillo'
  UNION ALL SELECT 'semi_nuevos', 'demo.cuestionario09@factoriq.test', '36-45', 'Femenino', 'Comas', 'San Isidro', 'Compra de vehículo semi nuevo / Cotización', 'Maquinarias Seminuevos - Surquillo'
  UNION ALL SELECT 'semi_nuevos', 'demo.cuestionario10@factoriq.test', '26-35', 'Masculino', 'Surquillo', 'Miraflores', 'Compra de vehículo semi nuevo / Cotización', 'Maquinarias Seminuevos - Tomás Valle'
) v JOIN cuestionarios q ON q.cliente_id = @cliente_id AND q.codigo = v.codigo;

-- Completa todos los ítems de cada respuesta para que el detalle tenga contenido visual.
INSERT INTO cuestionario_respuesta_items (respuesta_id, pregunta_id, valor_texto, valor_numero, valor_json)
SELECT r.id, p.id,
  CASE
    WHEN p.orden IN (8, 9, 10, 11, 13, 14, 15, 16, 20, 21, 23, 26, 28, 29) THEN NULL
    WHEN p.orden = 1 THEN r.respondente_email
    WHEN p.orden = 2 THEN r.edad
    WHEN p.orden = 3 THEN r.sexo
    WHEN p.orden = 4 THEN r.distrito_residencia
    WHEN p.orden = 5 THEN r.distrito_laboral
    WHEN p.orden = 6 THEN r.sede_atencion
    WHEN p.orden = 7 THEN r.motivo_visita
    WHEN p.tipo = 'texto' THEN CONCAT('Respuesta demo para: ', p.texto)
    WHEN p.orden = 12 OR p.orden = 24 THEN 'Sí'
    WHEN p.orden = 17 THEN 'Personalizada'
    WHEN p.orden = 18 THEN 'Clara y transparente, requerí explicaciones adicionales'
    WHEN p.orden = 19 THEN 'Sí, 100% resuelta'
    WHEN p.orden = 30 THEN 'Sí, a tiempo'
    WHEN p.tipo = 'seleccion_unica' THEN JSON_UNQUOTE(JSON_EXTRACT(COALESCE(p.opciones, '["Sí"]'), '$[0]'))
    ELSE 'Respuesta completada'
  END,
  CASE
    WHEN p.orden = 26 THEN CASE WHEN r.id % 2 = 0 THEN 8 ELSE 9 END
    WHEN p.orden IN (8, 9, 10, 11, 13, 14, 15, 16, 20, 23, 28, 29) THEN 4 + (r.id % 2)
    ELSE NULL
  END,
  IF(p.orden = 21, JSON_ARRAY('Financiamiento / crédito', 'Cronograma y tiempos de entrega'), NULL)
FROM cuestionario_respuestas r
JOIN cuestionarios q ON q.id = r.cuestionario_id
JOIN cuestionario_preguntas p ON p.cuestionario_id = q.id AND p.activo = 1
WHERE q.cliente_id = @cliente_id AND r.respondente_email LIKE 'demo.cuestionario%@factoriq.test';

-- Verificación: cada respuesta debe tener una fila por cada pregunta activa
-- y ningún valor vacío en texto, número o JSON.
SELECT r.id, r.respondente_email,
       COUNT(DISTINCT p.id) AS preguntas_activas,
       COUNT(DISTINCT i.pregunta_id) AS respuestas_registradas,
       SUM(CASE WHEN i.id IS NULL
                  OR (NULLIF(TRIM(i.valor_texto), '') IS NULL
                      AND i.valor_numero IS NULL
                      AND i.valor_json IS NULL)
                THEN 1 ELSE 0 END) AS campos_sin_respuesta
FROM cuestionario_respuestas r
JOIN cuestionarios q ON q.id = r.cuestionario_id AND q.cliente_id = @cliente_id
JOIN cuestionario_preguntas p ON p.cuestionario_id = q.id AND p.activo = 1
LEFT JOIN cuestionario_respuesta_items i ON i.respuesta_id = r.id AND i.pregunta_id = p.id
WHERE r.respondente_email LIKE 'demo.cuestionario%@factoriq.test'
GROUP BY r.id, r.respondente_email
ORDER BY r.id;

COMMIT;
