import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pdfmake from 'pdfmake'
import { getEffectiveLogoBase64 } from '../managers/logoManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- RESOLUCIÓN SEGURA DE FUENTES ---
function resolveRobotoFonts() {
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(process.cwd(), 'AguaVP', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(__dirname, '../..', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(__dirname, '../../..', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', 'pdfmake', 'fonts', 'Roboto')
  ]

  try {
    const electron = globalThis.require ? globalThis.require('electron') : null
    if (electron?.app?.getAppPath) {
      candidates.unshift(path.join(electron.app.getAppPath(), 'node_modules', 'pdfmake', 'fonts', 'Roboto'))
    }
  } catch (e) {}

  for (const p of candidates) {
    if (p && fs.existsSync(path.join(p, 'Roboto-Regular.ttf'))) {
      return p
    }
  }
  return null
}

function resolveCustomFontsDir() {
  const candidates = [
    path.join(__dirname, 'fonts'),
    path.join(process.cwd(), 'src', 'main', 'pdf', 'fonts'),
    path.join(process.cwd(), 'AguaVP', 'src', 'main', 'pdf', 'fonts'),
    path.join(__dirname, '..', 'fonts'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'src', 'main', 'pdf', 'fonts'),
    'C:/Windows/Fonts'
  ]

  for (const p of candidates) {
    if (p && fs.existsSync(path.join(p, 'segoeui.ttf'))) {
      return p
    }
  }
  return null
}

let fontsConfigured = false
function ensureFonts() {
  if (fontsConfigured) return
  const robotoDir = resolveRobotoFonts()
  const customFontsDir = resolveCustomFontsDir()

  const robotoNormal = robotoDir ? path.join(robotoDir, 'Roboto-Regular.ttf') : ''
  const robotoBold = robotoDir ? path.join(robotoDir, 'Roboto-Medium.ttf') : ''
  const robotoItalic = robotoDir ? path.join(robotoDir, 'Roboto-Italic.ttf') : ''
  const robotoBoldItalic = robotoDir ? path.join(robotoDir, 'Roboto-MediumItalic.ttf') : ''

  const getCustomFont = (filename, fallback) => {
    if (customFontsDir) {
      const p = path.join(customFontsDir, filename)
      if (fs.existsSync(p)) return p
    }
    return fallback
  }

  const fonts = {
    SegoeUI: {
      normal: getCustomFont('segoeui.ttf', robotoNormal),
      bold: getCustomFont('segoeuib.ttf', robotoBold),
      italics: getCustomFont('segoeuii.ttf', robotoItalic),
      bolditalics: getCustomFont('segoeuiz.ttf', robotoBoldItalic)
    },
    Roboto: {
      normal: robotoNormal,
      bold: robotoBold,
      italics: robotoItalic,
      bolditalics: robotoBoldItalic
    }
  }

  try {
    pdfmake.addFonts(fonts)
  } catch (err) {
    console.warn('Advertencia al configurar fuentes en pdfmake:', err.message)
  }

  if (typeof pdfmake.setUrlAccessPolicy === 'function') {
    pdfmake.setUrlAccessPolicy(() => true)
  }
  if (typeof pdfmake.setLocalAccessPolicy === 'function') {
    pdfmake.setLocalAccessPolicy(() => true)
  }
  fontsConfigured = true
}

// --- FORMATEADORES ---
const fmt = (n, dec = 0) =>
  Number(n || 0).toLocaleString('es-MX', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  })

const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0))

const percent = (value) => `${Number(value || 0).toFixed(1)}%`

const shortMonth = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || ''
  const [anio, mes] = periodoMes.split('-')
  const fecha = new Date(Number(anio), Number(mes) - 1, 1)
  return fecha.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '').toUpperCase()
}

const formatMonthYearLong = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || '-'
  const [anio, mes] = periodoMes.split('-')
  const fecha = new Date(Number(anio), Number(mes) - 1, 1)
  const label = fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// --- COLORES INSTITUCIONALES SOBRIOS ---
const THEME = {
  headerBg: '#1e3a8a',       // Azul Marino Institucional
  headerDarkBg: '#0f172a',   // Pizarra oscuro
  tableHeaderBg: '#1e293b',  // Encabezado de tabla pizarra
  tableHeaderSub: '#334155', // Subencabezado tabla
  border: '#cbd5e1',         // Borde suave profesional
  borderLight: '#e2e8f0',    // Borde muy tenue
  cardBg: '#ffffff',         // Fondo de tarjeta blanco puro
  cardBgAlt: '#f8fafc',      // Fondo alterno gris neutro tenue
  textDark: '#0f172a',       // Texto principal pizarra profunda
  textMuted: '#475569',      // Texto secundario pizarra medio
  textLight: '#64748b',      // Texto terciario gris
  // Colores reservados estrictamente para métricas y gráficas
  chartBlue: '#2563eb',      // Facturación emitida
  chartGreen: '#059669',     // Recaudación corriente
  chartTeal: '#0d9488',      // Caja real / flujo efectivo
  chartRed: '#dc2626'        // Saldo pendiente / mora
}

// ══════════════════════════════════════════════════════════════════════
// GENERADORES VECTORIALES SVG PARA PDFMAKE
// ══════════════════════════════════════════════════════════════════════

