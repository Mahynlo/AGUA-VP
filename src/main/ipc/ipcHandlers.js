import { ipcMain, BrowserWindow, app, shell, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { execFile } from 'child_process'
import { pathToFileURL, fileURLToPath } from 'url'
import ExcelJS from 'exceljs'
import { zoomIn, zoomOut, zoomReset, getZoom } from '../managers/zoomManager.js'
import { openHelpWindow } from '../managers/helpWindowManager.js'
import { generarRecibosPdf } from '../pdf/reciboPdfGenerator.js'

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
        console.log('ℹ️ [printComponent] Impresión de recibos por ventana web desactivada; se utiliza el PDF generado nativamente.')
        resolve('Impresión de recibos delegada al motor nativo PDF')
        return
      }

      let win = new BrowserWindow({
        show: false,
        backgroundColor: '#ffffff', // FORCE WHITE BACKGROUND
        webPreferences: {
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

    const isMultiSheet = !Array.isArray(data) && typeof data === 'object'

    if (isMultiSheet) {
      for (const [sheetName, rows] of Object.entries(data)) {
        if (!Array.isArray(rows) || rows.length === 0) continue
        const sheet = workbook.addWorksheet(sheetName.substring(0, 31))
        await setupHoja(sheet, rows)
      }
    } else {
      const sheet = workbook.addWorksheet('Datos')
      await setupHoja(sheet, data)
    }

    return workbook.xlsx.writeBuffer()
  }

  // === HANDLER DE GUARDADO DE ARCHIVOS ===
  ipcMain.handle('save-file-dialog', async (event, { data, fileName, format }) => {
    const win = BrowserWindow.fromWebContents(event.sender)

    const options = {
      title: 'Guardar Archivo',
      defaultPath: path.join(
        app.getPath('downloads'),
        `${fileName}.${format === 'csv' ? 'csv' : 'xlsx'}`
      ),
      filters: [
        {
          name: format === 'csv' ? 'Archivos CSV' : 'Archivos Excel',
          extensions: [format === 'csv' ? 'csv' : 'xlsx']
        }
      ]
    }

    const { canceled, filePath } = await dialog.showSaveDialog(win, options)

    if (canceled || !filePath) {
      return { success: false, canceled: true }
    }

    try {
      let buffer
      if (format === 'xlsx') {
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

  // ============================================================
  // GUARDAR PDF — copiar el PDF temporal a ubicación elegida por el usuario
  // ============================================================
  ipcMain.handle('save-pdf', async (event, fileUrl) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    // Convertir file:// URL a path local
    let sourcePath
    try {
      sourcePath = fileURLToPath(fileUrl)
    } catch {
      sourcePath = fileUrl.replace(/^file:\/\/\//, '')
    }

    if (!fs.existsSync(sourcePath)) {
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
      await fs.promises.copyFile(sourcePath, filePath)
      return { success: true, filePath }
    } catch (error) {
      console.error('Error guardando PDF:', error)
      return { success: false, error: error.message }
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

  // SELECCIONAR LOGO — abre diálogo de archivo, devuelve base64
  // ============================================================
  ipcMain.handle('select-logo', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Seleccionar Logo de la Aplicación',
      filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile']
    })
    if (canceled || !filePaths.length) return { canceled: true }
    const filePath = filePaths[0]
    const ext = path.extname(filePath).slice(1).toLowerCase()
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', png: 'image/png' }
    const mime = mimeMap[ext] || 'image/png'
    const data = await fs.promises.readFile(filePath)
    return { success: true, data: `data:${mime};base64,${data.toString('base64')}` }
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

  ipcMain.handle('print-silent', (event, pdfFileUrl, config = {}) => {
    const { printer = '', copies = 1, landscape = false, pageSize = 'Letter' } = config
    console.log('print-silent (SumatraPDF):', { printer, copies, landscape, pageSize })

    const VIRTUAL_PRINTERS = [
      'microsoft print to pdf',
      'microsoft xps document writer',
      'onenote',
      'fax'
    ]
    const isVirtual = VIRTUAL_PRINTERS.some((v) => printer.toLowerCase().includes(v))

    return new Promise((resolve, reject) => {
      let pdfPath
      try {
        pdfPath = fileURLToPath(pdfFileUrl)
      } catch {
        pdfPath = decodeURIComponent(pdfFileUrl.replace(/^file:\/\/\//, '')).replace(/\//g, '\\')
      }

      let sumatraPath
      try {
        sumatraPath = getSumatraPath()
      } catch (e) {
        return reject('SumatraPDF no encontrado: ' + e.message)
      }

      // Configuración de impresión: tamaño, orientación, copias
      const settings = [
        `paper=${pageSize.toLowerCase()}`,
        landscape ? 'landscape' : 'portrait',
        `copies=${Math.max(1, parseInt(copies) || 1)}`
      ].join(',')

      const args = [
        printer ? `-print-to` : `-print-to-default`,
        ...(printer ? [printer] : []),
        `-print-settings`,
        settings,
        `-silent`,
        pdfPath
      ]

      execFile(sumatraPath, args, { timeout: 60000 }, (error, stdout, stderr) => {
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
            reject('La impresora no respondió a tiempo.')
          } else if (exitCode === 1 && !errText && isVirtual) {
            // Impresora virtual (PDF, XPS, OneNote): código 1 puede ser cancelación del diálogo
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
      const filePath = fileURLToPath(fileUrl)
      await fs.promises.unlink(filePath)
      console.log('Temp PDF eliminado:', filePath)
    } catch (e) {
      // El archivo puede no existir si ya fue borrado — no es error
    }
  })
}
