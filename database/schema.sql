-- =============================================================
-- Factor IQ — Esquema MySQL 8.x (multi-cliente)
-- Motor: InnoDB | Charset: utf8mb4
-- Ejecutar primero este archivo, luego seed_maquinarias.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS factoriq
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE factoriq;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS evaluacion_preguntas;
DROP TABLE IF EXISTS evaluacion_indicadores;
DROP TABLE IF EXISTS evaluaciones;
DROP TABLE IF EXISTS indicadores;
DROP TABLE IF EXISTS sucursales;
DROP TABLE IF EXISTS proyectos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS clientes;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
-- 1. CLIENTES (empresas a las que Factor IQ les presta el servicio)
-- -------------------------------------------------------------
CREATE TABLE clientes (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(60)  NOT NULL,               -- usado en la URL: /maquinarias
  nombre_comercial VARCHAR(150) NOT NULL,
  razon_social     VARCHAR(200) NULL,
  ruc              VARCHAR(20)  NULL,
  rubro            VARCHAR(100) NULL,
  logo_url         VARCHAR(255) NULL,
  color_primario   VARCHAR(7)   NULL,                   -- #RRGGBB para personalizar su panel
  sitio_web        VARCHAR(255) NULL,
  contacto_nombre  VARCHAR(150) NULL,
  contacto_email   VARCHAR(150) NULL,
  contacto_telefono VARCHAR(30) NULL,
  plan             ENUM('basico','profesional','enterprise') NOT NULL DEFAULT 'basico',
  estado           ENUM('activo','suspendido','inactivo')    NOT NULL DEFAULT 'activo',
  notas_internas   TEXT NULL,                           -- solo visible para Factor IQ
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clientes_slug (slug),
  UNIQUE KEY uq_clientes_ruc (ruc)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 2. USUARIOS (superadmin de Factor IQ + usuarios de cada cliente)
-- -------------------------------------------------------------
CREATE TABLE usuarios (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id     BIGINT UNSIGNED NULL,                  -- NULL = superadmin de Factor IQ
  usuario        VARCHAR(60)  NOT NULL,                 -- login
  email          VARCHAR(150) NULL,
  password_hash  VARCHAR(255) NOT NULL,                 -- bcrypt/argon2, NUNCA texto plano
  nombre         VARCHAR(150) NOT NULL,
  rol            ENUM('superadmin','admin_cliente','viewer') NOT NULL DEFAULT 'viewer',
  estado         ENUM('activo','bloqueado','inactivo') NOT NULL DEFAULT 'activo',
  ultimo_acceso  DATETIME NULL,
  intentos_fallidos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_usuario (usuario),
  UNIQUE KEY uq_usuarios_email (email),
  KEY ix_usuarios_cliente (cliente_id),
  CONSTRAINT fk_usuarios_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 3. PROYECTOS / ESTUDIOS (cada levantamiento de datos de un cliente)
--    Ej.: "Mystery Shopping 2025" de Maquinarias
-- -------------------------------------------------------------
CREATE TABLE proyectos (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id  BIGINT UNSIGNED NOT NULL,
  nombre      VARCHAR(150) NOT NULL,
  tipo        VARCHAR(60)  NOT NULL DEFAULT 'mystery_shopping',
  periodo     VARCHAR(60)  NULL,                        -- "Base consolidada 2025"
  fuente      VARCHAR(255) NULL,                        -- archivo origen, p.ej. Excel
  estado      ENUM('borrador','activo','cerrado') NOT NULL DEFAULT 'activo',
  fecha_inicio DATE NULL,
  fecha_fin    DATE NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_proyectos_cliente (cliente_id),
  CONSTRAINT fk_proyectos_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 4. SUCURSALES / CONCESIONARIAS evaluadas
-- -------------------------------------------------------------
CREATE TABLE sucursales (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id  BIGINT UNSIGNED NOT NULL,
  nombre      VARCHAR(150) NOT NULL,                    -- ASTARA, WIGO MOTORS...
  marca       VARCHAR(80)  NULL,                        -- KIA, NISSAN...
  ubicacion   VARCHAR(150) NULL,                        -- SURQUILLO, JAVIER PRADO...
  estado      ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sucursal (cliente_id, nombre, marca, ubicacion),
  CONSTRAINT fk_sucursales_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 5. CATÁLOGO DE INDICADORES por proyecto y tipo de evaluación
-- -------------------------------------------------------------
CREATE TABLE indicadores (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  proyecto_id     BIGINT UNSIGNED NOT NULL,
  codigo          VARCHAR(30)  NULL,                     -- IND_01..IND_12, IND_CAL_01..IND_CAL_07
  tipo_evaluacion VARCHAR(60)  NOT NULL DEFAULT 'Ventas',-- 'Ventas' (aplica a Ventas y Seminuevos) o 'Call Center'
  orden           SMALLINT UNSIGNED NOT NULL,            -- n: 1..12 o 1..7
  nombre          VARCHAR(200) NOT NULL,
  peso            DECIMAL(5,4) NOT NULL DEFAULT 0,       -- 0.05, 0.10...
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_indicador (proyecto_id, tipo_evaluacion, orden),
  KEY ix_indicadores_codigo (proyecto_id, codigo),
  CONSTRAINT fk_indicadores_proyecto FOREIGN KEY (proyecto_id)
    REFERENCES proyectos (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 6. EVALUACIONES (una visita/evaluación a una sucursal)
-- -------------------------------------------------------------
CREATE TABLE evaluaciones (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(30)  NOT NULL,                  -- EV_VEN_6C68AAC811
  proyecto_id     BIGINT UNSIGNED NOT NULL,
  sucursal_id     BIGINT UNSIGNED NOT NULL,
  tipo_evaluacion VARCHAR(60)  NOT NULL DEFAULT 'Ventas', -- 'Ventas', 'Call Center', 'Seminuevos', 'Posventa'
  puntaje         DECIMAL(7,6) NOT NULL DEFAULT 0,        -- 0..1
  resumen         TEXT NULL,
  recomendaciones TEXT NULL,
  fecha_evaluacion DATE NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_evaluaciones_codigo (codigo),
  KEY ix_eval_proyecto (proyecto_id),
  KEY ix_eval_sucursal (sucursal_id),
  KEY ix_eval_tipo (tipo_evaluacion),
  CONSTRAINT fk_eval_proyecto FOREIGN KEY (proyecto_id)
    REFERENCES proyectos (id) ON DELETE CASCADE,
  CONSTRAINT fk_eval_sucursal FOREIGN KEY (sucursal_id)
    REFERENCES sucursales (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 7. RESULTADO POR INDICADOR de cada evaluación
-- -------------------------------------------------------------
CREATE TABLE evaluacion_indicadores (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  evaluacion_id  BIGINT UNSIGNED NOT NULL,
  indicador_id   BIGINT UNSIGNED NOT NULL,
  cumplimiento   DECIMAL(7,6) NOT NULL DEFAULT 0,       -- 0..1
  PRIMARY KEY (id),
  UNIQUE KEY uq_eval_ind (evaluacion_id, indicador_id),
  CONSTRAINT fk_ei_eval FOREIGN KEY (evaluacion_id)
    REFERENCES evaluaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_ei_indicador FOREIGN KEY (indicador_id)
    REFERENCES indicadores (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 8. RESPUESTAS A PREGUNTAS de cada evaluación
-- -------------------------------------------------------------
CREATE TABLE evaluacion_preguntas (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  evaluacion_id  BIGINT UNSIGNED NOT NULL,
  indicador_id   BIGINT UNSIGNED NOT NULL,
  pregunta       VARCHAR(500) NOT NULL,
  respuesta      VARCHAR(100) NULL,
  nota           VARCHAR(255) NULL,
  observacion    TEXT NULL,
  PRIMARY KEY (id),
  KEY ix_ep_eval (evaluacion_id),
  CONSTRAINT fk_ep_eval FOREIGN KEY (evaluacion_id)
    REFERENCES evaluaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_ep_indicador FOREIGN KEY (indicador_id)
    REFERENCES indicadores (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 9. AUDITORÍA (quién hizo qué en el panel administrador)
-- -------------------------------------------------------------
CREATE TABLE auditoria (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  BIGINT UNSIGNED NULL,
  cliente_id  BIGINT UNSIGNED NULL,
  accion      VARCHAR(80) NOT NULL,                     -- login, crear_usuario, editar_cliente...
  detalle     JSON NULL,
  ip          VARCHAR(45) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_aud_usuario (usuario_id),
  KEY ix_aud_cliente (cliente_id),
  CONSTRAINT fk_aud_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB;
