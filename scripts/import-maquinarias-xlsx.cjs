#!/usr/bin/env node

/**
 * Reemplaza los datos operativos del proyecto Maquinarias desde un Excel.
 *
 * Uso seguro recomendado:
 *   node scripts/import-maquinarias-xlsx.cjs "Base_Mystery_Shopping_Consolidada (10).xlsx"
 *
 * Genera database/seed_maquinarias_from_excel.sql. Para ejecutar contra MySQL:
 *   node scripts/import-maquinarias-xlsx.cjs "Base_Mystery_Shopping_Consolidada (10).xlsx" --execute
 *
 * --execute es intencionalmente explícito porque primero elimina los datos
 * operativos del proyecto seleccionado, dentro de una transacción.
 */

const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");
const mysql = require("mysql2/promise");

const DEFAULT_INPUT = "Base_Mystery_Shopping_Consolidada (10).xlsx";
const DEFAULT_OUTPUT = "database/seed_maquinarias_from_excel.sql";
const CLIENT_SLUG = "maquinarias";

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const positional = args.filter((arg) => !arg.startsWith("--"));
const inputPath = path.resolve(positional[0] || DEFAULT_INPUT);
const outputPath = path.resolve(positional[1] || DEFAULT_OUTPUT);

function loadDotEnv() {
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function text(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function key(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function number(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const raw = text(value).replace(/\u00a0/g, " ").replace(/,/g, ".");
  if (!raw) return fallback;
  const percent = raw.endsWith("%");
  const parsed = Number(percent ? raw.slice(0, -1).trim() : raw);
  if (!Number.isFinite(parsed)) return fallback;
  return percent ? parsed / 100 : parsed;
}

function sql(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  const escaped = String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/\r\n|\r|\n/g, "\\n");
  return `'${escaped}'`;
}

function canonicalType(value) {
  const normalized = key(value);
  if (normalized.includes("callcenter") || normalized === "call") return "Call Center";
  if (normalized.includes("seminuevo")) return "Seminuevos";
  if (normalized.includes("postventa") || normalized.includes("posventa")) return "Postventa";
  if (normalized.includes("venta")) return "Ventas";
  throw new Error(`Tipo de evaluación no reconocido: ${value || "vacío"}`);
}

function normalizeLocation(value) {
  const location = text(value).toUpperCase();
  const corrections = {
    SURUILLO: "SURQUILLO",
    SURQUIILLO: "SURQUILLO",
    SURQULLO: "SURQUILLO",
    "SAN MIGUE": "SAN MIGUEL",
    "JAVIR PRADO": "JAVIER PRADO",
    MOLINA: "LA MOLINA",
  };
  return corrections[location] || location || "SIN UBICACIÓN";
}

function mysqlDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = text(value);
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const latam = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (latam) return `${latam[3]}-${latam[2].padStart(2, "0")}-${latam[1].padStart(2, "0")}`;
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 20000 && serial < 60000) {
      return new Date((serial - 25569) * 86400 * 1000).toISOString().slice(0, 10);
    }
  }
  return null;
}

function month(value, fallback) {
  const parsed = Number(text(value));
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 12)
    return String(parsed).padStart(2, "0");
  const months = {
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    setiembre: "09",
    septiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12",
  };
  return months[key(value)] || fallback || null;
}

function rows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`No se encontró la hoja ${sheetName}.`);
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
}

function chunked(items, size, callback) {
  const blocks = [];
  for (let index = 0; index < items.length; index += size) {
    blocks.push(callback(items.slice(index, index + size), index));
  }
  return blocks.join("\n");
}

