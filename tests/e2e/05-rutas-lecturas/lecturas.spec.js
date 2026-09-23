const { test, expect } = require('@playwright/test');
const { launchApp } = require('../../helpers/electronApp');
const { loginAsAdmin } = require('../../helpers/authHelper');

test.describe('Módulo 05: Rutas y Captura de Lecturas', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    const appData = await launchApp();
    electronApp = appData.electronApp;
    window = appData.window;

    await loginAsAdmin(window);
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('05.1 - Debe cargar la vista de Sistema de Lecturas con sus KPIs', async () => {
    await window.evaluate(() => {
      const link = document.querySelector('a[href*="resibos/lecturas"]');
      if (link) link.click();
      else window.location.hash = '#/resibos/lecturas';
    });

    const heading = window.locator('h1', { hasText: 'Sistema de Lecturas' });
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verificar pestañas de rutas y métricas
    const tabLecturas = window.locator('button', { hasText: 'Registro de Lecturas' });
    await expect(tabLecturas).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para ver la vista de lecturas y KPIs
    await window.waitForTimeout(3000);
  });

  test('05.2 - Debe mostrar el panel de rutas de lectura y opciones de filtrado', async () => {
    const inputFiltro = window.locator('input[placeholder*="Buscar"], select').first();
    await expect(inputFiltro).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para ver las rutas y filtros en pantalla
    await window.waitForTimeout(2500);
  });
});
