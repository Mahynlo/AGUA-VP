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
  chartBlue: '#2563eb',      // Barras de consumo (m³)
  chartNavy: '#1e293b',      // Línea de tomas / recibos
  chartGreen: '#059669',     // Rutas completadas / avance positivo
  chartTeal: '#0d9488',      // Indicadores
  chartRed: '#dc2626',       // Reducción / rutas sin iniciar
  chartAmber: '#d97706'      // En progreso / pendientes
}

// ══════════════════════════════════════════════════════════════════════
// GENERADORES VECTORIALES SVG PARA PDFMAKE
// ══════════════════════════════════════════════════════════════════════

// 1. Gráfica de Tendencia de Consumo (Solo m³)
function generarSvgConsumoSoloPdf(consumoMensual, ancho = 556, alto = 105) {
  if (!consumoMensual || consumoMensual.length === 0) {
    return `<svg width="${ancho}" height="35" viewBox="0 0 ${ancho} 35" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="35" fill="#f8fafc" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${ancho / 2}" y="22" font-family="Roboto" font-size="8" fill="${THEME.textLight}" text-anchor="middle">Sin registros de consumo mensual para el período seleccionado</text>
    </svg>`
  }

  const chartTop = 16
  const chartBottom = alto - 20
  const chartHeight = chartBottom - chartTop
  const left = 46
  const right = 24
  const plotWidth = ancho - left - right
  const groupWidth = plotWidth / consumoMensual.length
  const barWidth = Math.max(8, Math.min(22, groupWidth / 2.3))

  const maxConsumo = consumoMensual.reduce((acc, r) => Math.max(acc, Number(r.consumo_total_m3 || 0)), 0)
  const baseConsumo = maxConsumo > 0 ? maxConsumo : 1

  let gridSvg = ''
  for (let step = 0; step <= 4; step++) {
    const y = chartBottom - (step / 4) * chartHeight
    const axisConsumo = (baseConsumo * step) / 4
    gridSvg += `
      <line x1="${left}" y1="${y}" x2="${ancho - right}" y2="${y}" stroke="${THEME.borderLight}" stroke-dasharray="2,2" stroke-width="0.8" />
      <text x="${left - 5}" y="${y + 3}" text-anchor="end" font-family="Roboto" font-size="6.5" fill="${THEME.textMuted}" font-weight="bold">
        ${axisConsumo.toLocaleString('es-MX', { notation: 'compact', maximumFractionDigits: 1 })}
      </text>
    `
  }

  let barsSvg = ''
  consumoMensual.forEach((row, idx) => {
    const x = left + idx * groupWidth + groupWidth / 2
    const consumoVal = Number(row.consumo_total_m3 || 0)
    const hCon = (consumoVal / baseConsumo) * (chartHeight - 8)
    const valLabel = consumoVal >= 1000 ? (consumoVal / 1000).toFixed(1) + 'k' : Math.round(consumoVal)
    const barTop = chartBottom - hCon

    barsSvg += `
      <rect x="${x - barWidth / 2}" y="${barTop}" width="${barWidth}" height="${Math.max(2, hCon)}" fill="${THEME.chartBlue}" rx="2" />
      <text x="${x}" y="${barTop - 3}" text-anchor="middle" font-family="Roboto" font-size="6" fill="${THEME.chartBlue}" font-weight="bold">
        ${valLabel}
      </text>
      <text x="${x}" y="${alto - 6}" text-anchor="middle" font-family="Roboto" font-size="7" fill="${THEME.textDark}" font-weight="bold">
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

// 2. Gráfica de Clientes y Tomas Facturadas por Mes
function generarSvgClientesRecibosPdf(consumoMensual, ancho = 556, alto = 95) {
  if (!consumoMensual || consumoMensual.length === 0) {
    return `<svg width="${ancho}" height="35" viewBox="0 0 ${ancho} 35" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="35" fill="#f8fafc" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${ancho / 2}" y="22" font-family="Roboto" font-size="8" fill="${THEME.textLight}" text-anchor="middle">Sin registros de clientes facturados para el período seleccionado</text>
    </svg>`
  }

  const chartTop = 16
  const chartBottom = alto - 20
  const chartHeight = chartBottom - chartTop
  const left = 46
  const right = 24
  const plotWidth = ancho - left - right
  const groupWidth = plotWidth / consumoMensual.length
  const barWidth = Math.max(8, Math.min(22, groupWidth / 2.3))

  const maxRecibos = consumoMensual.reduce((acc, r) => Math.max(acc, Number(r.recibos || 0)), 0)
  const baseRecibos = maxRecibos > 0 ? maxRecibos : 1

  let gridSvg = ''
  for (let step = 0; step <= 4; step++) {
    const y = chartBottom - (step / 4) * chartHeight
    const axisRecibos = (baseRecibos * step) / 4
    gridSvg += `
      <line x1="${left}" y1="${y}" x2="${ancho - right}" y2="${y}" stroke="${THEME.borderLight}" stroke-dasharray="2,2" stroke-width="0.8" />
      <text x="${left - 5}" y="${y + 3}" text-anchor="end" font-family="Roboto" font-size="6.5" fill="${THEME.textMuted}" font-weight="bold">
        ${Math.round(axisRecibos)}
      </text>
    `
  }

  let barsSvg = ''
  consumoMensual.forEach((row, idx) => {
    const x = left + idx * groupWidth + groupWidth / 2
    const recibos = Number(row.recibos || 0)
    const hRec = (recibos / baseRecibos) * (chartHeight - 8)
    const barTop = chartBottom - hRec

    barsSvg += `
      <rect x="${x - barWidth / 2}" y="${barTop}" width="${barWidth}" height="${Math.max(2, hRec)}" fill="#1e3a8a" rx="2" />
      <text x="${x}" y="${barTop - 3}" text-anchor="middle" font-family="Roboto" font-size="6.5" fill="#1e3a8a" font-weight="bold">
        ${fmt(recibos)}
      </text>
      <text x="${x}" y="${alto - 6}" text-anchor="middle" font-family="Roboto" font-size="7" fill="${THEME.textDark}" font-weight="bold">
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

// 2. Gráfica de Variación de Consumo Mes a Mes (Incremento o Disminución vs Mes Anterior)
function generarSvgVariacionConsumoPdf(consumoMensual, ancho = 556, alto = 100) {
  if (!consumoMensual || consumoMensual.length < 2) {
    return `<svg width="${ancho}" height="38" viewBox="0 0 ${ancho} 38" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="38" fill="#f8fafc" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${ancho / 2}" y="23" font-family="Roboto" font-size="8" fill="${THEME.textLight}" text-anchor="middle">Se requieren al menos dos períodos para calcular la variación intermensual</text>
    </svg>`
  }

  const deltas = []
  for (let i = 0; i < consumoMensual.length; i++) {
    const curr = Number(consumoMensual[i].consumo_total_m3 || 0)
    if (i === 0) {
      deltas.push({
        periodo: consumoMensual[i].periodo,
        diff: 0,
        pct: 0,
        isBase: true,
        consumo: curr
      })
    } else {
      const prev = Number(consumoMensual[i - 1].consumo_total_m3 || 0)
      const diff = curr - prev
      const pct = prev > 0 ? (diff / prev) * 100 : 0
      deltas.push({
        periodo: consumoMensual[i].periodo,
        diff,
        pct,
        isBase: false,
        consumo: curr
      })
    }
  }

  const maxAbsDiff = Math.max(...deltas.map((d) => Math.abs(d.diff)), 1)

  const chartTop = 16
  const chartBottom = alto - 20
  const chartHeight = chartBottom - chartTop
  const zeroY = chartTop + chartHeight / 2
  const availableHalf = chartHeight / 2 - 10
  const left = 46
  const right = 24
  const plotWidth = ancho - left - right
  const groupWidth = plotWidth / deltas.length
  const barWidth = Math.max(8, Math.min(22, groupWidth / 2.3))

  let gridSvg = `
    <line x1="${left}" y1="${chartTop}" x2="${ancho - right}" y2="${chartTop}" stroke="${THEME.borderLight}" stroke-dasharray="2,2" stroke-width="0.8" />
    <text x="${left - 5}" y="${chartTop + 3}" text-anchor="end" font-family="Roboto" font-size="6.5" fill="${THEME.textLight}" font-weight="bold">+${fmt(maxAbsDiff, 1)} m³</text>
    <line x1="${left}" y1="${zeroY}" x2="${ancho - right}" y2="${zeroY}" stroke="#94a3b8" stroke-width="1.2" />
    <text x="${left - 5}" y="${zeroY + 3}" text-anchor="end" font-family="Roboto" font-size="6.5" fill="${THEME.textDark}" font-weight="bold">0 m³</text>
    <line x1="${left}" y1="${chartBottom}" x2="${ancho - right}" y2="${chartBottom}" stroke="${THEME.borderLight}" stroke-dasharray="2,2" stroke-width="0.8" />
    <text x="${left - 5}" y="${chartBottom + 3}" text-anchor="end" font-family="Roboto" font-size="6.5" fill="${THEME.textLight}" font-weight="bold">-${fmt(maxAbsDiff, 1)} m³</text>
  `

  let barsSvg = ''
  deltas.forEach((d, idx) => {
    const x = left + idx * groupWidth + groupWidth / 2
    if (d.isBase) {
      barsSvg += `
        <circle cx="${x}" cy="${zeroY}" r="3" fill="#64748b" />
        <text x="${x}" y="${zeroY - 5}" text-anchor="middle" font-family="Roboto" font-size="6.5" fill="#64748b" font-weight="bold">Base</text>
      `
    } else if (d.diff >= 0) {
      const h = (d.diff / maxAbsDiff) * availableHalf
      const barTop = zeroY - h
      const pctStr = `+${d.pct.toFixed(1)}%`
      barsSvg += `
        <rect x="${x - barWidth / 2}" y="${barTop}" width="${barWidth}" height="${Math.max(2, h)}" fill="${THEME.chartBlue}" rx="2" />
        <text x="${x}" y="${barTop - 3}" text-anchor="middle" font-family="Roboto" font-size="6" fill="${THEME.chartBlue}" font-weight="bold">${pctStr}</text>
      `
    } else {
      const h = (Math.abs(d.diff) / maxAbsDiff) * availableHalf
      const barBottom = zeroY + h
      const pctStr = `${d.pct.toFixed(1)}%`
      barsSvg += `
        <rect x="${x - barWidth / 2}" y="${zeroY}" width="${barWidth}" height="${Math.max(2, h)}" fill="${THEME.chartRed}" rx="2" />
        <text x="${x}" y="${barBottom + 8}" text-anchor="middle" font-family="Roboto" font-size="6" fill="${THEME.chartRed}" font-weight="bold">${pctStr}</text>
      `
    }

    barsSvg += `
      <text x="${x}" y="${alto - 6}" text-anchor="middle" font-family="Roboto" font-size="7" fill="${THEME.textDark}" font-weight="bold">
        ${shortMonth(d.periodo)}
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

/**
 * Genera el buffer PDF del Reporte de Métricas de Lecturas usando pdfmake.
 * @param {Object} data - Paquete de datos estructurado
 * @param {Object} options - Opciones (customLogo, etc.)
 */
export async function generarReporteLecturasMetricasPdf(data, options = {}) {
  ensureFonts()

  const consumo = data?.consumo || {}
  const rutasData = data?.rutas || {}
  const filtro = data?.filtro_aplicado || {}
  const resumen = consumo?.resumen || {}
  const consumoMensual = consumo?.series?.consumo_mensual || []
  const distribucionRutas = consumo?.distribucion_rutas || []
  const menorConsumo = consumo?.listados?.menor_consumo || []
  const rutasResumen = rutasData?.resumen || {}

  const rangoFiltro = (() => {
    const inicio = filtro.inicio_periodo || filtro.fecha_inicio
    const fin = filtro.fin_periodo || filtro.fecha_fin
    if (inicio && fin && inicio !== fin) {
      return `${formatMonthYearLong(inicio)} a ${formatMonthYearLong(fin)}`
    }
    if (inicio) return formatMonthYearLong(inicio)
    if (fin) return formatMonthYearLong(fin)
    return 'Consolidado General'
  })()

  const periodoPrincipal = (() => {
    if (filtro.periodo) return formatMonthYearLong(filtro.periodo)
    if (filtro.anio) return `Ejercicio Fiscal ${filtro.anio}`
    if (filtro.meses) return `Últimos ${filtro.meses} Meses`
    return filtro.etiqueta || 'Período Ordinario'
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

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 1: ENCABEZADO INSTITUCIONAL, KPIS Y GRÁFICAS DE CONSUMO
  // ═══════════════════════════════════════════════════════════════════

  // 1. ENCABEZADO INSTITUCIONAL OFICIAL
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
                text: 'VILLA PESQUEIRA, SONORA — REPORTE DE MÉTRICAS DE LECTURAS',
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
              {
                text: String(consumoMensual.length || 1),
                fontSize: 20,
                color: '#ffffff',
                alignment: 'center',
                bold: true,
                margin: [0, 1, 0, 0]
              }
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
    {
      text: [
        { text: 'FILTRO APLICADO\n', fontSize: 6.5, color: THEME.textLight, bold: true },
        { text: (filtro.etiqueta || 'General').toUpperCase(), bold: true, fontSize: 8, color: THEME.textDark }
      ]
    },
    {
      text: [
        { text: 'PERÍODO PRINCIPAL\n', fontSize: 6.5, color: THEME.textLight, bold: true },
        { text: periodoPrincipal, bold: true, fontSize: 8, color: THEME.headerBg }
      ]
    }
  ]
  if (rangoFiltro !== 'Consolidado General') {
    colFiltro.push({
      text: [
        { text: 'RANGO DE COBERTURA\n', fontSize: 6.5, color: THEME.textLight, bold: true },
        { text: rangoFiltro, bold: true, fontSize: 8, color: THEME.textMuted }
      ]
    })
  }
  colFiltro.push({
    text: [
      { text: 'EXPEDICIÓN\n', fontSize: 6.5, color: THEME.textLight, bold: true },
      { text: fechaHoyLarga, bold: true, fontSize: 8, color: THEME.textMuted }
    ],
    alignment: 'right'
  })

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
    margin: [0, 0, 0, 8]
  })

  // 3. 5 TARJETAS DE KPIS OPERATIVOS Y DE CONSUMO
  content.push({
    table: {
      widths: ['20%', '20%', '20%', '20%', '20%'],
      body: [
        [
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'RECIBOS EMITIDOS', bold: true, fontSize: 6.5, color: THEME.textMuted },
              { text: fmt(resumen.total_recibos), bold: true, fontSize: 11, color: THEME.textDark, margin: [0, 2, 0, 0] },
              { text: 'Padrón activo facturado', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'AGUA CONSUMIDA', bold: true, fontSize: 6.5, color: THEME.chartBlue },
              { text: `${fmt(resumen.consumo_total_m3, 2)} m³`, bold: true, fontSize: 11, color: THEME.chartBlue, margin: [0, 2, 0, 0] },
              { text: 'Volumen total medido', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'PROMEDIO POR RECIBO', bold: true, fontSize: 6.5, color: THEME.chartGreen },
              { text: `${fmt(resumen.consumo_promedio_m3, 2)} m³`, bold: true, fontSize: 11, color: THEME.chartGreen, margin: [0, 2, 0, 0] },
              { text: 'Media mensual por toma', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'CLIENTES EN PADRÓN', bold: true, fontSize: 6.5, color: THEME.chartAmber },
              { text: fmt(resumen.total_clientes), bold: true, fontSize: 11, color: THEME.chartAmber, margin: [0, 2, 0, 0] },
              { text: 'Tomas registradas', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'PROMEDIO CLIENTE', bold: true, fontSize: 6.5, color: THEME.headerBg },
              { text: `${fmt(resumen.promedio_consumo_por_cliente_m3, 2)} m³`, bold: true, fontSize: 11, color: THEME.headerBg, margin: [0, 2, 0, 0] },
              { text: 'Intensidad de uso', fontSize: 6, color: THEME.textLight }
            ]
          }
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
      paddingTop: () => 4,
      paddingBottom: () => 4
    },
    margin: [0, 0, 0, 8]
  })

  // 4. GRÁFICA 1: TENDENCIA MENSUAL DE CONSUMO DE AGUA POTABLE (m³)
  const svgConsumo = generarSvgConsumoSoloPdf(consumoMensual, ANCHO_UTIL, 105)
  content.push({
    stack: [
      {
        columns: [
          { text: 'TENDENCIA MENSUAL DE CONSUMO DE AGUA POTABLE (m³)', bold: true, fontSize: 8, color: THEME.textDark },
          { text: `VOLUMEN TOTAL: ${fmt(resumen.consumo_total_m3, 2)} m³`, bold: true, fontSize: 7.5, color: THEME.chartBlue, alignment: 'right' }
        ],
        margin: [0, 0, 0, 2]
      },
      {
        text: 'Volumen hidráulico mensual medido y facturado en metros cúbicos para los períodos analizados.',
        fontSize: 6.8,
        color: THEME.textLight,
        margin: [0, 0, 0, 3]
      },
      { svg: svgConsumo, width: ANCHO_UTIL, margin: [0, 0, 0, 2] },
      {
        columns: [
          { text: '■ Consumo Medido Facturado (m³)', fontSize: 7, color: THEME.chartBlue, bold: true },
          { text: `Promedio: ${fmt(resumen.consumo_promedio_m3, 2)} m³/recibo`, fontSize: 7, color: THEME.textLight, alignment: 'right' }
        ],
        margin: [4, 0, 4, 8]
      }
    ]
  })

  // 5. GRÁFICA 2: ANÁLISIS DE VARIACIÓN INTERMENSUAL DE CONSUMO (INCREMENTO / DECREMENTO)
  const svgVariacion = generarSvgVariacionConsumoPdf(consumoMensual, ANCHO_UTIL, 90)
  content.push({
    stack: [
      {
        columns: [
          { text: 'ANÁLISIS DE VARIACIÓN INTERMENSUAL DE CONSUMO (INCREMENTO / DECREMENTO)', bold: true, fontSize: 8, color: THEME.textDark },
          { text: 'TENDENCIA RELATIVA MES A MES', bold: true, fontSize: 7, color: THEME.textMuted, alignment: 'right' }
        ],
        margin: [0, 0, 0, 2]
      },
      {
        text: 'Fluctuación porcentual y neta en m³ respecto al mes inmediato anterior. Identifica picos estacionales o descensos de demanda.',
        fontSize: 6.8,
        color: THEME.textLight,
        margin: [0, 0, 0, 3]
      },
      { svg: svgVariacion, width: ANCHO_UTIL, margin: [0, 0, 0, 2] },
      {
        columns: [
          { text: '■ Incremento de Consumo (%)', fontSize: 7, color: THEME.chartBlue, bold: true },
          { text: '■ Reducción de Consumo (%)', fontSize: 7, color: THEME.chartRed, bold: true, alignment: 'right' }
        ],
        margin: [4, 0, 4, 8]
      }
    ]
  })

  // 6. GRÁFICA 3: EVOLUCIÓN MENSUAL DE CLIENTES Y RECIBOS FACTURADOS (Debajo de variación intermensual)
  const svgClientes = generarSvgClientesRecibosPdf(consumoMensual, ANCHO_UTIL, 95)
  content.push({
    stack: [
      {
        columns: [
          { text: 'EVOLUCIÓN MENSUAL DE CLIENTES Y RECIBOS FACTURADOS', bold: true, fontSize: 8, color: THEME.textDark },
          { text: `TOTAL PADRÓN: ${fmt(resumen.total_recibos)} RECIBOS`, bold: true, fontSize: 7.5, color: THEME.headerBg, alignment: 'right' }
        ],
        margin: [0, 0, 0, 2]
      },
      {
        text: 'Total de tomas y usuarios activos censados con recibo de agua emitido en cada ciclo operativo.',
        fontSize: 6.8,
        color: THEME.textLight,
        margin: [0, 0, 0, 3]
      },
      { svg: svgClientes, width: ANCHO_UTIL, margin: [0, 0, 0, 2] },
      {
        columns: [
          { text: '■ Tomas y Clientes Facturados por Período', fontSize: 7, color: THEME.headerBg, bold: true },
          { text: `Total clientes en padrón: ${fmt(resumen.total_clientes)}`, fontSize: 7, color: THEME.textLight, alignment: 'right' }
        ],
        margin: [4, 0, 4, 0]
      }
    ]
  })

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 2: TABLAS DE DESGLOSE MENSUAL Y DISTRIBUCIÓN POR RUTA
  // ═══════════════════════════════════════════════════════════════════

  // 7. TABLA 1: DESGLOSE CRONOLÓGICO DE CONSUMO MENSUAL
  const consumoBody = [
    [
      { text: 'Período / Mes', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg },
      { text: 'Recibos / Tomas', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
      { text: 'Consumo Total (m³)', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
      { text: 'Promedio por Recibo (m³)', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
      { text: 'Variación vs Anterior', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' }
    ]
  ]

  let sumRecibos = 0
  let sumConsumo = 0

  consumoMensual.forEach((row, idx) => {
    const rec = Number(row.recibos || 0)
    const con = Number(row.consumo_total_m3 || 0)
    const prom = Number(row.consumo_promedio_m3 || 0)
    sumRecibos += rec
    sumConsumo += con

    let varStr = '-'
    let varColor = THEME.textLight
    if (idx > 0) {
      const prevCon = Number(consumoMensual[idx - 1].consumo_total_m3 || 0)
      const diff = con - prevCon
      const pct = prevCon > 0 ? (diff / prevCon) * 100 : 0
      if (diff > 0) {
        varStr = `+${fmt(diff, 1)} m³ (+${pct.toFixed(1)}%)`
        varColor = THEME.chartBlue
      } else if (diff < 0) {
        varStr = `${fmt(diff, 1)} m³ (${pct.toFixed(1)}%)`
        varColor = THEME.chartRed
      } else {
        varStr = '0.0 m³ (0.0%)'
        varColor = THEME.textMuted
      }
    }

    const isEven = idx % 2 === 0
    consumoBody.push([
      { text: formatMonthYearLong(row.periodo), bold: true, fontSize: 7, fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
      { text: fmt(rec), fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
      { text: fmt(con, 2), bold: true, fontSize: 7, color: THEME.chartBlue, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
      { text: fmt(prom, 2), fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
      { text: varStr, bold: true, fontSize: 6.5, color: varColor, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' }
    ])
  })

  // Fila consolidada de totales
  const promConsolidado = sumRecibos > 0 ? sumConsumo / sumRecibos : 0
  consumoBody.push([
    { text: 'TOTAL CONSOLIDADO', bold: true, fontSize: 7, fillColor: '#eff6ff' },
    { text: fmt(sumRecibos), bold: true, fontSize: 7, alignment: 'right', fillColor: '#eff6ff' },
    { text: fmt(sumConsumo, 2), bold: true, fontSize: 7, color: THEME.chartBlue, alignment: 'right', fillColor: '#eff6ff' },
    { text: fmt(promConsolidado, 2), bold: true, fontSize: 7, color: THEME.chartGreen, alignment: 'right', fillColor: '#eff6ff' },
    { text: '100.0% COBERTURA', bold: true, fontSize: 6.5, color: THEME.headerBg, alignment: 'right', fillColor: '#eff6ff' }
  ])

  content.push({
    pageBreak: 'before',
    stack: [
      { text: 'DESGLOSE CRONOLÓGICO Y RENDIMIENTO MENSUAL DE CONSUMO', bold: true, fontSize: 8, color: THEME.textDark, margin: [0, 0, 0, 3] },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: ['*', 90, 110, 110, 115],
          body: consumoBody
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

  // 8. TABLA 2: DISTRIBUCIÓN HIDRÁULICA Y CONSUMO POR RUTA / SECTOR
  if (distribucionRutas.length > 0) {
    const rutasBody = [
      [
        { text: 'Ruta / Sector Operativo', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg },
        { text: 'Recibos / Tomas', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: 'Consumo Total (m³)', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: 'Promedio por Toma (m³)', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: '% del Consumo Total', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' }
      ]
    ]

    const totalConsumoRutas = distribucionRutas.reduce((acc, r) => acc + Number(r.consumo_total_m3 || 0), 0)
    let sumRecibosRutas = 0

    distribucionRutas.forEach((row, idx) => {
      const rec = Number(row.recibos || 0)
      const con = Number(row.consumo_total_m3 || 0)
      const prom = Number(row.consumo_promedio_m3 || 0)
      const pct = totalConsumoRutas > 0 ? (con / totalConsumoRutas) * 100 : 0
      sumRecibosRutas += rec

      const isEven = idx % 2 === 0
      rutasBody.push([
        { text: row.ruta_nombre || `Ruta ${row.ruta_id}`, bold: true, fontSize: 7, fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: fmt(rec), fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: fmt(con, 2), bold: true, fontSize: 7, color: THEME.chartBlue, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: fmt(prom, 2), fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: percent(pct), bold: true, fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' }
      ])
    })

    const promPonderadoRutas = sumRecibosRutas > 0 ? totalConsumoRutas / sumRecibosRutas : 0
    rutasBody.push([
      { text: 'TOTAL RUTAS Y SECTORES', bold: true, fontSize: 7, fillColor: '#eff6ff' },
      { text: fmt(sumRecibosRutas), bold: true, fontSize: 7, alignment: 'right', fillColor: '#eff6ff' },
      { text: fmt(totalConsumoRutas, 2), bold: true, fontSize: 7, color: THEME.chartBlue, alignment: 'right', fillColor: '#eff6ff' },
      { text: fmt(promPonderadoRutas, 2), bold: true, fontSize: 7, color: THEME.chartGreen, alignment: 'right', fillColor: '#eff6ff' },
      { text: '100.0%', bold: true, fontSize: 7, alignment: 'right', fillColor: '#eff6ff' }
    ])

    content.push({
      stack: [
        { text: 'DISTRIBUCIÓN HIDRÁULICA Y CONSUMO POR RUTA / SECTOR', bold: true, fontSize: 8, color: THEME.textDark, margin: [0, 0, 0, 3] },
        {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: ['*', 90, 110, 110, 115],
            body: rutasBody
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
            { text: `AGUA VILLA PESQUEIRA · Reporte de Métricas de Lecturas · Emisión: ${fechaHoyCorta} ${horaHoy}`, fontSize: 7, color: THEME.textLight, margin: [0, 4, 0, 0] },
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
