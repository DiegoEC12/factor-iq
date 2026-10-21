-- Cuestionarios de investigación de mercado para Maquinarias.
-- Ejecutar después de schema.sql. No contiene datos de prueba.

CREATE TABLE IF NOT EXISTS cuestionarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id BIGINT UNSIGNED NOT NULL,
  codigo VARCHAR(40) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cuestionarios_cliente_codigo (cliente_id, codigo),
  CONSTRAINT fk_cuestionarios_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cuestionario_preguntas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cuestionario_id BIGINT UNSIGNED NOT NULL,
  codigo VARCHAR(80) NOT NULL,
  bloque VARCHAR(160) NOT NULL,
  texto VARCHAR(700) NOT NULL,
  tipo ENUM('texto','seleccion_unica','seleccion_multiple','likert','nps','email','numero') NOT NULL,
  opciones JSON NULL,
  orden SMALLINT UNSIGNED NOT NULL,
  obligatorio TINYINT(1) NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cuestionario_pregunta_codigo (cuestionario_id, codigo),
  KEY ix_cuestionario_preguntas_orden (cuestionario_id, orden),
  CONSTRAINT fk_cuestionario_preguntas_cuestionario FOREIGN KEY (cuestionario_id)
    REFERENCES cuestionarios (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cuestionario_respuestas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cuestionario_id BIGINT UNSIGNED NOT NULL,
  respondente_email VARCHAR(255) NULL,
  edad VARCHAR(40) NULL,
  sexo VARCHAR(40) NULL,
  distrito_residencia VARCHAR(120) NULL,
  distrito_laboral VARCHAR(120) NULL,
  motivo_visita VARCHAR(255) NULL,
  sede_atencion VARCHAR(180) NULL,
  estado ENUM('iniciada','completa','anulada') NOT NULL DEFAULT 'completa',
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_respuestas_cuestionario_fecha (cuestionario_id, completed_at),
  KEY ix_respuestas_sede (sede_atencion),
  CONSTRAINT fk_respuestas_cuestionario FOREIGN KEY (cuestionario_id)
    REFERENCES cuestionarios (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cuestionario_respuesta_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  respuesta_id BIGINT UNSIGNED NOT NULL,
  pregunta_id BIGINT UNSIGNED NOT NULL,
  valor_texto TEXT NULL,
  valor_numero DECIMAL(10,2) NULL,
  valor_json JSON NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_respuesta_item (respuesta_id, pregunta_id),
  CONSTRAINT fk_respuesta_items_respuesta FOREIGN KEY (respuesta_id)
    REFERENCES cuestionario_respuestas (id) ON DELETE CASCADE,
  CONSTRAINT fk_respuesta_items_pregunta FOREIGN KEY (pregunta_id)
    REFERENCES cuestionario_preguntas (id) ON DELETE RESTRICT
) ENGINE=InnoDB;
