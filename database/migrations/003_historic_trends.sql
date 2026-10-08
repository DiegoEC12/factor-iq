-- Factor IQ — soporte para tendencias históricas por mes.
-- Ejecutar después de 002_admin_operaciones.sql sobre la base factoriq.
-- La operación conserva todos los registros existentes.

USE factoriq;

ALTER TABLE evaluaciones
  ADD COLUMN mes VARCHAR(30) NULL AFTER fecha_evaluacion;

-- La fecha real tiene prioridad. Los registros sin fecha son el histórico de agosto.
UPDATE evaluaciones
   SET mes = LPAD(MONTH(fecha_evaluacion), 2, '0')
 WHERE proyecto_id = 1
   AND fecha_evaluacion IS NOT NULL;

UPDATE evaluaciones
   SET mes = '08'
 WHERE proyecto_id = 1
   AND fecha_evaluacion IS NULL
   AND (mes IS NULL OR mes = '');

ALTER TABLE evaluaciones
  ADD INDEX ix_eval_mes_tipo (mes, tipo_evaluacion);
