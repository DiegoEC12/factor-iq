const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');

function key(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function number(value, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim().replace(',', '.');
  if (str.endsWith('%')) {
    const num = Number(str.slice(0, -1).trim());
    return Number.isFinite(num) ? num / 100 : fallback;
  }
  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeTipo(raw) {
  const k = key(raw);
  if (k.includes('call')) return 'Call Center';
  if (k.includes('semi')) return 'Seminuevos';
  if (k.includes('pos')) return 'Posventa';
  return 'Ventas';
}

async function repair() {
  const excelPath = path.resolve(__dirname, '..', 'Base_Mystery_Shopping_Consolidada.xlsx');
  console.log('Reading Excel file:', excelPath);
  const wb = XLSX.readFile(excelPath);

  const evRows = XLSX.utils.sheet_to_json(wb.Sheets['Evaluaciones'], { raw: true });
  const indRows = XLSX.utils.sheet_to_json(wb.Sheets['Indicadores'], { raw: true });

  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'factoriq',
  });

  console.log('--- REPAIRING EVALUACIONES ---');
  let updatedEvals = 0;
  for (const row of evRows) {
    const code = row['id_evaluación'] || row['id_evaluacion'];
    const puntaje = number(row['puntaje_total']);
    const [res] = await conn.execute(
      'UPDATE evaluaciones SET puntaje = ? WHERE codigo = ?',
      [puntaje, code]
    );
    if (res.affectedRows > 0) updatedEvals++;
  }
  console.log(`Updated ${updatedEvals} evaluations with correct scores.`);

  console.log('--- REPAIRING INDICADORES (PESOS & NOMBRES) ---');
  // Group indicators by tipoEvaluacion and orden to find true peso and nombre
  const indDefs = new Map();
  for (const row of indRows) {
    const tipo = normalizeTipo(row.origen_canal);
    const orden = number(row.no_indicador);
    const nombre = String(row.indicador || '').trim();
    const peso = number(row.peso);
    const mapKey = `${tipo}:${orden}`;
    if (!indDefs.has(mapKey)) {
      indDefs.set(mapKey, { tipo, orden, nombre, peso });
    }
  }

  let updatedInds = 0;
  for (const def of indDefs.values()) {
    const [res] = await conn.execute(
      'UPDATE indicadores SET peso = ?, nombre = ? WHERE proyecto_id = 1 AND tipo_evaluacion = ? AND orden = ?',
      [def.peso, def.nombre, def.tipo, def.orden]
    );
    if (res.affectedRows > 0) updatedInds++;
  }
  console.log(`Updated ${updatedInds} indicator definitions with correct weights.`);

  console.log('--- REPAIRING EVALUACION_INDICADORES (CUMPLIMIENTO) ---');
  let updatedEvalInds = 0;
  for (const row of indRows) {
    const evCode = row.id_evaluacion;
    const tipo = normalizeTipo(row.origen_canal);
    const orden = number(row.no_indicador);
    const cumplimiento = number(row.cumplimiento);

    const [evalRows] = await conn.execute(
      'SELECT id FROM evaluaciones WHERE codigo = ? LIMIT 1',
      [evCode]
    );
    if (!evalRows.length) continue;
    const evalId = evalRows[0].id;

    const [indRowsDb] = await conn.execute(
      'SELECT id FROM indicadores WHERE proyecto_id = 1 AND tipo_evaluacion = ? AND orden = ? LIMIT 1',
      [tipo, orden]
    );
    if (!indRowsDb.length) continue;
    const indId = indRowsDb[0].id;

    const [res] = await conn.execute(
      'UPDATE evaluacion_indicadores SET cumplimiento = ? WHERE evaluacion_id = ? AND indicador_id = ?',
      [cumplimiento, evalId, indId]
    );
    if (res.affectedRows > 0) updatedEvalInds++;
  }
  console.log(`Updated ${updatedEvalInds} evaluacion_indicadores rows with correct compliance.`);

  // Verify Posventa results
  console.log('\n--- VERIFYING POSVENTA IN DATABASE ---');
  const [posEvalsDb] = await conn.execute(
    'SELECT id, codigo, tipo_evaluacion, puntaje FROM evaluaciones WHERE tipo_evaluacion = "Posventa"'
  );
  console.table(posEvalsDb);

  const [posIndsDb] = await conn.execute(
    'SELECT id, orden, nombre, peso FROM indicadores WHERE tipo_evaluacion = "Posventa" ORDER BY orden'
  );
  console.table(posIndsDb);

  const [posEvalIndsDb] = await conn.execute(
    `SELECT ei.evaluacion_id, e.codigo, i.orden, i.nombre, ei.cumplimiento 
     FROM evaluacion_indicadores ei 
     JOIN evaluaciones e ON ei.evaluacion_id = e.id 
     JOIN indicadores i ON ei.indicador_id = i.id 
     WHERE e.tipo_evaluacion = "Posventa" 
     ORDER BY e.id, i.orden 
     LIMIT 10`
  );
  console.table(posEvalIndsDb);

  await conn.end();
  console.log('\nRepair completed successfully!');
}

repair().catch((err) => {
  console.error('Error during repair:', err);
  process.exit(1);
});
