const { launchApp } = require('./electronApp');
const { loginAsAdmin } = require('./authHelper');

/**
 * Hooks comunes de cada módulo: lanza la app sobre la base de prueba, inicia sesión y la cierra al final.
 * Las pruebas del archivo corren en orden (serial): si una falla, las siguientes se omiten.
 * Si una prueba falla se adjuntan una captura de pantalla y el registro de la app (consola del
 * proceso principal y eventos de la ventana: cierres, caídas del proceso de la interfaz).
 *
 * @param {import('@playwright/test').TestType} test
 * @param {{ antes?: () => any, iniciarSesion?: boolean }} opciones  antes: preparar datos con la app cerrada
 * @returns {{ app: import('playwright').ElectronApplication, window: import('playwright').Page }}
 */
function usarApp(test, { antes, iniciarSesion = true } = {}) {
  const ctx = {};
  const registro = [];
  const anotar = (texto) => registro.push(`${new Date().toISOString().slice(11, 23)} ${texto}`.slice(0, 500));
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    if (antes) await antes();
    const { electronApp, window } = await launchApp();
    ctx.app = electronApp;
    ctx.window = window;

    electronApp.process().stdout?.on('data', (d) => String(d).split('\n').filter(Boolean).forEach((l) => anotar(`[main] ${l}`)));
    electronApp.process().stderr?.on('data', (d) => String(d).split('\n').filter(Boolean).forEach((l) => anotar(`[main:err] ${l}`)));
    electronApp.on('close', () => anotar('[evento] la aplicación se cerró'));
    window.on('crash', () => anotar('[evento] se cayó el proceso de la interfaz (crash)'));
    window.on('close', () => anotar('[evento] se cerró la ventana'));
    window.on('pageerror', (e) => anotar(`[interfaz:error] ${e.message}`));
    await electronApp.evaluate(({ app, BrowserWindow }) => {
      app.on('render-process-gone', (_e, _wc, d) => console.log(`[evento] render-process-gone ${JSON.stringify(d)}`));
      app.on('child-process-gone', (_e, d) => console.log(`[evento] child-process-gone ${JSON.stringify(d)}`));
      BrowserWindow.getAllWindows().forEach((w) => w.on('closed', () => console.log('[evento] BrowserWindow closed')));
    });

    if (iniciarSesion) await loginAsAdmin(window);
  });

  test.afterEach(async ({}, info) => {
    if (info.status !== info.expectedStatus && ctx.window) {
      const ruta = info.outputPath('fallo.png');
      await ctx.window.screenshot({ path: ruta }).catch(() => {});
      await info.attach('pantalla al fallar', { path: ruta, contentType: 'image/png' }).catch(() => {});
      await info.attach('registro de la app', { body: registro.slice(-200).join('\n'), contentType: 'text/plain' });
    }
  });

  test.afterAll(async () => {
    await ctx.app?.close();
  });

  return ctx;
}

module.exports = { usarApp };
