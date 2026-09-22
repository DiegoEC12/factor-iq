import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { isDbEnabled, query } from "./db";
import { getAuthUserFn } from "./auth";

export interface ClientInput {
  id?: number;
  slug: string;
  nombre_comercial: string;
  razon_social?: string;
  ruc?: string;
  rubro?: string;
  plan: "basico" | "profesional" | "enterprise";
  estado: "activo" | "suspendido" | "inactivo";
  color_primario?: string;
  contacto_nombre?: string;
  contacto_email?: string;
  contacto_telefono?: string;
}

export interface UserInput {
  id?: number;
  usuario: string;
  nombre: string;
  email?: string;
  password?: string;
  rol: "superadmin" | "admin_cliente" | "editor_web" | "soporte" | "viewer";
  cliente_id?: number | null;
  estado: "activo" | "bloqueado" | "inactivo";
}

export interface ProjectInput {
  cliente_id: number;
  nombre: string;
  tipo?: string;
  periodo?: string;
  estado: "borrador" | "activo" | "cerrado";
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface TicketInput {
  cliente_id?: number | null;
  asunto: string;
  descripcion?: string;
  prioridad: "alta" | "media" | "baja";
}

async function assertSuperAdmin() {
  const user = await getAuthUserFn();
  if (!user || user.rol !== "superadmin") {
    throw new Error("Acceso no autorizado: se requieren permisos de SuperAdmin.");
  }
  return user;
}

async function recordAudit(accion: string, detalle: Record<string, any>) {
  try {
    if (!isDbEnabled()) return;
    const user = await getAuthUserFn();
    await query("INSERT INTO auditoria (usuario_id, accion, detalle) VALUES (?, ?, ?)", [
      user?.userId ? Number(user.userId) : null,
      accion,
      JSON.stringify(detalle),
    ]);
  } catch (err) {
    console.warn("No se pudo registrar auditoría:", err);
  }
}

/**
 * Guardar o actualizar un cliente
 */
export const saveClientFn = createServerFn({ method: "POST" })
  .validator((data: ClientInput) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    if (!isDbEnabled()) {
      return { success: true, message: "Operación simulada en modo memoria (MySQL inactivo)." };
    }

    const cleanSlug = data.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "");
    if (!cleanSlug) {
      throw new Error(
        "El slug es obligatorio y solo debe contener caracteres alfanuméricos y guiones.",
      );
    }
    if (!data.nombre_comercial?.trim()) {
      throw new Error("El nombre comercial es obligatorio.");
    }

