const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'factoriq'
  });

  const [evs] = await conn.query(`
    SELECT e.id, e.codigo, e.tipo_evaluacion, e.puntaje, s.nombre as sucursal_nombre, s.marca, s.ubicacion, p.id as proyecto_id, c.slug as cliente_slug
    FROM evaluaciones e
    JOIN sucursales s ON s.id = e.sucursal_id
    JOIN proyectos p ON p.id = e.proyecto_id
    JOIN clientes c ON c.id = p.cliente_id
    WHERE e.tipo_evaluacion LIKE '%pos%'
  `);
  console.log('Posventa evaluations JOINed:', JSON.stringify(evs, null, 2));

  // Check how many evaluations total per client
  const [byClient] = await conn.query(`
    SELECT c.slug, e.tipo_evaluacion, count(*) as count
    FROM evaluaciones e
    JOIN proyectos p ON p.id = e.proyecto_id
    JOIN clientes c ON c.id = p.cliente_id
    GROUP BY c.slug, e.tipo_evaluacion
  `);
  console.log('Evaluations by client and tipo:', byClient);

  // Check if there are indicators for posventa
  const [indPos] = await conn.query(`
    SELECT * FROM indicadores WHERE tipo_evaluacion LIKE '%pos%'
  `);
  console.log('Indicadores for posventa in DB:', indPos);

  await conn.end();
}

test().catch(console.error);
