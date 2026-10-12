const { test, expect } = require('@playwright/test');
const { usarApp } = require('../../helpers/sesion');
const { irA } = require('../../helpers/authHelper');
const { esperarPdfNuevo } = require('../../helpers/ui');

// Solo se generan los PDF y se revisa la vista previa: NUNCA se presiona "Imprimir" (iría a la impresora).
test.describe('08 · Impresión de recibos y reportes', () => {
  const ctx = usarApp(test);

  /** Presiona un botón que genera un PDF, espera la vista previa y la cierra sin imprimir. */
  async function generarPdf(textoBoton) {
    const { window } = ctx;
    const desde = Date.now();
    await window.locator('button', { hasText: textoBoton }).first().click();
    const pdf = await esperarPdfNuevo(desde, 120000);
    await expect(window.getByText(/VISTA PREVIA INTERACTIVA/i).first()).toBeVisible({ timeout: 30000 });
    await window.locator('button', { hasText: /^Cancelar$/ }).last().click();
    await expect(window.getByText(/VISTA PREVIA INTERACTIVA/i)).toHaveCount(0, { timeout: 10000 });
    return pdf;
  }

  test('la prueba de impresión genera un recibo de 1 hoja', async () => {
    await irA(ctx.window, '#/resibos/impresion', 'Impresión de Recibos');
    const pdf = await generarPdf('Prueba de Impresión (1 Recibo)');
    expect(pdf.paginas).toBe(1);
  });

  test('emite los recibos del período: 2 recibos por hoja', async () => {
    const { window } = ctx;
    const n = Number((await window.locator('button', { hasText: 'Impresión General' }).innerText()).replace(/\D/g, ''));
    expect(n, 'el período debe tener recibos').toBeGreaterThan(0);
    const pdf = await generarPdf('Emitir e Imprimir Recibos');
    expect(pdf.paginas).toBe(Math.ceil(n / 2));
  });

  test('emite el reporte de lecturas', async () => {
    await ctx.window.locator('button', { hasText: 'Reportes y Listas' }).click();
    const pdf = await generarPdf('Emitir Reporte de Lecturas');
    expect(pdf.paginas).toBeGreaterThan(0);
  });

  test('emite el padrón general', async () => {
    const pdf = await generarPdf('Emitir Padrón General');
    expect(pdf.paginas).toBeGreaterThan(0);
  });

  test('emite el informe general', async () => {
    const pdf = await generarPdf('Emitir Informe General');
    expect(pdf.paginas).toBeGreaterThan(0);
  });
});
