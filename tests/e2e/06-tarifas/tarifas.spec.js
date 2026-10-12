const { test, expect } = require('@playwright/test');
const { usarApp } = require('../../helpers/sesion');
const { irA } = require('../../helpers/authHelper');
const { fila, filas, totalTarifa } = require('../../helpers/datos');
const { esperarAviso } = require('../../helpers/ui');

// Tarifa que se crea en esta prueba (solo en la copia de la base). Escala: cuota base 0–10 m³ y dos bloques.
// La pantalla pide máximo en todos los rangos (como las tarifas reales); lo que pase del último se cobra a su precio.
const NOMBRE = 'Tarifa Pruebas';
const ESCALA = [
  { min: '0', max: '10', precio: '100' }, // cuota base fija
  { min: '11', max: '20', precio: '12' },
  { min: '21', max: '50', precio: '15' }
];

test.describe('06 · Tarifas', () => {
  const ctx = usarApp(test);
  // Tarjeta de la tarifa: el contenedor más cercano al título con sus botones ("Editar" si ya tiene rangos,
  // "Nuevo Rango" si todavía no)
  const tarjeta = (nombre) => ctx.window.locator(`xpath=//h3[normalize-space()='${nombre}']/ancestor::div[.//button[@title='Editar' or @title='Nuevo Rango']][1]`);
  const rangosGuardados = () => filas('SELECT consumo_min, consumo_max, precio_por_m3 FROM rangos_tarifas WHERE tarifa_id = ? ORDER BY consumo_min', tarifa().id).map((r) => ({ ...r }));

  /** Abre "Editar" de la tarifa en la pestaña de bloques; devuelve el diálogo y sus campos numéricos. */
  async function editarBloques(nombre) {
    await tarjeta(nombre).locator('button[title="Editar"]').click();
    const dialogo = ctx.window.getByRole('dialog');
    await dialogo.locator('button', { hasText: 'Bloques de Consumo' }).click();
    return { dialogo, campos: dialogo.locator('input[type="number"]') };
  }
  const tarifa = () => fila('SELECT * FROM tarifas WHERE nombre = ?', NOMBRE);

  test('crea una tarifa nueva', async () => {
    const { window } = ctx;
    await irA(window, '#/resibos/tarifas', 'Gestión de Tarifas');
    await window.locator('button', { hasText: 'Nueva Tarifa' }).click();
    const dialogo = window.getByRole('dialog');
    await dialogo.locator('input[placeholder^="Ej. Tarifa Residencial"]').fill(NOMBRE);
    await dialogo.locator('textarea').fill('Tarifa creada por las pruebas automatizadas');
    await dialogo.locator('input[type="date"]').first().fill('2026-10-01');
    await dialogo.locator('button', { hasText: 'Guardar Tarifa' }).click();

    await expect(dialogo).toBeHidden({ timeout: 15000 });
    await expect(window.getByRole('heading', { name: NOMBRE })).toBeVisible({ timeout: 15000 });
    expect(tarifa(), 'la tarifa debe quedar guardada').toBeTruthy();
  });

  test('registra su escala de rangos', async () => {
    const { window } = ctx;
    await tarjeta(NOMBRE).locator('button[title="Nuevo Rango"]').click();
    const dialogo = window.getByRole('dialog');
    await expect(dialogo.getByRole('heading', { name: 'Registrar Rangos' }).first()).toBeVisible();

    for (let i = 0; i < ESCALA.length; i++) {
      if (i > 0) await dialogo.locator('button', { hasText: 'Añadir Nuevo Rango' }).click();
      const campos = dialogo.locator('input[type="number"]');
      await campos.nth(i * 3).fill(ESCALA[i].min);
      await campos.nth(i * 3 + 1).fill(ESCALA[i].max);
      await campos.nth(i * 3 + 2).fill(ESCALA[i].precio);
    }
    await dialogo.locator('button', { hasText: 'Guardar Rangos' }).click();
    await esperarAviso(window, /rango.*(registrad|guardad|agregad|cread)|(registrad|guardad|agregad|cread).*rango/i);
    await expect(dialogo).toBeHidden({ timeout: 15000 });

    const rangos = filas('SELECT consumo_min, consumo_max, precio_por_m3 FROM rangos_tarifas WHERE tarifa_id = ? ORDER BY consumo_min', tarifa().id)
      .map((r) => ({ ...r }));
    expect(rangos).toEqual([
      { consumo_min: 0, consumo_max: 10, precio_por_m3: 100 },
      { consumo_min: 11, consumo_max: 20, precio_por_m3: 12 },
      { consumo_min: 21, consumo_max: 50, precio_por_m3: 15 }
    ]);
    // Cuota base 100 + 10 m³ × 12 + 5 m³ × 15 = 295; pasando el último máximo: 100 + 120 + 30 × 15 + 10 × 15 = 820
    expect(await totalTarifa(25, tarifa().id)).toBe(295);
    expect(await totalTarifa(60, tarifa().id)).toBe(820);
  });

  test('al editar, rechaza una escala con un hueco y no cambia nada', async () => {
    const { window } = ctx;
    const { dialogo, campos } = await editarBloques(NOMBRE);
    await campos.nth(3).fill('12'); // el rango 2 empezaría en 12: queda un hueco después de 10
    await dialogo.locator('button', { hasText: 'Guardar Cambios' }).click();

    await esperarAviso(window, /Hay un hueco entre los rangos 1 y 2/);
    expect(rangosGuardados()).toHaveLength(3);
    await dialogo.locator('button', { hasText: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
  });

  test('al editar, eliminar un rango lo quita de verdad (bug corregido en rc.2)', async () => {
    const { window } = ctx;
    const { dialogo } = await editarBloques(NOMBRE);
    await dialogo.locator('button[title="Eliminar fila de rango"]').last().click();
    await dialogo.locator('button', { hasText: 'Guardar Cambios' }).click();

    await esperarAviso(window, /1 eliminado/);
    await expect(dialogo).toBeHidden({ timeout: 10000 });
    expect(rangosGuardados()).toEqual([
      { consumo_min: 0, consumo_max: 10, precio_por_m3: 100 },
      { consumo_min: 11, consumo_max: 20, precio_por_m3: 12 }
    ]);
    // Lo que pasa de 20 m³ se cobra al precio del último rango: 100 + 10 × 12 + 5 × 12 = 280
    expect(await totalTarifa(25, tarifa().id)).toBe(280);
  });

  test('la calculadora da el mismo total que la facturación', async () => {
    const { window } = ctx;
    await window.locator('button', { hasText: 'Calculadora' }).click();
    await window.locator('select[aria-label="Selecciona una tarifa"]').selectOption({ label: NOMBRE });
    await window.locator('input[placeholder="Ej. 25"]').fill('25');
    await window.locator('button', { hasText: 'Calcular Desglose' }).click();
    await expect(window.getByText(/\$\s?280(\.00)?/).first()).toBeVisible({ timeout: 10000 });
    await window.locator('button', { hasText: 'Tarifas' }).first().click();
  });

  test('las tarifas en uso no se pueden eliminar', async () => {
    const usada = fila(`SELECT t.nombre FROM tarifas t WHERE EXISTS (SELECT 1 FROM clientes c WHERE c.tarifa_id = t.id) LIMIT 1`).nombre;
    const boton = tarjeta(usada).locator('span[title^="No se puede eliminar"] button');
    await expect(boton).toBeDisabled({ timeout: 10000 });
  });

  test('elimina la tarifa sin uso tras confirmar su nombre', async () => {
    const { window } = ctx;
    await tarjeta(NOMBRE).locator('span[title="Eliminar tarifa"] button').click();
    const dialogo = window.getByRole('dialog');
    const confirmar = dialogo.locator('button', { hasText: 'Eliminar Tarifa' });
    await expect(confirmar).toBeDisabled();
    await dialogo.locator(`input[placeholder="${NOMBRE}"]`).fill(NOMBRE);
    await confirmar.click();

    await expect(window.getByRole('heading', { name: NOMBRE })).toHaveCount(0, { timeout: 15000 });
    expect(tarifa(), 'la tarifa debe desaparecer de la base').toBeUndefined();
  });
});
