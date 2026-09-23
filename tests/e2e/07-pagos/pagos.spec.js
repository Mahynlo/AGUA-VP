const { test, expect } = require('@playwright/test');
const { launchApp } = require('../../helpers/electronApp');
const { loginAsAdmin } = require('../../helpers/authHelper');

test.describe('Módulo 07: Cobranza y Gestión de Pagos', () => {
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

  test('07.1 - Debe cargar la vista de Gestión de Pagos y sus pestañas', async () => {
    await window.evaluate(() => {
      const link = document.querySelector('a[href*="pagos"]');
      if (link) link.click();
      else window.location.hash = '#/resibos/pagos';
    });

    const heading = window.locator('h1', { hasText: 'Gestión de Pagos' });
    await expect(heading).toBeVisible({ timeout: 15000 });

    const tabCobranza = window.locator('button', { hasText: 'Cobranza' });
    const tabFacturas = window.locator('button', { hasText: 'Facturas' });

    await expect(tabCobranza).toBeVisible({ timeout: 10000 });
    await expect(tabFacturas).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para ver la vista de pagos y KPIs
    await window.waitForTimeout(3000);
  });

  test('07.2 - Debe mostrar el módulo de Cobranza con buscador de cliente o predio', async () => {
    const tabCobranza = window.locator('button', { hasText: 'Cobranza' });
    await tabCobranza.click();

    const inputCobranza = window.locator('input[placeholder*="Buscar"], input[placeholder*="predio"], input[type="text"]').first();
    await expect(inputCobranza).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para ver la caja de cobranza
    await window.waitForTimeout(3000);
  });
});