function parseWorkbook() {
  if (!fs.existsSync(inputPath)) throw new Error(`No se encontró el Excel: ${inputPath}`);
  const workbook = XLSX.readFile(inputPath, { cellDates: true });
  const evaluationRows = rows(workbook, "Evaluaciones");
  const indicatorRows = rows(workbook, "Indicadores");
  const questionRows = rows(workbook, "Preguntas");
  if (!evaluationRows.length) throw new Error("La hoja Evaluaciones no contiene datos.");

  const evaluations = [];
  const evaluationByCode = new Map();
  for (const [index, row] of evaluationRows.entries()) {
    const code = text(row.id_evaluacion || row.q);
    if (!code) throw new Error(`Evaluaciones, fila ${index + 2}: falta id_evaluacion.`);
    if (evaluationByCode.has(code)) throw new Error(`Evaluación duplicada en Excel: ${code}.`);
    const type = canonicalType(row.perfil || row.origen_canal);
    const evaluation = {
      code,
      type,
      concesionaria: text(row.concesionaria) || "SIN CONCESIONARIA",
      marca: text(row.marca) || "SIN MARCA",
      ubicacion: normalizeLocation(row.ubicacion || row.ubicacion_formulario),
      score: number(row.puntaje_total),
      summary: text(row.resumen_visita) || null,
      recommendations: text(row.recomendaciones) || null,
      date: mysqlDate(row.fecha_visita),
      month: month(row.numero_mes, month(row.mes, null)),
      advisor: text(row.asesor_evaluado) || null,
    };
    evaluationByCode.set(code, evaluation);
    evaluations.push(evaluation);
  }

  const branches = new Map();
  for (const evaluation of evaluations) {
    const branchKey = [evaluation.concesionaria, evaluation.marca, evaluation.ubicacion].join("|");
    branches.set(branchKey, {
      name: evaluation.concesionaria,
      brand: evaluation.marca,
      location: evaluation.ubicacion,
    });
  }

  const indicators = [];
  const indicatorsByKey = new Map();
  for (const [index, row] of indicatorRows.entries()) {
    const code = text(row.id_evaluacion);
    const evaluation = evaluationByCode.get(code);
    if (!evaluation) throw new Error(`Indicadores, fila ${index + 2}: evaluación inexistente ${code}.`);
    const order = Number(text(row.no_indicador));
    if (!Number.isInteger(order) || order < 1) throw new Error(`Indicadores, fila ${index + 2}: no_indicador inválido.`);
    const result = {
      evaluationCode: code,
      type: evaluation.type,
      order,
      name: text(row.indicador) || `Indicador ${order}`,
      weight: number(row.peso),
      compliance: number(row.cumplimiento),
    };
    const resultKey = `${code}|${order}`;
    if (indicatorsByKey.has(resultKey)) throw new Error(`Resultado de indicador duplicado: ${resultKey}.`);
    indicatorsByKey.set(resultKey, result);
    indicators.push(result);
  }

  const catalog = new Map();
  for (const indicator of indicators) {
    const catalogKey = `${indicator.type}|${indicator.order}`;
    if (!catalog.has(catalogKey)) catalog.set(catalogKey, indicator);
  }

  const questions = [];
  const questionsByKey = new Set();
  for (const [index, row] of questionRows.entries()) {
    const code = text(row.id_evaluacion);
    const evaluation = evaluationByCode.get(code);
    if (!evaluation) throw new Error(`Preguntas, fila ${index + 2}: evaluación inexistente ${code}.`);
    const order = Number(text(row.no_indicador));
    const question = text(row.pregunta);
    if (!Number.isInteger(order) || order < 1 || !question)
      throw new Error(`Preguntas, fila ${index + 2}: indicador o pregunta inválidos.`);
    const questionKey = `${code}|${text(row.clave_pregunta) || `${order}|${question}`}`;
    if (questionsByKey.has(questionKey)) throw new Error(`Pregunta duplicada: ${questionKey}.`);
    questionsByKey.add(questionKey);
    questions.push({
      evaluationCode: code,
      type: evaluation.type,
      order,
      question: question.slice(0, 500),
      answer: text(row.respuesta).slice(0, 100) || null,
      note: text(row.nota) || null,
      observation: text(row.observacion) || null,
    });
  }

  return { evaluations, indicators, catalog: [...catalog.values()], questions, branches: [...branches.values()] };
}

