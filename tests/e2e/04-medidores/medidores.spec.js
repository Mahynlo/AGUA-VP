const { test, expect } = require('@playwright/test');
const { usarApp } = require('../../helpers/sesion');
const { irA } = require('../../helpers/authHelper');
const { fila, CLIENTE_PRUEBA, asegurarClientePrueba } = require('../../helpers/datos');
const { esperarAviso } = require('../../helpers/ui');

// Medidor que se registra en esta prueba (solo en la copia de la base)
const MEDIDOR = { codigo: 'NG-', numero: '990001', marca: 'MarcaPruebas', modelo: 'MP-1', lecturaBase: '10', ubicacion: 'Frente a la casa de pruebas' };
const SERIE = `${MEDIDOR.codigo}${MEDIDOR.numero}`;

test.describe('04 · Medidores', () => {
  const ctx = usarApp(test, { antes: asegurarClientePrueba });
  const buscador = () => ctx.window.locator('input[placeholder^="Buscar por serie"]');

  async function abrirFormulario() {
    const { window } = ctx;
    await window.locator('button', { hasText: 'Nuevo Medidor' }).click();
    const dialogo = window.getByRole('dialog');
    await expect(dialogo.getByRole('heading', { name: 'Registrar Nuevo Medidor' }).first()).toBeVisible();
    await dialogo.locator('select[aria-label="Código de Ciudad"]').selectOption(MEDIDOR.codigo);
    await dialogo.locator('input[placeholder="123456"]').fill(MEDIDOR.numero);
    await dialogo.locator('input[type="date"]').fill('2026-10-01');
    await dialogo.locator('input[placeholder="Ej. AquaTech"]').fill(MEDIDOR.marca);
    await dialogo.locator('input[placeholder="Ej. AT-150"]').fill(MEDIDOR.modelo);
    await dialogo.locator('input[placeholder="Ej. 0 o 1234.56"]').fill(MEDIDOR.lecturaBase);
    await dialogo.locator('textarea').fill(MEDIDOR.ubicacion);
    return dialogo;
  }

  test('registra un medidor y lo asigna al cliente de prueba', async () => {
    const { window } = ctx;
    await irA(window, '#/medidores', 'Gestión de Medidores');
    await window.locator('button', { hasText: 'Inventario General' }).click();

    const dialogo = await abrirFormulario();
    await dialogo.locator('input[placeholder^="Buscar cliente"]').fill('Prueba Automatizada');
    await dialogo.locator('h4', { hasText: CLIENTE_PRUEBA.nombre }).first().click();
    await dialogo.locator('button', { hasText: 'Registrar Medidor' }).click();

    await esperarAviso(window, /registrado/i);
    await expect(dialogo).toBeHidden({ timeout: 15000 });
    const m = fila(`SELECT m.*, c.numero_predio FROM medidores m LEFT JOIN clientes c ON c.id = m.cliente_id WHERE m.numero_serie = ?`, SERIE);
    expect(m, 'el medidor debe quedar guardado').toBeTruthy();
    expect(m).toMatchObject({ marca: MEDIDOR.marca, modelo: MEDIDOR.modelo, lectura_base: 10, numero_predio: CLIENTE_PRUEBA.predio, estado_medidor: 'Activo' });
  });

  test('no permite registrar un número de serie repetido', async () => {
    const { window } = ctx;
    const dialogo = await abrirFormulario();
    await dialogo.locator('button', { hasText: 'Registrar Medidor' }).click();

    await esperarAviso(window, /El número de serie ya está registrado/);
    expect(fila('SELECT COUNT(*) AS n FROM medidores WHERE numero_serie = ?', SERIE).n).toBe(1);
    await dialogo.locator('button', { hasText: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
  });

  test('el inventario encuentra el medidor por serie y por cliente', async () => {
    const { window } = ctx;
    await buscador().fill(MEDIDOR.numero);
    await expect(window.getByText(SERIE).first()).toBeVisible({ timeout: 15000 });
    await buscador().fill('Prueba Automatizada');
    await expect(window.getByText(SERIE).first()).toBeVisible({ timeout: 15000 });
  });

  test('los filtros de "Más filtros" cuentan y filtran el medidor nuevo', async () => {
    const { window } = ctx;
    await buscador().fill('');
    await window.locator('button', { hasText: 'Más filtros' }).click();

    // Marca: la opción muestra 1 medidor y al elegirla la tabla solo lo muestra a él
    const marca = window.locator('select[aria-label="Marca"]');
    await expect(marca.locator('option', { hasText: MEDIDOR.marca })).toHaveText(/\(1\)/, { timeout: 15000 });
    await marca.selectOption({ label: `${MEDIDOR.marca} (1)` });
    await expect(window.getByText(SERIE).first()).toBeVisible({ timeout: 15000 });

    // Vinculación: los conteos coinciden con la base
    const asignados = fila('SELECT COUNT(*) AS n FROM medidores WHERE fecha_eliminacion IS NULL AND cliente_id IS NOT NULL').n;
    await expect(window.locator('select[aria-label="Vinculación"] option[value="asignados"]'))
      .toHaveText(new RegExp(`\\(${asignados}\\)`), { timeout: 15000 });
  });
});
