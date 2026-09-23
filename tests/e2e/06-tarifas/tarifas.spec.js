const { test, expect } = require('@playwright/test');
const { launchApp } = require('../../helpers/electronApp');
const { loginAsAdmin } = require('../../helpers/authHelper');

test.describe('Módulo 06: Estructura y Gestión de Tarifas', () => {
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

  test('06.1 - Debe cargar la vista de Gestión de Tarifas', async () => {
    await window.evaluate(() => {
      const link = document.querySelector('a[href*="tarifas"]');
      if (link) link.click();
      else window.location.hash = '#/resibos/tarifas';
    });

    const heading = window.locator('h1', { hasText: 'Gestión de Tarifas' });
    await expect(heading).toBeVisible({ timeout: 15000 });

    const tabTarifas = window.locator('button', { hasText: 'Tarifas' });
    const tabCalculadora = window.locator('button', { hasText: 'Calculadora' });

    await expect(tabTarifas).toBeVisible({ timeout: 10000 });
    await expect(tabCalculadora).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para ver el catálogo de tarifas
    await window.waitForTimeout(3000);
  });

  test('06.2 - Debe permitir alternar a la pestaña de Calculadora / Simulador de consumo', async () => {
    const tabCalculadora = window.locator('button', { hasText: 'Calculadora' });
    await tabCalculadora.click();

    const selectorTarifa = window.locator('select').first();
    await expect(selectorTarifa).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para ver el simulador de cálculo de consumo
    await window.waitForTimeout(3000);
  });
});
