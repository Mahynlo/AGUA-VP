const { test, expect } = require('@playwright/test');
const { launchApp } = require('../../helpers/electronApp');
const { DEFAULT_ADMIN, ensureLoggedOut, dismissWelcomeModalIfNeeded } = require('../../helpers/authHelper');

test.describe('Módulo 01: Autenticación e Inicio de Sesión', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    const appData = await launchApp();
    electronApp = appData.electronApp;
    window = appData.window;
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('01.1 - Debe presentar el formulario de inicio de sesión con todos sus campos', async () => {
    await ensureLoggedOut(window);

    const heading = window.locator('h1', { hasText: 'Iniciar Sesión' });
    await expect(heading).toBeVisible({ timeout: 15000 });

    const emailInput = window.locator('input[type="email"]');
    const passwordInput = window.locator('input[type="password"]');
    const submitBtn = window.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText(/Ingresar al Panel/i);

    // Pausa demostrativa para observar la pantalla de login
    await window.waitForTimeout(2000);
  });

  test('01.2 - Debe mostrar mensaje de error si las credenciales son incorrectas', async () => {
    await dismissWelcomeModalIfNeeded(window);

    const emailInput = window.locator('input[type="email"]');
    const passwordInput = window.locator('input[type="password"]');
    const submitBtn = window.locator('button[type="submit"]');

    await emailInput.fill('usuario_invalido@aguavp.com');
    await passwordInput.fill('PasswordIncorrecto123');
    await submitBtn.click();

    // Esperar mensaje o alerta de error visible
    const errorMessage = window.locator('div.border-rose-500\\/20, [class*="text-rose-"]');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });

    // Pausa demostrativa para que el usuario aprecie el mensaje de error en rojo
    await window.waitForTimeout(3000);
  });

  test('01.3 - Debe iniciar sesión exitosamente con la cuenta por defecto de Admin', async () => {
    await dismissWelcomeModalIfNeeded(window);

    const emailInput = window.locator('input[type="email"]');
    const passwordInput = window.locator('input[type="password"]');
    const submitBtn = window.locator('button[type="submit"]');

    // Limpiar campos y llenar credenciales por defecto de admin
    await emailInput.fill(DEFAULT_ADMIN.email);
    await passwordInput.fill(DEFAULT_ADMIN.password);
    await submitBtn.click();

    // Debe acceder al sistema y visualizarse la barra de navegación principal
    const navbar = window.locator('nav').first();
    await expect(navbar).toBeVisible({ timeout: 20000 });

    // Pausa demostrativa para ver el dashboard/panel tras iniciar sesión
    await window.waitForTimeout(4000);
  });
});