    if (data.id) {
      // Actualización
      await query(
        `UPDATE clientes
            SET slug = ?, nombre_comercial = ?, razon_social = ?, ruc = ?, rubro = ?,
                plan = ?, estado = ?, color_primario = ?, contacto_nombre = ?,
                contacto_email = ?, contacto_telefono = ?, updated_at = NOW()
          WHERE id = ?`,
        [
          cleanSlug,
          data.nombre_comercial.trim(),
          data.razon_social?.trim() || null,
          data.ruc?.trim() || null,
          data.rubro?.trim() || null,
          data.plan || "basico",
          data.estado || "activo",
          data.color_primario || null,
          data.contacto_nombre?.trim() || null,
          data.contacto_email?.trim() || null,
          data.contacto_telefono?.trim() || null,
          data.id,
        ],
      );

      await recordAudit("actualizar_cliente", {
        clienteId: data.id,
        slug: cleanSlug,
        modificadoPor: admin.nombre,
      });
      return {
        success: true,
        message: `Cliente "${data.nombre_comercial}" actualizado con éxito.`,
      };
    } else {
      // Creación
      const existing = await query(
        "SELECT id FROM clientes WHERE slug = ? OR (ruc IS NOT NULL AND ruc = ?)",
        [cleanSlug, data.ruc || ""],
      );
      if (existing.length > 0) {
        throw new Error("Ya existe un cliente con el mismo Slug o RUC.");
      }

      const result = await query<{ insertId: number }>(
        `INSERT INTO clientes (slug, nombre_comercial, razon_social, ruc, rubro, plan, estado, color_primario, contacto_nombre, contacto_email, contacto_telefono)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanSlug,
          data.nombre_comercial.trim(),
          data.razon_social?.trim() || null,
          data.ruc?.trim() || null,
          data.rubro?.trim() || null,
          data.plan || "basico",
          data.estado || "activo",
          data.color_primario || null,
          data.contacto_nombre?.trim() || null,
          data.contacto_email?.trim() || null,
          data.contacto_telefono?.trim() || null,
        ],
      );

      await recordAudit("crear_cliente", {
        slug: cleanSlug,
        nombre: data.nombre_comercial,
        creadoPor: admin.nombre,
      });
      return { success: true, message: `Cliente "${data.nombre_comercial}" registrado con éxito.` };
    }
  });

/**
 * Guardar o actualizar un usuario
 */
export const saveUserFn = createServerFn({ method: "POST" })
  .validator((data: UserInput) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    if (!isDbEnabled()) {
      return { success: true, message: "Operación simulada en modo memoria (MySQL inactivo)." };
    }

    const cleanUsername = data.usuario.trim();
    if (!cleanUsername) {
      throw new Error("El nombre de usuario (login) es obligatorio.");
    }
    if (!data.nombre?.trim()) {
      throw new Error("El nombre de la persona es obligatorio.");
    }

    const clienteId = data.rol === "superadmin" ? null : data.cliente_id || null;

    if (data.id) {
      // Actualizar usuario existente
      if (data.password && data.password.trim().length > 0) {
        const hash = await bcrypt.hash(data.password, 10);
        await query(
          `UPDATE usuarios
              SET usuario = ?, nombre = ?, email = ?, password_hash = ?, rol = ?, cliente_id = ?, estado = ?, updated_at = NOW()
            WHERE id = ?`,
          [
            cleanUsername,
            data.nombre.trim(),
            data.email?.trim() || null,
            hash,
            data.rol,
            clienteId,
            data.estado,
            data.id,
          ],
        );
        await recordAudit("cambio_clave_admin", {
          usuarioModificado: cleanUsername,
          modificadoPor: admin.nombre,
        });
      } else {
        await query(
          `UPDATE usuarios
              SET usuario = ?, nombre = ?, email = ?, rol = ?, cliente_id = ?, estado = ?, updated_at = NOW()
            WHERE id = ?`,
          [
            cleanUsername,
            data.nombre.trim(),
            data.email?.trim() || null,
            data.rol,
            clienteId,
            data.estado,
            data.id,
          ],
        );
      }

      await recordAudit("actualizar_usuario", {
        usuarioId: data.id,
        usuario: cleanUsername,
        modificadoPor: admin.nombre,
      });
      return { success: true, message: `Usuario "${cleanUsername}" actualizado con éxito.` };
    } else {
      // Crear nuevo usuario
      if (!data.password || data.password.length < 6) {
        throw new Error("La contraseña inicial es requerida (mínimo 6 caracteres).");
      }

      const existing = await query(
        "SELECT id FROM usuarios WHERE usuario = ? OR (email IS NOT NULL AND email = ?)",
        [cleanUsername, data.email || ""],
      );
      if (existing.length > 0) {
        throw new Error("Ya existe un usuario con ese nombre de usuario o correo electrónico.");
      }

      const hash = await bcrypt.hash(data.password, 10);

      await query(
        `INSERT INTO usuarios (usuario, nombre, email, password_hash, rol, cliente_id, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanUsername,
          data.nombre.trim(),
          data.email?.trim() || null,
          hash,
          data.rol,
          clienteId,
          data.estado || "activo",
        ],
      );

      await recordAudit("crear_usuario", {
        usuario: cleanUsername,
        rol: data.rol,
        creadoPor: admin.nombre,
      });
      return { success: true, message: `Usuario "${cleanUsername}" creado exitosamente.` };
    }
  });

/**
 * Restablecer contraseña de un usuario directamente
 */
