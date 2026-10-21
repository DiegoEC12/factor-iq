import { createServerFn } from "@tanstack/react-start";
import { isDbEnabled, query, withTransaction } from "@/lib/db";

export type QuestionnaireQuestionPayload = {
  id: number;
  text: string;
  options: string[];
  active: boolean;
  required: boolean;
  kind: "text" | "select" | "checks" | "scale" | "textarea";
  min?: number;
  max?: number;
};

function normalizeQuestionnaireKind(
  value: string | null | undefined,
): QuestionnaireQuestionPayload["kind"] {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "likert" || normalized === "scale" || normalized === "escala") {
    return "scale";
  }
  if (
    normalized === "seleccion_multiple" ||
    normalized === "multiple" ||
    normalized === "checks" ||
    normalized === "checkbox"
  ) {
    return "checks";
  }
  if (
    normalized === "texto" ||
    normalized === "texto_corto" ||
    normalized === "text" ||
    normalized === "input"
  ) {
    return "text";
  }
  if (normalized === "texto_largo" || normalized === "textarea") {
    return "textarea";
  }
  return "select";
}

export type SaveQuestionnairePayload = {
  clientSlug: string;
  code: "nuevos" | "postventa" | "semi_nuevos";
  questions: QuestionnaireQuestionPayload[];
};

export type QuestionnaireConfig = Record<
  SaveQuestionnairePayload["code"],
  QuestionnaireQuestionPayload[]
>;

export type QuestionnaireSummary = {
  codigo: "nuevos" | "postventa" | "semi_nuevos";
  nombre: string;
  descripcion: string;
  respuestas: number;
  csat: number | null;
  nps: number | null;
};

export type QuestionnaireDashboard = {
  totalRespuestas: number;
  totalCompletas: number;
  csatPromedio: number | null;
  nps: number | null;
  cuestionarios: QuestionnaireSummary[];
  sedes: { sede: string; respuestas: number }[];
  meta: { status: "ready" | "empty" | "unavailable"; message: string | null };
};

export type QuestionnaireResponseSummary = {
  id: number;
  email: string | null;
  edad: string | null;
  distritoResidencia: string | null;
  distritoLaboral: string | null;
  nps: number | null;
  sede: string | null;
  estado: string;
  completedAt: string | null;
};

export type QuestionnaireResponseDetail = QuestionnaireResponseSummary & {
  sexo: string | null;
  distritoResidencia: string | null;
  distritoLaboral: string | null;
  motivo: string | null;
  answers: {
    id: number;
    code: string;
    question: string;
    value: string;
    kind: string;
    options: string[];
  }[];
};

const EMPTY: QuestionnaireDashboard = {
  totalRespuestas: 0,
  totalCompletas: 0,
  csatPromedio: null,
  nps: null,
  cuestionarios: [
    {
      codigo: "nuevos",
      nombre: "Nuevos",
      descripcion: "Experiencia de compra y cotización.",
      respuestas: 0,
      csat: null,
      nps: null,
    },
    {
      codigo: "postventa",
      nombre: "Post Venta",
      descripcion: "Experiencia de taller, mantenimiento y servicio.",
      respuestas: 0,
      csat: null,
      nps: null,
    },
    {
      codigo: "semi_nuevos",
      nombre: "Semi Nuevos",
      descripcion: "Experiencia de compra de vehículos seminuevos.",
      respuestas: 0,
      csat: null,
      nps: null,
    },
  ],
  sedes: [],
  meta: { status: "empty", message: "Aún no hay respuestas registradas." },
};

