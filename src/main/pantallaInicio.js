/**
 * Pantalla de inicio dentro de la ventana principal.
 *
 * La ventana principal se crea en cuanto se abre la app y muestra primero esta página, mientras
 * arranca el servidor API embebido (respaldo, migraciones y carga del servidor; en un arranque en
 * frío puede tardar bastantes segundos). Cuando la API responde, la MISMA ventana carga la interfaz
 * (index.js → cargarInterfaz). Antes no se veía nada hasta que la API terminaba de cargar.
 *
 * Es HTML estático (sin scripts): no carga React ni llama a la API. Imita la pantalla de carga de la
 * interfaz (components/carga/PantallaCarga.jsx) para que el paso de una a otra no se note.
 *
 * Importante: la carga de la API ocupa el hilo principal de Electron, y mientras está ocupado la
 * ventana no se puede pintar. Por eso hay que esperar `esperarVisible()` ANTES de arrancar la API;
 * si no, la pantalla aparecería justo cuando ya no hace falta.
 */

import fs from 'fs'

// Tiempo máximo que se espera a que la ventana se vea antes de seguir con el arranque
const ESPERA_MAXIMA_MS = 2000
// Margen tras mostrarla para que alcance a pintarse el primer cuadro
const MARGEN_PINTADO_MS = 120

function html(logoDataUrl) {
  const logo = logoDataUrl ? `<img src="${logoDataUrl}" alt="" />` : ''
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'" />
<title>AGUA VP - Villa Pesqueira</title>
<style>
  html, body { height: 100%; margin: 0; }
  body {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: linear-gradient(90deg, #3b82f6, #93c5fd);
    font-family: Arial, sans-serif; color: #374151;
    user-select: none; cursor: default; overflow: hidden;
    /* La ventana no tiene marco: así se puede mover mientras arranca */
    -webkit-app-region: drag;
  }
  img { width: 128px; height: 128px; object-fit: contain; margin-bottom: 16px; }
  h1 { margin: 0 0 14px; font-size: 30px; font-weight: 700; }
  p { margin: 14px 0 0; font-size: 13px; color: #1f2937; }
  .spinner {
    width: 30px; height: 30px; border-radius: 50%; box-sizing: border-box;
    border: 4px solid #f3f3f3; border-top-color: #3498db;
    animation: girar 1s linear infinite;
  }
  @keyframes girar { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  ${logo}
  <h1>AGUA-VP</h1>
  <div class="spinner"></div>
  <p>Iniciando el sistema…</p>
</body>
</html>`
}

/**
 * URL (data:) de la pantalla de inicio, para `win.loadURL()`.
 * @param {string} [logoPath] - Ruta del logo (PNG)
 */
export function urlPantallaInicio(logoPath) {
  let logoDataUrl = ''
  try {
    if (logoPath) logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
  } catch {
    // Sin logo: se muestra solo el texto
  }
  return `data:text/html;charset=utf-8,${encodeURIComponent(html(logoDataUrl))}`
}

/**
 * Se resuelve cuando la ventana ya se ve y alcanzó a pintarse (o al agotarse la espera, o si se
 * destruye). Nunca se rechaza: la pantalla de inicio es solo una cortesía y no debe frenar el arranque.
 * @param {import('electron').BrowserWindow} win
 */
export function esperarVisible(win) {
  return new Promise((resolve) => {
    if (!win || win.isDestroyed()) return resolve()
    const limite = setTimeout(resolve, ESPERA_MAXIMA_MS)
    const listo = () => {
      clearTimeout(limite)
      setTimeout(resolve, MARGEN_PINTADO_MS)
    }
    if (win.isVisible()) return listo()
    win.once('show', listo)
    win.once('closed', () => {
      clearTimeout(limite)
      resolve()
    })
  })
}
