const { test, expect } = require('@playwright/test');
const { launchApp } = require('../../helpers/electronApp');
const { loginAsAdmin } = require('../../helpers/authHelper');

test.describe('Módulo 03: Gestión de Clientes', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    const appData = await launchApp();
    electronApp = appData.electronApp;
    window = appData.window;

    // Asegurar que estamos autenticados en el sistema
    await loginAsAdmin(window);
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('03.1 - Debe cargar la vista principal de Gestión de Clientes', async () => {
    const linkClientes = window.locator('a[href="#/clientes"]');
    await linkClientes.click();

    const heading = window.locator('h1', { hasText: 'Gestión de Clientes' });
    await expect(heading).toBeVisible({ timeout: 15000 });

    const subHeading = window.locator('h3', { hasText: 'Directorio de Clientes' });
    await expect(subHeading).toBeVisible({ timeout: 15000 });

    // Pausa demostrativa para ver la tabla de clientes y KPIs
    await window.waitForTimeout(2500);
  });

  test('03.2 - El buscador en tiempo real debe permitir filtrar registros', async () => {
    const searchInput = window.locator('input[placeholder*="Buscar por nombre"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Ingresar término de búsqueda
    await searchInput.fill('Prueba');
    await expect(searchInput).toHaveValue('Prueba');
    await window.waitForTimeout(1500);

    // Limpiar búsqueda
    await searchInput.fill('');
    await expect(searchInput).toHaveValue('');
    await window.waitForTimeout(1000);
  });

  test('03.3 - Debe abrir y cerrar el modal para Registrar Nuevo Cliente', async () => {
    const btnNuevoCliente = window.locator('button', { hasText: 'Nuevo Cliente' });
    await expect(btnNuevoCliente).toBeVisible({ timeout: 10000 });

    // Disparar clic para abrir el modal
    await window.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Nuevo Cliente'));
      if (btn) btn.click();
    });

    // Comprobar que el modal se despliega
    const modalTitle = window.locator('text=Registrar Nuevo Cliente').first();
    await expect(modalTitle).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para observar el modal desplegado en pantalla
    await window.waitForTimeout(3000);

    // Cerrar el modal mediante el botón cancelar
    await window.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Cancelar');
      if (btn) btn.click();
    });

    await expect(modalTitle).not.toBeVisible({ timeout: 5000 });
    await window.waitForTimeout(1500);
  });
});