export const getQuestionnaireDashboardFn = createServerFn({ method: "GET" })
  .validator((clientSlug?: string) => clientSlug || "maquinarias")
  .handler(async ({ data: clientSlug }): Promise<QuestionnaireDashboard> => {
    if (!isDbEnabled()) {
      return { ...EMPTY, meta: { status: "unavailable", message: "MySQL no está configurado." } };
    }

    try {
      const summaries = await query<QuestionnaireSummary & { total: number }>(
        `SELECT q.codigo, q.nombre, q.descripcion,
                COUNT(DISTINCT r.id) AS respuestas,
                ROUND(AVG(CASE WHEN p.orden = 23 OR p.codigo LIKE '%_p_23' OR p.texto LIKE '%general de tu experiencia%' THEN i.valor_numero END), 2) AS csat,
                ROUND(AVG(CASE WHEN p.orden = 26 OR p.codigo LIKE '%_p_26' OR p.tipo = 'nps' OR LOWER(p.codigo) LIKE '%nps%' OR p.texto LIKE '%recomiend%' THEN i.valor_numero END), 2) AS nps,
                COUNT(DISTINCT r.id) AS total
           FROM cuestionarios q
           JOIN clientes c ON c.id = q.cliente_id AND c.slug = ?
           LEFT JOIN cuestionario_respuestas r ON r.cuestionario_id = q.id AND r.estado = 'completa'
           LEFT JOIN cuestionario_respuesta_items i ON i.respuesta_id = r.id
           LEFT JOIN cuestionario_preguntas p ON p.id = i.pregunta_id
          WHERE q.estado = 'activo'
          GROUP BY q.id, q.codigo, q.nombre, q.descripcion
          ORDER BY FIELD(q.codigo, 'nuevos', 'postventa', 'semi_nuevos')`,
        [clientSlug],
      );
      const globalMetrics = await query<{ csat: number | string | null; nps: number | string | null }>(
        `SELECT
           ROUND(AVG(CASE WHEN p.orden = 23 OR p.codigo LIKE '%_p_23' OR p.texto LIKE '%general de tu experiencia%' THEN i.valor_numero END), 2) AS csat,
           ROUND(AVG(CASE WHEN p.orden = 26 OR p.codigo LIKE '%_p_26' OR p.tipo = 'nps' OR LOWER(p.codigo) LIKE '%nps%' OR p.texto LIKE '%recomiend%' THEN i.valor_numero END), 2) AS nps
         FROM cuestionario_respuestas r
         JOIN cuestionarios q ON q.id = r.cuestionario_id
         JOIN clientes c ON c.id = q.cliente_id AND c.slug = ?
         JOIN cuestionario_respuesta_items i ON i.respuesta_id = r.id
         JOIN cuestionario_preguntas p ON p.id = i.pregunta_id
        WHERE r.estado = 'completa' AND q.estado = 'activo'`,
        [clientSlug],
      );
      const sedes = await query<{ sede: string; respuestas: number }>(
        `SELECT COALESCE(NULLIF(sede_atencion, ''), 'Sin sede') AS sede, COUNT(*) AS respuestas
           FROM cuestionario_respuestas r
           JOIN cuestionarios q ON q.id = r.cuestionario_id
           JOIN clientes c ON c.id = q.cliente_id AND c.slug = ?
          WHERE r.estado = 'completa'
          GROUP BY sede ORDER BY respuestas DESC LIMIT 8`,
        [clientSlug],
      );
      const summariesByCode = new Map(summaries.map((summary) => [summary.codigo, summary]));
      const result = {
        ...EMPTY,
        cuestionarios: EMPTY.cuestionarios.map((template) => {
          const summary = summariesByCode.get(template.codigo);
          if (!summary) return template;
          const { total: _total, ...row } = summary;
          return {
            ...template,
            ...row,
            csat: row.csat !== null && row.csat !== undefined ? Number(row.csat) : null,
            nps: row.nps !== null && row.nps !== undefined ? Number(row.nps) : null,
          };
        }),
        sedes,
      };
      const total = result.cuestionarios.reduce((sum, item) => sum + Number(item.respuestas), 0);
      const firstMetric = globalMetrics[0];
      const csatPromedio =
        firstMetric?.csat !== null && firstMetric?.csat !== undefined
          ? Number(firstMetric.csat)
          : null;
      const npsPromedio =
        firstMetric?.nps !== null && firstMetric?.nps !== undefined
          ? Number(firstMetric.nps)
          : null;

      return {
        ...result,
        totalRespuestas: total,
        totalCompletas: total,
        csatPromedio,
        nps: npsPromedio,
        meta: { status: total ? "ready" : "empty", message: total ? null : EMPTY.meta.message },
      };
    } catch {
      return {
        ...EMPTY,
        meta: {
          status: "unavailable",
          message: "No se pudo consultar el módulo de cuestionarios.",
        },
      };
    }
  });