// 1. Gráfica Comparativa General Financiera (Facturación vs. Recaudación vs. Saldo Pendiente)
function generarSvgFinancieroPdf(recaudacionMensual, ancho = 556, alto = 150) {
  if (!recaudacionMensual || recaudacionMensual.length === 0) {
    return `<svg width="${ancho}" height="40" viewBox="0 0 ${ancho} 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="40" fill="#f8fafc" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${ancho / 2}" y="24" font-family="Roboto" font-size="9" fill="${THEME.textLight}" text-anchor="middle">Sin serie histórica mensual para este período</text>
    </svg>`
  }

  const chartTop = 16
  const chartBottom = alto - 30
  const chartHeight = chartBottom - chartTop
  const left = 50
  const right = 20
  const plotWidth = ancho - left - right
  const groupWidth = plotWidth / recaudacionMensual.length
  const barWidth = Math.max(5, Math.min(14, groupWidth / 3.8))

  const maxFinanciero = recaudacionMensual.reduce((acc, row) => {
    const e = Number(row.esperado || 0)
    const r = Number(row.recaudado || 0)
    const p = Number(row.pendiente || 0)
    return Math.max(acc, e, r, p)
  }, 0)
  const base = maxFinanciero > 0 ? maxFinanciero : 1

  let gridSvg = ''
  for (let step = 0; step <= 4; step++) {
    const y = chartBottom - (step / 4) * chartHeight
    const axisValue = (base * step) / 4
    gridSvg += `
      <line x1="${left}" y1="${y}" x2="${ancho - right}" y2="${y}" stroke="${THEME.borderLight}" stroke-dasharray="2,2" stroke-width="0.8" />
      <text x="${left - 6}" y="${y + 3}" text-anchor="end" font-family="Roboto" font-size="6.5" fill="${THEME.textMuted}" font-weight="bold">
        $${axisValue.toLocaleString('es-MX', { notation: 'compact', maximumFractionDigits: 1 })}
      </text>
    `
  }

  let barsSvg = ''
  const monthY = chartBottom + 16
  recaudacionMensual.forEach((row, idx) => {
    const esperado = Number(row.esperado || 0)
    const recaudado = Number(row.recaudado || 0)
    const pendiente = Number(row.pendiente || 0)
    const x = left + idx * groupWidth + groupWidth / 2

    const hEsp = (esperado / base) * chartHeight
    const hRec = (recaudado / base) * chartHeight
    const hPen = (pendiente / base) * chartHeight

    barsSvg += `
      <rect x="${x - barWidth * 1.7}" y="${chartBottom - hEsp}" width="${barWidth}" height="${hEsp}" fill="${THEME.chartBlue}" rx="1.5" />
      <rect x="${x - barWidth * 0.5}" y="${chartBottom - hRec}" width="${barWidth}" height="${hRec}" fill="${THEME.chartGreen}" rx="1.5" />
      <rect x="${x + barWidth * 0.7}" y="${chartBottom - hPen}" width="${barWidth}" height="${hPen}" fill="${THEME.chartRed}" rx="1.5" />
      <text x="${x}" y="${monthY}" text-anchor="middle" font-family="Roboto" font-size="7" fill="${THEME.textDark}" font-weight="bold">
        ${shortMonth(row.periodo)}
      </text>
    `
  })

  return `
    <svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="${alto}" fill="#ffffff" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      ${gridSvg}
      ${barsSvg}
    </svg>
  `
}