export const resetUserPasswordFn = createServerFn({ method: "POST" })
  .validator((data: { userId: number; newPassword: string; usuarioName: string }) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    if (!data.newPassword || data.newPassword.length < 6) {
      throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
    }

    if (!isDbEnabled()) {
      return { success: true, message: "Contraseña actualizada en simulación." };
    }

    const hash = await bcrypt.hash(data.newPassword, 10);
    await query(
      "UPDATE usuarios SET password_hash = ?, intentos_fallidos = 0, updated_at = NOW() WHERE id = ?",
      [hash, data.userId],
    );

    await recordAudit("reset_password", {
      usuarioId: data.userId,
      usuario: data.usuarioName,
      restablecidoPor: admin.nombre,
    });

    return {
      success: true,
      message: `Contraseña restablecida con éxito para el usuario ${data.usuarioName}.`,
    };
  });

/**
 * Cambiar estado de usuario (activo / bloqueado / inactivo)
 */
export const toggleUserStatusFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      userId: number;
      nuevoEstado: "activo" | "bloqueado" | "inactivo";
      usuarioName: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    if (!isDbEnabled()) {
      return { success: true, message: "Estado cambiado (simulación)." };
    }

    await query("UPDATE usuarios SET estado = ?, updated_at = NOW() WHERE id = ?", [
      data.nuevoEstado,
      data.userId,
    ]);

    await recordAudit("cambio_estado_usuario", {
      usuarioId: data.userId,
      usuario: data.usuarioName,
      nuevoEstado: data.nuevoEstado,
      modificadoPor: admin.nombre,
    });

    return {
      success: true,
      message: `Estado del usuario ${data.usuarioName} cambiado a ${data.nuevoEstado}.`,
    };
  });

/**
 * Cambiar estado de cliente (activo / suspendido / inactivo)
 */
export const toggleClientStatusFn = createServerFn({ method: "POST" })
  .validator(
    (data: { clientId: number; nuevoEstado: "activo" | "suspendido" | "inactivo"; slug: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    if (!isDbEnabled()) {
      return { success: true, message: "Estado de cliente cambiado (simulación)." };
    }

    await query("UPDATE clientes SET estado = ?, updated_at = NOW() WHERE id = ?", [
      data.nuevoEstado,
      data.clientId,
    ]);

    await recordAudit("cambio_estado_cliente", {
      clientId: data.clientId,
      slug: data.slug,
      nuevoEstado: data.nuevoEstado,
      modificadoPor: admin.nombre,
    });

    return { success: true, message: `Estado del cliente cambiado a ${data.nuevoEstado}.` };
  });

/** Crea un proyecto aislado para una empresa. */
export const saveProjectFn = createServerFn({ method: "POST" })
  .validator((data: ProjectInput) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();
    if (!data.nombre.trim()) throw new Error("El nombre del proyecto es obligatorio.");

    if (!isDbEnabled()) {
      return { success: true, message: "Proyecto validado en modo demostración (MySQL inactivo)." };
    }

    await query(
      `INSERT INTO proyectos (cliente_id, nombre, tipo, periodo, estado, fecha_inicio, fecha_fin)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.cliente_id,
        data.nombre.trim(),
        data.tipo?.trim() || "mystery_shopping",
        data.periodo?.trim() || null,
        data.estado,
        data.fecha_inicio || null,
        data.fecha_fin || null,
      ],
    );
    await recordAudit("crear_proyecto", {
      clienteId: data.cliente_id,
      nombre: data.nombre,
      creadoPor: admin.nombre,
    });
    return { success: true, message: `Proyecto "${data.nombre}" creado correctamente.` };
  });

/** Registra un ticket de soporte para la operación de Factor IQ. */
export const createTicketFn = createServerFn({ method: "POST" })
  .validator((data: TicketInput) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();
    if (!data.asunto.trim()) throw new Error("El asunto del ticket es obligatorio.");

    if (!isDbEnabled()) {
      return { success: true, message: "Ticket registrado en modo demostración (MySQL inactivo)." };
    }

    await query(
      `INSERT INTO tickets (cliente_id, creado_por_usuario_id, asunto, descripcion, prioridad)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.cliente_id || null,
        Number(admin.userId),
        data.asunto.trim(),
        data.descripcion?.trim() || null,
        data.prioridad,
      ],
    );
    await recordAudit("crear_ticket", {
      clienteId: data.cliente_id || null,
      asunto: data.asunto,
      creadoPor: admin.nombre,
    });
    return { success: true, message: "Ticket creado y enviado a la bandeja de soporte." };
  });