export const saveQuestionnaireDraftFn = createServerFn({ method: "POST" })
  .validator((data: SaveQuestionnairePayload) => data)
  .handler(async ({ data }) => {
    if (!isDbEnabled()) throw new Error("MySQL no está configurado.");
    await withTransaction(async (connection) => {
      const [questionnaireRows] = (await connection.query(
        `SELECT q.id, q.version FROM cuestionarios q JOIN clientes c ON c.id = q.cliente_id WHERE c.slug = ? AND q.codigo = ? LIMIT 1`,
        [data.clientSlug, data.code],
      )) as unknown as [{ id: number; version: number }[]];
      const questionnaire = questionnaireRows[0];
      if (!questionnaire) throw new Error("El cuestionario no existe en la BD.");
      await connection.execute(
        `UPDATE cuestionario_preguntas SET activo = 0, version = ? WHERE cuestionario_id = ?`,
        [questionnaire.version + 1, questionnaire.id],
      );
      for (const [index, question] of data.questions.entries()) {
        // Para postventa las preguntas llegan en orden de template (bloques),
        // hay que mapear al orden flat de la BD.
        const dbOrden: number =
          data.code === "postventa" && index < POSTVENTA_TEMPLATE_ORDER.length
            ? (POSTVENTA_TEMPLATE_ORDER[index] as number)
            : index + 1;
        const code = `${data.code}_p_${dbOrden}`;
        const options = JSON.stringify(question.options);
        await connection.execute(
          `INSERT INTO cuestionario_preguntas (cuestionario_id, codigo, bloque, texto, tipo, tipo_respuesta, opciones, orden, obligatorio, activo, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE texto = VALUES(texto), tipo = VALUES(tipo), tipo_respuesta = VALUES(tipo_respuesta), opciones = VALUES(opciones), orden = VALUES(orden), obligatorio = VALUES(obligatorio), activo = VALUES(activo), version = VALUES(version)`,
          [
            questionnaire.id,
            code,
            "Configurado desde el panel",
            question.text,
            question.kind === "text" || question.kind === "textarea"
              ? "texto"
              : question.kind === "scale"
                ? "likert"
                : question.kind === "checks"
                  ? "seleccion_multiple"
                  : "seleccion_unica",
            question.kind,
            options,
            dbOrden,
            question.required ? 1 : 0,
            question.active ? 1 : 0,
            questionnaire.version + 1,
          ],
        );
      }
      await connection.execute(
        `UPDATE cuestionarios SET version = version + 1, publicado_at = NOW() WHERE id = ?`,
        [questionnaire.id],
      );
    });
    return { ok: true };
  });

export type SubmitQuestionnairePayload = {
  clientSlug?: string;
  code: "nuevos" | "postventa" | "semi_nuevos";
  answers: Record<string, string | string[]>;
  items?: { orden: number; value: string | string[] | null }[];
};