function generateSql(data) {
  const branchSql = data.branches
    .map(
      (branch) =>
        `INSERT INTO sucursales (cliente_id, nombre, marca, ubicacion, estado) VALUES (@cliente_id, ${sql(branch.name)}, ${sql(branch.brand)}, ${sql(branch.location)}, 'activa') ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);`,
    )
    .join("\n");

  const catalogSql = data.catalog
    .sort((a, b) => a.type.localeCompare(b.type) || a.order - b.order)
    .map(
      (indicator) =>
        `INSERT INTO indicadores (proyecto_id, codigo, tipo_evaluacion, orden, nombre, peso) VALUES (@proyecto_id, ${sql(`${indicator.type === "Call Center" ? "IND_CAL_" : "IND_"}${String(indicator.order).padStart(2, "0")}`)}, ${sql(indicator.type)}, ${indicator.order}, ${sql(indicator.name)}, ${number(indicator.weight)}) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), peso = VALUES(peso);`,
    )
    .join("\n");

  const evaluationValues = data.evaluations
    .map((evaluation) => {
      const branchId = `(SELECT id FROM sucursales WHERE cliente_id = @cliente_id AND nombre = ${sql(evaluation.concesionaria)} AND marca = ${sql(evaluation.marca)} AND ubicacion = ${sql(evaluation.ubicacion)} LIMIT 1)`;
      return `(${sql(evaluation.code)}, @proyecto_id, ${branchId}, ${sql(evaluation.type)}, ${number(evaluation.score)}, ${sql(evaluation.summary)}, ${sql(evaluation.recommendations)}, ${sql(evaluation.date)}, ${sql(evaluation.month)}, ${sql(evaluation.advisor)})`;
    })
    .join(",\n");

  const indicatorValues = chunked(data.indicators, 350, (block) =>
    `INSERT INTO evaluacion_indicadores (evaluacion_id, indicador_id, cumplimiento) VALUES\n${block
      .map(
        (indicator) =>
          `((SELECT id FROM evaluaciones WHERE codigo = ${sql(indicator.evaluationCode)} AND proyecto_id = @proyecto_id LIMIT 1), (SELECT id FROM indicadores WHERE proyecto_id = @proyecto_id AND tipo_evaluacion = ${sql(indicator.type)} AND orden = ${indicator.order} LIMIT 1), ${number(indicator.compliance)})`,
      )
      .join(",\n")};`,
  );

  const questionSql = chunked(data.questions, 350, (block) =>
    `INSERT INTO evaluacion_preguntas (evaluacion_id, indicador_id, pregunta, respuesta, nota, observacion) VALUES\n${block
      .map(
        (question) =>
          `((SELECT id FROM evaluaciones WHERE codigo = ${sql(question.evaluationCode)} AND proyecto_id = @proyecto_id LIMIT 1), (SELECT id FROM indicadores WHERE proyecto_id = @proyecto_id AND tipo_evaluacion = ${sql(question.type)} AND orden = ${question.order} LIMIT 1), ${sql(question.question)}, ${sql(question.answer)}, ${sql(question.note)}, ${sql(question.observation)})`,
      )
      .join(",\n")};`,
  );

  return `-- Factor IQ: reemplazo de datos operativos de Maquinarias desde Excel
-- Fuente: ${path.basename(inputPath)}
-- Generado: ${new Date().toISOString()}
-- Evaluaciones: ${data.evaluations.length} | Indicadores: ${data.indicators.length} | Preguntas: ${data.questions.length}
-- Las respuestas se limitan a 100 caracteres porque evaluacion_preguntas.respuesta es VARCHAR(100).

USE factoriq;
START TRANSACTION;

SET @cliente_id = (SELECT id FROM clientes WHERE slug = ${sql(CLIENT_SLUG)} LIMIT 1);
SET @proyecto_id = (SELECT id FROM proyectos WHERE cliente_id = @cliente_id ORDER BY id LIMIT 1);

-- Se conserva cliente, usuarios, proyecto y estructura. Solo se reemplazan datos operativos.
DELETE ep FROM evaluacion_preguntas ep
INNER JOIN evaluaciones e ON e.id = ep.evaluacion_id
WHERE e.proyecto_id = @proyecto_id;
DELETE ei FROM evaluacion_indicadores ei
INNER JOIN evaluaciones e ON e.id = ei.evaluacion_id
WHERE e.proyecto_id = @proyecto_id;
DELETE FROM evaluaciones WHERE proyecto_id = @proyecto_id;
DELETE FROM indicadores WHERE proyecto_id = @proyecto_id;
DELETE s FROM sucursales s
LEFT JOIN evaluaciones e ON e.sucursal_id = s.id
WHERE s.cliente_id = @cliente_id AND e.id IS NULL;

${branchSql}

${catalogSql}

INSERT INTO evaluaciones (codigo, proyecto_id, sucursal_id, tipo_evaluacion, puntaje, resumen, recomendaciones, fecha_evaluacion, mes, asesor_evaluado) VALUES
${evaluationValues};

${indicatorValues}

${questionSql}

COMMIT;
`;
}

async function executeSql(sqlText) {
  loadDotEnv();
  const required = ["DB_HOST", "DB_NAME", "DB_USER"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Faltan variables para --execute: ${missing.join(", ")}.`);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });
  try {
    await connection.query(sqlText);
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // La conexión puede haber cerrado la transacción al fallar.
    }
    throw error;
  } finally {
    await connection.end();
  }
}

async function main() {
  const data = parseWorkbook();
  const sqlText = generateSql(data);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, sqlText, "utf8");
  console.log(`SQL generado: ${outputPath}`);
  console.log(`- Evaluaciones: ${data.evaluations.length}`);
  console.log(`- Indicadores: ${data.indicators.length}`);
  console.log(`- Catálogo de indicadores: ${data.catalog.length}`);
  console.log(`- Preguntas: ${data.questions.length}`);
  console.log(`- Sucursales: ${data.branches.length}`);
  if (execute) {
    console.log("Ejecutando reemplazo transaccional en MySQL...");
    await executeSql(sqlText);
    console.log("Importación completada.");
  }
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
