const { test, expect } = require('@playwright/test');
const { usarApp } = require('../../helpers/sesion');
const { irA } = require('../../helpers/authHelper');

// Cada sección del menú abre y muestra su contenido principal (con los datos de la copia de la base)
const SECCIONES = [
  { hash: '#/clientes', titulo: 'Gestión de Clientes', contenido: 'Directorio de Clientes' },
  { hash: '#/medidores', titulo: 'Gestión de Medidores', contenido: 'Lista de Medidores' },
  { hash: '#/resibos/lecturas', titulo: 'Sistema de Lecturas', contenido: 'Ruta Nacori Grande' },
  { hash: '#/resibos/tarifas', titulo: 'Gestión de Tarifas', contenido: 'Domestica' },
  { hash: '#/resibos/pagos', titulo: 'Gestión de Pagos', contenido: 'Cobranza por Cliente' },
  { hash: '#/resibos/impresion', titulo: 'Impresión de Recibos', contenido: 'Selección de Clientes para Impresión' },
  { hash: '#/administrador', titulo: 'Administración del Sistema', contenido: 'Gestión de Usuarios' }
];

test.describe('02 · Navegación entre módulos', () => {
  const ctx = usarApp(test);

  for (const s of SECCIONES) {
    test(`abre ${s.titulo}`, async () => {
      await irA(ctx.window, s.hash, s.titulo);
      await expect(ctx.window.getByRole('heading', { name: s.contenido }).first()).toBeVisible({ timeout: 20000 });
    });
  }

  test('los enlaces del menú lateral llevan a cada sección', async () => {
    const { window } = ctx;
    await window.locator('a[href="#/clientes"]').first().click();
    await expect(window.locator('h1', { hasText: 'Gestión de Clientes' })).toBeVisible({ timeout: 15000 });
    await window.locator('a[href="#/medidores"]').first().click();
    await expect(window.locator('h1', { hasText: 'Gestión de Medidores' })).toBeVisible({ timeout: 15000 });
  });
});