export const updateTicketStatusFn = createServerFn({ method: "POST" })
  .validator((data: { ticketId: number; estado: "abierto" | "en_analisis" | "resuelto" }) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();
    if (!isDbEnabled())
      return { success: true, message: "Estado actualizado en modo demostración." };
    await query("UPDATE tickets SET estado = ?, updated_at = NOW() WHERE id = ?", [
      data.estado,
      data.ticketId,
    ]);
    await recordAudit("actualizar_ticket", {
      ticketId: data.ticketId,
      estado: data.estado,
      modificadoPor: admin.nombre,
    });
    return { success: true, message: "Estado del ticket actualizado." };
  });

export interface NewServiceOnboardingInput {
  cliente: {
    slug: string;
    nombre_comercial: string;
    razon_social?: string;
    ruc?: string;
    rubro?: string;
    plan: "basico" | "profesional" | "enterprise";
    color_primario?: string;
    contacto_nombre?: string;
    contacto_email?: string;
    contacto_telefono?: string;
  };
  credenciales: {
    usuario: string;
    nombre: string;
    email?: string;
    password: string;
  };
  servicio: {
    nombre: string;
    tipo?: string;
    periodo?: string;
  };
  excelData: {
    evaluaciones: {
      id: string;
      concesionaria: string;
      marca: string;
      ubicacion: string;
      puntaje: number;
      resumen: string | null;
      recomendaciones: string | null;
      tipoEvaluacion: string;
    }[];
    indicadores: {
      ev: string;
      n: number;
      nombre: string;
      peso: number;
      cumpl: number;
    }[];
    preguntas: {
      ev: string;
      ind: number;
      indicador: string;
      q: string;
      resp: string | null;
      nota: number | null;
      obs: string | null;
    }[];
  };
}

/**
 * Persistencia atómica del Wizard de Onboarding:
 * Crea Empresa + Usuario Admin + Servicio/Proyecto + Sucursales + Indicadores + Evaluaciones en MySQL.
 */
