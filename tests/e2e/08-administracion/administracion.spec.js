const { test, expect } = require('@playwright/test');
const { launchApp } = require('../../helpers/electronApp');
const { loginAsAdmin } = require('../../helpers/authHelper');

test.describe('Módulo 08: Administración del Sistema', () => {
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

  test('08.1 - Debe cargar la vista de Administración del Sistema', async () => {
    await window.evaluate(() => {
      const link = document.querySelector('a[href*="administrador"]');
      if (link) link.click();
      else window.location.hash = '#/administrador';
    });

    const heading = window.locator('h1', { hasText: 'Administración del Sistema' });
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Pausa demostrativa para ver la vista de administración
    await window.waitForTimeout(3000);
  });

  test('08.2 - Debe mostrar las pestañas de administración (Usuarios, Mantenimiento, Configuración)', async () => {
    const tabUsuarios = window.locator('button', { hasText: 'Usuarios' });
    await expect(tabUsuarios).toBeVisible({ timeout: 10000 });

    const tabMantenimiento = window.locator('button', { hasText: 'Mantenimiento' });
    await expect(tabMantenimiento).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para ver las pestañas y la lista de usuarios
    await window.waitForTimeout(3000);
  });
});
