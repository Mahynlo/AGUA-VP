const { test, expect } = require('@playwright/test');
const { usarApp } = require('../../helpers/sesion');
const { irA } = require('../../helpers/authHelper');
const { fila, CLIENTE_PRUEBA } = require('../../helpers/datos');
const { esperarAviso } = require('../../helpers/ui');

// El cliente de prueba (CLIENTE_PRUEBA) se crea aquí desde la pantalla, solo en la copia de la base
const CLIENTE = CLIENTE_PRUEBA;

test.describe('03 · Clientes', () => {
  const ctx = usarApp(test);
  const buscador = () => ctx.window.locator('input[placeholder^="Buscar por nombre"]');

  test('registra un cliente nuevo con su tarifa', async () => {
    const { window } = ctx;
    await irA(window, '#/clientes', 'Gestión de Clientes');
    await window.locator('button', { hasText: 'Nuevo Cliente' }).click();

    const dialogo = window.getByRole('dialog');
    await expect(dialogo.getByRole('heading', { name: 'Registrar Nuevo Cliente' }).first()).toBeVisible();
    await dialogo.locator('input[placeholder^="Ej. NG-123"]').fill(CLIENTE.predio);
    await dialogo.locator('input[placeholder="Ingresa el nombre completo"]').fill(CLIENTE.nombre);
    await dialogo.locator('input[type="email"]').fill(CLIENTE.correo);
    await dialogo.locator('input[type="tel"]').fill(CLIENTE.telefono);
    await dialogo.locator('select[aria-label="Ciudad"]').selectOption(CLIENTE.ciudad);
    await dialogo.locator('textarea').fill(CLIENTE.direccion);
    await dialogo.locator('select[aria-label="Tarifa"]').selectOption(String(fila('SELECT id FROM tarifas WHERE nombre = ?', CLIENTE.tarifa).id));
    await dialogo.locator('button', { hasText: 'Guardar Cliente' }).click();

    await esperarAviso(window, /registrado/i);
    await expect(dialogo).toBeHidden({ timeout: 15000 });
    const guardado = fila(`SELECT c.*, t.nombre AS tarifa FROM clientes c JOIN tarifas t ON t.id = c.tarifa_id WHERE c.numero_predio = ?`, CLIENTE.predio);
    expect(guardado, 'el cliente debe quedar guardado en la base').toBeTruthy();
    expect(guardado).toMatchObject({ nombre: CLIENTE.nombre, correo: CLIENTE.correo, ciudad: CLIENTE.ciudad, tarifa: CLIENTE.tarifa, estado_cliente: 'Activo' });
  });

  test('no permite registrar un número de predio repetido', async () => {
    const { window } = ctx;
    await window.locator('button', { hasText: 'Nuevo Cliente' }).click();
    const dialogo = window.getByRole('dialog');
    await dialogo.locator('input[placeholder^="Ej. NG-123"]').fill(CLIENTE.predio);
    await dialogo.locator('input[placeholder="Ingresa el nombre completo"]').fill('Otro Cliente Repetido');
    await dialogo.locator('input[type="email"]').fill('otro.e2e@aguavp.com');
    await dialogo.locator('input[type="tel"]').fill('6629876543');
    await dialogo.locator('select[aria-label="Ciudad"]').selectOption(CLIENTE.ciudad);
    await dialogo.locator('textarea').fill('Otra dirección');
    await dialogo.locator('select[aria-label="Tarifa"]').selectOption(String(fila('SELECT id FROM tarifas WHERE nombre = ?', CLIENTE.tarifa).id));
    await dialogo.locator('button', { hasText: 'Guardar Cliente' }).click();

    // La app avisa del predio repetido, el formulario sigue abierto y no se crea un segundo cliente
    await esperarAviso(window, /Ya existe un cliente registrado con el número de predio/);
    await expect(dialogo).toBeVisible();
    expect(fila('SELECT COUNT(*) AS n FROM clientes WHERE numero_predio = ?', CLIENTE.predio).n).toBe(1);
    await dialogo.locator('button', { hasText: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
  });

  test('el buscador encuentra al cliente por nombre y por predio', async () => {
    const { window } = ctx;
    await buscador().fill('Prueba Automatizada');
    await expect(window.getByText(CLIENTE.nombre).first()).toBeVisible({ timeout: 15000 });
    await buscador().fill(CLIENTE.predio);
    await expect(window.getByText(CLIENTE.nombre).first()).toBeVisible({ timeout: 15000 });
  });

  test('edita el teléfono del cliente', async () => {
    const { window } = ctx;
    await buscador().fill(CLIENTE.predio);
    await expect(window.getByText(CLIENTE.nombre).first()).toBeVisible({ timeout: 15000 });
    await window.locator('button[title="Editar Cliente"]').first().click();

    const dialogo = window.getByRole('dialog');
    const tel = dialogo.locator('input[type="tel"]');
    // El formulario carga los datos del cliente al abrirse: esperar a que muestre el teléfono actual
    // (si se escribe antes, la carga lo sobrescribe)
    await expect(tel).toHaveValue(/\d{10}/, { timeout: 10000 });
    await tel.fill('6627654321');
    await dialogo.locator('button', { hasText: 'Guardar Cambios' }).click();
    await esperarAviso(window, /actualizado/i);

    await expect.poll(() => fila('SELECT telefono FROM clientes WHERE numero_predio = ?', CLIENTE.predio).telefono.replace(/\D/g, ''), { timeout: 15000 })
      .toBe('6627654321');
  });

  test('el filtro de situación de pago cuenta al cliente nuevo como "al corriente"', async () => {
    const { window } = ctx;
    await buscador().fill('');
    const situacion = window.locator('select[aria-label="Cualquier situación de pago"]');
    const opcion = situacion.locator('option[value="al_corriente"]');
    const esperado = fila(`SELECT COUNT(*) AS n FROM clientes c WHERE c.estado_cliente != 'Eliminado'
      AND NOT EXISTS (SELECT 1 FROM facturas f WHERE f.cliente_id = c.id AND f.saldo_pendiente > 0)`).n;
    await expect(opcion).toHaveText(new RegExp(`\\(${esperado}\\)`), { timeout: 15000 });

    await situacion.selectOption('al_corriente');
    await buscador().fill(CLIENTE.predio);
    await expect(window.getByText(CLIENTE.nombre).first()).toBeVisible({ timeout: 15000 });
  });
});
