const { test, expect } = require('@playwright/test');
const bcrypt = require('bcryptjs');
const { usarApp } = require('../../helpers/sesion');
const { irA, loginAsAdmin, ensureLoggedOut } = require('../../helpers/authHelper');
const { conBase, fila } = require('../../helpers/datos');
const { elegirPeriodo, hoySonora } = require('../../helpers/ui');

/**
 * Plazo para anular un cobro: mes en curso + 5 días (por la fecha en que se registró).
 * Fuera de plazo el administrador no puede; el superadmin sí, con un aviso.
 * Usa un administrador que existe solo en la copia de la base.
 */
const ADMIN = { email: 'e2e.administrador@aguavp.com', password: 'AdminE2E123!' };

test.describe('07 · Plazo para anular pagos', () => {
  let adminId;
  let pagoViejo; // cobro de agosto registrado (simulado) hace 3 meses

  const ctx = usarApp(test, {
    iniciarSesion: false,
    antes: () => conBase((db) => {
      adminId = Number(db.prepare(`INSERT INTO usuarios (correo, nombre, "contraseña", username, rol, estado_usuario, requiere_cambio_password)
        VALUES (?, 'Administrador E2E', ?, 'e2e_administrador', 'administrador', 'Activo', 0)`)
        .run(ADMIN.email, bcrypt.hashSync(ADMIN.password, 8)).lastInsertRowid);
      pagoViejo = db.prepare(`SELECT p.id FROM pagos p JOIN facturas f ON f.id = p.factura_id JOIN lecturas l ON l.id = f.lectura_id
        WHERE l.periodo = '2026-08' AND f.convenio_id IS NULL AND p.parcialidad_id IS NULL ORDER BY p.id LIMIT 1`).get().id;
      db.prepare(`UPDATE pagos SET fecha_creacion = datetime('now', '-3 months') WHERE id = ?`).run(pagoViejo);
    })
  });
  const dialogo = () => ctx.window.getByRole('dialog').last();
  const botonAnular = () => dialogo().locator('button', { hasText: 'Anular pago' });

  /** Abre el detalle del pago `id` en Pagos → Pagos (agosto). */
  async function abrirDetalle(id) {
    const { window } = ctx;
    await irA(window, '#/resibos/pagos', 'Gestión de Pagos');
    await window.locator('button', { hasText: /^Pagos$/ }).click();
    await elegirPeriodo(window, 'Ago');
    const buscador = window.locator('input[placeholder^="Buscar ID, factura"]');
    await buscador.fill('');
    await buscador.fill(String(id));
    const filaPago = window.locator('tr').filter({ hasText: new RegExp(`#P-\\s*${id}(?!\\d)`) });
    await expect(filaPago).toHaveCount(1, { timeout: 15000 });
    await filaPago.locator('button[title="Ver Detalle del Pago"]').click();
    await expect(dialogo().getByText('Detalle del Pago').first()).toBeVisible({ timeout: 15000 });
  }
  const cerrarDetalle = async () => {
    await dialogo().locator('button', { hasText: /^Cerrar$/ }).click();
    await expect(ctx.window.getByRole('dialog')).toHaveCount(0, { timeout: 10000 });
  };

  test('administrador: un cobro de hace 3 meses no se puede anular y se explica por qué', async () => {
    // La app puede arrancar con la sesión que dejó otro archivo de pruebas (superadmin):
    // loginAsAdmin no cambia de usuario si ya hay sesión, así que primero se cierra.
    await ensureLoggedOut(ctx.window);
    await loginAsAdmin(ctx.window, ADMIN);
    await abrirDetalle(pagoViejo);
    await expect(botonAnular()).toBeDisabled();
    await expect(dialogo().getByText(/No se puede anular:/).first()).toBeVisible();
    await expect(dialogo().getByText(/ese periodo cerró el \d{2}\/\d{2}\/\d{4}\. Solo un superadmin puede corregirlo\./).first()).toBeVisible();
    await cerrarDetalle();
  });

  test('administrador: un cobro de hoy sí se puede anular', async () => {
    const f = fila(`SELECT f.id FROM facturas f JOIN lecturas l ON l.id = f.lectura_id
      WHERE l.periodo = '2026-08' AND f.saldo_pendiente > 30 AND f.convenio_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM pagos p WHERE p.factura_id = f.id) ORDER BY f.id DESC LIMIT 1`);
    const cobro = await ctx.window.evaluate(({ factura_id, fecha_pago, modificado_por }) => window.api.registerPago(
      { factura_id, fecha_pago, cantidad_entregada: 10, metodo_pago: 'Efectivo', modificado_por },
      localStorage.getItem('token')
    ), { factura_id: f.id, fecha_pago: hoySonora(), modificado_por: adminId });
    expect(cobro.success, JSON.stringify(cobro)).toBe(true);

    await abrirDetalle(cobro.pagoID);
    await expect(botonAnular()).toBeEnabled();
    await expect(dialogo().getByText(/No se puede anular:/)).toHaveCount(0);
    await botonAnular().click();
    await expect(dialogo().getByText(/El periodo de este cobro ya cerró/)).toHaveCount(0);
    await dialogo().locator('button', { hasText: /^Cancelar$/ }).click();
    await cerrarDetalle();
  });

  test('superadmin: puede anular un cobro fuera de plazo, con aviso', async () => {
    await ensureLoggedOut(ctx.window);
    await loginAsAdmin(ctx.window); // superadmin de prueba
    await abrirDetalle(pagoViejo);
    await expect(botonAnular()).toBeEnabled();
    await botonAnular().click();
    await expect(dialogo().getByText(/El periodo de este cobro ya cerró/).first()).toBeVisible();

    await dialogo().locator('#motivo-anulacion').fill('Prueba E2E: anulación fuera de plazo por superadmin');
    await dialogo().locator('button', { hasText: 'Confirmar anulación' }).click();
    await expect(ctx.window.getByRole('dialog')).toHaveCount(0, { timeout: 15000 });
    expect(fila('SELECT fecha_anulacion IS NOT NULL AS anulado FROM pagos WHERE id = ?', pagoViejo).anulado).toBe(1);
  });
});