export const submitQuestionnaireResponseFn = createServerFn({ method: "POST" })
  .validator((data: SubmitQuestionnairePayload) => data)
  .handler(async ({ data }) => {
    if (!isDbEnabled()) throw new Error("MySQL no está configurado.");
    const clientSlug = data.clientSlug || "maquinarias";
    return await withTransaction(async (connection) => {
      const [questionnaireRows] = (await connection.query(
        `SELECT q.id FROM cuestionarios q
           JOIN clientes c ON c.id = q.cliente_id
          WHERE c.slug = ? AND q.codigo = ? AND q.estado = 'activo'
          LIMIT 1`,
        [clientSlug, data.code],
      )) as unknown as [{ id: number }[]];
      const questionnaire = questionnaireRows[0];
      if (!questionnaire) throw new Error("Cuestionario no encontrado en la BD.");

      const answers = data.answers;
      const email = typeof answers["email"] === "string" ? answers["email"].trim() : null;
      const edad = typeof answers["edad"] === "string" ? answers["edad"].trim() : null;
      const sexo = typeof answers["sexo"] === "string" ? answers["sexo"].trim() : null;
      const distritoResidencia =
        typeof answers["distrito_residencia"] === "string"
          ? answers["distrito_residencia"].trim()
          : null;
      const distritoLaboral =
        typeof answers["distrito_laboral"] === "string"
          ? answers["distrito_laboral"].trim()
          : null;
      const sede = typeof answers["sede"] === "string" ? answers["sede"].trim() : null;
      const motivo = typeof answers["motivo"] === "string" ? answers["motivo"].trim() : null;

      const [insertResult] = (await connection.execute(
        `INSERT INTO cuestionario_respuestas
           (cuestionario_id, respondente_email, edad, sexo, distrito_residencia, distrito_laboral, motivo_visita, sede_atencion, estado, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completa', NOW(), NOW())`,
        [
          questionnaire.id,
          email,
          edad,
          sexo,
          distritoResidencia,
          distritoLaboral,
          motivo,
          sede,
        ],
      )) as unknown as [{ insertId: number }];
      const respuestaId = insertResult.insertId;

      const [questions] = (await connection.query(
        `SELECT id, orden, codigo, tipo, tipo_respuesta FROM cuestionario_preguntas
          WHERE cuestionario_id = ? AND activo = 1 ORDER BY orden`,
        [questionnaire.id],
      )) as unknown as [{ id: number; orden: number; tipo: string; tipo_respuesta: string }[]];

      const questionByOrden = new Map(questions.map((q) => [q.orden, q]));

      if (data.items?.length) {
        for (const item of data.items) {
          const q = questionByOrden.get(item.orden);
          if (!q || item.value === null || item.value === undefined) continue;

          let valorTexto: string | null = null;
          let valorNumero: number | null = null;
          let valorJson: string | null = null;

          if (Array.isArray(item.value)) {
            valorJson = JSON.stringify(item.value);
            valorTexto = item.value.join(", ");
          } else {
            valorTexto = String(item.value);
            const num = Number(item.value);
            if (!Number.isNaN(num) && (q.tipo === "likert" || q.tipo === "nps" || q.tipo_respuesta === "scale" || !Number.isNaN(parseFloat(valorTexto)))) {
              valorNumero = num;
            }
          }

          await connection.execute(
            `INSERT INTO cuestionario_respuesta_items
               (respuesta_id, pregunta_id, valor_texto, valor_numero, valor_json)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE valor_texto = VALUES(valor_texto), valor_numero = VALUES(valor_numero), valor_json = VALUES(valor_json)`,
            [respuestaId, q.id, valorTexto, valorNumero, valorJson],
          );
        }
      }

      return { ok: true, id: respuestaId };
    });
  });

/**
 * Postventa en la BD almacena 30 preguntas con orden flat 1..30, pero la
 * plantilla del cuestionario las reordena en bloques:
 *   - Info general: 1-7
 *   - Instalaciones: 8-12
 *   - Atención asesor + asesoría técnica: 13, 14, 15, 16, **28, 29**, 17
 *   - Servicio, entrega y resolución: 18, 19, **30**, 20, 21, 22
 *   - Experiencia: 23-27
 *
 * Esta función reordena la lista flat de la BD al orden del template para
 * que `cuestionarios.modificar.tsx` pueda agrupar por bloques con slice().
 */
export const POSTVENTA_TEMPLATE_ORDER = [
  1, 2, 3, 4, 5, 6, 7, // Info general
  8, 9, 10, 11, 12,     // Instalaciones
  13, 14, 15, 16, 28, 29, 17, // Atención asesor + asesoría técnica
  18, 19, 30, 20, 21, 22,     // Servicio, entrega y resolución
  23, 24, 25, 26, 27,         // Experiencia
];

function reorderByTemplate(
  questions: QuestionnaireQuestionPayload[],
  code: "nuevos" | "postventa" | "semi_nuevos",
): QuestionnaireQuestionPayload[] {
  if (code !== "postventa" || questions.length !== POSTVENTA_TEMPLATE_ORDER.length) {
    return questions;
  }
  const byOrden = new Map(questions.map((q) => [q.id, q]));
  return POSTVENTA_TEMPLATE_ORDER.map((orden) => byOrden.get(orden)).filter(
    Boolean,
  ) as QuestionnaireQuestionPayload[];
}

