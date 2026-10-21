-- Datos de prueba para visualizar el dashboard de Cuestionarios.
-- Ejecutar después de migration_cuestionarios.sql.
-- Este script elimina únicamente las respuestas de prueba identificadas por email.

USE factoriq;
START TRANSACTION;

SET @cliente_id = (SELECT id FROM clientes WHERE slug = 'maquinarias' LIMIT 1);

INSERT INTO cuestionarios (cliente_id, codigo, nombre, descripcion)
VALUES
  (@cliente_id, 'nuevos', 'Nuevos', 'Experiencia de compra y cotización.'),
  (@cliente_id, 'postventa', 'Post Venta', 'Experiencia de taller, mantenimiento y servicio.'),
  (@cliente_id, 'semi_nuevos', 'Semi Nuevos', 'Experiencia de compra de vehículos seminuevos.')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion), estado = 'activo';

INSERT INTO cuestionario_preguntas (cuestionario_id, codigo, bloque, texto, tipo, orden, obligatorio)
SELECT q.id, 'B4_P3_CSAT', 'Experiencia emocional y satisfacción', 'Evaluación general de experiencia', 'likert', 1, 1
FROM cuestionarios q WHERE q.cliente_id = @cliente_id
ON DUPLICATE KEY UPDATE texto = VALUES(texto), tipo = VALUES(tipo);

INSERT INTO cuestionario_preguntas (cuestionario_id, codigo, bloque, texto, tipo, orden, obligatorio)
SELECT q.id, 'B4_P10_NPS', 'Experiencia emocional y satisfacción', 'Probabilidad de recomendar Maquinarias', 'nps', 2, 1
FROM cuestionarios q WHERE q.cliente_id = @cliente_id
ON DUPLICATE KEY UPDATE texto = VALUES(texto), tipo = VALUES(tipo);

DELETE r FROM cuestionario_respuestas r
JOIN cuestionarios q ON q.id = r.cuestionario_id
WHERE q.cliente_id = @cliente_id AND r.respondente_email LIKE 'prueba.cuestionario%@factoriq.test';

INSERT INTO cuestionario_respuestas
  (cuestionario_id, respondente_email, edad, sexo, distrito_residencia, distrito_laboral, motivo_visita, sede_atencion, estado, started_at, completed_at)
SELECT q.id, v.email, v.edad, v.sexo, v.residencia, v.laboral, v.motivo, v.sede, 'completa', NOW(), NOW()
FROM (
  SELECT 'nuevos' codigo, 'prueba.cuestionario01@factoriq.test' email, '26-35' edad, 'Femenino' sexo, 'Surquillo' residencia, 'Miraflores' laboral, 'Compra de vehículo nuevo / Cotización' motivo, 'Maquinarias Nissan - Surquillo' sede, 5 csat, 9 nps
  UNION ALL SELECT 'nuevos', 'prueba.cuestionario02@factoriq.test', '36-45', 'Masculino', 'San Miguel', 'Lince', 'Compra de vehículo nuevo / Cotización', 'Maquinarias Hyundai - Surquillo', 4, 8
  UNION ALL SELECT 'postventa', 'prueba.cuestionario03@factoriq.test', '46-60', 'Femenino', 'La Molina', 'Ate', 'Servicio de Posventa / Mantenimiento / Reparación (Taller)', 'Maquinarias Honda - La Molina', 4, 7
  UNION ALL SELECT 'postventa', 'prueba.cuestionario04@factoriq.test', '26-35', 'Masculino', 'Surco', 'Surco', 'Servicio de Posventa / Mantenimiento / Reparación (Taller)', 'Maquinarias C&P', 3, 6
  UNION ALL SELECT 'semi_nuevos', 'prueba.cuestionario05@factoriq.test', '36-45', 'Femenino', 'Comas', 'San Isidro', 'Compra de vehículo semi nuevo / Cotización', 'Maquinarias Seminuevos - Surquillo', 5, 10
) v
JOIN cuestionarios q ON q.cliente_id = @cliente_id AND q.codigo = v.codigo;

INSERT INTO cuestionario_respuesta_items (respuesta_id, pregunta_id, valor_numero)
SELECT r.id, p.id, v.csat
FROM cuestionario_respuestas r
JOIN cuestionarios q ON q.id = r.cuestionario_id
JOIN cuestionario_preguntas p ON p.cuestionario_id = q.id AND p.codigo = 'B4_P3_CSAT'
JOIN (
  SELECT 'prueba.cuestionario01@factoriq.test' email, 5 csat, 9 nps UNION ALL
  SELECT 'prueba.cuestionario02@factoriq.test', 4, 8 UNION ALL
  SELECT 'prueba.cuestionario03@factoriq.test', 4, 7 UNION ALL
  SELECT 'prueba.cuestionario04@factoriq.test', 3, 6 UNION ALL
  SELECT 'prueba.cuestionario05@factoriq.test', 5, 10
) v ON v.email = r.respondente_email;

INSERT INTO cuestionario_respuesta_items (respuesta_id, pregunta_id, valor_numero)
SELECT r.id, p.id, v.nps
FROM cuestionario_respuestas r
JOIN cuestionarios q ON q.id = r.cuestionario_id
JOIN cuestionario_preguntas p ON p.cuestionario_id = q.id AND p.codigo = 'B4_P10_NPS'
JOIN (
  SELECT 'prueba.cuestionario01@factoriq.test' email, 9 nps UNION ALL
  SELECT 'prueba.cuestionario02@factoriq.test', 8 UNION ALL
  SELECT 'prueba.cuestionario03@factoriq.test', 7 UNION ALL
  SELECT 'prueba.cuestionario04@factoriq.test', 6 UNION ALL
  SELECT 'prueba.cuestionario05@factoriq.test', 10
) v ON v.email = r.respondente_email;

COMMIT;
