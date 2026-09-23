const { _electron: electron } = require('@playwright/test');
const path = require('path');

/**
 * Inicia la aplicación Electron para pruebas E2E.
 * Retorna la instancia de la aplicación y la ventana principal lista para interactuar.
 * 
 * Se configura slowMo (por defecto 400ms) para que cada acción (tipeo, clics, transiciones)
 * sea visible en tiempo real para el usuario mientras corre la prueba.
 */
async function launchApp(options = {}) {
  const rootDir = path.resolve(__dirname, '../../');
  const slowMo = options.slowMo !== undefined ? options.slowMo : 400;

  const electronApp = await electron.launch({
    args: ['.'],
    cwd: rootDir,
    slowMo,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  // Espera a que se inicialice la primera ventana creada por Electron
  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  // Ajustar tamaño de ventana y traerla al frente en pantalla
  try {
    const browserWindow = await electronApp.browserWindow(window);
    await browserWindow.evaluate((bw) => {
      bw.show();
      bw.focus();
      bw.restore();
    });
  } catch (err) {
    // Continuar normalmente si la plataforma no soporta evaluate en browserWindow
  }

  return { electronApp, window };
}

module.exports = { launchApp };
