-- Versionado de configuración. Ejecutar después de migration_cuestionarios.sql.
USE factoriq;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cuestionarios' AND COLUMN_NAME = 'version') = 0,
  'ALTER TABLE cuestionarios ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cuestionarios' AND COLUMN_NAME = 'publicado_at') = 0,
  'ALTER TABLE cuestionarios ADD COLUMN publicado_at DATETIME NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cuestionario_preguntas' AND COLUMN_NAME = 'version') = 0,
  'ALTER TABLE cuestionario_preguntas ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cuestionario_preguntas' AND COLUMN_NAME = 'tipo_respuesta') = 0,
  'ALTER TABLE cuestionario_preguntas ADD COLUMN tipo_respuesta VARCHAR(40) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
