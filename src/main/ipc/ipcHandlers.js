import { ipcMain, BrowserWindow, app, shell, dialog, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import zlib from 'zlib'
import { execFile } from 'child_process'
import { pathToFileURL, fileURLToPath } from 'url'
import ExcelJS from 'exceljs'
import { zoomIn, zoomOut, zoomReset, getZoom } from '../managers/zoomManager.js'
import { openHelpWindow } from '../managers/helpWindowManager.js'
import { generarRecibosPdf } from '../pdf/reciboPdfGenerator.js'
import {
  saveCustomLogo,
  clearCustomLogo,
  getCustomLogoBase64,
  getDefaultLogoBase64
} from '../managers/logoManager.js'

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
]

const ROUTE_NOMBRES = {
  recibo: 'recibos',
  recibo_oficial: 'recibos_oficial',
  recibo_doblecara: 'recibos_doblecara',
  'comprobante-pago': 'comprobante_pago',
  reporteclientes: 'reporte_clientes',
  reportelecturas: 'reporte_lecturas',
  reportedeudoresmayores: 'reporte_deudores_mayores',
  reportefinanciero: 'reporte_financiero',
  reportelecturasmetricas: 'reporte_metricas_lecturas'
}

const buildPdfFilename = (url) => {
  try {
    const hashMatch = url.match(/#\/([^?#]+)(?:\?([^#]*))?/)
    if (!hashMatch) return `aguavp_doc_${Date.now()}`

    const route = hashMatch[1].toLowerCase()
    const params = new URLSearchParams(hashMatch[2] || '')
    const docName = ROUTE_NOMBRES[route] || route.replace(/[^a-z0-9]/g, '_')

    const periodoRaw = params.get('periodo') || params.get('mes') || params.get('periodoInicio')
    if (periodoRaw) {
      const m = String(periodoRaw).match(/^(\d{4})-(\d{2})$/)
      if (m) {
        const mes = MESES_ES[parseInt(m[2]) - 1] || m[2]
        return `aguavp_${docName}_${mes}_${m[1]}`
      }
    }

    return `aguavp_${docName}_${Date.now()}`
  } catch (e) {
    return `aguavp_doc_${Date.now()}`
  }
}

export default function IpcHandlers() {
  console.log('🔧 Registrando handlers IPC principales...')

  // Limpiar PDFs temporales de sesiones anteriores (> 1 hora de antigüedad)
  try {
    const tempDir = app.getPath('temp')
    fs.readdir(tempDir, (err, files) => {
      if (err) return
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      ;(files || [])
        .filter(
          (f) => (f.startsWith('aguavp_') || f.startsWith('preview_recibos_')) && f.endsWith('.pdf')
        )
        .forEach(async (f) => {
          try {
            const fp = path.join(tempDir, f)
            const stats = await fs.promises.stat(fp)
            if (stats.mtimeMs < oneHourAgo) {
              await fs.promises.unlink(fp)
              console.log('Temp PDF antiguo eliminado:', f)
            }
          } catch (e) {}
        })
    })
  } catch (e) {}

  // vista previa de la impresion

  const printOptions = {
    silent: false, // Para mostrar el diálogo de impresión
    printBackground: true, // Para imprimir el fondo
    color: true,
    margin: {
      // Márgenes de impresión
      marginType: 'printableArea'
    },
    landscape: true, // Para orientación horizontal
    pagesPerSheet: 1,
    collate: false,
    copies: 1,
    header: 'Page header', // Encabezado de la página
    footer: 'Page footer', // Pie de página
    pageSize: 'letter' // Tamaño carta (A4 sería 'A4')
  }

  // === ZOOM HANDLERS ===
  // La lógica (clamp, persistencia y notificación) vive en zoomManager,
  // compartida con los atajos de teclado del menú nativo.
  ipcMain.handle('zoom-in', (event) => zoomIn(BrowserWindow.fromWebContents(event.sender)))

  ipcMain.handle('zoom-out', (event) => zoomOut(BrowserWindow.fromWebContents(event.sender)))

  ipcMain.handle('zoom-reset', (event) => zoomReset(BrowserWindow.fromWebContents(event.sender)))

  ipcMain.handle('get-zoom-level', (event) => getZoom(BrowserWindow.fromWebContents(event.sender)))

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  //handle print - Con verificación de seguridad
  ipcMain.handle('printComponent', (event, url, options = {}) => {
    //console.log('=== PRINT DEBUG ===');
    //console.log('Printing from URL:', url);
    const printOptions = {
      silent: false,
      printBackground: true,
      color: true,
      margin: { marginType: 'printableArea' },
      landscape: true,
      pagesPerSheet: 1,
      collate: false,
      copies: 1,
      header: 'Page header',
      footer: 'Page footer',
      pageSize: 'letter',
      ...options
    }

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

          // Normalizar pageSize (Electron requiere Capitalized)
          if (printOptions.pageSize) {
            const size = printOptions.pageSize.toLowerCase()
            if (size === 'letter') printOptions.pageSize = 'Letter'
            else if (size === 'legal') printOptions.pageSize = 'Legal'
            else if (size === 'a4') printOptions.pageSize = 'A4'
          }

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
      const id = require('crypto').randomUUID()
      const tempPath = path.join(app.getPath('temp'), `print_data_${id}.json`)

      // Escribir archivo temporalmente
      await fs.promises.writeFile(tempPath, dataStr, 'utf-8')

      // Limpieza automática después de 10 minutos
      setTimeout(
        () => {
          fs.unlink(tempPath, (err) => {
            if (!err) console.log('Archivo temporal borrado:', tempPath)
          })
        },
        10 * 60 * 1000
      )

      return id
    } catch (error) {
      console.error('Error saving temp print data:', error)
      throw error
    }
  })

  ipcMain.handle('getPrintData', async (event, id) => {
    try {
      const tempPath = path.join(app.getPath('temp'), `print_data_${id}.json`)

      if (fs.existsSync(tempPath)) {
        const data = await fs.promises.readFile(tempPath, 'utf-8')
        // Intentar borrar inmediatamente después de leer para ahorrar espacio
        // (Opcional: se puede dejar que el timeout lo borre si se necesita recargar)
        return data
      }
      return null
    } catch (error) {
      console.error('Error reading temp print data:', error)
      return null // Retornar null en lugar de lanzar error para manejarlo suavemente
    }
  })

  //handle preview
  ipcMain.handle('previewComponent', async (event, url, options = {}) => {
    console.log('Preview from URL:', url, 'options:', options)

    const hashMatch = url.match(/#\/([^?#]+)(?:\?([^#]*))?/)
    const route = hashMatch ? hashMatch[1].toLowerCase() : ''
    const params = new URLSearchParams(hashMatch ? hashMatch[2] || '' : '')
    const dataKey = params.get('dataKey')

    // ⚡ VÍA ULTRA-RÁPIDA (pdfmake): Generación nativa directa en Node.js (<1.5s y <1MB)
    // NOTA: La generación antigua por renderizado web en Chromium (Recibo.jsx / Recibo_Oficial.jsx)
    // queda desactivada para evitar consumo de memoria y demoras de >20s.
    if (route === 'recibo' || route === 'recibo_oficial') {
      try {
        if (dataKey) {
          const tempPath = path.join(app.getPath('temp'), `print_data_${dataKey}.json`)
          if (fs.existsSync(tempPath)) {
            const rawData = await fs.promises.readFile(tempPath, 'utf8')
            const paginasRecibos = JSON.parse(rawData)
            if (Array.isArray(paginasRecibos) && paginasRecibos.length > 0) {
              console.log(
                `⚡ [pdfmake] Generando ${paginasRecibos.length} páginas de recibos nativamente...`
              )
              const ciudadFiltro = params.get('ciudad') || 'All'
              const pdfBuffer = await generarRecibosPdf(paginasRecibos, {
                ciudadFiltro,
                customLogo: options.customLogo,
                anuncio: options.anuncio,
                equivalencia: options.equivalencia
              })

              const pdfPath = path.join(app.getPath('temp'), `${buildPdfFilename(url)}.pdf`)
              await fs.promises.writeFile(pdfPath, pdfBuffer)
              // Limpieza del archivo temporal JSON de datos para no acumular archivos en disco
              fs.promises.unlink(tempPath).catch(() => {})

              console.log(
                `✅ [pdfmake] PDF generado en: ${pdfPath} (${(pdfBuffer.length / 1024).toFixed(0)} KB)`
              )
              return { success: true, path: pathToFileURL(pdfPath).href }
            }
          }
        }
        throw new Error('No se encontraron datos de recibos en la clave temporal.')
      } catch (pdfMakeErr) {
        console.error('❌ Error en generador nativo pdfmake:', pdfMakeErr)
        throw pdfMakeErr
      }
    }

    // Pipeline estándar con BrowserWindow solo para reportes (reporteLecturas, etc.)
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
            ...printOptions,
            ...(options || {}),
            scaleFactor: 100
          }

          // Normalizar pageSize si viene especificado
          if (pdfOptions.pageSize) {
            const size = String(pdfOptions.pageSize).toLowerCase()
            if (size === 'letter') pdfOptions.pageSize = 'Letter'
            else if (size === 'legal') pdfOptions.pageSize = 'Legal'
            else if (size === 'a4') pdfOptions.pageSize = 'A4'
          }

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
          const pdfPath = path.join(app.getPath('temp'), `${buildPdfFilename(url)}.pdf`)
          console.log('PDF generado en:', pdfPath)
          await fs.promises.writeFile(pdfPath, data)

          try {
            win.close()
          } catch (e) {}
          resolve({ success: true, path: pathToFileURL(pdfPath).href })
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

        // Fallback de seguridad de 3.5s (en caso de páginas estáticas sin useNotifyPrintReady)
        if (!captured) {
          fallbackTimer = setTimeout(() => {
            console.log('Usando fallback timer (3.5s) para PDF')
            capturePdf()
          }, 3500)
        }
      })

      win.loadURL(url)
    })
  })

  // Obtener lista de impresoras
  ipcMain.handle('getPrinters', async () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      const printers = await win.webContents.getPrintersAsync()
      return printers
    }
    return []
  })

  //impresion de reporte
  const printOptionsReporte = {
    silent: false, // Para mostrar el diálogo de impresión
    printBackground: true, // Para imprimir el fondo
    color: true,
    margin: {
      // Márgenes de impresión
      marginType: 'printableArea'
    },
    landscape: false, // Para orientación horizontal
    pagesPerSheet: 1,
    collate: false,
    copies: 1,
    header: 'Page header', // Encabezado de la página (puedes personalizarlo también)
    footer: `Página {{pageNumber}} de {{totalPages}}`, // Aquí agregamos el número de página
    pageSize: 'letter' // Tamaño carta (A4 sería 'A4')
  }

  //handle print report - Optimizado igual que printComponent
  ipcMain.handle('printReport', (event, url) => {
    console.log('=== PRINT REPORT DEBUG ===')
    console.log('Printing report from URL:', url)
    console.log('App packaged:', app.isPackaged)
    console.log('Process platform:', process.platform)

    let win = new BrowserWindow({
      show: false,
      backgroundColor: '#ffffff', // FORCE WHITE BACKGROUND
      webPreferences: {
        zoomFactor: 1.0,
        nodeIntegration: false,
        contextIsolation: true,
        // Deshabilitar cache para evitar problemas de carga
        cache: false,
        // Solo deshabilitar webSecurity en desarrollo para localhost
        webSecurity: app.isPackaged || !url.includes('localhost'),
        // No permitir contenido inseguro en producción
        allowRunningInsecureContent: !app.isPackaged && url.includes('localhost')
      }
    })

    win.loadURL(url)

    win.webContents.on('did-finish-load', async () => {
      console.log('Print report window loaded successfully')

      // FORZAR MODO CLARO (Hack para evitar borde negro en preview)
      try {
        await win.webContents.insertCSS(
          'html, body { color-scheme: light !important; background-color: #ffffff !important; }'
        )
        await win.webContents.executeJavaScript(
          'document.documentElement.classList.remove("dark"); document.body.classList.remove("dark");'
        )
      } catch (e) {
        console.error('Error forcing light mode in report:', e)
      }

      // Pequeño delay para asegurar que la página esté completamente renderizada
      setTimeout(() => {
        win.webContents.print(printOptionsReporte, (success, failureReason) => {
          console.log('Print Report Initiated in Main...')
          if (!success) {
            console.error('Print report failed:', failureReason)
          } else {
            console.log('Print report successful')
          }
        })
      }, 1000) // 1 segundo de delay
    })

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(
        'Failed to load URL for report printing:',
        errorCode,
        errorDescription,
        validatedURL
      )
    })

    // Filtrar algunos logs de console para reducir ruido
    win.webContents.on('console-message', (event, level, message) => {
      if (
        !message.includes('React DevTools') &&
        !message.includes('Electron Security Warning') &&
        !message.includes('[vite]')
      ) {
        console.log('Print report window console:', level, message)
      }
    })

    return 'mostrando diálogo de impresión de reporte'
  })

  //handle preview report - Optimizado igual que previewComponent
  ipcMain.handle('previewReport', (event, url) => {
    console.log('=== PREVIEW REPORT DEBUG ===')
    console.log('Preview report from URL:', url)
    console.log('App packaged:', app.isPackaged)

    let win = new BrowserWindow({
      title: 'Preview Report',
      show: false,
      backgroundColor: '#ffffff', // FORCE WHITE BACKGROUND
      autoHideMenuBar: true,
      webPreferences: {
        zoomFactor: 1.0,
        nodeIntegration: false,
        contextIsolation: true,
        // Deshabilitar cache para evitar problemas de carga
        cache: false,
        // Solo deshabilitar webSecurity en desarrollo para localhost
        webSecurity: app.isPackaged || !url.includes('localhost'),
        // No permitir contenido inseguro en producción
        allowRunningInsecureContent: !app.isPackaged && url.includes('localhost')
      }
    })

    win.loadURL(url)

    win.webContents.on('did-finish-load', async () => {
      // FORZAR MODO CLARO
      try {
        await win.webContents.insertCSS(
          'html, body { color-scheme: light !important; background-color: #ffffff !important; }'
        )
        await win.webContents.executeJavaScript(
          'document.documentElement.classList.remove("dark"); document.body.classList.remove("dark");'
        )
      } catch (e) {}
    })

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(
        'Failed to load URL for report preview:',
        errorCode,
        errorDescription,
        validatedURL
      )
    })

    // Filtrar algunos logs de console para reducir ruido
    win.webContents.on('console-message', (event, level, message) => {
      if (
        !message.includes('React DevTools') &&
        !message.includes('Electron Security Warning') &&
        !message.includes('[vite]')
      ) {
        console.log('Preview report window console:', level, message)
      }
    })

    win.webContents.once('did-finish-load', () => {
      console.log('Preview report window loaded successfully')
      // Pequeño delay para asegurar que la página esté completamente renderizada
      setTimeout(() => {
        win.webContents
          .printToPDF(printOptionsReporte)
          .then((data) => {
            let buf = Buffer.from(data)
            var data = buf.toString('base64')
            let url = 'data:application/pdf;base64,' + data

            win.webContents.on('ready-to-show', () => {
              win.show()
              win.setTitle('Preview Report')
            })

            win.webContents.on('closed', () => (win = null))
            win.loadURL(url)
          })
          .catch((error) => {
            console.error('Error generating report PDF:', error)
          })
      }, 1000) // 1 segundo de delay
    })
    return 'mostrando diálogo de previsualizacion de reporte'
  })

  // =====================================
  // HANDLERS DE DOCUMENTACIÓN MEJORADOS
  // =====================================

  // Función helper para parsear frontmatter
  const parseFrontmatter = (content, fileName) => {
    const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/
    const match = content.match(frontmatterRegex)

    let metadata = {
      titulo: fileName.replace('.md', '').replace(/-/g, ' '),
      orden: 999,
      descripcion: '',
      seccion: '',
      tags: []
    }

    if (match) {
      try {
        const frontmatterText = match[1]
        const frontmatterLines = frontmatterText.split(/\r?\n/).filter((line) => line.trim())

        frontmatterLines.forEach((line) => {
          const colonIndex = line.indexOf(':')
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim()
            let value = line.substring(colonIndex + 1).trim()

            // Remover comillas si existen
            value = value.replace(/^["']|["']$/g, '')

            // Convertir orden a número
            if (key === 'orden') {
              value = parseInt(value) || 999
            }

            // Parsear arrays básicos (solo para strings)
            if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
              try {
                value = JSON.parse(value)
              } catch {
                // Mantener como string si no se puede parsear
              }
            }

            metadata[key] = value
          }
        })
      } catch (parseError) {
        console.warn(`⚠️ Error parseando metadata de ${fileName}:`, parseError)
      }
    }

    if (!metadata.tipo) {
      const lowerFile = fileName.toLowerCase()
      const lowerTitle = (metadata.titulo || '').toLowerCase()
      if (
        lowerFile.includes('introduccion') ||
        lowerFile.includes('recalcular') ||
        lowerFile.includes('cartera vencida') ||
        lowerFile.includes('configurar-tarifas') ||
        lowerTitle.includes('introducción') ||
        lowerTitle.includes('funcionamiento') ||
        lowerTitle.includes('lógica') ||
        lowerTitle.includes('arquitectura')
      ) {
        metadata.tipo = 'funcionamiento'
      } else {
        metadata.tipo = 'uso'
      }
    }

    return metadata
  }

  // Función helper para resolver la ruta del directorio ayuda
  const resolveAyudaPath = () => {
    const isDev = !app.isPackaged
    const candidates = isDev
      ? [
          path.join(process.cwd(), 'ayuda'),
          path.join(app.getAppPath(), 'ayuda'),
          path.join(__dirname, '../../ayuda'),
          path.join(__dirname, '../ayuda')
        ]
      : [
          path.join(process.resourcesPath, 'ayuda'),
          path.join(process.resourcesPath, 'app.asar.unpacked', 'ayuda'),
          path.join(app.getAppPath(), 'ayuda'),
          path.join(process.cwd(), 'ayuda')
        ]

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        return cand
      }
    }
    return candidates[0]
  }

  // Handler para listar archivos de documentación
  ipcMain.handle('list-documentation-files', async (event, section = null) => {
    console.log(`📚 Handler documentación - Listando archivos de sección: ${section || 'todas'}`)

    try {
      const ayudaPath = resolveAyudaPath()
      console.log(`📁 Buscando en directorio: ${ayudaPath}`)

      if (!fs.existsSync(ayudaPath)) {
        console.warn(`⚠️ Directorio de ayuda no encontrado: ${ayudaPath}`)
        return { success: false, error: 'Directorio de ayuda no encontrado', sections: {} }
      }

      const sections = {}
      const subDirs = fs.readdirSync(ayudaPath).filter((d) => {
        try {
          return fs.statSync(path.join(ayudaPath, d)).isDirectory() && d !== 'imagenes'
        } catch {
          return false
        }
      })

      for (const sDir of subDirs) {
        if (section && sDir !== section) continue
        const sPath = path.join(ayudaPath, sDir)
        const mdFiles = fs.readdirSync(sPath).filter((f) => f.endsWith('.md'))
        sections[sDir] = []

        for (const f of mdFiles) {
          try {
            const fullF = path.join(sPath, f)
            const content = fs.readFileSync(fullF, 'utf8')
            const metadata = parseFrontmatter(content, f)
            metadata.seccion = sDir
            sections[sDir].push({ fileName: f, metadata })
          } catch (e) {
            console.warn(`Error leyendo archivo ${f}:`, e)
          }
        }

        sections[sDir].sort((a, b) => (a.metadata.orden || 999) - (b.metadata.orden || 999))
      }

      console.log(
        `✅ Documentación listada exitosamente: ${Object.keys(sections).length} secciones`
      )
      return { success: true, sections }
    } catch (error) {
      console.error('❌ Error listando documentación:', error)
      return { success: false, error: error.message, sections: {} }
    }
  })

  // Handler para abrir ventana independiente de ayuda
  ipcMain.handle('open-help-window', async (_event, section = null, file = null) => {
    try {
      openHelpWindow(section, file)
      return { success: true }
    } catch (error) {
      console.error('❌ Error al abrir ventana de ayuda:', error)
      return { success: false, error: error.message }
    }
  })

  // Handler para cargar un archivo específico de documentación
  ipcMain.handle('load-documentation-file', async (event, section, fileName) => {
    console.log(`📄 Handler documentación - Solicitando archivo: ${section}/${fileName}`)

    try {
      const ayudaPath = resolveAyudaPath()

      const candidatePaths = [
        path.join(ayudaPath, section, fileName),
        path.join(ayudaPath, section, `${fileName}.md`),
        path.join(ayudaPath, fileName)
      ]

      let filePath = null
      for (const cand of candidatePaths) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          filePath = cand
          break
        }
      }

      if (!filePath) {
        console.warn(`⚠️ Archivo no encontrado en ninguna ruta: ${section}/${fileName}`)
        return { success: false, error: 'Archivo no encontrado', content: '', metadata: {} }
      }

      const content = fs.readFileSync(filePath, 'utf8')
      console.log(`✅ Archivo leído exitosamente: ${filePath} (${content.length} caracteres)`)

      // Parsear y remover frontmatter del contenido
      const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/
      const match = content.match(frontmatterRegex)

      let cleanContent = content
      let metadata = {}

      if (match) {
        cleanContent = content.replace(frontmatterRegex, '')
        metadata = parseFrontmatter(content, fileName)
      } else {
        metadata = parseFrontmatter(content, fileName)
      }

      // Resolver y transformar rutas de imágenes locales relativas a Data URIs
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.avif': 'image/avif',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon'
      }

      const tryFindImage = (imgPath) => {
        if (
          !imgPath ||
          imgPath.startsWith('http://') ||
          imgPath.startsWith('https://') ||
          imgPath.startsWith('data:')
        ) {
          return null
        }
        const clean = imgPath.trim().replace(/^<|>$/g, '').trim()

        const candidates = [
          path.resolve(path.dirname(filePath), clean),
          path.resolve(
            ayudaPath,
            clean
              .replace(/^(\.\.\/)+/g, '')
              .replace(/^(\.\/)+/g, '')
              .replace(/^\//g, '')
          ),
          path.resolve(
            ayudaPath,
            'imagenes',
            clean
              .replace(/^(\.\.\/)+/g, '')
              .replace(/^(\.\/)+/g, '')
              .replace(/^imagenes\//g, '')
              .replace(/^\//g, '')
          ),
          path.resolve(ayudaPath, 'imagenes', 'Guia_Acccion_mes', path.basename(clean)),
          path.resolve(ayudaPath, 'imagenes', path.basename(clean))
        ]

        for (const cand of candidates) {
          if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
            const ext = path.extname(cand).toLowerCase()
            const mime = mimeTypes[ext] || 'image/png'
            try {
              const buf = fs.readFileSync(cand)
              return `data:${mime};base64,${buf.toString('base64')}`
            } catch (e) {
              console.warn(`Error leyendo imagen ${cand}:`, e)
            }
          }
        }
        return null
      }

      // 1. Reemplazar enlaces inline ![alt](path)
      cleanContent = cleanContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imgPath) => {
        const dataUri = tryFindImage(imgPath)
        if (dataUri) {
          return `![${alt}](${dataUri})`
        }
        return match
      })

      // 2. Reemplazar referencias [ref]: path o [ref]: <path>
      cleanContent = cleanContent.replace(
        /^\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm,
        (match, ref, imgPath) => {
          const dataUri = tryFindImage(imgPath)
          if (dataUri) {
            return `[${ref}]: ${dataUri}`
          }
          return match
        }
      )

      // 3. Reemplazar etiquetas HTML <img src="path" ... />
      cleanContent = cleanContent.replace(
        /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)\/?>/gi,
        (match, before, imgPath, after) => {
          const dataUri = tryFindImage(imgPath)
          if (dataUri) {
            return `<img ${before}src="${dataUri}"${after} />`
          }
          return match
        }
      )

      return {
        success: true,
        content: cleanContent,
        metadata: metadata
      }
    } catch (error) {
      console.error('❌ Error cargando archivo de documentación:', error)
      return { success: false, error: error.message, content: '', metadata: {} }
    }
  })

  // Handler para cargar imágenes individuales de documentación
  ipcMain.handle('load-documentation-image', async (_event, imagePath) => {
    try {
      if (!imagePath) return { success: false, error: 'Ruta no proporcionada' }
      if (
        imagePath.startsWith('data:') ||
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
      ) {
        return { success: true, dataUri: imagePath }
      }

      const ayudaPath = resolveAyudaPath()
      const clean = imagePath.trim().replace(/^<|>$/g, '').trim()

      const candidates = [
        path.resolve(
          ayudaPath,
          clean
            .replace(/^(\.\.\/)+/g, '')
            .replace(/^(\.\/)+/g, '')
            .replace(/^\//g, '')
        ),
        path.resolve(
          ayudaPath,
          'imagenes',
          clean
            .replace(/^(\.\.\/)+/g, '')
            .replace(/^(\.\/)+/g, '')
            .replace(/^imagenes\//g, '')
            .replace(/^\//g, '')
        ),
        path.resolve(ayudaPath, 'imagenes', 'Guia_Acccion_mes', path.basename(clean)),
        path.resolve(ayudaPath, 'imagenes', path.basename(clean)),
        path.resolve(clean)
      ]

      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.avif': 'image/avif',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon'
      }

      for (const cand of candidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          const ext = path.extname(cand).toLowerCase()
          const mime = mimeTypes[ext] || 'image/png'
          const buf = fs.readFileSync(cand)
          return {
            success: true,
            dataUri: `data:${mime};base64,${buf.toString('base64')}`
          }
        }
      }

      return { success: false, error: 'Imagen no encontrada' }
    } catch (error) {
      console.error('❌ Error cargando imagen de documentación:', error)
      return { success: false, error: error.message }
    }
  })

  // === GENERACIÓN EXCEL CON EXCELJS ===
  async function setupHoja(sheet, rows) {
    if (!rows || rows.length === 0) return
    const headers = Object.keys(rows[0])

    // Detectar tipo de columna: number, date o string
    const colTypes = {}
    for (const key of headers) {
      const vals = rows.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== '')
      if (vals.length === 0) {
        colTypes[key] = 'string'
        continue
      }
      if (vals.every((v) => typeof v === 'number')) {
        colTypes[key] = 'number'
        continue
      }
      if (vals.every((v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))) {
        colTypes[key] = 'date'
        continue
      }
      colTypes[key] = 'string'
    }

    // Fila de cabecera con estilo
    const headerRow = sheet.addRow(headers)
    headerRow.height = 22
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
      cell.border = { bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } } }
    })

    // Filas de datos
    for (const row of rows) {
      const values = headers.map((h) => {
        const v = row[h]
        if (colTypes[h] === 'date' && typeof v === 'string') return new Date(v)
        // Sanitizar si accidentalmente viniera un objeto complejo para evitar interpretaciones erróneas en ExcelJS
        if (v && typeof v === 'object' && !(v instanceof Date)) {
          return JSON.stringify(v)
        }
        return v ?? ''
      })
      const dataRow = sheet.addRow(values)
      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = headers[colNumber - 1]
        if (colTypes[key] === 'number') cell.numFmt = '#,##0.##'
        else if (colTypes[key] === 'date') cell.numFmt = 'dd/mm/yyyy'
        cell.alignment = { vertical: 'middle' }
      })
    }

    // Anchos automáticos de columna basados en el contenido
    sheet.columns.forEach((col, i) => {
      const header = headers[i]
      const maxLen = Math.max(header.length, ...rows.map((r) => String(r[header] ?? '').length))
      col.width = Math.min(maxLen + 4, 55)
    })

    // Congelar primera fila y activar filtros automáticos
    sheet.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }]
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } }
  }

  async function generarExcelBuffer(data) {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AguaVP'
    workbook.created = new Date()

    const MAX_SAFE_ROWS = 100000
    const isMultiSheet = !Array.isArray(data) && typeof data === 'object' && data !== null

    if (isMultiSheet) {
      for (const [sheetName, rows] of Object.entries(data)) {
        if (!Array.isArray(rows) || rows.length === 0) continue
        if (rows.length > MAX_SAFE_ROWS) {
          throw new Error(
            `La hoja "${sheetName}" excede el límite máximo seguro (${MAX_SAFE_ROWS} filas)`
          )
        }
        // Excel prohíbe caracteres especiales: \ / ? * : [ ] y máx 31 caracteres
        const safeSheetName =
          String(sheetName)
            .replace(/[/\\?*:[\]]/g, '_')
            .trim()
            .substring(0, 31) || 'Hoja'
        const sheet = workbook.addWorksheet(safeSheetName)
        await setupHoja(sheet, rows)
      }
    } else if (Array.isArray(data)) {
      if (data.length > MAX_SAFE_ROWS) {
        throw new Error(`Los datos exceden el límite máximo seguro (${MAX_SAFE_ROWS} filas)`)
      }
      const sheet = workbook.addWorksheet('Datos')
      await setupHoja(sheet, data)
    }

    return workbook.xlsx.writeBuffer()
  }

  // === HANDLER DE GUARDADO DE ARCHIVOS ===
  ipcMain.handle('save-file-dialog', async (event, { data, fileName, format }) => {
    const win = BrowserWindow.fromWebContents(event.sender)

    // Sanitizar formato y nombre de archivo para prevenir Path Traversal y caracteres prohibidos
    const safeFormat = format === 'csv' ? 'csv' : 'xlsx'
    const safeBaseName =
      path
        .basename(String(fileName || 'exportacion'))
        .replace(/[/\\?%*:|"<>]/g, '_')
        .trim() || 'exportacion'

    const options = {
      title: 'Guardar Archivo',
      defaultPath: path.join(app.getPath('downloads'), `${safeBaseName}.${safeFormat}`),
      filters: [
        {
          name: safeFormat === 'csv' ? 'Archivos CSV' : 'Archivos Excel',
          extensions: [safeFormat]
        }
      ]
    }

    const { canceled, filePath } = await dialog.showSaveDialog(win, options)

    if (canceled || !filePath) {
      return { success: false, canceled: true }
    }

    try {
      let buffer
      if (safeFormat === 'xlsx') {
        buffer = await generarExcelBuffer(data)
      } else {
        // CSV con BOM para soporte UTF-8 en Excel
        buffer = Buffer.concat([Buffer.from('\uFEFF'), Buffer.from(data, 'utf-8')])
      }

      await fs.promises.writeFile(filePath, buffer)
      return { success: true, filePath }
    } catch (error) {
      console.error('Error guardando archivo:', error)
      return { success: false, error: error.message }
    }
  })

  // Helper para resolver rutas locales de PDF a partir de cualquier URL o formato en Windows
  const resolveLocalPdfPath = (fileUrl) => {
    if (!fileUrl) return null
    let p = String(fileUrl).trim()
    // Remover query parameters o hashes (ej: file:///...pdf?t=123#page=1)
    p = p.split('#')[0].split('?')[0]
    if (p.startsWith('file:')) {
      try {
        p = fileURLToPath(p)
      } catch {
        p = p.replace(/^file:\/{1,3}/i, '')
        p = decodeURIComponent(p)
      }
    } else {
      p = decodeURIComponent(p)
    }
    p = p.replace(/\//g, path.sep)
    if (/^[\\\/][a-zA-Z]:/.test(p)) {
      p = p.slice(1)
    }
    return p
  }

  // Helper para interpretar rangos de páginas (ej. '1-3, 5') a índices 0-based
  const parsePageRange = (rangeStr, maxPages) => {
    const pages = new Set()
    const parts = String(rangeStr || '').split(',')
    for (const part of parts) {
      const trimmed = part.trim()
      if (!trimmed) continue
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-')
        const start = Math.max(1, parseInt(startStr, 10) || 1)
        const end = Math.min(maxPages, parseInt(endStr, 10) || maxPages)
        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          pages.add(i - 1)
        }
      } else {
        const p = parseInt(trimmed, 10)
        if (p >= 1 && p <= maxPages) {
          pages.add(p - 1)
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b)
  }

  // Convierte un documento PDF a escala de grises real (monocromático) transformando
  // flujos vectoriales (páginas y Form XObjects), gradientes (Shadings/Patterns) e imágenes (/DeviceRGB / ICCBased).
  const convertDocToGrayscale = async (doc) => {
    const { PDFName, PDFRawStream, PDFStream } = await import('pdf-lib')

    const processContentStream = (stream) => {
      if (!stream || !stream.contents) return

      const filter = stream.dict?.get(PDFName.of('Filter'))?.toString()
      let decompressed
      const isFlate = filter === '/FlateDecode'
      if (isFlate) {
        try {
          decompressed = zlib.inflateSync(Buffer.from(stream.contents))
        } catch {
          return
        }
      } else if (!filter) {
        decompressed = Buffer.from(stream.contents)
      } else {
        return
      }

      let contentStr = decompressed.toString('latin1')

      // Transformar operadores RGB: r g b (rg|RG|scn|SCN|sc|SC)
      contentStr = contentStr.replace(
        /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s+(scn|SCN|rg|RG|sc|SC)\b/g,
        (match, rStr, gStr, bStr, op) => {
          const r = parseFloat(rStr)
          const g = parseFloat(gStr)
          const b = parseFloat(bStr)
          if (isNaN(r) || isNaN(g) || isNaN(b)) return match
          const gray = Math.max(0, Math.min(1, 0.299 * r + 0.587 * g + 0.114 * b)).toFixed(4)
          return `${gray} ${gray} ${gray} ${op}`
        }
      )

      // Transformar operadores CMYK: c m y k (k|K)
      contentStr = contentStr.replace(
        /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s+(k|K)\b/g,
        (match, cStr, mStr, yStr, kStr, op) => {
          const c = parseFloat(cStr)
          const m = parseFloat(mStr)
          const y = parseFloat(yStr)
          const k = parseFloat(kStr)
          if (isNaN(c) || isNaN(m) || isNaN(y) || isNaN(k)) return match
          const grayK = Math.max(0, Math.min(1, 0.299 * c + 0.587 * m + 0.114 * y + k)).toFixed(4)
          return `0 0 0 ${grayK} ${op}`
        }
      )

      const newBuffer = Buffer.from(contentStr, 'latin1')
      if (isFlate) {
        stream.contents = zlib.deflateSync(newBuffer)
      } else {
        stream.contents = new Uint8Array(newBuffer)
      }
    }

    const convertFunctionColors = (fnTarget) => {
      if (!fnTarget) return
      const resolved = (fnTarget.tag === 'Ref' || fnTarget._objectNumber !== undefined)
        ? doc.context.lookup(fnTarget)
        : fnTarget
      if (!resolved) return
      const d = resolved.dict || (typeof resolved.get === 'function' ? resolved : null)
      if (!d) return

      // Manejar funciones compuestas / stitching (Tipo 3)
      const childFunctions = d.get(PDFName.of('Functions'))
      if (childFunctions && typeof childFunctions.asArray === 'function') {
        for (const child of childFunctions.asArray()) {
          convertFunctionColors(child)
        }
      } else if (Array.isArray(childFunctions)) {
        for (const child of childFunctions) {
          convertFunctionColors(child)
        }
      }

      // Procesar puntos extremos de color de gradientes C0 y C1
      for (const key of ['C0', 'C1']) {
        const cArr = d.get(PDFName.of(key))
        if (cArr && typeof cArr.asArray === 'function') {
          const arr = cArr.asArray()
          if (arr.length === 3) {
            const r = parseFloat(arr[0].toString())
            const g = parseFloat(arr[1].toString())
            const b = parseFloat(arr[2].toString())
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
              const gray = Math.round(Math.max(0, Math.min(1, 0.299 * r + 0.587 * g + 0.114 * b)) * 10000) / 10000
              d.set(PDFName.of(key), doc.context.obj([gray, gray, gray]))
            }
          }
        }
      }
    }

    // 1. Convertir flujos de contenido de todas las páginas
    for (const page of doc.getPages()) {
      const contentsRef = page.node.Contents()
      if (!contentsRef) continue

      let streams = []
      if (typeof contentsRef.asArray === 'function') {
        streams = contentsRef.asArray().map((r) => doc.context.lookup(r) || r)
      } else if (Array.isArray(contentsRef)) {
        streams = contentsRef.map((r) => doc.context.lookup(r) || r)
      } else {
        const resolved = (contentsRef.tag === 'Ref' || contentsRef._objectNumber !== undefined)
          ? doc.context.lookup(contentsRef)
          : contentsRef
        streams = [resolved || contentsRef]
      }

      for (const s of streams) {
        processContentStream(s)
      }
    }

    // 2. Procesar todos los objetos indirectos (Form XObjects, Imágenes e iluminación/degradados Shading)
    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
      if (!obj) continue

      // 2A. Flujos (Form XObjects, imágenes y patrones)
      const isStream = (PDFRawStream && obj instanceof PDFRawStream) ||
                       (PDFStream && obj instanceof PDFStream) ||
                       (obj && obj.contents !== undefined && obj.dict !== undefined)
      if (isStream) {
        const subtype = obj.dict?.get(PDFName.of('Subtype'))?.toString()
        const type = obj.dict?.get(PDFName.of('Type'))?.toString()

        // Imágenes raster (/DeviceRGB, /ICCBased, etc.)
        if (subtype === '/Image') {
          const filter = obj.dict?.get(PDFName.of('Filter'))?.toString()
          const w = parseInt(obj.dict?.get(PDFName.of('Width'))?.toString() || '0', 10)
          const h = parseInt(obj.dict?.get(PDFName.of('Height'))?.toString() || '0', 10)

          if (filter === '/FlateDecode' && w > 0 && h > 0) {
            try {
              const raw = zlib.inflateSync(Buffer.from(obj.contents))
              // Buffer RGB de 3 canales (DeviceRGB, ICCBased, CalRGB)
              if (raw.length === w * h * 3) {
                for (let i = 0; i < raw.length; i += 3) {
                  const gray = Math.round(0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2])
                  raw[i] = gray
                  raw[i + 1] = gray
                  raw[i + 2] = gray
                }
                obj.contents = zlib.deflateSync(raw)
              } else if (raw.length === h * (1 + w * 3)) {
                // Buffer con predictor PNG (3 canales)
                const rowBytes = 1 + w * 3
                for (let y = 0; y < h; y++) {
                  const rowStart = y * rowBytes + 1
                  for (let x = 0; x < w; x++) {
                    const idx = rowStart + x * 3
                    const gray = Math.round(0.299 * raw[idx] + 0.587 * raw[idx + 1] + 0.114 * raw[idx + 2])
                    raw[idx] = gray
                    raw[idx + 1] = gray
                    raw[idx + 2] = gray
                  }
                }
                obj.contents = zlib.deflateSync(raw)
              } else if (raw.length === w * h * 4) {
                // Buffer RGBA de 4 canales (preserva canal alfa)
                for (let i = 0; i < raw.length; i += 4) {
                  const gray = Math.round(0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2])
                  raw[i] = gray
                  raw[i + 1] = gray
                  raw[i + 2] = gray
                }
                obj.contents = zlib.deflateSync(raw)
              } else if (raw.length === h * (1 + w * 4)) {
                // Buffer RGBA de 4 canales con predictor PNG (preserva canal alfa)
                const rowBytes = 1 + w * 4
                for (let y = 0; y < h; y++) {
                  const rowStart = y * rowBytes + 1
                  for (let x = 0; x < w; x++) {
                    const idx = rowStart + x * 4
                    const gray = Math.round(0.299 * raw[idx] + 0.587 * raw[idx + 1] + 0.114 * raw[idx + 2])
                    raw[idx] = gray
                    raw[idx + 1] = gray
                    raw[idx + 2] = gray
                  }
                }
                obj.contents = zlib.deflateSync(raw)
              }
            } catch (imgErr) {
              console.warn('⚠️ Error al transformar imagen a escala de grises:', imgErr.message)
            }
          }
          continue
        }

        // Form XObjects (cabeceras, componentes visuales de Chromium) y flujos de patrones
        if (subtype === '/Form' || type === '/Pattern') {
          processContentStream(obj)
        }
      }

      // 2B. Diccionarios de Degradados (Shadings) y Patrones con Shading (cabeceras y fondos con gradientes CSS)
      const dict = obj.dict || (typeof obj.get === 'function' ? obj : null)
      if (dict) {
        let shading = dict.get(PDFName.of('Shading'))
        if (shading) {
          shading = (shading.tag === 'Ref' || shading._objectNumber !== undefined) ? doc.context.lookup(shading) : shading
        } else if (dict.get(PDFName.of('ShadingType'))) {
          shading = obj
        }

        if (shading) {
          const sDict = shading.dict || shading
          const fn = sDict.get(PDFName.of('Function'))
          if (fn) {
            convertFunctionColors(fn)
          }
          const bg = sDict.get(PDFName.of('Background'))
          if (bg && typeof bg.asArray === 'function') {
            const arr = bg.asArray()
            if (arr.length === 3) {
              const r = parseFloat(arr[0].toString())
              const g = parseFloat(arr[1].toString())
              const b = parseFloat(arr[2].toString())
              if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                const gray = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 10000) / 10000
                sDict.set(PDFName.of('Background'), doc.context.obj([gray, gray, gray]))
              }
            }
          }
        }
      }
    }
  }

  // ============================================================
  // GUARDAR PDF — copiar o exportar el PDF a ubicación elegida por el usuario
  // Soporta filtrado nativo de rangos de páginas, rotación y conversión B/N
  // ============================================================
  ipcMain.handle('save-pdf', async (event, fileUrl, options = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const sourcePath = resolveLocalPdfPath(fileUrl)

    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return { success: false, error: 'El archivo temporal ya no existe' }
    }

    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Guardar PDF',
      defaultPath: path.join(app.getPath('downloads'), path.basename(sourcePath)),
      filters: [{ name: 'Archivos PDF', extensions: ['pdf'] }]
    })

    if (canceled || !filePath) {
      return { success: false, canceled: true }
    }

    try {
      const isMonochrome = options.colorMode === 'monochrome'
      const hasCustomPages = options.pages && typeof options.pages === 'string' && options.pages !== 'all'
      const hasRotation = typeof options.rotateAngle === 'number' && options.rotateAngle !== 0

      if (isMonochrome || hasCustomPages || hasRotation) {
        const { PDFDocument, degrees } = await import('pdf-lib')
        const fileBytes = await fs.promises.readFile(sourcePath)
        const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true })
        const total = srcDoc.getPageCount()
        const pageIndices = hasCustomPages ? parsePageRange(options.pages, total) : Array.from({ length: total }, (_, i) => i)

        if (hasCustomPages && pageIndices.length === 0) {
          return { success: false, error: 'El rango de páginas especificado no coincide con ninguna página del documento.' }
        }

        if (pageIndices.length > 0) {
          const newDoc = await PDFDocument.create()
          const copiedPages = await newDoc.copyPages(srcDoc, pageIndices)
          copiedPages.forEach((p) => {
            if (hasRotation) {
              const currentRot = p.getRotation ? (p.getRotation().angle || 0) : 0
              p.setRotation(degrees((currentRot + options.rotateAngle) % 360))
            }
            newDoc.addPage(p)
          })
          if (isMonochrome) {
            await convertDocToGrayscale(newDoc)
          }
          const newPdfBytes = await newDoc.save()
          await fs.promises.writeFile(filePath, newPdfBytes)
          return { success: true, filePath }
        }
      }

      await fs.promises.copyFile(sourcePath, filePath)
      return { success: true, filePath }
    } catch (error) {
      console.error('Error guardando PDF:', error)
      return { success: false, error: error.message }
    }
  })

  // Obtener metadatos nativos del documento (orientación y total de páginas con detección real de rotación)
  ipcMain.handle('get-pdf-metadata', async (_event, fileUrl) => {
    try {
      const sourcePath = resolveLocalPdfPath(fileUrl)
      if (!sourcePath || !fs.existsSync(sourcePath)) {
        console.warn('⚠️ [get-pdf-metadata] Archivo no existe:', sourcePath)
        return null
      }

      const { PDFDocument } = await import('pdf-lib')
      const fileBytes = await fs.promises.readFile(sourcePath)
      const doc = await PDFDocument.load(fileBytes, { ignoreEncryption: true })
      const pageCount = doc.getPageCount()
      if (pageCount === 0) {
        return {
          success: true,
          pageCount: 0,
          orientation: 'portrait',
          isLandscape: false,
          width: 612,
          height: 792
        }
      }

      const firstPage = doc.getPage(0)
      const size = firstPage.getSize()
      const rot = firstPage.getRotation ? (firstPage.getRotation().angle || 0) : 0
      const effectiveWidth = (rot === 90 || rot === 270) ? size.height : size.width
      const effectiveHeight = (rot === 90 || rot === 270) ? size.width : size.height
      const isLandscape = effectiveWidth >= effectiveHeight
      const orientation = isLandscape ? 'landscape' : 'portrait'

      const result = {
        success: true,
        pageCount,
        orientation,
        isLandscape,
        width: Math.round(effectiveWidth),
        height: Math.round(effectiveHeight),
        rotation: rot
      }
      console.log('✅ [get-pdf-metadata]:', result)
      return result
    } catch (err) {
      console.warn('⚠️ Error al obtener metadatos de PDF:', err.message)
      return null
    }
  })

  // Generar corte o transformación temporal de vista previa (filtrado de páginas, rotación y/o monocromático)
  ipcMain.handle('generate-preview-slice', async (_event, { fileUrl, pages, rotateAngle = 0, colorMode = 'color' }) => {
    try {
      const sourcePath = resolveLocalPdfPath(fileUrl)
      if (!sourcePath || !fs.existsSync(sourcePath)) {
        return { success: false, error: 'Archivo PDF de origen no encontrado' }
      }

      const { PDFDocument, degrees } = await import('pdf-lib')
      const fileBytes = await fs.promises.readFile(sourcePath)
      const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true })
      const total = srcDoc.getPageCount()

      let pageIndices = []
      if (!pages || pages === 'all') {
        pageIndices = Array.from({ length: total }, (_, i) => i)
      } else {
        pageIndices = parsePageRange(pages, total)
      }

      if (pageIndices.length === 0) {
        pageIndices = Array.from({ length: total }, (_, i) => i)
      }

      const newDoc = await PDFDocument.create()
      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices)
      copiedPages.forEach((p) => {
        if (rotateAngle !== 0) {
          const currentRot = p.getRotation ? (p.getRotation().angle || 0) : 0
          p.setRotation(degrees((currentRot + rotateAngle) % 360))
        }
        newDoc.addPage(p)
      })

      if (colorMode === 'monochrome') {
        await convertDocToGrayscale(newDoc)
      }

      const tempSlicePath = path.join(app.getPath('temp'), `preview_slice_${Date.now()}.pdf`)
      const newBytes = await newDoc.save()
      await fs.promises.writeFile(tempSlicePath, newBytes)

      return {
        success: true,
        url: pathToFileURL(tempSlicePath).href,
        pageCount: pageIndices.length,
        path: tempSlicePath
      }
    } catch (err) {
      console.error('Error generando corte de vista previa:', err)
      return { success: false, error: err.message }
    }
  })

  // ============================================================
  // SELECCIONAR IMÁGENES DE LOGIN — multi-selección, devuelve array base64
  // ======================================================================
  ipcMain.handle('select-login-images', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Seleccionar Imágenes del Login',
      filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile', 'multiSelections']
    })
    if (canceled || !filePaths.length) return { canceled: true }
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', png: 'image/png' }
    const results = await Promise.all(
      filePaths.map(async (filePath) => {
        const ext = path.extname(filePath).slice(1).toLowerCase()
        const mime = mimeMap[ext] || 'image/png'
        const data = await fs.promises.readFile(filePath)
        return `data:${mime};base64,${data.toString('base64')}`
      })
    )
    return { success: true, data: results }
  })

  // SELECCIONAR LOGO — abre diálogo de archivo, devuelve base64 y persiste en el sistema
  // ============================================================
  ipcMain.handle('select-logo', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Seleccionar Logo de la Aplicación',
      filters: [{ name: 'Imágenes (*.png, *.jpg, *.jpeg, *.webp)', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile']
    })
    if (canceled || !filePaths.length) return { canceled: true }
    const filePath = filePaths[0]

    try {
      // Normalizar siempre a PNG estándar para compatibilidad total con PDFKit/pdfmake
      const img = nativeImage.createFromPath(filePath)
      if (img.isEmpty()) {
        throw new Error('La imagen no se pudo cargar o su formato no es compatible.')
      }
      const pngBuffer = img.toPNG()
      const base64Data = `data:image/png;base64,${pngBuffer.toString('base64')}`
      saveCustomLogo(base64Data)
      return { success: true, data: base64Data }
    } catch (imgErr) {
      console.warn('⚠️ Error procesando imagen con nativeImage, intentando lectura directa:', imgErr.message)
      try {
        const ext = path.extname(filePath).slice(1).toLowerCase()
        const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', png: 'image/png' }
        const mime = mimeMap[ext] || 'image/png'
        const data = await fs.promises.readFile(filePath)
        const base64Data = `data:${mime};base64,${data.toString('base64')}`
        saveCustomLogo(base64Data)
        return { success: true, data: base64Data }
      } catch (readErr) {
        return { success: false, error: readErr.message }
      }
    }
  })

  ipcMain.handle('save-custom-logo', async (_event, base64Data) => {
    try {
      saveCustomLogo(base64Data)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('get-custom-logo', async () => {
    return getCustomLogoBase64()
  })

  ipcMain.handle('clear-custom-logo', async () => {
    return clearCustomLogo()
  })

  ipcMain.handle('get-default-logo', async () => {
    return getDefaultLogoBase64()
  })

  // ============================================================
  // IMPRESIÓN SILENCIOSA vía SumatraPDF (pdf-to-printer) — sin BrowserWindow, sin React.
  // Recibe pdfFileUrl (file:///...) y envía el trabajo directo al spooler de Windows.
  const getSumatraPath = () => {
    const distDir = app.isPackaged
      ? path.join(
          process.resourcesPath,
          'app.asar.unpacked',
          'node_modules',
          'pdf-to-printer',
          'dist'
        )
      : path.join(app.getAppPath(), 'node_modules', 'pdf-to-printer', 'dist')
    const entries = fs
      .readdirSync(distDir)
      .filter((f) => f.startsWith('SumatraPDF') && f.endsWith('.exe'))
    if (!entries.length) throw new Error('SumatraPDF.exe no encontrado en ' + distDir)
    return path.join(distDir, entries[0])
  }

  ipcMain.handle('print-silent', async (event, pdfFileUrl, config = {}) => {
    const {
      printer = '',
      copies = 1,
      landscape = false,
      pageSize = 'Letter',
      colorMode = 'color',
      pages = '',
      duplex = 'simplex',
      scale = 'fit',
      collate = true,
      pagesPerSheet = 1,
      rotateAngle = 0
    } = config
    console.log('print-silent (SumatraPDF):', {
      printer,
      copies,
      landscape,
      pageSize,
      colorMode,
      pages,
      duplex,
      scale,
      collate,
      pagesPerSheet,
      rotateAngle
    })

    const VIRTUAL_PRINTERS = [
      'microsoft print to pdf',
      'microsoft xps document writer',
      'onenote',
      'fax'
    ]
    const isVirtual = VIRTUAL_PRINTERS.some((v) => (printer || '').toLowerCase().includes(v))

    const pdfPath = resolveLocalPdfPath(pdfFileUrl)
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      throw new Error('El archivo PDF a imprimir no existe: ' + pdfFileUrl)
    }

    const isMonochrome = colorMode === 'monochrome'
    const hasCustomPages = pages && typeof pages === 'string' && pages !== 'all'
    const hasRotation = typeof rotateAngle === 'number' && rotateAngle !== 0

    // Si el usuario seleccionó una impresora virtual de PDF (ej. Microsoft Print to PDF):
    // En lugar de enviar un PDF a través del spooler de Windows para volverlo a convertir a PDF
    // (lo que genera archivos EMF de 44MB+ y falla por timeout en PORTPROMPT:),
    // guardamos directamente el archivo PDF de alta fidelidad aplicando las opciones (páginas, B/N, rotación).
    if (isVirtual && (printer.toLowerCase().includes('pdf') || !printer)) {
      try {
        const win = BrowserWindow.fromWebContents(event.sender)
        const { canceled, filePath } = await dialog.showSaveDialog(win, {
          title: 'Guardar Salida de Impresión',
          defaultPath: path.basename(pdfPath),
          filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }]
        })
        if (canceled || !filePath) {
          return { success: false, canceled: true }
        }
        if (hasCustomPages || isMonochrome || hasRotation) {
          const { PDFDocument, degrees } = await import('pdf-lib')
          const fileBytes = await fs.promises.readFile(pdfPath)
          const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true })
          const total = srcDoc.getPageCount()
          const pageIndices = hasCustomPages ? parsePageRange(pages, total) : Array.from({ length: total }, (_, i) => i)

          if (hasCustomPages && pageIndices.length === 0) {
            throw new Error('El rango de páginas especificado no coincide con ninguna página del documento.')
          }

          if (pageIndices.length > 0) {
            const newDoc = await PDFDocument.create()
            const copiedPages = await newDoc.copyPages(srcDoc, pageIndices)
            copiedPages.forEach((p) => {
              if (hasRotation) {
                const currentRot = p.getRotation ? (p.getRotation().angle || 0) : 0
                p.setRotation(degrees((currentRot + rotateAngle) % 360))
              }
              newDoc.addPage(p)
            })
            if (isMonochrome) {
              await convertDocToGrayscale(newDoc)
            }
            const newPdfBytes = await newDoc.save()
            await fs.promises.writeFile(filePath, newPdfBytes)
            console.log('print-silent: guardado directo virtual exitoso (páginas y color transformados) en:', filePath)
            return { success: true, savedPath: filePath }
          }
        }
        await fs.promises.copyFile(pdfPath, filePath)
        console.log('print-silent: guardado directo exitoso en:', filePath)
        return { success: true, savedPath: filePath }
      } catch (saveErr) {
        console.warn('print-silent: error en guardado directo virtual:', saveErr.message)
        throw saveErr
      }
    }

    return new Promise(async (resolve, reject) => {
      let sumatraPath
      try {
        sumatraPath = getSumatraPath()
      } catch (e) {
        return reject('SumatraPDF no encontrado: ' + e.message)
      }

      // Si hay selección de páginas específica, rotación o modo monocromático, generamos un archivo transformado
      // para que SumatraPDF y el Windows Print Spooler solo procesen esas páginas en B/N real (ahorrando memoria y tóner)
      let fileToPrint = pdfPath
      let tempPrintFile = null

      try {
        if (hasCustomPages || isMonochrome || hasRotation) {
          const { PDFDocument, degrees } = await import('pdf-lib')
          const fileBytes = await fs.promises.readFile(pdfPath)
          const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true })
          const total = srcDoc.getPageCount()
          const pageIndices = hasCustomPages ? parsePageRange(pages, total) : Array.from({ length: total }, (_, i) => i)

          if (hasCustomPages && pageIndices.length === 0) {
            return reject('El rango de páginas especificado no coincide con ninguna página del documento.')
          }

          if (pageIndices.length > 0) {
            const newDoc = await PDFDocument.create()
            const copiedPages = await newDoc.copyPages(srcDoc, pageIndices)
            copiedPages.forEach((p) => {
              if (hasRotation) {
                const currentRot = p.getRotation ? (p.getRotation().angle || 0) : 0
                p.setRotation(degrees((currentRot + rotateAngle) % 360))
              }
              newDoc.addPage(p)
            })
            if (isMonochrome) {
              await convertDocToGrayscale(newDoc)
            }
            const newPdfBytes = await newDoc.save()
            tempPrintFile = path.join(app.getPath('temp'), `print_job_${Date.now()}.pdf`)
            await fs.promises.writeFile(tempPrintFile, newPdfBytes)
            fileToPrint = tempPrintFile
            console.log('print-silent: enviando archivo pre-procesado a SumatraPDF:', { tempPrintFile, isMonochrome, pagesCount: pageIndices.length })
          }
        }
      } catch (sliceErr) {
        console.warn('print-silent: no se pudo pre-procesar PDF previo a impresión, usando original:', sliceErr.message)
      }

      const cleanupTempPrintFile = async () => {
        if (tempPrintFile) {
          try {
            await fs.promises.unlink(tempPrintFile)
          } catch {}
        }
      }

      // Configuración de impresión avanzada para SumatraPDF
      const settingsList = [
        `paper=${pageSize.toLowerCase()}`,
        landscape ? 'landscape' : 'portrait',
        `copies=${Math.max(1, parseInt(copies) || 1)}`,
        isMonochrome ? 'monochrome' : 'color'
      ]

      if (scale === 'fit' || scale === 'shrink' || scale === 'noscale') {
        settingsList.push(scale)
      }

      if (duplex === 'duplex' || duplex === true) {
        settingsList.push('duplex')
      } else if (duplex === 'duplexshort') {
        settingsList.push('duplexshort')
      } else if (duplex === 'duplexlong') {
        settingsList.push('duplexlong')
      } else if (duplex === 'simplex') {
        settingsList.push('simplex')
      }

      if (parseInt(copies) > 1) {
        settingsList.push(collate ? 'collate' : 'nocolla')
      }

      if (pagesPerSheet === 2 || pagesPerSheet === 4) {
        settingsList.push(`nup=${pagesPerSheet}`)
      }

      const settings = settingsList.join(',')

      const args = [
        printer ? `-print-to` : `-print-to-default`,
        ...(printer ? [printer] : []),
        `-print-settings`,
        settings,
        `-silent`,
        fileToPrint
      ]

      // Timeout generoso de 10 minutos (600,000 ms) para soportar lotes grandes de 44, 80 o más páginas sin corte prematuro
      execFile(sumatraPath, args, { timeout: 600000, maxBuffer: 50 * 1024 * 1024 }, async (error, stdout, stderr) => {
        await cleanupTempPrintFile()
        if (!error) {
          console.log('print-silent: SumatraPDF OK')
          resolve({ success: true })
        } else {
          const exitCode = error.code
          const errText = (stderr || '').trim()
          console.warn(
            'print-silent: SumatraPDF salió con código',
            exitCode,
            '| killed:',
            error.killed,
            '| stderr:',
            errText || '(vacío)'
          )
          if (error.killed || exitCode === null) {
            reject('La impresora no respondió a tiempo después de 10 minutos.')
          } else if (exitCode === 1 && !errText && isVirtual) {
            reject(
              'El documento no fue guardado. Selecciona una impresora física para imprimir silenciosamente.'
            )
          } else if (exitCode === 1 && !errText) {
            // SumatraPDF 3.x sale con código 1 incluso cuando el trabajo se envió correctamente a impresoras físicas
            console.log('print-silent: código 1 sin stderr → considerado exitoso')
            resolve({ success: true })
          } else {
            reject(errText || error.message || 'Error al imprimir con SumatraPDF')
          }
        }
      })
    })
  })

  console.log('✅ Handlers de documentación registrados')

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
