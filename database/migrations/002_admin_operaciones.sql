-- Factor IQ — ampliación no destructiva del panel de administración.
-- Ejecutar una sola vez sobre una base creada con database/schema.sql.
-- No elimina tablas ni datos existentes.

USE factoriq;

ALTER TABLE usuarios
  MODIFY rol ENUM('superadmin', 'admin_cliente', 'editor_web', 'soporte', 'viewer')
  NOT NULL DEFAULT 'viewer';

CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id BIGINT UNSIGNED NULL,
  proyecto_id BIGINT UNSIGNED NULL,
  creado_por_usuario_id BIGINT UNSIGNED NULL,
  asunto VARCHAR(180) NOT NULL,
  descripcion TEXT NULL,
  estado ENUM('abierto', 'en_analisis', 'resuelto') NOT NULL DEFAULT 'abierto',
  prioridad ENUM('alta', 'media', 'baja') NOT NULL DEFAULT 'media',
  asignado_a_usuario_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_tickets_cliente (cliente_id),
  KEY ix_tickets_proyecto (proyecto_id),
  KEY ix_tickets_estado (estado),
  CONSTRAINT fk_tickets_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_creado_por FOREIGN KEY (creado_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_asignado_a FOREIGN KEY (asignado_a_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_comentarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  usuario_id BIGINT UNSIGNED NULL,
  comentario TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_ticket_comentarios_ticket (ticket_id),
  CONSTRAINT fk_ticket_comentarios_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_comentarios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contenidos_web (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  clave VARCHAR(120) NOT NULL,
  titulo VARCHAR(255) NULL,
  contenido TEXT NULL,
  imagen_url VARCHAR(255) NULL,
  estado ENUM('borrador', 'publicado') NOT NULL DEFAULT 'borrador',
  actualizado_por_usuario_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_contenidos_web_clave (clave),
  CONSTRAINT fk_contenidos_web_usuario FOREIGN KEY (actualizado_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