// 2. Subgráfica Individual por Componente (Óptima para impresión Blanco y Negro / Fotocopias)
function generarSvgMetricaIndividualPdf(recaudacionMensual, campo, titulo, colorBarra, ancho = 556, alto = 90) {
  if (!recaudacionMensual || recaudacionMensual.length === 0) {
    return `<svg width="${ancho}" height="35" viewBox="0 0 ${ancho} 35" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="35" fill="#f8fafc" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${ancho / 2}" y="20" font-family="Roboto" font-size="7" fill="${THEME.textLight}" text-anchor="middle">Sin datos</text>
    </svg>`
  }

  const maxVal = Math.max(...recaudacionMensual.map((r) => Number(r[campo] || 0)), 1)
  const totalVal = recaudacionMensual.reduce((acc, r) => acc + Number(r[campo] || 0), 0)

  const chartTop = 27
  const chartBottom = 70
  const chartHeight = chartBottom - chartTop
  const left = 50
  const right = 20
  const plotWidth = ancho - left - right
  const groupWidth = plotWidth / recaudacionMensual.length
  const barWidth = Math.max(10, Math.min(22, groupWidth / 2.2))

  const maxValK = Math.floor((maxVal / 1000) * 10) / 10
  const maxValStr = maxVal >= 1000000
    ? `$${(Math.floor((maxVal / 1000000) * 10) / 10).toFixed(1)}M`
    : maxVal >= 1000
      ? `$${maxValK.toFixed(1)}k`
      : `$${Math.floor(maxVal)}`
  const midVal = maxVal / 2
  const midValK = Math.floor((midVal / 1000) * 10) / 10
  const midValStr = midVal >= 1000000
    ? `$${(Math.floor((midVal / 1000000) * 10) / 10).toFixed(1)}M`
    : midVal >= 1000
      ? `$${midValK.toFixed(1)}k`
      : `$${Math.floor(midVal)}`

  let barsSvg = ''
  recaudacionMensual.forEach((row, idx) => {
    const val = Number(row[campo] || 0)
    const x = left + idx * groupWidth + groupWidth / 2
    const h = (val / maxVal) * chartHeight

    const esp = Number(row.esperado || 0)
    const rec = Number(row.recaudado || 0)
    const pen = Number(row.pendiente || 0)
    const espK = Math.floor((esp / 1000) * 10) / 10
    const recK = Math.floor((rec / 1000) * 10) / 10
    const penK = Math.max(0, Math.round((espK - recK) * 10) / 10)

    let valLabel = '$0'
    if (campo === 'esperado') {
      valLabel = esp >= 1000000
        ? `$${(Math.floor((esp / 1000000) * 10) / 10).toFixed(1)}M`
        : esp >= 1000
          ? `$${espK.toFixed(1)}k`
          : `$${Math.floor(esp)}`
    } else if (campo === 'recaudado') {
      valLabel = rec >= 1000000
        ? `$${(Math.floor((rec / 1000000) * 10) / 10).toFixed(1)}M`
        : rec >= 1000
          ? `$${recK.toFixed(1)}k`
          : `$${Math.floor(rec)}`
    } else {
      valLabel = pen >= 1000000
        ? `$${(Math.floor((pen / 1000000) * 10) / 10).toFixed(1)}M`
        : esp >= 1000
          ? `$${penK.toFixed(1)}k`
          : pen >= 1000
            ? `$${(Math.floor((pen / 1000) * 10) / 10).toFixed(1)}k`
            : `$${Math.floor(pen)}`
    }

    barsSvg += `
      <rect x="${x - barWidth / 2}" y="${chartBottom - h}" width="${barWidth}" height="${Math.max(1.5, h)}" fill="${colorBarra}" rx="1.5" stroke="#0f172a" stroke-width="0.7" />
      <text x="${x}" y="${chartBottom - h - 3}" text-anchor="middle" font-family="Roboto" font-size="6" font-weight="bold" fill="${THEME.textDark}">
        ${valLabel}
      </text>
      <text x="${x}" y="82" text-anchor="middle" font-family="Roboto" font-size="6.5" font-weight="bold" fill="${THEME.textDark}">
        ${shortMonth(row.periodo)}
      </text>
    `
  })

  return `
    <svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="${alto}" fill="#ffffff" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${left}" y="14" font-family="Roboto" font-size="7" font-weight="bold" fill="${THEME.textDark}">${titulo.toUpperCase()}</text>
      <text x="${ancho - right}" y="14" text-anchor="end" font-family="Roboto" font-size="7.5" font-weight="bold" fill="${colorBarra}">${money(totalVal)}</text>
      <line x1="${left}" y1="${chartTop}" x2="${ancho - right}" y2="${chartTop}" stroke="${THEME.borderLight}" stroke-dasharray="2,2" stroke-width="0.7" />
      <text x="${left - 5}" y="${chartTop + 3}" text-anchor="end" font-family="Roboto" font-size="6" fill="${THEME.textMuted}" font-weight="bold">${maxValStr}</text>
      <line x1="${left}" y1="${chartBottom - chartHeight / 2}" x2="${ancho - right}" y2="${chartBottom - chartHeight / 2}" stroke="${THEME.borderLight}" stroke-dasharray="2,2" stroke-width="0.7" />
      <text x="${left - 5}" y="${chartBottom - chartHeight / 2 + 2.5}" text-anchor="end" font-family="Roboto" font-size="5.8" fill="${THEME.textMuted}" font-weight="bold">${midValStr}</text>
      <line x1="${left}" y1="${chartBottom}" x2="${ancho - right}" y2="${chartBottom}" stroke="${THEME.border}" stroke-width="0.8" />
      <text x="${left - 5}" y="${chartBottom + 2}" text-anchor="end" font-family="Roboto" font-size="6" fill="${THEME.textMuted}" font-weight="bold">$0</text>
      ${barsSvg}
    </svg>
  `
}

