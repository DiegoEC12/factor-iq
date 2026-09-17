const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");

const jsonPath = path.resolve("src/data/mystery-shopping-imported.json");
if (!fs.existsSync(jsonPath)) {
  console.error(`No se encontró ${jsonPath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const { meta, evaluaciones, indicadores, preguntas } = raw;

function sqlEscape(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return isNaN(val) ? "NULL" : String(val);
  const str = String(val)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\n");
  return `'${str}'`;
}

// 1. Clientes
const clientesSql = `
-- Cliente Maquinarias (id=1)
INSERT INTO clientes (id, slug, nombre_comercial, razon_social, rubro, plan, estado) VALUES
(1, 'maquinarias', 'Maquinarias', 'Maquinarias S.A.', 'Automotriz / Maquinaria', 'profesional', 'activo');
`;

// 2. Usuarios con hashes bcrypt reales para inicio inmediato
const hashSuperadmin = bcrypt.hashSync("admin123", 10);
const hashAdmMaqui = bcrypt.hashSync("adm123", 10);

const usuariosSql = `
-- Usuarios iniciales (superadmin: admin123 | admMaqui: adm123)
-- Para cambiar contraseñas: node scripts/hash-password.mjs <nueva_password>
INSERT INTO usuarios (cliente_id, usuario, password_hash, nombre, rol, estado) VALUES
(NULL, 'superadmin', '${hashSuperadmin}', 'Super Admin Factor IQ', 'superadmin', 'activo'),
(1, 'admMaqui', '${hashAdmMaqui}', 'Admin Maquinarias', 'admin_cliente', 'activo');
`;

// 3. Proyectos
const proyectosSql = `
-- Proyecto (id=1)
INSERT INTO proyectos (id, cliente_id, nombre, tipo, periodo, fuente, estado) VALUES
(1, 1, 'Mystery Shopping Maquinarias', 'mystery_shopping', 'Base consolidada 2025', ${sqlEscape(meta.source || "Base_Mystery_Shopping_Consolidada.xlsx")}, 'activo');
`;

// 4. Sucursales (29 únicas)
const sucursalesMap = new Map();
const sucursalesList = [];

evaluaciones.forEach((e) => {
  const key = `${e.concesionaria}|${e.marca}|${e.ubicacion}`;
  if (!sucursalesMap.has(key)) {
    const id = sucursalesMap.size + 1;
    sucursalesMap.set(key, id);
    sucursalesList.push({
      id,
      cliente_id: 1,
      nombre: e.concesionaria,
      marca: e.marca,
      ubicacion: e.ubicacion,
    });
  }
});

const sucursalesValues = sucursalesList
  .map(
    (s) =>
      `(${s.id}, ${s.cliente_id}, ${sqlEscape(s.nombre)}, ${sqlEscape(s.marca)}, ${sqlEscape(s.ubicacion)})`,
  )
  .join(",\n");

const sucursalesSql = `
-- Sucursales / Concesionarias (${sucursalesList.length} registradas)
INSERT INTO sucursales (id, cliente_id, nombre, marca, ubicacion) VALUES
${sucursalesValues};
`;

// 5. Indicadores
// 12 para Ventas/Seminuevos (orden 1..12, id 1..12)
// 7 para Call Center (orden 1..7, id 13..19)
const evalMap = new Map(evaluaciones.map((e) => [e.id, e]));

const ventasInds = new Map();
const callInds = new Map();

indicadores.forEach((ind) => {
  const ev = evalMap.get(ind.ev);
  const isCall = ev?.tipoEvaluacion === "Call Center";
  const targetMap = isCall ? callInds : ventasInds;
  if (!targetMap.has(ind.n)) {
    targetMap.set(ind.n, {
      orden: ind.n,
      nombre: ind.nombre,
      peso: ind.peso,
    });
  }
});

const indicadoresList = [];
// Ventas/Seminuevos primero (1..12)
Array.from(ventasInds.values())
  .sort((a, b) => a.orden - b.orden)
  .forEach((ind) => {
    const id = indicadoresList.length + 1;
    indicadoresList.push({
      id,
      proyecto_id: 1,
      codigo: `IND_${String(ind.orden).padStart(2, "0")}`,
      tipo_evaluacion: "Ventas",
      orden: ind.orden,
      nombre: ind.nombre,
      peso: ind.peso,
    });
  });

// Call Center después (13..19)
Array.from(callInds.values())
  .sort((a, b) => a.orden - b.orden)
  .forEach((ind) => {
    const id = indicadoresList.length + 1;
    indicadoresList.push({
      id,
      proyecto_id: 1,
      codigo: `IND_CAL_${String(ind.orden).padStart(2, "0")}`,
      tipo_evaluacion: "Call Center",
      orden: ind.orden,
      nombre: ind.nombre,
      peso: ind.peso,
    });
  });

const indicadoresValues = indicadoresList
  .map(
    (i) =>
      `(${i.id}, ${i.proyecto_id}, ${sqlEscape(i.codigo)}, ${sqlEscape(i.tipo_evaluacion)}, ${i.orden}, ${sqlEscape(i.nombre)}, ${i.peso})`,
  )
  .join(",\n");

const indicadoresSql = `
-- Catálogo de Indicadores (${indicadoresList.length} registros: 12 Ventas/Seminuevos + 7 Call Center)
INSERT INTO indicadores (id, proyecto_id, codigo, tipo_evaluacion, orden, nombre, peso) VALUES
${indicadoresValues};
`;

// Helper para resolver id de indicador
function resolveIndicadorId(evaluacionId, orden) {
  const ev = evalMap.get(evaluacionId);
  const isCall = ev?.tipoEvaluacion === "Call Center";
  const tipo = isCall ? "Call Center" : "Ventas";
  const found = indicadoresList.find((i) => i.tipo_evaluacion === tipo && i.orden === orden);
  if (!found) {
    throw new Error(`No se encontró indicador para ev ${evaluacionId}, orden ${orden}, tipo ${tipo}`);
  }
  return found.id;
}

// 6. Evaluaciones (42)
const evalDbIdMap = new Map();

const evaluacionesValues = evaluaciones
  .map((e, index) => {
    const id = index + 1;
    evalDbIdMap.set(e.id, id);
    const sucursalKey = `${e.concesionaria}|${e.marca}|${e.ubicacion}`;
    const sucursalId = sucursalesMap.get(sucursalKey);
    return `(${id}, ${sqlEscape(e.id)}, 1, ${sucursalId}, ${sqlEscape(e.tipoEvaluacion)}, ${Number(e.puntaje).toFixed(6)}, ${sqlEscape(e.resumen)}, ${sqlEscape(e.recomendaciones)})`;
  })
  .join(",\n");

const evaluacionesSql = `
-- Evaluaciones (${evaluaciones.length} registradas con su tipo de evaluación)
INSERT INTO evaluaciones (id, codigo, proyecto_id, sucursal_id, tipo_evaluacion, puntaje, resumen, recomendaciones) VALUES
${evaluacionesValues};
`;

// 7. Evaluacion_indicadores (434)
const evalIndRows = indicadores.map((ind, index) => {
  const id = index + 1;
  const evaluacionId = evalDbIdMap.get(ind.ev);
  const indicadorId = resolveIndicadorId(ind.ev, ind.n);
  return `(${id}, ${evaluacionId}, ${indicadorId}, ${Number(ind.cumpl).toFixed(6)})`;
});

const evalIndValues = evalIndRows.join(",\n");

const evalIndSql = `
-- Resultados por indicador (${evalIndRows.length} registros)
INSERT INTO evaluacion_indicadores (id, evaluacion_id, indicador_id, cumplimiento) VALUES
${evalIndValues};
`;

// 8. Evaluacion_preguntas (2494)
// Para evitar sentencias gigantes en MySQL, agrupamos en bloques de 500 registros
const chunkSize = 500;
let preguntasSql = `
-- Respuestas a preguntas (${preguntas.length} registros distribuidos)
`;

for (let i = 0; i < preguntas.length; i += chunkSize) {
  const chunk = preguntas.slice(i, i + chunkSize);
  const values = chunk
    .map((p, chunkIndex) => {
      const id = i + chunkIndex + 1;
      const evaluacionId = evalDbIdMap.get(p.ev);
      const indicadorId = resolveIndicadorId(p.ev, p.ind);
      return `(${id}, ${evaluacionId}, ${indicadorId}, ${sqlEscape(p.q)}, ${sqlEscape(p.resp)}, ${sqlEscape(p.nota)}, ${sqlEscape(p.obs)})`;
    })
    .join(",\n");

  preguntasSql += `
INSERT INTO evaluacion_preguntas (id, evaluacion_id, indicador_id, pregunta, respuesta, nota, observacion) VALUES
${values};
`;
}

// Armar archivo completo
const fullSql = `-- =============================================================
-- Factor IQ — Seed Completo Maquinarias
-- Generado automáticamente desde src/data/mystery-shopping-imported.json
-- Garantiza integridad relacional, 19 indicadores y tipos de evaluación
-- Fecha de generación: ${new Date().toISOString()}
-- =============================================================

USE factoriq;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE evaluacion_preguntas;
TRUNCATE TABLE evaluacion_indicadores;
TRUNCATE TABLE evaluaciones;
TRUNCATE TABLE indicadores;
TRUNCATE TABLE sucursales;
TRUNCATE TABLE proyectos;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE clientes;
SET FOREIGN_KEY_CHECKS = 1;

${clientesSql}
${usuariosSql}
${proyectosSql}
${sucursalesSql}
${indicadoresSql}
${evaluacionesSql}
${evalIndSql}
${preguntasSql}
`;

const outputPath = path.resolve("database/seed_maquinarias.sql");
fs.writeFileSync(outputPath, fullSql, "utf8");

console.log(`✅ Seed generado exitosamente en ${outputPath}`);
console.log(`- Clientes: 1`);
console.log(`- Usuarios: 2`);
console.log(`- Proyectos: 1`);
console.log(`- Sucursales: ${sucursalesList.length}`);
console.log(`- Indicadores: ${indicadoresList.length} (12 Ventas + 7 Call Center)`);
console.log(`- Evaluaciones: ${evaluaciones.length}`);
console.log(`- Evaluacion_indicadores: ${evalIndRows.length}`);
console.log(`- Evaluacion_preguntas: ${preguntas.length}`);