export const getQuestionnaireConfigFn = createServerFn({ method: "GET" })
  .validator((clientSlug?: string) => clientSlug || "maquinarias")
  .handler(async ({ data: clientSlug }): Promise<QuestionnaireConfig> => {
    const empty: QuestionnaireConfig = { nuevos: [], postventa: [], semi_nuevos: [] };
    if (!isDbEnabled()) return empty;
    const rows = await query<{
      codigo: "nuevos" | "postventa" | "semi_nuevos";
      pregunta_codigo: string;
      pregunta_orden: number;
      texto: string;
      tipo_respuesta: string | null;
      tipo: string;
      opciones: string | null;
      activo: number;
      obligatorio: number;
    }>(
      `SELECT q.codigo, p.codigo AS pregunta_codigo, p.orden AS pregunta_orden, p.texto, p.tipo_respuesta, p.tipo, p.opciones, p.activo, p.obligatorio
         FROM cuestionarios q
         JOIN clientes c ON c.id = q.cliente_id AND c.slug = ?
         JOIN cuestionario_preguntas p ON p.cuestionario_id = q.id
        WHERE q.estado = 'activo' AND p.activo = 1
          AND p.codigo LIKE CONCAT(q.codigo, '_p_%')
        ORDER BY q.codigo, p.orden, p.id`,
      [clientSlug],
    );
    for (const row of rows) {
      const options = row.opciones
        ? typeof row.opciones === "string"
          ? JSON.parse(row.opciones)
          : row.opciones
        : [];
      const isAgeQuestion = row.pregunta_codigo === `${row.codigo}_p_2`;
      const kind = isAgeQuestion
        ? "select"
        : normalizeQuestionnaireKind(row.tipo_respuesta || row.tipo);
      const item: QuestionnaireQuestionPayload = {
        id: row.pregunta_orden,
        text: row.texto,
        options,
        active: Boolean(row.activo),
        required: Boolean(row.obligatorio),
        kind,
      };
      if (kind === "scale") {
        item.min = 1;
        item.max = 5;
      }
      empty[row.codigo].push(item);
    }
    // Reorder postventa from DB flat order to template block order
    for (const code of Object.keys(empty) as (keyof QuestionnaireConfig)[]) {
      empty[code] = reorderByTemplate(empty[code], code);
    }
    return empty;
  });

export const getQuestionnaireResponsesFn = createServerFn({ method: "GET" })
  .validator((data: { clientSlug?: string; code: "nuevos" | "postventa" | "semi_nuevos" }) => data)
  .handler(async ({ data }): Promise<QuestionnaireResponseSummary[]> => {
    if (!isDbEnabled()) return [];
    return query<QuestionnaireResponseSummary>(
      `SELECT r.id, r.respondente_email AS email, r.edad,
              r.distrito_residencia AS distritoResidencia,
              r.distrito_laboral AS distritoLaboral,
              r.sede_atencion AS sede,
              r.estado, DATE_FORMAT(r.completed_at, '%Y-%m-%d %H:%i') AS completedAt,
              MAX(CASE WHEN p.orden = 26 OR LOWER(p.codigo) LIKE '%nps%' OR p.tipo = 'nps' OR p.texto LIKE '%recomiend%'
                       THEN COALESCE(i.valor_numero, CAST(i.valor_texto AS DECIMAL(10,2))) END) AS nps
         FROM cuestionario_respuestas r
         JOIN cuestionarios q ON q.id = r.cuestionario_id
         JOIN clientes c ON c.id = q.cliente_id AND c.slug = ?
         LEFT JOIN cuestionario_respuesta_items i ON i.respuesta_id = r.id
         LEFT JOIN cuestionario_preguntas p ON p.id = i.pregunta_id
        WHERE q.codigo = ? AND q.estado = 'activo' AND r.estado = 'completa'
        GROUP BY r.id, r.respondente_email, r.edad, r.distrito_residencia,
                 r.distrito_laboral, r.sede_atencion, r.estado, r.completed_at
        ORDER BY r.completed_at DESC, r.id DESC`,
      [data.clientSlug ?? "maquinarias", data.code],
    );
  });

