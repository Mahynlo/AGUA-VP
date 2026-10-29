const { test, expect } = require('@playwright/test');
const { usarApp } = require('../../helpers/sesion');
const { DEFAULT_ADMIN, loginAsAdmin } = require('../../helpers/authHelper');

test.describe('01 · Acceso al sistema', () => {
  const ctx = usarApp(test, { iniciarSesion: false });

  test('rechaza una contraseña incorrecta y no entra al sistema', async () => {
    const { window } = ctx;
    await window.locator('input[type="email"]').fill(DEFAULT_ADMIN.email);
    await window.locator('input[type="password"]').fill('ContraseñaMala1!');
    await window.locator('button', { hasText: 'Ingresar al Panel' }).click();

    await expect(window.getByText(/credenciales|incorrect|inválid/i).first()).toBeVisible({ timeout: 15000 });
    await expect(window.locator('a[href="#/clientes"]')).toHaveCount(0);
  });

  test('valida el formato del correo antes de enviar', async () => {
    const { window } = ctx;
    // el navegador acepta el formato; la app exige un dominio válido
    await window.locator('input[type="email"]').fill('usuario@dominio.local');
    await window.locator('input[type="password"]').fill('Cualquiera1!');
    await window.locator('button', { hasText: 'Ingresar al Panel' }).click();
    await expect(window.getByText('Ingresa un correo electrónico válido.')).toBeVisible();
  });

  test('inicia sesión con un usuario válido y muestra el menú', async () => {
    await loginAsAdmin(ctx.window);
    await expect(ctx.window.locator('a[href="#/clientes"]').first()).toBeVisible();
  });

  test('cierra sesión y regresa al login', async () => {
    const { window } = ctx;
    await window.locator('button[aria-label="Menú de perfil"]').click();
    await window.locator('button', { hasText: 'Cerrar Sesión' }).click();
    await window.locator('button', { hasText: 'Sí, cerrar sesión' }).click();

    await expect(window.locator('input[type="email"]')).toBeVisible({ timeout: 15000 });
    await expect(window.locator('a[href="#/clientes"]')).toHaveCount(0);
  });
});
