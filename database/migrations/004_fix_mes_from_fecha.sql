-- Factor IQ — corrección de periodos históricos.
-- Ejecutar si 003_historic_trends.sql ya fue aplicado.
-- fecha_evaluacion siempre tiene prioridad sobre mes.

USE factoriq;

UPDATE evaluaciones
   SET mes = LPAD(MONTH(fecha_evaluacion), 2, '0')
 WHERE proyecto_id = 1
   AND fecha_evaluacion IS NOT NULL;

UPDATE evaluaciones
   SET mes = '08'
 WHERE proyecto_id = 1
   AND fecha_evaluacion IS NULL;
