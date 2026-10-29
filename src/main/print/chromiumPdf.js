import { ipcMain, BrowserWindow } from 'electron'
import path from 'path'
import { DEFAULT_PRINT_OPTIONS, normalizePageSize } from './printOptions.js'
import { writeTempPdf, toFileUrl } from './printTempFiles.js'

// Pipeline estándar con BrowserWindow para rutas sin generador nativo (reporteClientes,
// reporteDocumentacion, …) o cuando el generador pdfmake falla.
// Carga la ruta React en una ventana oculta, espera la señal 'print-ready' (useNotifyPrintReady)
// o un fallback de 3.5s, y captura con printToPDF().
// `readyTimeoutMs` amplía ese fallback para páginas que sí avisan cuando terminan pero tardan más
// (el manual de ayuda: diagramas Mermaid e imágenes).
export const generarPdfConChromium = (url, rawOptions = {}) => {
  const { readyTimeoutMs, ...options } = rawOptions || {}
  const fallbackMs = Number(readyTimeoutMs) > 0 ? Number(readyTimeoutMs) : 3500

  return new Promise((resolve, reject) => {
    let win = new BrowserWindow({
      title: 'Preview',
      show: false,
      backgroundColor: '#ffffff',
      autoHideMenuBar: true,
      webPreferences: {
        zoomFactor: 1.0,
        sandbox: false,
        nodeIntegration: false,
        contextIsolation: true,
        cache: false,
        // La ventana está oculta: sin esto Chromium puede frenar timers/rAF y retrasar el aviso print-ready
        backgroundThrottling: false,
        plugins: true,
        webSecurity: false,
        allowRunningInsecureContent: true,
        preload: path.join(__dirname, '../preload/index.js')
      }
    })

    let captured = false
    let fallbackTimer = null
    let onPrintReady = null

    const cleanup = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer)
        fallbackTimer = null
      }
      if (onPrintReady) {
        ipcMain.removeListener('print-ready', onPrintReady)
        onPrintReady = null
      }
    }

    const capturePdf = async () => {
      if (captured) return
      captured = true
      cleanup()

      try {
        const pdfOptions = {
          ...DEFAULT_PRINT_OPTIONS,
          ...(options || {}),
          scaleFactor: 100
        }

        // Normalizar pageSize si viene especificado
        normalizePageSize(pdfOptions)

        // Número de página por hoja (opcional, vía footer nativo de Chromium).
        // Solo se activa cuando el renderer lo pide explícitamente.
        if (options && options.pageNumbers) {
          pdfOptions.displayHeaderFooter = true
          // Header vacío para que no aparezca el título/URL por defecto.
          pdfOptions.headerTemplate = '<span></span>'
          pdfOptions.footerTemplate =
            '<div style="width:100%; font-size:8px; color:#6b7280; text-align:center; padding:0 10mm;">' +
            'Página <span class="pageNumber"></span> de <span class="totalPages"></span>' +
            '</div>'
          // Márgenes explícitos para reservar espacio al footer nativo (en pulgadas).
          pdfOptions.margins = { top: 0.3, bottom: 0.55, left: 0.3, right: 0.3 }
        }

        const data = await win.webContents.printToPDF(pdfOptions)
        const pdfPath = await writeTempPdf(url, data)
        console.log('PDF generado en:', pdfPath)

        try {
          win.close()
        } catch (e) {}
        resolve({ success: true, path: toFileUrl(pdfPath) })
      } catch (err) {
        console.error('Error generando PDF temporal:', err)
        try {
          win.close()
        } catch (e) {}
        reject(err)
      }
    }

    // Escuchar 'print-ready' INMEDIATAMENTE para no perder el evento si React renderiza rápido
    onPrintReady = (evt) => {
      if (
        win &&
        !win.isDestroyed() &&
        (evt.sender === win.webContents || evt.sender?.id === win.webContents?.id)
      ) {
        console.log('⚡ Señal print-ready recibida vía ipcMain (inmediata)')
        capturePdf()
      }
    }
    ipcMain.on('print-ready', onPrintReady)

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load URL for preview:', errorCode, errorDescription)
      cleanup()
      try {
        win.close()
      } catch (e) {}
      reject(`Failed to load: ${errorDescription}`)
    })

    win.webContents.on('console-message', (event, level, message) => {
      if (
        !message.includes('React DevTools') &&
        !message.includes('Electron Security Warning') &&
        !message.includes('[vite]')
      ) {
        console.log('Preview window console:', level, message)
      }
    })

    win.webContents.once('did-finish-load', async () => {
      try {
        await win.webContents.insertCSS(
          'html, body { color-scheme: light !important; background-color: #ffffff !important; }'
        )
        await win.webContents.executeJavaScript(
          'document.documentElement.classList.remove("dark"); document.body.classList.remove("dark");'
        )
      } catch (e) {}

      // Fallback de seguridad (3.5s por defecto, en caso de páginas estáticas sin useNotifyPrintReady)
      if (!captured) {
        fallbackTimer = setTimeout(() => {
          console.log(`Usando fallback timer (${fallbackMs / 1000}s) para PDF`)
          capturePdf()
        }, fallbackMs)
      }
    })

    win.loadURL(url)
  })
}
