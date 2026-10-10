import fs from 'fs'
import { generarRecibosPdf } from '../pdf/recibos/reciboPdfGenerator.js'
import { generarComprobantePagoPdf } from '../pdf/recibos/comprobantePagoPdfGenerator.js'
import { generarReporteGeneralPdf } from '../pdf/reportes/reporteGeneralPdfGenerator.js'
import { generarReporteFinancieroPdf } from '../pdf/reportes/reporteFinancieroPdfGenerator.js'
import { generarReporteLecturasMetricasPdf } from '../pdf/reportes/reporteLecturasMetricasPdfGenerator.js'
import { generarReporteLecturasPdf } from '../pdf/reportes/reporteLecturasPdfGenerator.js'
import { generarReporteDeudoresMayoresPdf } from '../pdf/reportes/reporteDeudoresMayoresPdfGenerator.js'
import { getPrintDataPath, writeTempPdf, toFileUrl } from './printTempFiles.js'

// ⚡ VÍA ULTRA-RÁPIDA (pdfmake): generación nativa directa en Node.js (<1.5s y <1MB).
// Cada entrada asocia rutas de impresión del renderer con su generador en src/main/pdf/.
// Los textos solo se usan en los logs.
const REPORTES_NATIVOS = [
  {
    rutas: ['reportegeneral'],
    titulo: 'Reporte General Ejecutivo',
    etiqueta: 'Reporte General',
    etiquetaError: 'Reporte General',
    generar: (data, { options }) => generarReporteGeneralPdf(data, { customLogo: options.customLogo })
  },
  {
    rutas: ['reportefinancieropagos', 'reportefinanciero'],
    titulo: 'Reporte Financiero de Pagos',
    etiqueta: 'Reporte Financiero',
    etiquetaError: 'Reporte Financiero',
    generar: (data, { options }) => generarReporteFinancieroPdf(data, { customLogo: options.customLogo })
  },
  {
    rutas: ['reportelecturasmetricas'],
    titulo: 'Reporte de Métricas de Lecturas',
    etiqueta: 'Reporte de Métricas de Lecturas',
    etiquetaError: 'Reporte de Métricas de Lecturas',
    generar: (data, { options }) =>
      generarReporteLecturasMetricasPdf(data, { customLogo: options.customLogo })
  },
  {
    rutas: ['reportelecturas'],
    titulo: 'Formato de Toma de Lecturas',
    etiqueta: 'Reporte de Toma de Lecturas',
    etiquetaError: 'Reporte de Lecturas',
    generar: (data, { params, options }) =>
      generarReporteLecturasPdf(data, {
        mes: params.get('mes') || '',
        ordenarPor: params.get('ordenarPor') || 'numero_predio',
        customLogo: options.customLogo
      })
  },
  {
    rutas: ['reportedeudoresmayores'],
    titulo: 'Reporte de Mayores Deudores',
    etiqueta: 'Reporte de Mayores Deudores',
    etiquetaError: 'Reporte de Deudores Mayores',
    generar: (data, { params, options }) =>
      generarReporteDeudoresMayoresPdf(data, {
        orden: params.get('orden') || params.get('ordenarPor') || '',
        customLogo: options.customLogo
      })
  },
  {
    rutas: ['comprobante-pago', 'comprobantepago'],
    titulo: 'Comprobante de Pago',
    etiqueta: 'Comprobante de Pago',
    etiquetaError: 'Comprobante de Pago',
    generar: (data, { options }) => generarComprobantePagoPdf(data, { customLogo: options.customLogo })
  }
]

export const esRutaRecibo = (route) => route === 'recibo' || route === 'recibo_oficial'

// Recibos: solo vía pdfmake. Si no hay datos o falla, lanza el error (sin fallback web).
// NOTA: la generación antigua por renderizado web en Chromium (Recibo.jsx / Recibo_Oficial.jsx)
// queda desactivada para evitar consumo de memoria y demoras de >20s.
export const generarRecibosNativo = async ({ event, url, params, dataKey, options }) => {
  try {
    if (dataKey) {
      const tempPath = getPrintDataPath(dataKey)
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
            equivalencia: options.equivalencia,
            onProgreso: (progreso) => {
              try {
                if (event.sender && !event.sender.isDestroyed()) {
                  event.sender.send('impresion:progreso-real', progreso)
                }
              } catch (e) {}
            }
          })

          const pdfPath = await writeTempPdf(url, pdfBuffer)
          // Limpieza del archivo temporal JSON de datos para no acumular archivos en disco
          fs.promises.unlink(tempPath).catch(() => {})

          console.log(
            `✅ [pdfmake] PDF generado en: ${pdfPath} (${(pdfBuffer.length / 1024).toFixed(0)} KB)`
          )
          return { success: true, path: toFileUrl(pdfPath) }
        }
      }
    }
    throw new Error('No se encontraron datos de recibos en la clave temporal.')
  } catch (pdfMakeErr) {
    console.error('❌ Error en generador nativo pdfmake:', pdfMakeErr)
    throw pdfMakeErr
  }
}

// Reportes con generador nativo. Devuelve { success, path } o null si la ruta no tiene
// generador, no hay datos o el generador falla (en ese caso se continúa con el pipeline web).
export const generarReporteNativo = async ({ route, url, params, dataKey, options }) => {
  const reporte = REPORTES_NATIVOS.find((r) => r.rutas.includes(route))
  if (!reporte) return null

  try {
    if (dataKey) {
      const tempPath = getPrintDataPath(dataKey)
      if (fs.existsSync(tempPath)) {
        const rawData = await fs.promises.readFile(tempPath, 'utf8')
        const reporteData = JSON.parse(rawData)
        if (reporteData) {
          console.log(`⚡ [pdfmake] Generando ${reporte.titulo} con pdfmake...`)
          const pdfBuffer = await reporte.generar(reporteData, { params, options })
          const pdfPath = await writeTempPdf(url, pdfBuffer)
          console.log(
            `✅ [pdfmake] ${reporte.etiqueta} PDF generado en: ${pdfPath} (${(pdfBuffer.length / 1024).toFixed(0)} KB)`
          )
          return { success: true, path: toFileUrl(pdfPath) }
        }
      }
    }
  } catch (pdfMakeErr) {
    console.error(
      `❌ Error en generador nativo pdfmake para ${reporte.etiquetaError}, usando fallback web:`,
      pdfMakeErr
    )
    // Permite continuar al pipeline de BrowserWindow si ocurre algún fallo
  }
  return null
}