export const getQuestionnaireResponseDetailFn = createServerFn({ method: "GET" })
  .validator(
    (data: {
      clientSlug?: string;
      code: "nuevos" | "postventa" | "semi_nuevos";
      responseId: number;
    }) => data,
  )
  .handler(async ({ data }): Promise<QuestionnaireResponseDetail | null> => {
    if (!isDbEnabled()) return null;
    const rows = await query<QuestionnaireResponseDetail>(
      `SELECT r.id, r.respondente_email AS email, r.edad, r.sexo,
              r.distrito_residencia AS distritoResidencia,
              r.distrito_laboral AS distritoLaboral,
              r.motivo_visita AS motivo, r.sede_atencion AS sede, r.estado,
              DATE_FORMAT(r.completed_at, '%Y-%m-%d %H:%i') AS completedAt,
              MAX(CASE WHEN p.orden = 26 OR LOWER(p.codigo) LIKE '%nps%' OR p.tipo = 'nps' OR p.texto LIKE '%recomiend%'
                       THEN COALESCE(i.valor_numero, CAST(i.valor_texto AS DECIMAL(10,2))) END) AS nps
         FROM cuestionario_respuestas r
         JOIN cuestionarios q ON q.id = r.cuestionario_id
         JOIN clientes c ON c.id = q.cliente_id AND c.slug = ?
         LEFT JOIN cuestionario_respuesta_items i ON i.respuesta_id = r.id
         LEFT JOIN cuestionario_preguntas p ON p.id = i.pregunta_id
        WHERE q.codigo = ? AND r.id = ? AND r.estado = 'completa'
        GROUP BY r.id, r.respondente_email, r.edad, r.sexo, r.distrito_residencia,
                 r.distrito_laboral, r.motivo_visita,
                 r.sede_atencion, r.estado, r.completed_at
        LIMIT 1`,
      [data.clientSlug ?? "maquinarias", data.code, data.responseId],
    );
    const response = rows[0];
    if (!response) return null;
    const answers = await query<{
      id: number;
      code: string;
      order: number;
      question: string;
      value: string | null;
      kind: string;
      options: string | null;
    }>(
      `SELECT p.id, p.codigo AS code, p.orden AS \`order\`, p.texto AS question, p.tipo AS kind, p.opciones AS options,
              COALESCE(i.valor_texto, CAST(i.valor_numero AS CHAR), JSON_UNQUOTE(i.valor_json)) AS value
         FROM cuestionarios q
         JOIN clientes c ON c.id = q.cliente_id AND c.slug = ?
         JOIN cuestionario_preguntas p ON p.cuestionario_id = q.id
         LEFT JOIN cuestionario_respuesta_items i ON i.pregunta_id = p.id AND i.respuesta_id = ?
        WHERE q.codigo = ? AND p.activo = 1
        ORDER BY p.orden, p.id`,
      [data.clientSlug ?? "maquinarias", data.responseId, data.code],
    );
    // Reorder answers for postventa to match template block structure
    const reorderedAnswers =
      data.code === "postventa" && answers.length === POSTVENTA_TEMPLATE_ORDER.length
        ? POSTVENTA_TEMPLATE_ORDER.map((orden) =>
            answers.find((a) => a.order === orden),
          ).filter(Boolean) as typeof answers
        : answers;
    return {
      ...response,
      answers: reorderedAnswers.map((answer) => {
        const match = answer.code.match(/_p_(\d+)$/);
        const identityIndex = match ? Number(match[1]) - 1 : answer.order - 1;
        const identityValues = [
          response.email,
          response.edad,
          response.sexo,
          response.distritoResidencia,
          response.distritoLaboral,
          response.sede,
          response.motivo,
        ];
        const identityValue = identityValues[identityIndex];
        return {
          ...answer,
          value:
            identityIndex >= 0 && identityIndex < identityValues.length && identityValue?.trim()
              ? identityValue
              : (answer.value ?? "—"),
          options: answer.options
            ? typeof answer.options === "string"
              ? JSON.parse(answer.options)
              : answer.options
            : [],
        };
      }),
    };
  });
