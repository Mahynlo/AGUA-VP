const { test, expect } = require('@playwright/test');
const { usarApp } = require('../../helpers/sesion');
const { irA } = require('../../helpers/authHelper');
const { fila, filas, contarListado } = require('../../helpers/datos');
const { esperarAviso, elegirPeriodo, hoySonora, esperarPdfNuevo } = require('../../helpers/ui');

const r2 = (n) => Math.round(Number(n) * 100) / 100;

test.describe('07 · Pagos y cobranza', () => {
  const ctx = usarApp(test);
  const dialogo = () => ctx.window.getByRole('dialog').last();
  let factura; // factura de agosto sin pagos (datos reales de la copia)

  /** Abre "Registrar Pago" de la factura `id` en Pagos → Facturas (mes: 'Ago', 'Sep', ...). */
  async function abrirPagoDeFactura(id, mes = 'Ago') {
    const { window } = ctx;
    await irA(window, '#/resibos/pagos', 'Gestión de Pagos');
    await window.locator('button', { hasText: /^Facturas$/ }).click();
    await elegirPeriodo(window, mes);
    // La búsqueda revisa varios campos (teléfono, predio...): se toma la fila con ese folio exacto.
    // Se limpia antes de escribir: el mismo texto otra vez no vuelve a buscar.
    const buscador = window.locator('input[placeholder^="Buscar cliente o N"]');
    const fila = window.locator('tr').filter({ hasText: new RegExp(`#${id}(?!\d)`) });
    await expect(async () => {
      await buscador.fill('');
      await buscador.fill(String(id));
      await expect(fila.locator('button[title="Registrar Pago"]')).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 30000 });
    await fila.locator('button[title="Registrar Pago"]').click();
    await expect(dialogo().getByText(`Factura #${id}`).first()).toBeVisible({ timeout: 15000 });
  }

  /** Abre el cobro distribuido del cliente `deudor` desde Pagos → Cobranza. */
  async function abrirCobroDistribuido(window, deudor) {
    await irA(window, '#/resibos/pagos', 'Gestión de Pagos');
    await window.locator('button', { hasText: /^Cobranza$/ }).click();
    await window.locator('input[placeholder^="Buscar nombre, predio"]').fill(deudor.numero_predio);
    // El botón "Cobrar" de la fila de ESE cliente: la lista se ordena por deuda y, mientras la búsqueda
    // no se aplica, la primera fila es otro cliente (el cobro se registraba al cliente equivocado).
    const etiqueta = `Predio #${deudor.numero_predio} · ID: ${deudor.id}`;
    const filaDeudor = window.locator('tr').filter({ has: window.getByText(etiqueta, { exact: true }) });
    await expect(filaDeudor).toHaveCount(1, { timeout: 15000 });
    await filaDeudor.locator('button', { hasText: /^Cobrar$/ }).click();
    await expect(dialogo().getByText(deudor.nombre).first()).toBeVisible({ timeout: 15000 });
  }

  async function cobrar(cantidad) {
    await dialogo().locator('input[type="number"]').fill(String(cantidad));
    await dialogo().locator('button', { hasText: /^Cobrar$/ }).click();
    await dialogo().locator('button', { hasText: 'Confirmar y Procesar Pago' }).click();
    await expect(dialogo().getByText('Pago Realizado con Éxito').first()).toBeVisible({ timeout: 20000 });
  }

  test('registra un abono parcial: la factura queda Parcial con el saldo correcto', async () => {
    factura = fila(`SELECT f.id, f.total, f.saldo_pendiente FROM facturas f JOIN lecturas l ON l.id = f.lectura_id
      WHERE l.periodo = '2026-08' AND f.saldo_pendiente > 60 AND f.convenio_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM pagos p WHERE p.factura_id = f.id) ORDER BY f.id LIMIT 1`);
    expect(factura, 'debe haber una factura de agosto sin pagos en la copia').toBeTruthy();

    await abrirPagoDeFactura(factura.id);
    await cobrar(40);

    const f = fila('SELECT estado, saldo_pendiente FROM facturas WHERE id = ?', factura.id);
    expect(f).toMatchObject({ estado: 'Parcial', saldo_pendiente: r2(factura.saldo_pendiente - 40) });
    const pago = fila('SELECT monto, cambio, fecha_pago, metodo_pago FROM pagos WHERE factura_id = ? ORDER BY id DESC', factura.id);
    expect(pago).toMatchObject({ monto: 40, cambio: 0, metodo_pago: 'Efectivo' });
    expect(pago.fecha_pago.slice(0, 10), 'fecha de pago = hoy en hora de Sonora').toBe(hoySonora());
  });

  test('genera el comprobante de pago (vista previa con 1 página, sin imprimir)', async () => {
    const { window } = ctx;
    const desde = Date.now();
    await dialogo().locator('button', { hasText: 'Imprimir Comprobante de Pago' }).click();

    const pdf = await esperarPdfNuevo(desde);
    expect(pdf.paginas).toBe(1);
    await expect(window.getByText(/1 página/i).first()).toBeVisible({ timeout: 20000 });
    // Cerrar la vista previa SIN imprimir y terminar
    await window.locator('button', { hasText: /^Cancelar$/ }).last().click();
    const finalizar = window.locator('button', { hasText: /^Finalizar$/ });
    // (isVisible no espera: waitFor sí)
    if (await finalizar.waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false)) await finalizar.click();
    await expect(window.getByRole('dialog')).toHaveCount(0, { timeout: 10000 });
  });

  test('liquida el saldo: calcula el cambio y la factura queda Pagada', async () => {
    const saldo = fila('SELECT saldo_pendiente FROM facturas WHERE id = ?', factura.id).saldo_pendiente;
    await abrirPagoDeFactura(factura.id);
    await cobrar(500);
    await ctx.window.locator('button', { hasText: /^Finalizar$/ }).click();

    expect(fila('SELECT estado, saldo_pendiente FROM facturas WHERE id = ?', factura.id)).toMatchObject({ estado: 'Pagado', saldo_pendiente: 0 });
    const pago = fila('SELECT monto, cantidad_entregada, cambio FROM pagos WHERE factura_id = ? ORDER BY id DESC', factura.id);
    expect(pago).toMatchObject({ monto: saldo, cantidad_entregada: 500, cambio: r2(500 - saldo) });
  });

  test('doble clic en "Confirmar y Procesar Pago" registra un solo cobro', async () => {
    const otra = fila(`SELECT f.id, f.saldo_pendiente FROM facturas f JOIN lecturas l ON l.id = f.lectura_id
      WHERE l.periodo = '2026-08' AND f.saldo_pendiente > 60 AND f.convenio_id IS NULL AND f.id != ?
        AND NOT EXISTS (SELECT 1 FROM pagos p WHERE p.factura_id = f.id) ORDER BY f.id LIMIT 1`, factura.id);
    expect(otra, 'debe haber otra factura de agosto sin pagos en la copia').toBeTruthy();

    await abrirPagoDeFactura(otra.id);
    await dialogo().locator('input[type="number"]').fill('40');
    await dialogo().locator('button', { hasText: /^Cobrar$/ }).click();
    const confirmar = dialogo().locator('button', { hasText: 'Confirmar y Procesar Pago' });
    await expect(confirmar).toBeVisible();
    // Dos clics en la misma tarea del navegador: React aún no ha ocultado el botón
    // (el peor caso de un doble clic rápido; sin candado se registraban dos cobros).
    await confirmar.evaluate((boton) => { boton.click(); boton.click(); });
    await expect(dialogo().getByText('Pago Realizado con Éxito').first()).toBeVisible({ timeout: 20000 });
    await ctx.window.locator('button', { hasText: /^Finalizar$/ }).click();

    expect(fila('SELECT COUNT(*) AS n FROM pagos WHERE factura_id = ?', otra.id).n, 'un solo pago').toBe(1);
    expect(fila('SELECT saldo_pendiente FROM facturas WHERE id = ?', otra.id).saldo_pendiente).toBe(r2(otra.saldo_pendiente - 40));
  });

  test('el cobro distribuido aplica primero a la factura más antigua', async () => {
    const { window } = ctx;
    const deudor = fila(`SELECT c.id, c.numero_predio, c.nombre FROM clientes c
      WHERE (SELECT COUNT(*) FROM facturas f WHERE f.cliente_id = c.id AND f.saldo_pendiente > 0 AND f.convenio_id IS NULL) >= 3
        AND c.numero_predio IS NOT NULL ORDER BY c.id LIMIT 1`);
    const antes = filas(`SELECT f.id, f.saldo_pendiente FROM facturas f JOIN lecturas l ON l.id = f.lectura_id
      WHERE f.cliente_id = ? AND f.saldo_pendiente > 0 ORDER BY l.periodo, f.id`, deudor.id);
    const monto = r2(antes[0].saldo_pendiente + 10);

    await abrirCobroDistribuido(window, deudor);
    await dialogo().locator('input[type="number"]').fill(String(monto));
    await dialogo().locator('button', { hasText: 'Revisar y Cobrar' }).click();
    await dialogo().locator('button', { hasText: 'Confirmar Pago' }).click();
    await expect(dialogo().getByText('Cobro Exitoso').first()).toBeVisible({ timeout: 20000 });
    await dialogo().locator('button', { hasText: 'Finalizar y Cerrar' }).click();

    const despues = antes.map((f) => fila('SELECT estado, saldo_pendiente FROM facturas WHERE id = ?', f.id));
    expect(despues[0]).toMatchObject({ estado: 'Pagado', saldo_pendiente: 0 });
    expect(despues[1].saldo_pendiente).toBe(r2(antes[1].saldo_pendiente - 10));
    for (let i = 2; i < antes.length; i++) expect(despues[i].saldo_pendiente).toBe(antes[i].saldo_pendiente);
  });

  test('doble clic en "Confirmar Pago" del cobro distribuido registra un solo cobro', async () => {
    const { window } = ctx;
    const deudor = fila(`SELECT c.id, c.numero_predio, c.nombre FROM clientes c
      WHERE (SELECT COUNT(*) FROM facturas f WHERE f.cliente_id = c.id AND f.saldo_pendiente > 10 AND f.convenio_id IS NULL) >= 2
        AND c.numero_predio IS NOT NULL ORDER BY c.id DESC LIMIT 1`);
    expect(deudor, 'debe haber un cliente con 2 o más facturas pendientes en la copia').toBeTruthy();
    const pagosAntes = fila('SELECT COUNT(*) AS n FROM pagos p JOIN facturas f ON f.id = p.factura_id WHERE f.cliente_id = ?', deudor.id).n;

    await abrirCobroDistribuido(window, deudor);
    await dialogo().locator('input[type="number"]').fill('10');
    await dialogo().locator('button', { hasText: 'Revisar y Cobrar' }).click();
    const confirmar = dialogo().locator('button', { hasText: 'Confirmar Pago' });
    await expect(confirmar).toBeVisible();
    // Dos clics en la misma tarea del navegador, antes de que React oculte el botón
    await confirmar.evaluate((boton) => { boton.click(); boton.click(); });
    await expect(dialogo().getByText('Cobro Exitoso').first()).toBeVisible({ timeout: 20000 });
    await dialogo().locator('button', { hasText: 'Finalizar y Cerrar' }).click();

    const pagosDespues = fila('SELECT COUNT(*) AS n FROM pagos p JOIN facturas f ON f.id = p.factura_id WHERE f.cliente_id = ?', deudor.id).n;
    expect(pagosDespues - pagosAntes, '$10 cubren parte de una sola factura: un solo pago').toBe(1);
  });

  test('Facturas → el filtro de antigüedad del vencimiento llega a la API y cuenta bien', async () => {
    const { window } = ctx;
    await window.locator('button', { hasText: /^Facturas$/ }).click();
    await elegirPeriodo(window, 'Ago');
    await window.locator('input[placeholder^="Buscar cliente o N"]').fill('');
    await window.locator('select[aria-label="Cualquier vencimiento"]').selectOption('vencida_30');

    const esperado = await contarListado('facturas', { periodo: '2026-08', antiguedad: 'vencida_30' });
    const total = await contarListado('facturas', { periodo: '2026-08' });
    expect(esperado, 'el filtro debe dejar fuera alguna factura de agosto').toBeLessThan(total);
    await expect(window.getByText(new RegExp(`de ${esperado} facturas`, 'i')).first()).toBeVisible({ timeout: 15000 });
    await window.locator('select[aria-label="Cualquier vencimiento"]').selectOption('All');
  });

  test('Pagos → filtro "Cobrados hoy" muestra los cobros de hoy y su total', async () => {
    const { window } = ctx;
    await window.locator('button', { hasText: /^Pagos$/ }).click();
    await window.locator('select[aria-label="Cualquier fecha de cobro"]').selectOption('hoy');

    const { n, total } = fila(`SELECT COUNT(*) AS n, ROUND(COALESCE(SUM(monto), 0), 2) AS total FROM pagos WHERE substr(fecha_pago, 1, 10) = ?`, hoySonora());
    expect(n, 'en esta prueba se registraron al menos 3 cobros hoy').toBeGreaterThanOrEqual(3);
    const totalTexto = total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    await expect(window.getByText('Total cobrado con estos filtros:').locator('xpath=..')).toContainText(totalTexto, { timeout: 15000 });
  });

  test('tras cobrarla, la lectura de esa factura ya no se puede rectificar', async () => {
    const { window } = ctx;
    // La lectura de septiembre del primer medidor de la ruta la crea la prueba 05 (Lecturas)
    const objetivo = fila(`SELECT f.id AS factura_id, f.saldo_pendiente, m.numero_serie FROM rutas_puntos rp
      JOIN medidores m ON m.id = rp.medidor_id JOIN lecturas l ON l.medidor_id = m.id AND l.periodo = '2026-09'
      JOIN facturas f ON f.lectura_id = l.id WHERE rp.ruta_id = 1 ORDER BY rp.orden LIMIT 1`);
    test.skip(!objetivo, 'requiere las facturas de septiembre que genera la prueba 05');

    // Cobrar la factura completa
    await abrirPagoDeFactura(objetivo.factura_id, 'Sep');
    await cobrar(objetivo.saldo_pendiente);
    await window.locator('button', { hasText: /^Finalizar$/ }).click();
    expect(fila('SELECT estado FROM facturas WHERE id = ?', objetivo.factura_id).estado).toBe('Pagado');

    // En la toma de lecturas de septiembre, el botón de rectificar queda deshabilitado con el motivo
    await irA(window, '#/resibos/lecturas', 'Sistema de Lecturas');
    await elegirPeriodo(window, 'Sep');
    await window.locator('button', { hasText: 'Tomar Lecturas' }).first().click();
    const carrusel = window.getByRole('dialog');
    await expect(carrusel.getByText(objetivo.numero_serie).first()).toBeVisible({ timeout: 15000 });
    await expect(carrusel.locator('button', { hasText: 'Editar / Rectificar Lectura' })).toBeDisabled();
    await expect(carrusel.getByText(/ya tiene pagos registrados/).first()).toBeVisible();
    await carrusel.locator('button[aria-label="Close"]').click();
  });
});
