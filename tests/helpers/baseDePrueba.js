/**
 * Base de datos de prueba para E2E.
 *
 * Cada corrida usa una COPIA de la base real en una carpeta de datos propia (AGUAVP_E2E_USER_DATA):
 * la app de prueba no toca la base real, ni sus respaldos, ni la conexión con Turso (la copia no
 * lleva las credenciales de la nube: esas viven en api-secrets.enc, que no se copia).
 *
 * La base original solo se abre en modo lectura (VACUUM INTO hace una copia consistente aunque la
 * app esté abierta). Se agrega un usuario superadmin de prueba que existe solo en la copia.
 */
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const CARPETA_PRUEBA = process.env.AGUAVP_E2E_USER_DATA || path.join(os.tmpdir(), 'aguavp-e2e');
const BASE_ORIGEN = process.env.AGUAVP_E2E_SOURCE_DB
  || path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'aguavp', 'agua-vp.db');
const BASE_PRUEBA = path.join(CARPETA_PRUEBA, 'agua-vp.db');

const USUARIO_PRUEBA = {
  correo: 'e2e.pruebas@aguavp.com',
  password: 'PruebaE2E123!',
  username: 'e2e_admin',
  nombre: 'Usuario Pruebas E2E'
};

/** El servidor embebido usa el puerto 3000: si está ocupado, la app real (o `npm run dev`) está abierta. */
function puertoLibre(puerto) {
  return new Promise((resolve) => {
    const srv = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => srv.close(() => resolve(true)))
      .listen(puerto, '127.0.0.1');
  });
}

async function prepararBaseDePrueba() {
  if (!(await puertoLibre(3000))) {
    throw new Error('El puerto 3000 está ocupado: cierra AguaVP (y `npm run dev`) antes de correr las pruebas E2E.');
  }
  if (!fs.existsSync(BASE_ORIGEN)) {
    throw new Error(`No se encontró la base de origen: ${BASE_ORIGEN} (puedes indicar otra con AGUAVP_E2E_SOURCE_DB)`);
  }
  if (path.resolve(BASE_ORIGEN) === path.resolve(BASE_PRUEBA)) {
    throw new Error('La carpeta de prueba no puede ser la carpeta real de la app.');
  }

  fs.rmSync(CARPETA_PRUEBA, { recursive: true, force: true });
  fs.mkdirSync(CARPETA_PRUEBA, { recursive: true });

  const origen = new DatabaseSync(BASE_ORIGEN, { readOnly: true });
  try {
    origen.exec(`VACUUM INTO '${BASE_PRUEBA.replace(/'/g, "''")}'`);
  } finally {
    origen.close();
  }

  const db = new DatabaseSync(BASE_PRUEBA);
  try {
    db.prepare(`INSERT INTO usuarios (correo, nombre, "contraseña", username, rol, estado_usuario, requiere_cambio_password)
                VALUES (?, ?, ?, ?, 'superadmin', 'Activo', 0)`)
      .run(USUARIO_PRUEBA.correo, USUARIO_PRUEBA.nombre, bcrypt.hashSync(USUARIO_PRUEBA.password, 8), USUARIO_PRUEBA.username);
  } finally {
    db.close();
  }
  return { carpeta: CARPETA_PRUEBA, base: BASE_PRUEBA };
}

/** Abre la base de la copia (para preparar datos antes de lanzar la app o verificar resultados). */
function abrirBaseDePrueba() {
  return new DatabaseSync(BASE_PRUEBA);
}

module.exports = { CARPETA_PRUEBA, BASE_PRUEBA, USUARIO_PRUEBA, prepararBaseDePrueba, abrirBaseDePrueba };
