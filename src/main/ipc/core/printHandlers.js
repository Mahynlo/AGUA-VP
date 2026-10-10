import { ipcMain, BrowserWindow, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { DEFAULT_PRINT_OPTIONS, normalizePageSize } from '../../print/printOptions.js'
import { parsePrintUrl } from '../../print/printUrl.js'
import { savePrintData, readPrintData } from '../../print/printTempFiles.js'
import { esRutaRecibo, generarRecibosNativo, generarReporteNativo } from '../../print/nativePdf.js'
import { generarPdfConChromium } from '../../print/chromiumPdf.js'
import { resolveLocalPdfPath } from '../../pdf/pdfTools.js'

// Vista previa (generación de PDF temporal), impresión por diálogo de Chromium,
// transferencia de datos de impresión y limpieza del PDF temporal.
export default function registerPrintHandlers() {
  //handle print - Con verificación de seguridad
  ipcMain.handle('printComponent', (event, url, options = {}) => {
    const printOptions = { ...DEFAULT_PRINT_OPTIONS, ...options }

    return new Promise((resolve, reject) => {
      // SEGURIDAD: Verificar que la URL contenga el parámetro print=true
      if (!url.includes('print=true')) {
        resolve('Error: Modo impresión no autorizado')
        return
      }

      // NOTA: La generación e impresión de recibos por componente Chromium (Recibo.jsx)
      // está desactivada en favor del generador nativo PDF (printSilent con pdfmake).
      const isReciboRoute = url.includes('#/recibo') || url.includes('#/recibo_oficial')
      if (isReciboRoute) {
        console.log(
          'ℹ️ [printComponent] Impresión de recibos por ventana web desactivada; se utiliza el PDF generado nativamente.'
        )
        resolve('Impresión de recibos delegada al motor nativo PDF')
        return
      }

      let win = new BrowserWindow({
        show: false,
        backgroundColor: '#ffffff', // FORCE WHITE BACKGROUND
        webPreferences: {
          zoomFactor: 1.0,
          sandbox: false,
          nodeIntegration: false,
          contextIsolation: true,
          cache: false,
          webSecurity: app.isPackaged || !url.includes('localhost'),
          allowRunningInsecureContent: !app.isPackaged && url.includes('localhost'),
          preload: path.join(__dirname, '../preload/index.js')
        }
      })

      win.loadURL(url)

      win.webContents.on('did-finish-load', async () => {
        console.log('Print window loaded successfully')

        // FORZAR MODO CLARO (Hack para evitar borde negro en preview)
        try {
          await win.webContents.insertCSS(
            'html, body { color-scheme: light !important; background-color: #ffffff !important; }'
          )
          await win.webContents.executeJavaScript(
            'document.documentElement.classList.remove("dark"); document.body.classList.remove("dark");'
          )
        } catch (e) {
          console.error('Error forcing light mode:', e)
        }

        // Pequeño delay para asegurar que la página esté completamente renderizada
        setTimeout(() => {
          // Si options.silent es true, aseguramos que se envíe así
          if (options.silent) {
            printOptions.silent = true
          }

          normalizePageSize(printOptions)

          win.webContents.print(printOptions, (success, failureReason) => {
            console.log('Print Initiated in Main...')
            if (!success) {
              console.error('Print failed:', failureReason)
              reject('Print failed: ' + failureReason)
            } else {
              console.log('Print successful')
              resolve('shown print dialog')
            }
            // Cerrar ventana oculta tras imprimir (opcional, pero buena práctica si es silent)
            if (printOptions.silent) {
              win.close()
            }
          })
        }, 1000) // 1 segundo de delay
      })

      win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load URL for printing:', errorCode, errorDescription, validatedURL)
        reject(`Failed to load: ${errorDescription}`)
      })

      // Filtrar algunos logs de console para reducir ruido
      win.webContents.on('console-message', (event, level, message) => {
        if (
          !message.includes('React DevTools') &&
          !message.includes('Electron Security Warning') &&
          !message.includes('[vite]')
        ) {
          console.log('Print window console:', level, message)
        }
      })
    })
  })

  // === GESTIÓN DE DATOS TEMPORALES (FileSystem) ===
  // Solución para grandes volúmenes de datos que exceden localStorage

  ipcMain.handle('savePrintData', async (event, dataStr) => {
    try {
      return await savePrintData(dataStr)
    } catch (error) {
      console.error('Error saving temp print data:', error)
      throw error
    }
  })

  ipcMain.handle('getPrintData', async (event, id) => {
    try {
      return await readPrintData(id)
    } catch (error) {
      console.error('Error reading temp print data:', error)
      return null // Retornar null en lugar de lanzar error para manejarlo suavemente
    }
  })

  //handle preview
  ipcMain.handle('previewComponent', async (event, url, options = {}) => {
    console.log('Preview from URL:', url, 'options:', options)

    const { route, params } = parsePrintUrl(url)
    const dataKey = params.get('dataKey')

    // Recibos: solo generador nativo (sin fallback web)
    if (esRutaRecibo(route)) {
      return generarRecibosNativo({ event, url, params, dataKey, options })
    }

    // Reportes con generador nativo pdfmake (si falla, se continúa con Chromium)
    const nativo = await generarReporteNativo({ route, url, params, dataKey, options })
    if (nativo) return nativo

    // Pipeline estándar con BrowserWindow (reporteClientes, reporteDocumentacion, fallback)
    return generarPdfConChromium(url, options)
  })

  // Elimina el PDF temporal al cerrar el modal.
  ipcMain.handle('delete-temp-pdf', async (event, fileUrl) => {
    try {
      const filePath = resolveLocalPdfPath(fileUrl)
      if (filePath && fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath)
        console.log('Temp PDF eliminado:', filePath)
      }
    } catch (e) {
      // El archivo puede no existir si ya fue borrado — no es error
    }
  })
}
