const { test, expect } = require('@playwright/test');
const { launchApp } = require('../../helpers/electronApp');
const { loginAsAdmin } = require('../../helpers/authHelper');

test.describe('Módulo 02: Navegación y Shell Principal', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    const appData = await launchApp();
    electronApp = appData.electronApp;
    window = appData.window;

    // Asegurar que estamos autenticados con la cuenta de admin
    await loginAsAdmin(window);
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('02.1 - La barra superior (Navbar) debe estar visible y mostrar los controles principales', async () => {
    const navbar = window.locator('nav').first();
    await expect(navbar).toBeVisible({ timeout: 15000 });
  });

  test('02.2 - La barra lateral (Sidebar) debe contener los enlaces a los módulos del sistema', async () => {
    const linkClientes = window.locator('a[href="#/clientes"]');
    const linkMedidores = window.locator('a[href="#/medidores"]');
    const linkLecturas = window.locator('a[href="#/resibos/lecturas"]');

    await expect(linkClientes).toBeVisible({ timeout: 10000 });
    await expect(linkMedidores).toBeVisible({ timeout: 10000 });
    await expect(linkLecturas).toBeVisible({ timeout: 10000 });
  });

  test('02.3 - Navegación hacia el módulo de Clientes', async () => {
    const linkClientes = window.locator('a[href="#/clientes"]');
    await linkClientes.click();

    const headingClientes = window.locator('h1', { hasText: 'Gestión de Clientes' });
    await expect(headingClientes).toBeVisible({ timeout: 15000 });
  });

  test('02.4 - Navegación hacia el módulo de Medidores', async () => {
    const linkMedidores = window.locator('a[href="#/medidores"]');
    await linkMedidores.click();

    const headingMedidores = window.locator('h3', { hasText: 'Inventario de Medidores' });
    await expect(headingMedidores).toBeVisible({ timeout: 15000 });
  });
});