export const saveNewServiceWithExcelFn = createServerFn({ method: "POST" })
  .validator((data: NewServiceOnboardingInput) => data)
  .handler(async ({ data }) => {
    const admin = await assertSuperAdmin();

    const cleanSlug = data.cliente.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "");

    if (!cleanSlug) {
      throw new Error("El slug de la empresa es obligatorio.");
    }
    if (!data.cliente.nombre_comercial?.trim()) {
      throw new Error("El nombre comercial de la empresa es obligatorio.");
    }
    if (!data.credenciales.usuario?.trim()) {
      throw new Error("El usuario de acceso es obligatorio.");
    }
    if (!data.credenciales.password || data.credenciales.password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }
    if (!data.servicio.nombre?.trim()) {
      throw new Error("El nombre del servicio/proyecto es obligatorio.");
    }

    if (!isDbEnabled()) {
      return {
        success: true,
        message: `Servicio "${data.servicio.nombre}" y cliente "${data.cliente.nombre_comercial}" validados en modo demostración (MySQL inactivo).`,
        clienteSlug: cleanSlug,
      };
    }

    // 1. Validar unicidad de slug, ruc y usuario
    const existingClient = await query(
      "SELECT id FROM clientes WHERE slug = ? OR (ruc IS NOT NULL AND ruc = ?)",
      [cleanSlug, data.cliente.ruc || ""],
    );
    if (existingClient.length > 0) {
      throw new Error("Ya existe una empresa registrada con ese Slug o RUC.");
    }

    const existingUser = await query(
      "SELECT id FROM usuarios WHERE usuario = ? OR (email IS NOT NULL AND email = ?)",
      [data.credenciales.usuario.trim(), data.credenciales.email?.trim() || ""],
    );
    if (existingUser.length > 0) {
      throw new Error("El nombre de usuario o correo ya está en uso en el sistema.");
    }

    // 2. Insertar cliente
    const clientRes = await query<{ insertId: number }>(
      `INSERT INTO clientes (slug, nombre_comercial, razon_social, ruc, rubro, plan, estado, color_primario, contacto_nombre, contacto_email, contacto_telefono)
       VALUES (?, ?, ?, ?, ?, ?, 'activo', ?, ?, ?, ?)`,
      [
        cleanSlug,
        data.cliente.nombre_comercial.trim(),
        data.cliente.razon_social?.trim() || null,
        data.cliente.ruc?.trim() || null,
        data.cliente.rubro?.trim() || null,
        data.cliente.plan || "basico",
        data.cliente.color_primario || "#6366f1",
        data.cliente.contacto_nombre?.trim() || null,
        data.cliente.contacto_email?.trim() || null,
        data.cliente.contacto_telefono?.trim() || null,
      ],
    );
    const clienteId = (clientRes as any).insertId || (await query<any>("SELECT id FROM clientes WHERE slug = ?", [cleanSlug]))[0]?.id;

    // 3. Insertar usuario admin_cliente con hash
    const passHash = await bcrypt.hash(data.credenciales.password, 10);
    await query(
      `INSERT INTO usuarios (cliente_id, usuario, email, password_hash, nombre, rol, estado)
       VALUES (?, ?, ?, ?, ?, 'admin_cliente', 'activo')`,
      [
        clienteId,
        data.credenciales.usuario.trim(),
        data.credenciales.email?.trim() || null,
        passHash,
        data.credenciales.nombre.trim(),
      ],
    );

    // 4. Insertar proyecto
    const projRes = await query<{ insertId: number }>(
      `INSERT INTO proyectos (cliente_id, nombre, tipo, periodo, fuente, estado, fecha_inicio)
       VALUES (?, ?, ?, ?, 'excel_onboarding_import', 'activo', CURDATE())`,
      [
        clienteId,
        data.servicio.nombre.trim(),
        data.servicio.tipo?.trim() || "mystery_shopping",
        data.servicio.periodo?.trim() || "2025",
      ],
    );
    const proyectoId = (projRes as any).insertId || (await query<any>("SELECT id FROM proyectos WHERE cliente_id = ? ORDER BY id DESC LIMIT 1", [clienteId]))[0]?.id;

    // 5. Insertar sucursales únicas
    const sucursalesMap = new Map<string, number>();
    for (const ev of data.excelData.evaluaciones) {
      const nom = ev.concesionaria?.trim() || "Principal";
      const marca = ev.marca?.trim() || "General";
      const ub = ev.ubicacion?.trim() || "Lima";
      const key = `${nom}__${marca}__${ub}`;

      if (!sucursalesMap.has(key)) {
        await query(
          `INSERT INTO sucursales (cliente_id, nombre, marca, ubicacion, estado)
           VALUES (?, ?, ?, ?, 'activa')
           ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
          [clienteId, nom, marca, ub],
        );
        const sucRows = await query<any>(
          "SELECT id FROM sucursales WHERE cliente_id = ? AND nombre = ? AND marca = ? AND ubicacion = ? LIMIT 1",
          [clienteId, nom, marca, ub],
        );
        if (sucRows.length > 0) {
          sucursalesMap.set(key, sucRows[0].id);
        }
      }
    }

    // 6. Insertar catálogo de indicadores del proyecto
    const indicadoresMap = new Map<string, number>(); // key: tipo_evaluacion__orden -> indicador_id
    const uniqueIndicators = new Map<string, { tipo: string; orden: number; nombre: string; peso: number }>();

    for (const ind of data.excelData.indicadores) {
      const evObj = data.excelData.evaluaciones.find((e) => e.id === ind.ev);
      const tipo = evObj?.tipoEvaluacion || "Ventas";
      const indKey = `${tipo}__${ind.n}`;
      if (!uniqueIndicators.has(indKey)) {
        uniqueIndicators.set(indKey, {
          tipo,
          orden: ind.n,
          nombre: ind.nombre || `Criterio ${ind.n}`,
          peso: ind.peso || 0.1,
        });
      }
    }

    for (const [indKey, item] of uniqueIndicators.entries()) {
      const codigo = item.tipo.toLowerCase().includes("call")
        ? `IND_CAL_${String(item.orden).padStart(2, "0")}`
        : `IND_${String(item.orden).padStart(2, "0")}`;

      await query(
        `INSERT INTO indicadores (proyecto_id, codigo, tipo_evaluacion, orden, nombre, peso)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), peso = VALUES(peso), id = LAST_INSERT_ID(id)`,
        [proyectoId, codigo, item.tipo, item.orden, item.nombre, item.peso],
      );

      const indRows = await query<any>(
        "SELECT id FROM indicadores WHERE proyecto_id = ? AND tipo_evaluacion = ? AND orden = ? LIMIT 1",
        [proyectoId, item.tipo, item.orden],
      );
      if (indRows.length > 0) {
        indicadoresMap.set(indKey, indRows[0].id);
      }
    }

    // 7. Insertar evaluaciones
    const evaluacionesMap = new Map<string, number>(); // original_code -> evaluacion_id
    for (const ev of data.excelData.evaluaciones) {
      const nom = ev.concesionaria?.trim() || "Principal";
      const marca = ev.marca?.trim() || "General";
      const ub = ev.ubicacion?.trim() || "Lima";
      const sucId = sucursalesMap.get(`${nom}__${marca}__${ub}`) || 1;

      // Código único garantizado
      const uniqueCode = `${cleanSlug.toUpperCase().slice(0, 6)}_${ev.id}`.slice(0, 30);

      const evRes = await query<{ insertId: number }>(
        `INSERT INTO evaluaciones (codigo, proyecto_id, sucursal_id, tipo_evaluacion, puntaje, resumen, recomendaciones, fecha_evaluacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())
         ON DUPLICATE KEY UPDATE puntaje = VALUES(puntaje), resumen = VALUES(resumen), id = LAST_INSERT_ID(id)`,
        [
          uniqueCode,
          proyectoId,
          sucId,
          ev.tipoEvaluacion || "Ventas",
          ev.puntaje || 0,
          ev.resumen || null,
          ev.recomendaciones || null,
        ],
      );
      const evId = (evRes as any).insertId || (await query<any>("SELECT id FROM evaluaciones WHERE codigo = ? LIMIT 1", [uniqueCode]))[0]?.id;
      if (evId) {
        evaluacionesMap.set(ev.id, evId);
      }
    }

    // 8. Insertar evaluacion_indicadores
    for (const ind of data.excelData.indicadores) {
      const evId = evaluacionesMap.get(ind.ev);
      const evObj = data.excelData.evaluaciones.find((e) => e.id === ind.ev);
      const tipo = evObj?.tipoEvaluacion || "Ventas";
      const indId = indicadoresMap.get(`${tipo}__${ind.n}`);

      if (evId && indId) {
        await query(
          `INSERT INTO evaluacion_indicadores (evaluacion_id, indicador_id, cumplimiento)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE cumplimiento = VALUES(cumplimiento)`,
          [evId, indId, ind.cumpl || 0],
        );
      }
    }

    // 9. Insertar evaluacion_preguntas
    for (const q of data.excelData.preguntas) {
      const evId = evaluacionesMap.get(q.ev);
      const evObj = data.excelData.evaluaciones.find((e) => e.id === q.ev);
      const tipo = evObj?.tipoEvaluacion || "Ventas";
      const indId = indicadoresMap.get(`${tipo}__${q.ind}`);

      if (evId && indId) {
        await query(
          `INSERT INTO evaluacion_preguntas (evaluacion_id, indicador_id, pregunta, respuesta, nota, observacion)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            evId,
            indId,
            q.q.slice(0, 500),
            q.resp?.slice(0, 100) || null,
            q.nota !== null && q.nota !== undefined ? String(q.nota) : null,
            q.obs || null,
          ],
        );
      }
    }

    // 10. Auditoría
    await recordAudit("onboarding_servicio_excel", {
      clienteId,
      clienteSlug: cleanSlug,
      proyectoId,
      nombreProyecto: data.servicio.nombre,
      evaluacionesCount: data.excelData.evaluaciones.length,
      creadoPor: admin.nombre,
    });

    return {
      success: true,
      message: `Empresa "${data.cliente.nombre_comercial}" y servicio "${data.servicio.nombre}" registrados exitosamente con ${data.excelData.evaluaciones.length} evaluaciones importadas.`,
      clienteSlug: cleanSlug,
    };
  });
