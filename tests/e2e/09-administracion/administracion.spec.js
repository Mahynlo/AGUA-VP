const { test, expect } = require('@playwright/test');
const { usarApp } = require('../../helpers/sesion');
const { irA, loginAsAdmin } = require('../../helpers/authHelper');
const { fila } = require('../../helpers/datos');
const { USUARIO_PRUEBA } = require('../../helpers/baseDePrueba');

// Usuario operador que se crea en esta prueba (solo en la copia de la base)
const OPERADOR = { nombre: 'Operador De Pruebas', usuario: 'operador.pruebas', correo: 'operador.pruebas@aguavp.com', password: 'Operador123!' };

test.describe('09 · Administración de usuarios y permisos', () => {
  const ctx = usarApp(test);
  const buscador = () => ctx.window.locator('input[placeholder^="Buscar por nombre, usuario"]');

  test('el directorio de usuarios muestra y encuentra usuarios', async () => {
    const { window } = ctx;
    await irA(window, '#/administrador', 'Administración del Sistema');
    await buscador().fill(USUARIO_PRUEBA.username);
    await expect(window.getByText(USUARIO_PRUEBA.nombre).first()).toBeVisible({ timeout: 15000 });
  });

  test('registra un usuario operador', async () => {
    const { window } = ctx;
    await window.locator('button', { hasText: 'Nuevo Usuario' }).click();
    const dialogo = window.getByRole('dialog');
    await dialogo.locator('input[placeholder="Nombre del personal"]').fill(OPERADOR.nombre);
    await dialogo.locator('input[placeholder="Ej. juan.perez"]').fill(OPERADOR.usuario);
    await dialogo.locator('input[type="email"]').fill(OPERADOR.correo);
    await dialogo.locator('input[type="password"]').nth(0).fill(OPERADOR.password);
    await dialogo.locator('input[type="password"]').nth(1).fill(OPERADOR.password);
    await dialogo.locator('select').selectOption('operador');
    await dialogo.locator('button', { hasText: 'Confirmar Registro' }).click();

    await expect(dialogo).toBeHidden({ timeout: 15000 });
    expect(fila('SELECT rol, estado_usuario FROM usuarios WHERE correo = ?', OPERADOR.correo)).toMatchObject({ rol: 'operador', estado_usuario: 'Activo' });
    await buscador().fill(OPERADOR.usuario);
    await expect(window.getByText(OPERADOR.nombre).first()).toBeVisible({ timeout: 15000 });
  });

  test('el operador entra al sistema pero no puede registrar clientes', async () => {
    const { window } = ctx;
    await window.locator('button[aria-label="Menú de perfil"]').click();
    await window.locator('button', { hasText: 'Cerrar Sesión' }).click();
    await window.locator('button', { hasText: 'Sí, cerrar sesión' }).click();
    await expect(window.locator('input[type="email"]')).toBeVisible({ timeout: 15000 });

    await loginAsAdmin(window, { email: OPERADOR.correo, password: OPERADOR.password });
    await irA(window, '#/clientes', 'Gestión de Clientes');
    // El rol operador solo tiene permiso de tomar lecturas
    await expect(window.locator('button', { hasText: 'Nuevo Cliente' })).toBeDisabled({ timeout: 15000 });
  });
});
