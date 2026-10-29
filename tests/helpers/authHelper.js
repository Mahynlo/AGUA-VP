const { expect } = require('@playwright/test');

const { USUARIO_PRUEBA } = require('./baseDePrueba');

/**
 * Usuario superadmin de prueba: se crea solo en la copia de la base (baseDePrueba.js)
 */
const DEFAULT_ADMIN = {
  email: USUARIO_PRUEBA.correo,
  password: USUARIO_PRUEBA.password
};

/**
 * Cierra la ventana emergente de bienvenida si estuviese presente al arrancar
 */
async function dismissWelcomeModalIfNeeded(window) {
  try {
    const btnRegistrar = window.locator('button', { hasText: 'Registrar y Continuar' });
    if (await btnRegistrar.waitFor({ state: 'visible', timeout: 2500 }).then(() => true, () => false)) {
      await btnRegistrar.click();
      await window.waitForTimeout(1000);
    }
  } catch (e) {
    // Si no aparece el modal, continuar normalmente
  }
}

/**
 * Asegura que la sesión esté cerrada y la pantalla esté en el Login
 */
async function ensureLoggedOut(window) {
  await window.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('app_last_route');
    window.location.hash = '#/';
  });
  await window.reload();
  await window.waitForLoadState('domcontentloaded');
  await dismissWelcomeModalIfNeeded(window);
}

/**
 * Inicia sesión en la aplicación utilizando la cuenta de administrador por defecto
 */
async function loginAsAdmin(window, credentials = DEFAULT_ADMIN) {
  await dismissWelcomeModalIfNeeded(window);

  // Ya autenticado: el menú lateral (enlace a Clientes) solo existe dentro de la app.
  // Ojo: la barra de título es un <nav> que también está en el login, no sirve como indicador.
  const menu = window.locator('a[href="#/clientes"]').first();
  if (await menu.waitFor({ state: 'visible', timeout: 2000 }).then(() => true, () => false)) {
    return;
  }

  const emailInput = window.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 20000 });
  await emailInput.fill(credentials.email);
  await window.locator('input[type="password"]').fill(credentials.password);
  await window.locator('button', { hasText: 'Ingresar al Panel' }).click();

  await expect(menu).toBeVisible({ timeout: 30000 });
  await dismissWelcomeModalIfNeeded(window);
}

/** Navega a una sección por su hash (#/clientes, #/resibos/pagos, ...) y espera su título. */
async function irA(window, hash, titulo) {
  await window.evaluate((h) => { window.location.hash = h; }, hash);
  if (titulo) await expect(window.locator('h1', { hasText: titulo }).first()).toBeVisible({ timeout: 20000 });
}

module.exports = {
  DEFAULT_ADMIN,
  irA,
  dismissWelcomeModalIfNeeded,
  ensureLoggedOut,
  loginAsAdmin
};
