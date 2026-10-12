/**
 * Datos y verificaciones directas sobre la COPIA de la base de prueba.
 *
 * Preparar datos (sembrar lecturas) solo se hace con la app cerrada (en beforeAll, antes de lanzarla).
 * Las lecturas para verificar resultados se pueden hacer con la app abierta (SQLite en modo WAL).
 */
const path = require('path');
const { pathToFileURL } = require('url');
const { abrirBaseDePrueba, USUARIO_PRUEBA } = require('./baseDePrueba');

/** Ejecuta fn(db) con la base de prueba abierta y la cierra al terminar. */
function conBase(fn) {
  const db = abrirBaseDePrueba();
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

const fila = (sql, ...args) => conBase((db) => db.prepare(sql).get(...args));
const filas = (sql, ...args) => conBase((db) => db.prepare(sql).all(...args));

/** Cálculo oficial de la tarifa: la misma función que usa la API embebida al facturar. */
let tarifaUtils;
async function totalTarifa(consumo, tarifaId) {
  tarifaUtils ??= await import(pathToFileURL(path.resolve(__dirname, '../../node_modules/@aguavp/api-server/src/utils/tarifaUtils.js')).href);
  const rangos = filas('SELECT * FROM rangos_tarifas WHERE tarifa_id = ? ORDER BY consumo_min', tarifaId);
  return tarifaUtils.calcularTarifa(consumo, rangos);
}

/**
 * Registra lecturas del período para los medidores de la ruta (en el orden de la ruta), dejando
 * `dejarSinLeer` medidores para capturarlos desde la pantalla. Replica lo que hace la API al
 * registrar: anterior = última lectura del medidor (o su lectura base), consumo = actual − anterior.
 * @returns {{ sembrados: number, pendientes: Array<{medidor_id, numero_serie, cliente_id, anterior}> }}
 */
function sembrarLecturasRuta({ rutaId, periodo, fecha, dejarSinLeer = 2 }) {
  return conBase((db) => {
    const usuarioId = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(USUARIO_PRUEBA.correo).id;
    const puntos = db.prepare(`
      SELECT m.id AS medidor_id, m.numero_serie, m.cliente_id,
             COALESCE((SELECT l.lectura_actual FROM lecturas l WHERE l.medidor_id = m.id AND l.periodo < ? ORDER BY l.periodo DESC LIMIT 1),
                      m.lectura_base, 0) AS anterior
      FROM rutas_puntos rp JOIN medidores m ON m.id = rp.medidor_id
      WHERE rp.ruta_id = ? AND m.fecha_eliminacion IS NULL AND m.cliente_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM lecturas x WHERE x.medidor_id = m.id AND x.periodo = ?)
      ORDER BY rp.orden`).all(periodo, rutaId, periodo);

    const pendientes = puntos.slice(0, dejarSinLeer);
    const insertar = db.prepare(`INSERT INTO lecturas (medidor_id, ruta_id, fecha_lectura, consumo_m3, periodo, modificado_por, estado, lectura_anterior, lectura_actual, vuelta_cero)
                                 VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, 0)`);
    db.exec('BEGIN');
    try {
      for (const p of puntos.slice(dejarSinLeer)) {
        const consumo = 5 + (p.medidor_id % 23); // consumos variados y deterministas (5 a 27 m³)
        insertar.run(p.medidor_id, rutaId, fecha, consumo, periodo, usuarioId, p.anterior, p.anterior + consumo);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    return { sembrados: puntos.length - dejarSinLeer, pendientes };
  });
}

/** Cliente de prueba: lo registra la prueba de Clientes desde la pantalla; otras pruebas lo reutilizan. */
const CLIENTE_PRUEBA = {
  predio: 'NG-9901',
  nombre: 'Cliente Prueba Automatizada', // la API solo acepta letras y espacios en el nombre
  correo: 'cliente.e2e@aguavp.com',
  telefono: '6621234567',
  ciudad: 'Nacori Grande',
  direccion: 'Calle de Pruebas 123',
  tarifa: 'Domestica'
};

/** Si la prueba de Clientes no corrió antes (p. ej. se corre un módulo suelto), crea el cliente directamente. */
function asegurarClientePrueba() {
  return conBase((db) => {
    const existente = db.prepare('SELECT id FROM clientes WHERE numero_predio = ?').get(CLIENTE_PRUEBA.predio);
    if (existente) return existente.id;
    const tarifa = db.prepare('SELECT id FROM tarifas WHERE nombre = ?').get(CLIENTE_PRUEBA.tarifa).id;
    return Number(db.prepare(`INSERT INTO clientes (numero_predio, nombre, correo, telefono, ciudad, direccion, tarifa_id, estado_cliente)
                              VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')`)
      .run(CLIENTE_PRUEBA.predio, CLIENTE_PRUEBA.nombre, CLIENTE_PRUEBA.correo, CLIENTE_PRUEBA.telefono, CLIENTE_PRUEBA.ciudad, CLIENTE_PRUEBA.direccion, tarifa).lastInsertRowid);
  });
}

/**
 * Cuenta registros de un listado con los MISMOS filtros que usa la API (filtrosListado.js del paquete instalado).
 * @param {'facturas'|'pagos'} tipo
 */
let filtrosListado;
async function contarListado(tipo, query) {
  filtrosListado ??= await import(pathToFileURL(path.resolve(__dirname, '../../node_modules/@aguavp/api-server/src/v2/services/filtrosListado.js')).href);
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Hermosillo' });
  const { conditions, args } = tipo === 'facturas' ? filtrosListado.condicionesFacturas(query, hoy) : filtrosListado.condicionesPagos(query);
  const desde = tipo === 'facturas'
    ? 'facturas f JOIN clientes c ON f.cliente_id = c.id JOIN lecturas l ON f.lectura_id = l.id LEFT JOIN medidores m ON l.medidor_id = m.id'
    : 'pagos p JOIN facturas f ON p.factura_id = f.id JOIN clientes c ON f.cliente_id = c.id LEFT JOIN lecturas l ON f.lectura_id = l.id';
  return conBase((db) => {
    db.function('unaccent', (v) => (v == null ? null : String(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()));
    return db.prepare(`SELECT COUNT(*) AS n FROM ${desde}${conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''}`).get(...args).n;
  });
}

module.exports = { conBase, fila, filas, totalTarifa, sembrarLecturasRuta, CLIENTE_PRUEBA, asegurarClientePrueba, contarListado };
