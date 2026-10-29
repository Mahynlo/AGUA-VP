// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * Configuración de Playwright para pruebas E2E en Electron (AGUA-VP)
 * 
 * - workers: 1 garantiza ejecución secuencial para evitar bloqueos en SQLite embebido.
 * - timeout amplio para tolerar el arranque de Node.js, Electron y el servidor API local.
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  // Copia de la base real en una carpeta de prueba: la app de prueba nunca toca la base real
  globalSetup: require.resolve('./tests/helpers/globalSetup.js'),
  timeout: 60000,
  expect: {
    timeout: 15000
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    headless: false,
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  }
});
