const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'factoriq' });

  const [summary] = await conn.execute(
    `SELECT tipo_evaluacion, COUNT(*) as count, 
            ROUND(AVG(puntaje) * 100, 2) as avg_puntaje_pct,
            ROUND(MIN(puntaje) * 100, 2) as min_pct,
            ROUND(MAX(puntaje) * 100, 2) as max_pct
     FROM evaluaciones 
     GROUP BY tipo_evaluacion
     ORDER BY tipo_evaluacion`
  );
  console.log('=== EVALUATION SUMMARY BY TYPE ===');
  console.table(summary);

  const [posEvals] = await conn.execute('SELECT codigo, puntaje FROM evaluaciones WHERE tipo_evaluacion = "Posventa"');
  console.log('\n=== POSVENTA EVALUATIONS ===');
  console.table(posEvals);

  const [posInds] = await conn.execute('SELECT orden, nombre, peso FROM indicadores WHERE tipo_evaluacion = "Posventa" ORDER BY orden');
  console.log('\n=== POSVENTA INDICATOR WEIGHTS ===');
  console.table(posInds);

  const [semiInds] = await conn.execute('SELECT orden, nombre, peso FROM indicadores WHERE tipo_evaluacion = "Seminuevos" ORDER BY orden');
  console.log('\n=== SEMINUEVOS INDICATOR WEIGHTS ===');
  console.table(semiInds);

  const [zeroEvals] = await conn.execute('SELECT COUNT(*) as c FROM evaluaciones WHERE puntaje = 0');
  const [zeroInds] = await conn.execute('SELECT COUNT(*) as c FROM indicadores WHERE peso = 0');
  const [zeroCumpl] = await conn.execute('SELECT COUNT(*) as c FROM evaluacion_indicadores WHERE cumplimiento = 0');
  console.log('\n=== REMAINING ZEROS (some may be legitimately 0) ===');
  console.log('Evaluations with puntaje=0:', zeroEvals[0].c);
  console.log('Indicators with peso=0:', zeroInds[0].c);
  console.log('Eval-Indicators with cumplimiento=0:', zeroCumpl[0].c);

  await conn.end();
})();
