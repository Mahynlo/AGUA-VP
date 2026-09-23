const { expect } = require('@playwright/test');

/**
 * Credenciales por defecto del usuario Administrador del sistema AguaVP
 */
const DEFAULT_ADMIN = {
  email: 'admin@aguavp.com',
  password: 'Admin123!'
};

/**
 * Cierra la ventana emergente de bienvenida si estuviese presente al arrancar
 */
async function dismissWelcomeModalIfNeeded(window) {
  try {
    const btnRegistrar = window.locator('button', { hasText: 'Registrar y Continuar' });
    if (await btnRegistrar.isVisible({ timeout: 2500 })) {
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

  // Verificar si ya estamos autenticados en el shell de la aplicación
  const navBar = window.locator('nav').first();
  const alreadyLoggedIn = await navBar.isVisible({ timeout: 2000 }).catch(() => false);
  if (alreadyLoggedIn) {
    return;
  }

  // Esperar a que el formulario de inicio de sesión esté en pantalla
  const emailInput = window.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 15000 });

  // Llenar correo y contraseña
  await emailInput.fill(credentials.email);
  const passwordInput = window.locator('input[type="password"]');
  await passwordInput.fill(credentials.password);

  // Hacer clic en Ingresar
  const submitButton = window.locator('button[type="submit"]');
  await submitButton.click();

  // Esperar a que aparezca la barra de navegación principal
  await expect(navBar).toBeVisible({ timeout: 20000 });
}

module.exports = {
  DEFAULT_ADMIN,
  dismissWelcomeModalIfNeeded,
  ensureLoggedOut,
  loginAsAdmin
};