// 3. Gráfica de Recaudación por Mes de Pago (Caja Real - Flujo de Efectivo)
function generarSvgCajaRealPdf(recaudacionCaja, ancho = 556, alto = 105) {
  if (!recaudacionCaja || recaudacionCaja.length === 0) {
    return `<svg width="${ancho}" height="35" viewBox="0 0 ${ancho} 35" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="35" fill="#f8fafc" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${ancho / 2}" y="20" font-family="Roboto" font-size="7.5" fill="${THEME.textLight}" text-anchor="middle">Sin registros de caja real para el período</text>
    </svg>`
  }

  const maxCaja = Math.max(...recaudacionCaja.map((r) => Number(r.recaudado || 0)), 1)

  const chartTop = 18
  const chartBottom = 78
  const chartHeight = chartBottom - chartTop
  const left = 50
  const right = 20
  const plotWidth = ancho - left - right
  const groupWidth = plotWidth / recaudacionCaja.length
  const barWidth = Math.max(10, Math.min(22, groupWidth / 2.2))

  let gridSvg = ''
  for (let step = 0; step <= 4; step++) {
    const y = chartBottom - (step / 4) * chartHeight
    const axisVal = (maxCaja * step) / 4
    const axisValK = Math.floor((axisVal / 1000) * 10) / 10
    const axisLabel = axisVal >= 1000000
      ? `$${(Math.floor((axisVal / 1000000) * 10) / 10).toFixed(1)}M`
      : axisVal >= 1000
        ? `$${axisValK.toFixed(1)}k`
        : `$${Math.floor(axisVal)}`

    gridSvg += `
      <line x1="${left}" y1="${y}" x2="${ancho - right}" y2="${y}" stroke="${THEME.borderLight}" stroke-dasharray="2,2" stroke-width="0.7" />
      <text x="${left - 6}" y="${y + 3}" text-anchor="end" font-family="Roboto" font-size="6.5" fill="${THEME.textMuted}" font-weight="bold">${axisLabel}</text>
    `
  }

  let barsSvg = ''
  recaudacionCaja.forEach((row, idx) => {
    const val = Number(row.recaudado || 0)
    const x = left + idx * groupWidth + groupWidth / 2
    const h = (val / maxCaja) * chartHeight
    const valK = Math.floor((val / 1000) * 10) / 10
    const valStr = val >= 1000000
      ? `$${(Math.floor((val / 1000000) * 10) / 10).toFixed(1)}M`
      : val >= 1000
        ? `$${valK.toFixed(1)}k`
        : `$${Math.floor(val)}`

    barsSvg += `
      <rect x="${x - barWidth / 2}" y="${chartBottom - h}" width="${barWidth}" height="${Math.max(1.5, h)}" fill="${THEME.chartTeal}" rx="2" stroke="#0f172a" stroke-width="0.7" />
      <text x="${x}" y="${chartBottom - h - 3}" text-anchor="middle" font-family="Roboto" font-size="6.5" font-weight="bold" fill="${THEME.textDark}">
        ${valStr}
      </text>
      <text x="${x}" y="94" text-anchor="middle" font-family="Roboto" font-size="7" font-weight="bold" fill="${THEME.textDark}">
        ${shortMonth(row.periodo)}
      </text>
    `
  })

  return `
    <svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="${alto}" fill="#ffffff" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      ${gridSvg}
      ${barsSvg}
    </svg>
  `
}

