/** Avisos (toasts de éxito o error) visibles en este momento: [{ titulo, texto }]. */
async function avisos(window) {
  return window.locator('div.pointer-events-auto.shadow-2xl').evaluateAll((els) =>
    els.map((el) => {
      const [titulo, texto] = [...el.querySelectorAll('p')].map((p) => p.textContent.trim());
      return { titulo, texto };
    })
  );
}

/**
 * Espera un aviso cuyo texto cumpla `patron`. Los avisos se cierran solos a los pocos segundos,
 * así que se registran todos los que aparecen: si no llega el esperado, el error muestra los
 * mensajes reales de la app (p. ej. el rechazo de la API).
 */
async function esperarAviso(window, patron, timeout = 15000) {
  const vistos = new Set();
  const limite = Date.now() + timeout;
  while (Date.now() < limite) {
    for (const a of await avisos(window).catch(() => [])) {
      const texto = `${a.titulo}: ${a.texto}`;
      if (patron.test(texto)) return texto;
      vistos.add(texto);
    }
    await window.waitForTimeout(250);
  }
  throw new Error(`No apareció un aviso que cumpla ${patron}. Avisos vistos: ${vistos.size ? [...vistos].join(' | ') : 'ninguno'}`);
}

const MESES = /(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre) \d{4}/;

/**
 * Elige un mes en el selector de período (SelectorPeriodoAvanzado) de la pantalla actual.
 * @param {string} mesCorto  'Ene', 'Feb', ... 'Sep', ... 'Dic' (el año que muestra el selector)
 */
async function elegirPeriodo(window, mesCorto) {
  await window.locator('button', { hasText: MESES }).first().click();
  await window.locator(`button:has(> span:text-is("${mesCorto}"))`).first().click();
}

/** Fecha de hoy (YYYY-MM-DD) en hora de Sonora, la misma que usan la app y la API. */
const hoySonora = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Hermosillo' });

/**
 * Espera el PDF que genera la vista previa (carpeta temporal del sistema) creado después de `desde`
 * y devuelve su ruta y su número de páginas.
 */
async function esperarPdfNuevo(desde, timeout = 60000) {
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const { PDFDocument } = require('pdf-lib');
  const limite = Date.now() + timeout;
  while (Date.now() < limite) {
    const nuevos = fs.readdirSync(os.tmpdir())
      .filter((f) => f.toLowerCase().endsWith('.pdf'))
      .map((f) => ({ ruta: path.join(os.tmpdir(), f), t: fs.statSync(path.join(os.tmpdir(), f)).mtimeMs }))
      .filter((f) => f.t >= desde)
      .sort((a, b) => b.t - a.t);
    for (const { ruta } of nuevos) {
      try {
        const doc = await PDFDocument.load(fs.readFileSync(ruta));
        return { ruta, paginas: doc.getPageCount() };
      } catch {
        // todavía se está escribiendo
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('No se generó ningún PDF nuevo en la carpeta temporal');
}

module.exports = { avisos, esperarAviso, elegirPeriodo, hoySonora, esperarPdfNuevo };
