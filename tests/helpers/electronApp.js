const { _electron: electron } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { CARPETA_PRUEBA } = require('./baseDePrueba');

/**
 * Inicia la aplicación Electron (build de out/) sobre la carpeta de datos de prueba.
 * Retorna la instancia de la aplicación y la ventana principal lista para interactuar.
 *
 * slowMo: pausa entre acciones (ms). 0 por defecto; con E2E_SLOWMO=400 se ve cada paso.
 */
async function launchApp(options = {}) {
  const rootDir = path.resolve(__dirname, '../../');
  const slowMo = options.slowMo !== undefined ? options.slowMo : Number(process.env.E2E_SLOWMO || 0);

  // Nunca la carpeta real: la app usa la copia preparada en globalSetup
  const carpeta = process.env.AGUAVP_E2E_USER_DATA || CARPETA_PRUEBA;
  if (!fs.existsSync(path.join(carpeta, 'agua-vp.db'))) {
    throw new Error(`No existe la base de prueba en ${carpeta}: corre las pruebas con "npm run test:e2e".`);
  }

  const env = { ...process.env, NODE_ENV: 'development', AGUAVP_E2E_USER_DATA: carpeta };
  delete env.ELECTRON_RUN_AS_NODE; // si viene del entorno (p. ej. VS Code), Electron arrancaría como Node

  const electronApp = await electron.launch({ args: ['.'], cwd: rootDir, slowMo, env });

  // Espera a que se inicialice la primera ventana creada por Electron
  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  // Comprobación de seguridad: la app debe estar usando la carpeta de prueba
  const userData = await electronApp.evaluate(({ app }) => app.getPath('userData'));
  if (path.resolve(userData) !== path.resolve(carpeta)) {
    await electronApp.close();
    throw new Error(`La app no está usando la carpeta de prueba (usa ${userData}). Se detiene para no tocar la base real.`);
  }

  // Mostrar la ventana al frente
  try {
    const browserWindow = await electronApp.browserWindow(window);
    await browserWindow.evaluate((bw) => {
      bw.show();
      bw.focus();
      bw.restore();
    });
  } catch {
    // Continuar normalmente si la plataforma no soporta evaluate en browserWindow
  }

  return { electronApp, window };
}

module.exports = { launchApp };