// ══════════════════════════════════════════════════════════════════════
// GENERADOR PRINCIPAL DEL REPORTE FINANCIERO CON PDFMAKE
// ══════════════════════════════════════════════════════════════════════
export async function generarReporteFinancieroPdf(reporteData, options = {}) {
  ensureFonts()

  const resumen = reporteData?.resumen || reporteData?.financiero?.resumen || {}
  const filtro = reporteData?.filtro_aplicado || {}
  const series = reporteData?.series || reporteData?.financiero?.series || {}

  const recaudacionMensual = series.recaudacion_mensual || []
  const recaudacionCaja = series.recaudacion_por_mes_pago || []
  const metodosPago = series.metodos_pago || []

  const totalFacturado = Number(resumen.total_esperado || 0)
  const totalRecaudado = Number(resumen.total_recaudado || 0)
  const saldoPendiente = Number(resumen.por_cobrar_estimado || 0)
  const carteraVencida = Number(resumen.deuda_total_rango || 0)
  const eficienciaCobranza = Number(resumen.eficiencia_recaudo_porcentaje || 0)
  const totalFacturas = Number(resumen.total_facturas || 0)
  const facturasPagadas = Number(resumen.facturas_pagadas || 0)

  const totalRecaudadoCaja =
    Number(resumen.total_recaudado_caja || 0) ||
    recaudacionCaja.reduce((acc, row) => acc + Number(row.recaudado || 0), 0)

  const totalTransaccionesCaja = recaudacionCaja.reduce(
    (acc, row) => acc + Number(row.transacciones || 0),
    0
  )

  const totalMetodosPago = metodosPago.reduce((acc, row) => acc + Number(row.total || 0), 0)
  const totalOperacionesMetodos = metodosPago.reduce(
    (acc, row) => acc + Number(row.cantidad || row.transacciones || 0),
    0
  )

  // Metadatos de fechas
  const periodoPrincipal = filtro.periodo
    ? formatMonthYearLong(filtro.periodo)
    : filtro.periodo_mes
      ? formatMonthYearLong(filtro.periodo_mes)
      : filtro.anio
        ? `Ejercicio Fiscal ${filtro.anio}`
        : filtro.meses
          ? `Rango de Últimos ${filtro.meses} Meses`
          : filtro.etiqueta || 'Período Ordinario'

  const rangoFiltro = (() => {
    const inicio = filtro.inicio_periodo || filtro.fecha_inicio
    const fin = filtro.fin_periodo || filtro.fecha_fin
    if (inicio && fin && inicio !== fin) {
      return `${formatMonthYearLong(inicio)} a ${formatMonthYearLong(fin)}`
    }
    if (inicio) return formatMonthYearLong(inicio)
    if (fin) return formatMonthYearLong(fin)
    return 'Consolidado Integral'
  })()

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const fechaHoyLarga = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1)
  const fechaHoyCorta = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const horaHoy = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const logoBase64 = getEffectiveLogoBase64(options.customLogo)

  // Ancho útil para página Carta con márgenes de 28pt: 612 - 56 = 556pt
  const ANCHO_UTIL = 556

  const content = []

  // 1. ENCABEZADO INSTITUCIONAL
  const logoCell = logoBase64
    ? { image: logoBase64, fit: [54, 54], alignment: 'center' }
    : { text: 'AGUA VP', bold: true, fontSize: 13, color: '#ffffff', alignment: 'center' }

  content.push({
    table: {
      widths: [64, '*', 80],
      body: [
        [
          logoCell,
          {
            stack: [
              {
                text: 'COMISIÓN MUNICIPAL DE AGUA POTABLE Y ALCANTARILLADO',
                bold: true,
                fontSize: 16,
                color: '#ffffff',
                letterSpacing: 0.3
              },
              {
                text: 'VILLA PESQUEIRA, SONORA — ESTADO FINANCIERO Y RECAUDACIÓN',
                fontSize: 11,
                color: '#dbeafe',
                margin: [0, 2, 0, 0],
                letterSpacing: 0.2
              }
            ],
            margin: [4, 4, 0, 4]
          },
          {
            fillColor: '#1e40af',
            stack: [
              { text: 'PERÍODOS', fontSize: 6.5, color: '#bfdbfe', alignment: 'center', bold: true },
              { text: String(recaudacionMensual.length), fontSize: 20, color: '#ffffff', alignment: 'center', bold: true, margin: [0, 1, 0, 0] }
            ],
            margin: [0, 4, 0, 4]
          }
        ]
      ]
    },
    layout: {
      fillColor: () => THEME.headerBg,
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 8,
      paddingBottom: () => 8
    },
    margin: [0, 0, 0, 0]
  })

  // 2. CINTILLO DE METADATOS Y FILTROS
  const colFiltro = [
    { text: [{ text: 'FILTRO APLICADO\n', fontSize: 6.5, color: THEME.textLight, bold: true }, { text: (filtro.etiqueta || 'Consolidado General').toUpperCase(), bold: true, fontSize: 8, color: THEME.textDark }] },
    { text: [{ text: 'PERÍODO PRINCIPAL\n', fontSize: 6.5, color: THEME.textLight, bold: true }, { text: periodoPrincipal, bold: true, fontSize: 8, color: THEME.headerBg }] }
  ]
  if (rangoFiltro !== 'Consolidado Integral') {
    colFiltro.push({ text: [{ text: 'RANGO DE COBERTURA\n', fontSize: 6.5, color: THEME.textLight, bold: true }, { text: rangoFiltro, bold: true, fontSize: 8, color: THEME.textMuted }] })
  }
  colFiltro.push({ text: [{ text: 'EXPEDICIÓN\n', fontSize: 6.5, color: THEME.textLight, bold: true }, { text: fechaHoyLarga, bold: true, fontSize: 8, color: THEME.textMuted }], alignment: 'right' })

  content.push({
    table: {
      widths: Array(colFiltro.length).fill('*'),
      body: [colFiltro]
    },
    layout: {
      fillColor: () => THEME.cardBgAlt,
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => THEME.border,
      vLineColor: () => THEME.border,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 5,
      paddingBottom: () => 5
    },
    margin: [0, 0, 0, 10]
  })

  // 3. 5 TARJETAS DE KPIS FINANCIEROS EJECUTIVOS (Limpias, bordes sobrios, sin gradientes)
  content.push({
    table: {
      widths: ['20%', '20%', '20%', '20%', '20%'],
      body: [
        [
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'FACTURACIÓN EMITIDA', bold: true, fontSize: 6.5, color: THEME.textMuted },
              { text: money(totalFacturado), bold: true, fontSize: 10.5, color: THEME.textDark, margin: [0, 2, 0, 0] },
              { text: `${fmt(totalFacturas)} recibos`, fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'RECAUDACIÓN CORRIENTE', bold: true, fontSize: 6.5, color: THEME.chartGreen },
              { text: money(totalRecaudado), bold: true, fontSize: 10.5, color: THEME.chartGreen, margin: [0, 2, 0, 0] },
              { text: `${fmt(facturasPagadas)} pagados`, fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'SALDO PENDIENTE', bold: true, fontSize: 6.5, color: THEME.chartRed },
              { text: money(saldoPendiente), bold: true, fontSize: 10.5, color: THEME.chartRed, margin: [0, 2, 0, 0] },
              { text: `${fmt(Math.max(0, totalFacturas - facturasPagadas))} por cobrar`, fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'CAJA REAL (EFECTIVO)', bold: true, fontSize: 6.5, color: THEME.chartTeal },
              { text: money(totalRecaudadoCaja), bold: true, fontSize: 10.5, color: THEME.chartTeal, margin: [0, 2, 0, 0] },
              { text: `${fmt(totalTransaccionesCaja)} cobros`, fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'EFICIENCIA DE COBRO', bold: true, fontSize: 6.5, color: THEME.headerBg },
              { text: percent(eficienciaCobranza), bold: true, fontSize: 10.5, color: THEME.textDark, margin: [0, 2, 0, 0] },
              { text: `${facturasPagadas} de ${totalFacturas}`, fontSize: 6, color: THEME.textLight }
            ]
          }
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      hLineColor: () => THEME.border,
      vLineColor: () => THEME.border,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5
    },
    margin: [0, 0, 0, 10]
  })

  // 4. SECCIÓN DE ANÁLISIS DE GRÁFICAS
  // A. Gráfica Comparativa General
  const svgFinanciero = generarSvgFinancieroPdf(recaudacionMensual, ANCHO_UTIL, 150)
  content.push({
    stack: [
      {
        columns: [
          { text: 'COMPORTAMIENTO MENSUAL DE FACTURACIÓN Y RECAUDACIÓN', bold: true, fontSize: 8.5, color: THEME.textDark },
          { text: `EFICIENCIA GLOBAL: ${percent(eficienciaCobranza)}`, bold: true, fontSize: 8, color: THEME.chartGreen, alignment: 'right' }
        ],
        margin: [0, 0, 0, 2]
      },
      { text: 'Comparativa consolidada entre facturación determinada, cobranza corriente del período y saldos pendientes.', fontSize: 7, color: THEME.textLight, margin: [0, 0, 0, 3] },
      { svg: svgFinanciero, width: ANCHO_UTIL, margin: [0, 0, 0, 2] },
      {
        columns: [
          { text: '■ Facturación Emitida (Determinada)', fontSize: 7, color: THEME.chartBlue },
          { text: '■ Recaudación Corriente del Período', fontSize: 7, color: THEME.chartGreen, alignment: 'center' },
          { text: '■ Saldo Pendiente por Recuperar', fontSize: 7, color: THEME.chartRed, alignment: 'right' }
        ],
        margin: [4, 0, 4, 8]
      }
    ]
  })

  // B. 3 Subgráficas Individuales por Componente (Óptimas para impresión B&W)
  if (recaudacionMensual.length > 0) {
    const svgSubEsp = generarSvgMetricaIndividualPdf(recaudacionMensual, 'esperado', '1. Facturación Emitida / Determinada (Cuotas y Consumos)', THEME.chartBlue, ANCHO_UTIL, 90)
    const svgSubRec = generarSvgMetricaIndividualPdf(recaudacionMensual, 'recaudado', '2. Recaudación Aplicada al Período (Cobranza Corriente)', THEME.chartGreen, ANCHO_UTIL, 90)
    const svgSubPen = generarSvgMetricaIndividualPdf(recaudacionMensual, 'pendiente', '3. Saldo Corriente Pendiente por Recuperar', THEME.chartRed, ANCHO_UTIL, 90)

    content.push({
      stack: [
        { text: 'DESGLOSE INDIVIDUAL POR COMPONENTE FINANCIERO ', bold: true, fontSize: 8, color: THEME.textDark, margin: [0, 0, 0, 2] },
        { text: 'Métricas analíticas a ancho completo para garantizar total legibilidad y separación de los 12 meses sin saturación ni recortes.', fontSize: 6.8, color: THEME.textLight, margin: [0, 0, 0, 3] },
        { svg: svgSubEsp, width: ANCHO_UTIL, margin: [0, 0, 0, 4] },
        { svg: svgSubRec, width: ANCHO_UTIL, margin: [0, 0, 0, 4] },
        { svg: svgSubPen, width: ANCHO_UTIL, margin: [0, 0, 0, 0] }
      ]
    })
  }

  // C. TABLA 1: DESGLOSE MENSUAL DE FACTURACIÓN Y RECAUDACIÓN
  if (recaudacionMensual.length > 0) {
    const finBody = [
      [
        { text: 'Período Emitido', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg },
        { text: 'Facturación Emitida', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: 'Recaudación Corriente', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: 'Saldo Pendiente', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: '% Eficiencia Cobro', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' }
      ]
    ]

    let sumEsp = 0
    let sumRec = 0
    let sumPen = 0

    recaudacionMensual.forEach((rm, idx) => {
      const esp = Number(rm.esperado || 0)
      const rec = Number(rm.recaudado || 0)
      const pen = Number(rm.pendiente || 0)
      const pct = esp > 0 ? (rec / esp) * 100 : 0
      sumEsp += esp
      sumRec += rec
      sumPen += pen
      const isEven = idx % 2 === 0
      finBody.push([
        { text: formatMonthYearLong(rm.periodo), bold: true, fontSize: 7, fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: money(esp), fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: money(rec), bold: true, fontSize: 7, color: THEME.chartGreen, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: money(pen), fontSize: 7, color: THEME.chartRed, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: percent(pct), bold: true, fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' }
      ])
    })

    // Fila total consolidado
    finBody.push([
      { text: 'TOTAL CONSOLIDADO', bold: true, fontSize: 7, fillColor: '#f1f5f9' },
      { text: money(sumEsp), bold: true, fontSize: 7, alignment: 'right', fillColor: '#f1f5f9' },
      { text: money(sumRec), bold: true, fontSize: 7, color: THEME.chartGreen, alignment: 'right', fillColor: '#f1f5f9' },
      { text: money(sumPen), bold: true, fontSize: 7, color: THEME.chartRed, alignment: 'right', fillColor: '#f1f5f9' },
      { text: percent(sumEsp > 0 ? (sumRec / sumEsp) * 100 : 0), bold: true, fontSize: 7, alignment: 'right', fillColor: '#f1f5f9' }
    ])

    content.push({
      pageBreak: 'before',
      stack: [
        { text: 'DESGLOSE MENSUAL DE FACTURACIÓN DETERMINADA Y RECAUDACIÓN APLICADA', bold: true, fontSize: 8, color: THEME.textDark, margin: [0, 0, 0, 3] },
        {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: ['*', 105, 105, 100, 75],
            body: finBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => THEME.borderLight,
            vLineColor: () => THEME.borderLight,
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 3,
            paddingBottom: () => 3
          }
        }
      ],
      margin: [0, 0, 0, 10]
    })
  }

  // D. GRÁFICA DE RECAUDACIÓN POR MES DE PAGO (CAJA REAL - FLUJO DE EFECTIVO) - DEBAJO DE DESGLOSE MENSUAL
  if (recaudacionCaja.length > 0) {
    const svgCajaReal = generarSvgCajaRealPdf(recaudacionCaja, ANCHO_UTIL, 105)
    content.push({
      stack: [
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: [
                    { text: 'RECAUDACIÓN POR MES DE PAGO ', bold: true, fontSize: 8, color: THEME.textDark },
                    { text: '[CAJA REAL · FLUJO EFECTIVO]', bold: true, fontSize: 7.5, color: THEME.chartTeal }
                  ]
                },
                {
                  text: 'Flujo de efectivo real percibido en ventanilla y cuentas bancarias según la fecha de cobro (incluye cobranza corriente y recuperación de rezagos históricos).',
                  fontSize: 6.8,
                  color: THEME.textLight,
                  margin: [0, 1, 0, 2]
                }
              ]
            },
            {
              width: 170,
              alignment: 'right',
              stack: [
                { text: [{ text: 'TOTAL EN CAJA: ', fontSize: 7, color: THEME.textLight }, { text: money(totalRecaudadoCaja), fontSize: 9.5, bold: true, color: THEME.chartTeal }] },
                { text: `${fmt(totalTransaccionesCaja)} cobros registrados`, fontSize: 6.5, color: THEME.textMuted }
              ]
            }
          ]
        },
        { svg: svgCajaReal, width: ANCHO_UTIL, margin: [0, 2, 0, 2] },
        {
          columns: [
            { text: '■ Recaudación Efectiva Ingresada en Ventanilla (Flujo de Efectivo)', fontSize: 7, color: THEME.chartTeal },
            { text: `Total Depositado en Caja: ${money(totalRecaudadoCaja)}`, fontSize: 7, bold: true, color: THEME.textDark, alignment: 'right' }
          ],
          margin: [4, 0, 4, 8]
        }
      ],
      margin: [0, 0, 0, 8]
    })
  }

  // E. TABLA 4: DETALLE DE CAJA REAL POR MES DE COBRO - DEBAJO DE LA GRÁFICA DE CAJA REAL
  if (recaudacionCaja.length > 0) {
    const cajaBody = [
      [
        { text: 'Mes de Operación (Fecha de Cobro)', bold: true, fontSize: 7, color: '#ffffff', fillColor: '#0d9488' },
        { text: 'Recibos Cobrados en Ventanilla', bold: true, fontSize: 7, color: '#ffffff', fillColor: '#0d9488', alignment: 'right' },
        { text: 'Flujo Percibido en Caja ($ MXN)', bold: true, fontSize: 7, color: '#ffffff', fillColor: '#0d9488', alignment: 'right' },
        { text: '% del Flujo Total', bold: true, fontSize: 7, color: '#ffffff', fillColor: '#0d9488', alignment: 'right' }
      ]
    ]

    recaudacionCaja.forEach((row, idx) => {
      const cobrado = Number(row.recaudado || 0)
      const pct = totalRecaudadoCaja > 0 ? (cobrado / totalRecaudadoCaja) * 100 : 0
      const isEven = idx % 2 === 0
      cajaBody.push([
        { text: formatMonthYearLong(row.periodo), bold: true, fontSize: 7, fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: fmt(row.transacciones || 0), fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: money(cobrado), bold: true, fontSize: 7, color: THEME.chartTeal, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: percent(pct), bold: true, fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' }
      ])
    })

    cajaBody.push([
      { text: 'TOTAL INGRESADO EN CAJA', bold: true, fontSize: 7, fillColor: '#f0fdfa' },
      { text: fmt(totalTransaccionesCaja), bold: true, fontSize: 7, alignment: 'right', fillColor: '#f0fdfa' },
      { text: money(totalRecaudadoCaja), bold: true, fontSize: 7, color: THEME.chartTeal, alignment: 'right', fillColor: '#f0fdfa' },
      { text: '100.0%', bold: true, fontSize: 7, alignment: 'right', fillColor: '#f0fdfa' }
    ])

    content.push({
      stack: [
        { text: 'DETALLE DE FLUJO EFECTIVO PERCIBIDO EN CAJA POR MES DE COBRO', bold: true, fontSize: 8, color: THEME.textDark, margin: [0, 0, 0, 3] },
        {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: ['*', 120, 130, 90],
            body: cajaBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => THEME.borderLight,
            vLineColor: () => THEME.borderLight,
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 3,
            paddingBottom: () => 3
          }
        }
      ],
      margin: [0, 0, 0, 10]
    })
  }

  // F. TABLA 2: BALANCE INTEGRAL DE DERECHOS, COBRANZA Y CARTERA DEUDORA
  content.push({
    pageBreak: 'before',
    stack: [
      { text: 'BALANCE INTEGRAL DE DERECHOS, COBRANZA Y CARTERA DEUDORA', bold: true, fontSize: 8, color: THEME.textDark, margin: [0, 0, 0, 3] },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: ['*', 130, 150],
          body: [
            [
              { text: 'Concepto Financiero y Contable', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg },
              { text: 'Cuentas / Recibos', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
              { text: 'Monto Consolidado ($ MXN)', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' }
            ],
            [
              { text: 'Facturación Total Determinada y Emitida (Ejercicio/Período)', bold: true, fontSize: 7 },
              { text: fmt(totalFacturas), fontSize: 7, alignment: 'right' },
              { text: money(totalFacturado), bold: true, fontSize: 7, alignment: 'right' }
            ],
            [
              { text: 'Recaudación Efectiva Aplicada a la Emisión Corriente', bold: true, fontSize: 7 },
              { text: fmt(facturasPagadas), fontSize: 7, alignment: 'right' },
              { text: money(totalRecaudado), bold: true, fontSize: 7, color: THEME.chartGreen, alignment: 'right' }
            ],
            [
              { text: 'Saldo Corriente Pendiente de Cobro (Rezago del Ejercicio)', bold: true, fontSize: 7 },
              { text: fmt(Math.max(0, totalFacturas - facturasPagadas)), fontSize: 7, alignment: 'right' },
              { text: money(saldoPendiente), bold: true, fontSize: 7, color: THEME.chartRed, alignment: 'right' }
            ],
            [
              { text: 'Cartera Vencida Histórica Acumulada (Rezagos Previos)', bold: true, fontSize: 7, fillColor: THEME.cardBgAlt },
              { text: 'Acumulado Histórico', fontSize: 7, color: THEME.textLight, alignment: 'right', fillColor: THEME.cardBgAlt },
              { text: money(carteraVencida), bold: true, fontSize: 7, color: THEME.textMuted, alignment: 'right', fillColor: THEME.cardBgAlt }
            ],
            [
              { text: 'ÍNDICE DE EFICIENCIA RECAUDATORIA (Cobranza / Emisión)', bold: true, fontSize: 7, color: THEME.textDark, fillColor: '#f1f5f9' },
              { text: `${facturasPagadas} / ${totalFacturas}`, bold: true, fontSize: 7, alignment: 'right', fillColor: '#f1f5f9' },
              { text: percent(eficienciaCobranza), bold: true, fontSize: 8.5, color: THEME.headerBg, alignment: 'right', fillColor: '#f1f5f9' }
            ],
            [
              { text: 'FLUJO TOTAL DE EFECTIVO PERCIBIDO EN CAJA (Ventanilla / Bancos)', bold: true, fontSize: 7, color: THEME.chartTeal, fillColor: '#f0fdfa' },
              { text: `${fmt(totalTransaccionesCaja)} cobros registrados`, bold: true, fontSize: 7, alignment: 'right', fillColor: '#f0fdfa' },
              { text: money(totalRecaudadoCaja), bold: true, fontSize: 8.5, color: THEME.chartTeal, alignment: 'right', fillColor: '#f0fdfa' }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => THEME.border,
          vLineColor: () => THEME.border,
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 3.5,
          paddingBottom: () => 3.5
        }
      }
    ],
    margin: [0, 0, 0, 10]
  })

  // G. TABLA 3: CLASIFICACIÓN DE INGRESOS POR MEDIO DE PAGO
  if (metodosPago.length > 0) {
    const mpBody = [
      [
        { text: 'Medio de Pago / Canal de Cobro', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg },
        { text: 'Operaciones', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: 'Total Percibido ($ MXN)', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: '% Participación', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' }
      ]
    ]

    metodosPago.forEach((mp, idx) => {
      const tot = Number(mp.total || 0)
      const pct = totalMetodosPago > 0 ? (tot / totalMetodosPago) * 100 : 0
      const isEven = idx % 2 === 0
      mpBody.push([
        { text: (mp.metodo || 'Sin clasificar').toUpperCase(), bold: true, fontSize: 7, fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: fmt(mp.cantidad || mp.transacciones || 0), fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: money(tot), bold: true, fontSize: 7, color: THEME.chartGreen, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: percent(pct), bold: true, fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' }
      ])
    })

    mpBody.push([
      { text: 'TOTAL INGRESOS CANALIZADOS', bold: true, fontSize: 7, fillColor: '#eff6ff' },
      { text: fmt(totalOperacionesMetodos), bold: true, fontSize: 7, alignment: 'right', fillColor: '#eff6ff' },
      { text: money(totalMetodosPago), bold: true, fontSize: 7, color: THEME.headerBg, alignment: 'right', fillColor: '#eff6ff' },
      { text: '100.0%', bold: true, fontSize: 7, alignment: 'right', fillColor: '#eff6ff' }
    ])

    content.push({
      stack: [
        { text: 'CLASIFICACIÓN DE INGRESOS POR MEDIO DE PAGO', bold: true, fontSize: 8, color: THEME.textDark, margin: [0, 0, 0, 3] },
        {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: ['*', 100, 130, 90],
            body: mpBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => THEME.borderLight,
            vLineColor: () => THEME.borderLight,
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 3,
            paddingBottom: () => 3
          }
        }
      ],
      margin: [0, 0, 0, 0]
    })
  }

  // Definición completa del documento pdfmake
  const docDefinition = {
    pageSize: 'LETTER',
    pageOrientation: 'portrait',
    pageMargins: [28, 28, 28, 34],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 8,
      color: THEME.textDark
    },
    footer: (currentPage, pageCount) => ({
      margin: [28, 8, 28, 0],
      stack: [
        {
          canvas: [
            { type: 'line', x1: 0, y1: 0, x2: ANCHO_UTIL, y2: 0, lineWidth: 0.5, lineColor: THEME.border }
          ]
        },
        {
          columns: [
            { text: `AGUA VILLA PESQUEIRA · Informe Financiero y Recaudación · Emisión: ${fechaHoyCorta} ${horaHoy}`, fontSize: 7, color: THEME.textLight, margin: [0, 4, 0, 0] },
            { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7.5, bold: true, color: THEME.headerBg, alignment: 'right', margin: [0, 4, 0, 0] }
          ]
        }
      ]
    }),
    content
  }

  const pdfDoc = pdfmake.createPdf(docDefinition)
  return await pdfDoc.getBuffer()
}

