const { test, expect } = require('@playwright/test');
const { usarApp } = require('../../helpers/sesion');
const { irA } = require('../../helpers/authHelper');
const { fila, filas, totalTarifa, sembrarLecturasRuta } = require('../../helpers/datos');
const { esperarAviso, elegirPeriodo } = require('../../helpers/ui');

// Septiembre 2026 es el período siguiente al último leído en la copia (agosto): la pantalla lo propone.
const RUTA_ID = 1;
const PERIODO = '2026-09';
const CONSUMO_1 = 12; // primer medidor capturado desde la pantalla
const CONSUMO_2 = 30; // segundo medidor
const CONSUMO_RECTIFICADO = 20;

test.describe('05 · Lecturas, facturación y recálculo de una ruta', () => {
  let pendientes = [];
  const ctx = usarApp(test, {
    // 178 lecturas se registran directo en la copia; las 2 primeras de la ruta se capturan en pantalla
    antes: () => { ({ pendientes } = sembrarLecturasRuta({ rutaId: RUTA_ID, periodo: PERIODO, fecha: '2026-09-05', dejarSinLeer: 2 })); }
  });

  const carrusel = () => ctx.window.getByRole('dialog');
  // El campo de la lectura muestra como sugerencia la lectura anterior (placeholder variable)
  const campoLectura = () => carrusel().locator('input[type="text"]:not([placeholder^="Buscar"])');
  const lecturaDe = (medidorId) => fila('SELECT * FROM lecturas WHERE medidor_id = ? AND periodo = ?', medidorId, PERIODO);

  async function abrirCarrusel() {
    const { window } = ctx;
    await irA(window, '#/resibos/lecturas', 'Sistema de Lecturas');
    await window.locator('button', { hasText: 'Tomar Lecturas' }).first().click();
    await expect(carrusel().getByRole('heading', { name: 'Toma de Lecturas' }).first()).toBeVisible({ timeout: 15000 });
    await expect(carrusel().getByText('Septiembre 2026').first()).toBeVisible();
  }

  async function cerrarCarrusel() {
    await carrusel().locator('button[aria-label="Close"]').click();
    await expect(carrusel()).toBeHidden({ timeout: 10000 });
  }

  test('captura la lectura del primer medidor pendiente', async () => {
    await abrirCarrusel();
    const [m1] = pendientes;
    await expect(carrusel().getByText(m1.numero_serie).first()).toBeVisible({ timeout: 15000 });

    await campoLectura().fill(String(m1.anterior + CONSUMO_1));
    await carrusel().locator('button', { hasText: 'Guardar y Siguiente' }).click();

    await expect.poll(() => lecturaDe(m1.medidor_id)?.consumo_m3, { timeout: 15000 }).toBe(CONSUMO_1);
    expect(lecturaDe(m1.medidor_id)).toMatchObject({ lectura_anterior: m1.anterior, lectura_actual: m1.anterior + CONSUMO_1, ruta_id: RUTA_ID });
  });

  test('una lectura menor a la anterior no se guarda: pide confirmar vuelta a cero o corregir', async () => {
    const m2 = pendientes[1];
    await expect(carrusel().getByText(m2.numero_serie).first()).toBeVisible({ timeout: 15000 });

    await campoLectura().fill(String(m2.anterior - 5));
    await expect(carrusel().getByText('Alerta: La lectura es menor que la anterior')).toBeVisible();
    await expect(carrusel().locator('button', { hasText: 'Guardar y Siguiente' })).toHaveCount(0);
    await carrusel().locator('button', { hasText: 'Corregir Error' }).click();
    expect(lecturaDe(m2.medidor_id), 'no debe registrarse nada').toBeUndefined();
  });

  test('captura la lectura del segundo medidor y la ruta queda completa', async () => {
    const m2 = pendientes[1];
    await campoLectura().fill(String(m2.anterior + CONSUMO_2));
    await carrusel().locator('button', { hasText: 'Guardar y Siguiente' }).click();
    await expect.poll(() => lecturaDe(m2.medidor_id)?.consumo_m3, { timeout: 15000 }).toBe(CONSUMO_2);
    await cerrarCarrusel();

    const { leidos, total } = fila(`SELECT COUNT(l.id) AS leidos, COUNT(*) AS total FROM rutas_puntos rp
      LEFT JOIN lecturas l ON l.medidor_id = rp.medidor_id AND l.periodo = ? WHERE rp.ruta_id = ?`, PERIODO, RUTA_ID);
    expect(leidos).toBe(total);

    // Al completar septiembre la pantalla propone el mes siguiente; para facturar se vuelve a septiembre
    await elegirPeriodo(ctx.window, 'Sep');
    await expect(ctx.window.getByText('100%').first()).toBeVisible({ timeout: 15000 });
    await expect(ctx.window.locator('button', { hasText: 'Generar Facturas' })).toBeVisible({ timeout: 15000 });
  });

  test('genera las facturas de la ruta con el total correcto de su tarifa', async () => {
    const { window } = ctx;
    await window.locator('button', { hasText: 'Generar Facturas' }).click();
    // Si el mes anterior tiene mucha cobranza pendiente, la app avisa antes de facturar
    // (se espera a la que aparezca primero: el aviso o la confirmación)
    const continuar = window.locator('button', { hasText: 'Continuar de todos modos' });
    const confirmar = window.locator('button', { hasText: 'Confirmar Generación' });
    await expect(continuar.or(confirmar)).toBeVisible({ timeout: 20000 });
    if (await continuar.isVisible()) await continuar.click();
    await confirmar.click();
    await esperarAviso(window, /factura.*generada/i, 60000);

    const facturas = filas(`SELECT f.id, f.total, f.saldo_pendiente, f.estado, f.cliente_id, f.tarifa_id, l.consumo_m3, c.tarifa_id AS tarifa_cliente
      FROM lecturas l JOIN facturas f ON f.lectura_id = l.id JOIN clientes c ON c.id = f.cliente_id
      WHERE l.periodo = ? AND l.ruta_id = ?`, PERIODO, RUTA_ID);
    const lecturas = fila('SELECT COUNT(*) AS n FROM lecturas WHERE periodo = ? AND ruta_id = ?', PERIODO, RUTA_ID).n;
    expect(facturas.length, 'una factura por lectura').toBe(lecturas);

    const incorrectas = [];
    for (const f of facturas) {
      const esperado = await totalTarifa(f.consumo_m3, f.tarifa_cliente);
      if (Math.abs(f.total - esperado) > 0.005 || f.saldo_pendiente !== f.total || f.estado !== 'Pendiente' || f.tarifa_id !== f.tarifa_cliente) {
        incorrectas.push({ ...f, esperado });
      }
    }
    expect(incorrectas, 'todas las facturas con el total de su tarifa, saldo completo y estado Pendiente').toEqual([]);

    await window.locator('button', { hasText: 'Cerrar Visualizador' }).click().catch(() => {});
  });

  test('rectifica una lectura facturada sin pagos y el recálculo actualiza su factura', async () => {
    const { window } = ctx;
    const [m1] = pendientes;
    await abrirCarrusel();
    await expect(carrusel().getByText(m1.numero_serie).first()).toBeVisible({ timeout: 15000 });

    const rectificar = carrusel().locator('button', { hasText: 'Editar / Rectificar Lectura' });
    await expect(rectificar).toBeEnabled();
    await rectificar.click();
    await campoLectura().fill(String(m1.anterior + CONSUMO_RECTIFICADO));
    await carrusel().locator('button', { hasText: 'Guardar y Siguiente' }).click();
    await esperarAviso(window, /rectificada/i);
    expect(lecturaDe(m1.medidor_id)).toMatchObject({ consumo_m3: CONSUMO_RECTIFICADO, estado: 'pendiente' });
    await cerrarCarrusel();

    // Hasta recalcular, la factura conserva el importe anterior
    const factura = () => fila('SELECT f.total, f.saldo_pendiente FROM facturas f JOIN lecturas l ON l.id = f.lectura_id WHERE l.medidor_id = ? AND l.periodo = ?', m1.medidor_id, PERIODO);
    const tarifa = fila('SELECT tarifa_id FROM clientes WHERE id = ?', m1.cliente_id).tarifa_id;
    expect(factura().total).toBe(await totalTarifa(CONSUMO_1, tarifa));

    await window.locator('button', { hasText: 'Recalcular' }).first().click();
    await window.locator('button', { hasText: 'Confirmar Recálculo' }).click();
    await esperarAviso(window, /Recálculo completado/i, 60000);

    const nuevo = await totalTarifa(CONSUMO_RECTIFICADO, tarifa);
    expect(factura()).toMatchObject({ total: nuevo, saldo_pendiente: nuevo });
    expect(lecturaDe(m1.medidor_id).estado).toBe('facturada');
    await window.locator('button', { hasText: 'Cerrar Visualizador' }).click().catch(() => {});
  });
});
