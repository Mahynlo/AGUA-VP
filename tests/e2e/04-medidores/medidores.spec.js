const { test, expect } = require('@playwright/test');
const { launchApp } = require('../../helpers/electronApp');
const { loginAsAdmin } = require('../../helpers/authHelper');

test.describe('Módulo 04: Inventario y Gestión de Medidores', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    const appData = await launchApp();
    electronApp = appData.electronApp;
    window = appData.window;

    // Iniciar sesión con la cuenta de administrador
    await loginAsAdmin(window);
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('04.1 - Debe cargar la vista principal de Gestión de Medidores con sus KPIs', async () => {
    const linkMedidores = window.locator('a[href="#/medidores"]');
    await linkMedidores.click();

    const heading = window.locator('h1', { hasText: 'Gestión de Medidores' });
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verificar las pestañas de navegación interna
    const tabMapa = window.locator('button', { hasText: 'Mapa y Ubicaciones' });
    const tabInventario = window.locator('button', { hasText: 'Inventario General' });

    await expect(tabMapa).toBeVisible({ timeout: 10000 });
    await expect(tabInventario).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para ver la vista de medidores y KPIs
    await window.waitForTimeout(2500);
  });

  test('04.2 - Debe alternar a la pestaña de Inventario General', async () => {
    const tabInventario = window.locator('button', { hasText: 'Inventario General' });
    await tabInventario.click();

    // El buscador del inventario debe ser accesible
    const searchInput = window.locator('input[placeholder*="Buscar por serie"], input[placeholder*="Buscar"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para ver la tabla del inventario
    await window.waitForTimeout(2500);
  });

  test('04.3 - Búsqueda interactiva de medidores', async () => {
    const searchInput = window.locator('input[placeholder*="Buscar por serie"], input[placeholder*="Buscar"]').first();
    await searchInput.fill('MED-01');
    await expect(searchInput).toHaveValue('MED-01');
    await window.waitForTimeout(1500);

    await searchInput.fill('');
    await expect(searchInput).toHaveValue('');
    await window.waitForTimeout(1000);
  });
});
