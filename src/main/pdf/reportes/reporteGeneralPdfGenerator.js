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

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// --- COLORES INSTITUCIONALES SOBRIOS ---
const THEME = {
  headerBg: '#1e3a8a',       // Azul Marino Institucional formal
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
  chartBlue: '#2563eb',      // Barra de consumo
  chartNavy: '#1e293b',      // Línea de tomas
  chartGreen: '#059669',     // Cobranza positiva
  chartTeal: '#0d9488',      // Caja real flujo efectivo
  chartRed: '#dc2626',       // Saldo pendiente / mora
  chartAmber: '#d97706'      // Atención
}

// --- GENERADORES SVG VECTORIALES NATIVOS SOBRIOS ---

// --- GENERADORES SVG VECTORIALES NATIVOS SOBRIOS ---

// 1. Gráfica Principal de Tendencia de Consumo (m³ vs. Recibos)
function generarSvgConsumoPdf(consumoMensual, ancho = 540, alto = 140) {
  if (!consumoMensual || consumoMensual.length === 0) {
    return `<svg width="${ancho}" height="40" viewBox="0 0 ${ancho} 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="40" fill="#f8fafc" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${ancho / 2}" y="24" font-family="Roboto" font-size="9" fill="${THEME.textLight}" text-anchor="middle">Sin registros históricos de tendencia para el período evaluado</text>
    </svg>`
  }

  const chartTop = 18
  const chartBottom = alto - 24
  const chartHeight = chartBottom - chartTop
  const left = 46
  const right = 36
  const plotWidth = ancho - left - right
  const groupWidth = plotWidth / consumoMensual.length
  const barWidth = Math.max(8, Math.min(22, groupWidth / 2.3))

  const maxConsumo = consumoMensual.reduce((acc, r) => Math.max(acc, Number(r.consumo_total_m3 || 0)), 0)
  const maxRecibos = consumoMensual.reduce((acc, r) => Math.max(acc, Number(r.recibos || 0)), 0)
  const baseConsumo = maxConsumo > 0 ? maxConsumo : 1
  const baseRecibos = maxRecibos > 0 ? maxRecibos : 1

  let gridSvg = ''
  for (let step = 0; step <= 4; step++) {
    const y = chartBottom - (step / 4) * chartHeight
    const axisConsumo = (baseConsumo * step) / 4
    const axisRecibos = (baseRecibos * step) / 4
    gridSvg += `
      <line x1="${left}" y1="${y}" x2="${ancho - right}" y2="${y}" stroke="${THEME.borderLight}" stroke-dasharray="2,2" stroke-width="0.8" />
      <text x="${left - 5}" y="${y + 3}" text-anchor="end" font-family="Roboto" font-size="6.5" fill="${THEME.textMuted}" font-weight="bold">
        ${axisConsumo.toLocaleString('es-MX', { notation: 'compact', maximumFractionDigits: 1 })}
      </text>
      <text x="${ancho - right + 5}" y="${y + 3}" text-anchor="start" font-family="Roboto" font-size="6.5" fill="${THEME.textMuted}" font-weight="bold">
        ${Math.round(axisRecibos)}
      </text>
    `
  }

  let barsSvg = ''
  const linePoints = []

  consumoMensual.forEach((row, idx) => {
    const x = left + idx * groupWidth + groupWidth / 2
    const consumoVal = Number(row.consumo_total_m3 || 0)
    const hCon = (consumoVal / baseConsumo) * (chartHeight - 10)
    const recibos = Number(row.recibos || 0)
    const yLine = chartBottom - (recibos / baseRecibos) * (chartHeight - 10)
    linePoints.push({ x, y: yLine })

    const valLabel = consumoVal >= 1000 ? (consumoVal / 1000).toFixed(1) + 'k' : Math.round(consumoVal)
    const barTop = chartBottom - hCon

    barsSvg += `
      <rect x="${x - barWidth / 2}" y="${barTop}" width="${barWidth}" height="${hCon}" fill="${THEME.chartBlue}" rx="2" />
      <text x="${x}" y="${barTop - 3}" text-anchor="middle" font-family="Roboto" font-size="6" fill="${THEME.chartBlue}" font-weight="bold">
        ${valLabel}
      </text>
      <text x="${x}" y="${alto - 8}" text-anchor="middle" font-family="Roboto" font-size="7" fill="${THEME.textDark}" font-weight="bold">
        ${shortMonth(row.periodo)}
      </text>
    `
  })

  let polylineSvg = ''
  if (linePoints.length > 1) {
    const pts = linePoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    polylineSvg = `<polyline fill="none" stroke="${THEME.chartNavy}" stroke-width="2" points="${pts}" />`
  }

  let circlesSvg = ''
  linePoints.forEach((p) => {
    circlesSvg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.8" fill="${THEME.chartNavy}" stroke="#ffffff" stroke-width="1.2" />`
  })

  return `
    <svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="${alto}" fill="#ffffff" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      ${gridSvg}
      ${barsSvg}
      ${polylineSvg}
      ${circlesSvg}
    </svg>
  `
}

// 2. Gráfica de Variación de Consumo Mes a Mes (Incremento o Disminución vs Mes Anterior)
function generarSvgVariacionConsumoPdf(consumoMensual, ancho = 540, alto = 110) {
  if (!consumoMensual || consumoMensual.length < 2) {
    return `<svg width="${ancho}" height="42" viewBox="0 0 ${ancho} 42" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="42" fill="#f8fafc" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${ancho / 2}" y="25" font-family="Roboto" font-size="8" fill="${THEME.textLight}" text-anchor="middle">Se requieren al menos dos períodos para calcular la variación intermensual</text>
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
  const chartBottom = alto - 22
  const chartHeight = chartBottom - chartTop
  const zeroY = chartTop + chartHeight / 2
  const availableHalf = chartHeight / 2 - 12
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
        <text x="${x}" y="${barTop - 3}" text-anchor="middle" font-family="Roboto" font-size="6.5" fill="${THEME.chartBlue}" font-weight="bold">${pctStr}</text>
      `
    } else {
      const h = (Math.abs(d.diff) / maxAbsDiff) * availableHalf
      const barBottom = zeroY + h
      const pctStr = `${d.pct.toFixed(1)}%`
      barsSvg += `
        <rect x="${x - barWidth / 2}" y="${zeroY}" width="${barWidth}" height="${Math.max(2, h)}" fill="${THEME.chartRed}" rx="2" />
        <text x="${x}" y="${barBottom + 8}" text-anchor="middle" font-family="Roboto" font-size="6.5" fill="${THEME.chartRed}" font-weight="bold">${pctStr}</text>
      `
    }

    barsSvg += `
      <text x="${x}" y="${alto - 7}" text-anchor="middle" font-family="Roboto" font-size="7" fill="${THEME.textDark}" font-weight="bold">
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

// 3. Gráfica Principal de Tendencia Financiera (Esperado vs. Recaudado vs. Pendiente)
function generarSvgFinancieroPdf(recaudacionMensual, ancho = 540, alto = 150) {
  if (!recaudacionMensual || recaudacionMensual.length === 0) {
    return `<svg width="${ancho}" height="40" viewBox="0 0 ${ancho} 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="40" fill="#f8fafc" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${ancho / 2}" y="24" font-family="Roboto" font-size="9" fill="${THEME.textLight}" text-anchor="middle">Sin serie histórica mensual para este período</text>
    </svg>`
  }

  const chartTop = 18
  const chartBottom = 118
  const chartHeight = chartBottom - chartTop
  const left = 52
  const right = 20
  const plotWidth = ancho - left - right
  const groupWidth = plotWidth / recaudacionMensual.length
  const barWidth = Math.max(5, Math.min(14, groupWidth / 4))

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
      <text x="${left - 6}" y="${y + 3}" text-anchor="end" font-family="Roboto" font-size="7" fill="${THEME.textMuted}" font-weight="bold">
        $${axisValue.toLocaleString('es-MX', { notation: 'compact', maximumFractionDigits: 1 })}
      </text>
    `
  }

  let barsSvg = ''
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
      <text x="${x}" y="136" text-anchor="middle" font-family="Roboto" font-size="7.5" fill="${THEME.textDark}" font-weight="bold">
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

// 4. Gráfica de Recaudación por Mes de Pago (Caja Real - Flujo de Efectivo)
function generarSvgCajaRealPdf(recaudacionCaja, ancho = 540, alto = 105) {
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

// 5. Subgráfica Individual por Métrica Financiera (Para impresión monocromática / B&W legible)
function generarSvgMetricaIndividualPdf(recaudacionMensual, campo, titulo, colorBarra, ancho = 540, alto = 90) {
  if (!recaudacionMensual || recaudacionMensual.length === 0) {
    return `<svg width="${ancho}" height="35" viewBox="0 0 ${ancho} 35" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ancho}" height="35" fill="#f8fafc" rx="4" stroke="${THEME.borderLight}" stroke-width="1" />
      <text x="${ancho / 2}" y="20" font-family="Roboto" font-size="7" fill="${THEME.textLight}" text-anchor="middle">Sin datos</text>
    </svg>`
  }

  const maxVal = Math.max(...recaudacionMensual.map((r) => Number(r[campo] || 0)), 1)
  const totalVal = recaudacionMensual.reduce((acc, r) => acc + Number(r[campo] || 0), 0)

  const chartTop = 22
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

/**
 * Genera el buffer PDF del Reporte General Ejecutivo completo usando pdfmake.
 * @param {Object} data - Paquete consolidado generado en TabReportes.jsx
 * @param {Object} options - Opciones adicionales (customLogo, etc.)
 */
export async function generarReporteGeneralPdf(data, options = {}) {
  ensureFonts()

  const logoBase64 = getEffectiveLogoBase64(options.customLogo)
  const hasLogo = Boolean(logoBase64 && logoBase64.startsWith('data:image/'))

  // Desempaquetar datos
  const filtro = data?.filtro_aplicado || {}
  const consumoData = data?.consumoAgua || {}
  const financieroData = data?.financiero || {}
  const clientesResumen = data?.clientesResumen || {}
  const medidoresResumen = data?.medidoresResumen || {}
  const tarifasDistribucion = data?.tarifasDistribucion || []

  const consumoMensual = consumoData?.series?.consumo_mensual || []
  const recaudacionMensual = financieroData?.series?.recaudacion_mensual || []
  const recaudacionCaja = financieroData?.series?.recaudacion_por_mes_pago || []
  const metodosPago = financieroData?.series?.metodos_pago || []
  const rutas = consumoData?.distribucion_rutas || []

  const consumoResumen = consumoData.resumen || {}
  const consumoTotalM3 = Number(consumoResumen.consumo_total_m3 || 0)
  const consumoPromedioM3 = Number(consumoResumen.consumo_promedio_m3 || 0)
  const totalTomas = Number(consumoResumen.total_recibos || 0)

  const finResumen = financieroData.resumen || {}
  const totalFacturado = Number(finResumen.total_esperado || 0)
  const totalRecaudado = Number(finResumen.total_recaudado || 0)
  const totalCajaReal = Number(finResumen.total_recaudado_caja || 0) || recaudacionCaja.reduce((acc, row) => acc + Number(row.recaudado || 0), 0)
  const totalTransaccionesCaja = recaudacionCaja.reduce((acc, row) => acc + Number(row.transacciones || 0), 0)
  const saldoPendiente = Number(finResumen.por_cobrar_estimado || 0)
  const carteraVencida = Number(finResumen.deuda_total_rango || 0)
  const eficienciaCobranza = Number(finResumen.eficiencia_recaudo_porcentaje || 0)
  const totalFacturas = Number(finResumen.total_facturas || totalTomas || 0)
  const facturasPagadas = Number(finResumen.facturas_pagadas || 0)
  const totalMetodosPago = metodosPago.reduce((acc, row) => acc + Number(row.total || 0), 0)
  const totalOperacionesMetodos = metodosPago.reduce(
    (acc, row) => acc + Number(row.cantidad || row.transacciones || 0),
    0
  )

  const totalClientes = Number(clientesResumen.total || 0)
  const clientesActivos = Number(clientesResumen.activos || 0)
  const clientesConMedidor = Number(clientesResumen.conMedidor || 0)
  const clientesSinMedidor = Number(clientesResumen.sinMedidor || 0)
  const medidoresRetirados = Number(medidoresResumen.retirados || 0)

  const totalM3Rutas = rutas.reduce((acc, r) => acc + Number(r.consumo_total_m3 || 0), 0)
  const totalTomasRutas = rutas.reduce((acc, r) => acc + Number(r.recibos || 0), 0)

  const rangoFiltro = (() => {
    const inicio = filtro.inicio_periodo || filtro.fecha_inicio
    const fin = filtro.fin_periodo || filtro.fecha_fin
    if (inicio && fin && inicio !== fin) {
      return `${formatMonthYearLong(inicio)} a ${formatMonthYearLong(fin)}`
    }
    if (inicio) return formatMonthYearLong(inicio)
    if (fin) return formatMonthYearLong(fin)
    return 'Consolidado Integral del Ejercicio'
  })()

  const periodoPrincipal = (() => {
    if (filtro.periodo) return formatMonthYearLong(filtro.periodo)
    if (filtro.anio) return `Ejercicio Fiscal ${filtro.anio}`
    if (filtro.meses) return `Rango de Últimos ${filtro.meses} Meses`
    return filtro.etiqueta || 'Período Ordinario'
  })()

  const fechaHoyLarga = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const fechaHoyCorta = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const horaHoy = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  // Ancho útil en Letter Portrait con márgenes [36, 36, 36, 44]:
  // 612 - 72 = 540 pt
  const ANCHO_UTIL = 540

  const content = []

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 1: PORTADA INSTITUCIONAL OFICIAL (Diseño Ejecutivo y Sobrio)
  // ═══════════════════════════════════════════════════════════════════
  const cabeceraPortada = {
    columns: [
      hasLogo
        ? { image: 'escudoLogo', width: 68, height: 68 }
        : {
            width: 68,
            canvas: [
              { type: 'rect', x: 0, y: 0, w: 60, h: 60, r: 4, color: THEME.headerBg }
            ]
          },
      {
        width: '*',
        margin: [12, 4, 0, 0],
        stack: [
          { text: 'H. AYUNTAMIENTO DE VILLA PESQUEIRA, SONORA', bold: true, fontSize: 13, color: THEME.textDark, letterSpacing: 0.2 },
          { text: 'COMISIÓN MUNICIPAL DE AGUA POTABLE Y ALCANTARILLADO', bold: true, fontSize: 9.5, color: THEME.headerBg, margin: [0, 2, 0, 0] },
          { text: 'DIRECCIÓN GENERAL · ORGANISMO OPERADOR MUNICIPAL', fontSize: 8, color: THEME.textMuted, margin: [0, 1, 0, 0] }
        ]
      },
      {
        width: 135,
        alignment: 'right',
        stack: [
          { text: 'CONTROL OFICIAL', bold: true, fontSize: 8, color: THEME.textDark, background: THEME.cardBgAlt, alignment: 'center' },
          { text: `Folio: INF-GEN-${filtro.anio || new Date().getFullYear()}`, fontSize: 7.5, color: THEME.textLight, margin: [0, 4, 0, 0] }
        ]
      }
    ]
  }

  const lineaSeparadora = {
    canvas: [
      { type: 'line', x1: 0, y1: 8, x2: ANCHO_UTIL, y2: 8, lineWidth: 1.5, lineColor: THEME.headerBg },
      { type: 'line', x1: 0, y1: 11, x2: ANCHO_UTIL, y2: 11, lineWidth: 0.5, lineColor: THEME.border }
    ],
    margin: [0, 8, 0, 30]
  }

  const cuerpoTituloPortada = {
    stack: [
      {
        text: 'INFORME TÉCNICO DE GESTIÓN Y RENDICIÓN DE CUENTAS',
        bold: true,
        fontSize: 8,
        color: THEME.headerBg,
        alignment: 'center',
        letterSpacing: 0.8,
        margin: [0, 0, 0, 8]
      },
      {
        text: 'INFORME GENERAL EJECUTIVO',
        bold: true,
        fontSize: 22,
        color: THEME.textDark,
        alignment: 'center',
        letterSpacing: 0.4,
        margin: [0, 0, 0, 8]
      },
      {
        text: 'Diagnóstico Integral de Operación Hidráulica, Demanda de Consumo, Recaudación Financiera, Tarifas y Padrón de Usuarios.',
        fontSize: 9.5,
        color: THEME.textMuted,
        alignment: 'center',
        lineHeight: 1.3,
        margin: [24, 0, 24, 26]
      }
    ]
  }

  const fichaTecnicaPortada = {
    table: {
      widths: ['*', '*'],
      body: [
        [
          { text: 'PARÁMETROS DE CONSULTA Y ÁMBITO TEMPORAL', colSpan: 2, bold: true, fontSize: 8, color: '#ffffff', fillColor: THEME.tableHeaderBg },
          {}
        ],
        [
          { text: [{ text: 'Período Auditado / Criterio:\n', fontSize: 7.5, color: THEME.textLight }, { text: periodoPrincipal, bold: true, fontSize: 9.5, color: THEME.textDark }] },
          { text: [{ text: 'Rango Cronológico Evaluado:\n', fontSize: 7.5, color: THEME.textLight }, { text: rangoFiltro, bold: true, fontSize: 9.5, color: THEME.textDark }] }
        ],
        [
          { text: [{ text: 'Fecha y Hora de Expedición:\n', fontSize: 7.5, color: THEME.textLight }, { text: `${fechaHoyLarga} (${horaHoy} hrs)`, bold: true, fontSize: 9, color: THEME.textDark }] },
          { text: [{ text: 'Carácter del Documento:\n', fontSize: 7.5, color: THEME.textLight }, { text: 'Auditoría Administrativa y Consulta Institucional', bold: true, fontSize: 9, color: THEME.textDark }] }
        ]
      ]
    },
    layout: {
      fillColor: (i) => (i === 0 ? THEME.tableHeaderBg : THEME.cardBgAlt),
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => THEME.border,
      vLineColor: () => THEME.border,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 6,
      paddingBottom: () => 6
    },
    margin: [0, 0, 0, 24]
  }

  // 4 Pilares Maestros en Portada (Sobrios, fondo neutro uniforme, sin arcoíris)
  const kpisPortada = {
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          {
            fillColor: THEME.cardBgAlt,
            stack: [
              { text: 'PADRÓN ACTIVO', bold: true, fontSize: 7, color: THEME.headerBg, alignment: 'center' },
              { text: fmt(clientesActivos), bold: true, fontSize: 14, color: THEME.textDark, alignment: 'center', margin: [0, 3, 0, 1] },
              { text: `de ${fmt(totalClientes)} cuentas`, fontSize: 6.5, color: THEME.textLight, alignment: 'center' }
            ]
          },
          {
            fillColor: THEME.cardBgAlt,
            stack: [
              { text: 'AGUA SUMINISTRADA', bold: true, fontSize: 7, color: THEME.headerBg, alignment: 'center' },
              { text: `${fmt(consumoTotalM3, 1)} m³`, bold: true, fontSize: 14, color: THEME.textDark, alignment: 'center', margin: [0, 3, 0, 1] },
              { text: `${fmt(consumoPromedioM3, 1)} m³/toma prom.`, fontSize: 6.5, color: THEME.textLight, alignment: 'center' }
            ]
          },
          {
            fillColor: THEME.cardBgAlt,
            stack: [
              { text: 'RECAUDACIÓN EN CAJA', bold: true, fontSize: 7, color: THEME.headerBg, alignment: 'center' },
              { text: money(totalRecaudado), bold: true, fontSize: 13, color: THEME.textDark, alignment: 'center', margin: [0, 3, 0, 1] },
              { text: `${fmt(facturasPagadas)} recibos liquidados`, fontSize: 6.5, color: THEME.textLight, alignment: 'center' }
            ]
          },
          {
            fillColor: THEME.cardBgAlt,
            stack: [
              { text: 'EFICIENCIA DE COBRO', bold: true, fontSize: 7, color: THEME.headerBg, alignment: 'center' },
              { text: percent(eficienciaCobranza), bold: true, fontSize: 14, color: THEME.textDark, alignment: 'center', margin: [0, 3, 0, 1] },
              { text: `facturado ${money(totalFacturado)}`, fontSize: 6.5, color: THEME.textLight, alignment: 'center' }
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
      paddingTop: () => 8,
      paddingBottom: () => 8
    },
    margin: [0, 0, 0, 36]
  }

  const piePortada = {
    stack: [
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: ANCHO_UTIL, y2: 0, lineWidth: 0.5, lineColor: THEME.border }],
        margin: [0, 0, 0, 8]
      },
      {
        columns: [
          { text: 'Comisión Municipal de Agua Potable y Alcantarillado · Villa Pesqueira, Sonora', fontSize: 7.5, color: THEME.textLight },
          { text: 'Sistema de Gestión Institucional AguaVP · Certificación Oficial', fontSize: 7.5, color: THEME.textLight, alignment: 'right' }
        ]
      }
    ]
  }

  content.push(cabeceraPortada)
  content.push(lineaSeparadora)
  content.push(cuerpoTituloPortada)
  content.push(fichaTecnicaPortada)
  content.push(kpisPortada)
  content.push(piePortada)

  // Salto estricto de página para que el cuerpo empiece en la página 2
  content.push({ text: '', pageBreak: 'after' })

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 2: SECCIÓN I (SÍNTESIS) Y SECCIÓN II (OPERACIÓN HIDRÁULICA)
  // ═══════════════════════════════════════════════════════════════════
  // 5 KPIs Ejecutivos (Fondo blanco uniforme, bordes slate sobrios, acento formal)
  const kpisDetalle = {
    table: {
      widths: ['20%', '20%', '20%', '20%', '20%'],
      body: [
        [
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'TOMAS FACTURADAS', bold: true, fontSize: 6.5, color: THEME.textMuted },
              { text: fmt(totalTomas), bold: true, fontSize: 11.5, color: THEME.textDark, margin: [0, 2, 0, 0] }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'AGUA SUMINISTRADA', bold: true, fontSize: 6.5, color: THEME.textMuted },
              { text: `${fmt(consumoTotalM3, 1)} m³`, bold: true, fontSize: 11.5, color: THEME.textDark, margin: [0, 2, 0, 0] }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'TOTAL FACTURADO', bold: true, fontSize: 6.5, color: THEME.textMuted },
              { text: money(totalFacturado), bold: true, fontSize: 11, color: THEME.textDark, margin: [0, 2, 0, 0] }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'TOTAL RECAUDADO', bold: true, fontSize: 6.5, color: THEME.textMuted },
              { text: money(totalRecaudado), bold: true, fontSize: 11, color: THEME.textDark, margin: [0, 2, 0, 0] }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'EFICIENCIA GLOBAL', bold: true, fontSize: 6.5, color: THEME.textMuted },
              { text: percent(eficienciaCobranza), bold: true, fontSize: 11.5, color: THEME.textDark, margin: [0, 2, 0, 0] }
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
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 5,
      paddingBottom: () => 5
    },
    margin: [0, 0, 0, 8]
  }

  // Gráfica Principal de Consumo SVG (Optimizada para balancear página 2)
  const svgConsumoString = generarSvgConsumoPdf(consumoMensual, ANCHO_UTIL, 135)
  const seccionConsumo = {
    stack: [
      { text: 'SECCIÓN II. DIAGNÓSTICO OPERATIVO Y DEMANDA DE CONSUMO HIDRÁULICO', bold: true, fontSize: 8.5, color: THEME.headerBg, margin: [0, 0, 0, 2] },
      { text: 'Evolución mensual del volumen suministrado (m³) en barras y total de tomas en línea continua.', fontSize: 6.8, color: THEME.textLight, margin: [0, 0, 0, 4] },
      { svg: svgConsumoString, width: ANCHO_UTIL, margin: [0, 0, 0, 2] },
      {
        columns: [
          { text: '■ Volumen de Agua (m³) — Eje Izquierdo', fontSize: 6.8, color: THEME.chartBlue },
          { text: '—●— Tomas / Recibos Facturados — Eje Derecho', fontSize: 6.8, color: THEME.chartNavy, alignment: 'right' }
        ],
        margin: [4, 0, 4, 6]
      }
    ]
  }

  // Gráfica Analítica de Variación Intermensual de Consumo
  const svgVariacionString = generarSvgVariacionConsumoPdf(consumoMensual, ANCHO_UTIL, 100)
  const seccionVariacion = {
    stack: [
      { text: 'ANÁLISIS DE VARIACIÓN INTERMENSUAL DE CONSUMO (INCREMENTO / DECREMENTO)', bold: true, fontSize: 8, color: THEME.textDark, margin: [0, 1, 0, 2] },
      { text: 'Diferencial neto en metros cúbicos (m³) y porcentaje relativo comparado contra el mes inmediato anterior.', fontSize: 6.8, color: THEME.textLight, margin: [0, 0, 0, 3] },
      { svg: svgVariacionString, width: ANCHO_UTIL, margin: [0, 0, 0, 2] },
      {
        columns: [
          { text: '■ Incremento de Consumo (+m³)', fontSize: 6.8, color: THEME.chartBlue },
          { text: '■ Disminución de Consumo (-m³)', fontSize: 6.8, color: THEME.chartRed, alignment: 'right' }
        ],
        margin: [4, 0, 4, 6]
      }
    ]
  }

  // Tabla de Desglose de Consumo Mensual
  let tablaDesgloseConsumo = null
  if (consumoMensual.length > 1) {
    const consumoBody = [
      [
        { text: 'Período', bold: true, fontSize: 6.5, color: '#ffffff', fillColor: THEME.tableHeaderBg },
        { text: 'Consumo (m³)', bold: true, fontSize: 6.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: 'Prom/Toma', bold: true, fontSize: 6.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: 'Tomas', bold: true, fontSize: 6.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' }
      ]
    ]

    consumoMensual.forEach((cm, idx) => {
      const isEven = idx % 2 === 0
      consumoBody.push([
        { text: shortMonth(cm.periodo), bold: true, fontSize: 6.5, fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: `${fmt(cm.consumo_total_m3, 1)} m³`, bold: true, fontSize: 6.5, color: THEME.headerBg, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: `${fmt(cm.consumo_promedio_m3, 1)} m³`, fontSize: 6.5, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: fmt(cm.recibos), fontSize: 6.5, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' }
      ])
    })

    tablaDesgloseConsumo = {
      stack: [
        { text: 'DESGLOSE CRONOLÓGICO DE CONSUMO', bold: true, fontSize: 7, color: THEME.textDark, margin: [0, 0, 0, 3] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 65, 55, 42],
            body: consumoBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => THEME.borderLight,
            vLineColor: () => THEME.borderLight,
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 1.8,
            paddingBottom: () => 1.8
          }
        }
      ]
    }
  }

  // Tabla de Rutas
  const tablaRutasBody = [
    [
      { text: 'Ruta / Sector Hidráulico', bold: true, fontSize: 6.5, color: '#ffffff', fillColor: THEME.tableHeaderBg },
      { text: 'Tomas', bold: true, fontSize: 6.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
      { text: 'Volumen', bold: true, fontSize: 6.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
      { text: 'Promedio', bold: true, fontSize: 6.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
      { text: 'Part.', bold: true, fontSize: 6.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' }
    ]
  ]

  if (rutas.length > 0) {
    rutas.forEach((ruta, idx) => {
      const m3 = Number(ruta.consumo_total_m3 || 0)
      const part = totalM3Rutas > 0 ? (m3 / totalM3Rutas) * 100 : 0
      const isEven = idx % 2 === 0
      tablaRutasBody.push([
        { text: ruta.ruta_nombre || 'Sector sin nombre', bold: true, fontSize: 6.5, fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: fmt(ruta.recibos), fontSize: 6.5, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: `${fmt(m3, 1)} m³`, bold: true, fontSize: 6.5, color: THEME.headerBg, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: `${fmt(ruta.consumo_promedio_m3, 1)} m³`, fontSize: 6.5, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: percent(part), bold: true, fontSize: 6.5, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' }
      ])
    })
  } else {
    tablaRutasBody.push([
      { text: 'Sin registros de rutas para este filtro', colSpan: 5, fontSize: 6.5, color: THEME.textLight, alignment: 'center' },
      {}, {}, {}, {}
    ])
  }

  tablaRutasBody.push([
    { text: 'TOTAL CONSOLIDADO', bold: true, fontSize: 6.5, color: THEME.textDark, fillColor: '#f1f5f9' },
    { text: fmt(totalTomasRutas), bold: true, fontSize: 6.5, alignment: 'right', fillColor: '#f1f5f9' },
    { text: `${fmt(totalM3Rutas, 1)} m³`, bold: true, fontSize: 6.5, color: THEME.headerBg, alignment: 'right', fillColor: '#f1f5f9' },
    { text: `${fmt(consumoPromedioM3, 1)} m³`, bold: true, fontSize: 6.5, alignment: 'right', fillColor: '#f1f5f9' },
    { text: '100.0%', bold: true, fontSize: 6.5, alignment: 'right', fillColor: '#f1f5f9' }
  ])

  const seccionTablaRutas = {
    stack: [
      { text: 'DISTRIBUCIÓN HIDRÁULICA POR SECTOR', bold: true, fontSize: 7, color: THEME.textDark, margin: [0, 0, 0, 3] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 32, 52, 48, 36],
          body: tablaRutasBody
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => THEME.borderLight,
          vLineColor: () => THEME.borderLight,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 1.8,
          paddingBottom: () => 1.8
        }
      }
    ]
  }

  // Estructura en 2 columnas para que quepan juntas en la Página 2 sin desbordar
  let bloqueTablasOperativas = null
  if (tablaDesgloseConsumo) {
    bloqueTablasOperativas = {
      columns: [
        {
          width: '49%',
          stack: [tablaDesgloseConsumo]
        },
        {
          width: '49%',
          margin: [10, 0, 0, 0],
          stack: [seccionTablaRutas]
        }
      ],
      margin: [0, 0, 0, 6]
    }
  } else {
    bloqueTablasOperativas = seccionTablaRutas
  }

  content.push({ text: 'SECCIÓN I. RESUMEN EJECUTIVO Y CIFRAS CLAVE', bold: true, fontSize: 8.5, color: THEME.headerBg, margin: [0, 0, 0, 4] })
  content.push(kpisDetalle)
  content.push(seccionConsumo)
  content.push(seccionVariacion)
  content.push(bloqueTablasOperativas)

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 3: SECCIÓN III (ESTADO FINANCIERO Y GESTIÓN DE COBRANZA)
  // ═══════════════════════════════════════════════════════════════════
  content.push({ text: '', pageBreak: 'before' })

  // Gráfica Principal Financiera SVG (Comparativa Facturación vs Recaudación Corriente vs Saldo Pendiente)
  const svgFinancieroString = generarSvgFinancieroPdf(recaudacionMensual, ANCHO_UTIL, 150)
  const seccionFinanzas = {
    stack: [
      { text: 'SECCIÓN III. ESTADO FINANCIERO Y GESTIÓN DE COBRANZA', bold: true, fontSize: 9, color: THEME.headerBg, margin: [0, 0, 0, 2] },
      { text: 'Comparativa mensual consolidada por período de emisión: Facturación Determinada vs. Recaudación Corriente vs. Saldo Pendiente.', fontSize: 7, color: THEME.textLight, margin: [0, 0, 0, 3] },
      { svg: svgFinancieroString, width: ANCHO_UTIL, margin: [0, 0, 0, 2] },
      {
        columns: [
          { text: '■ Facturación Emitida (Determinada)', fontSize: 7, color: THEME.chartBlue },
          { text: '■ Recaudación Corriente del Período', fontSize: 7, color: THEME.chartGreen, alignment: 'center' },
          { text: '■ Saldo Pendiente por Recuperar', fontSize: 7, color: THEME.chartRed, alignment: 'right' }
        ],
        margin: [4, 0, 4, 6]
      }
    ]
  }

  // 3 Subgráficas Individuales por Componente (Óptimas para impresión Blanco y Negro / Monocromática)
  // En ancho completo vertical apilado: cada métrica dispone de los 540pt útiles para desplegar los 12 meses con holgura
  const svgEsperado = generarSvgMetricaIndividualPdf(recaudacionMensual, 'esperado', '1. Facturación Emitida / Determinada (Cuotas y Consumos)', THEME.chartBlue, ANCHO_UTIL, 90)
  const svgRecaudado = generarSvgMetricaIndividualPdf(recaudacionMensual, 'recaudado', '2. Recaudación Aplicada al Período (Cobranza Corriente)', THEME.chartGreen, ANCHO_UTIL, 90)
  const svgPendiente = generarSvgMetricaIndividualPdf(recaudacionMensual, 'pendiente', '3. Saldo Corriente Pendiente por Recuperar', THEME.chartRed, ANCHO_UTIL, 90)

  const seccionSubgraficasFinancieras = {
    stack: [
      { text: 'DESGLOSE INDIVIDUAL POR COMPONENTE FINANCIERO (ÓPTIMO PARA IMPRESIÓN EN BLANCO Y NEGRO)', bold: true, fontSize: 8, color: THEME.textDark, margin: [0, 1, 0, 2] },
      { text: 'Métricas analíticas a ancho completo para garantizar total legibilidad y separación de los 12 meses sin saturación ni recortes.', fontSize: 6.8, color: THEME.textLight, margin: [0, 0, 0, 3] },
      { svg: svgEsperado, width: ANCHO_UTIL, margin: [0, 0, 0, 3] },
      { svg: svgRecaudado, width: ANCHO_UTIL, margin: [0, 0, 0, 3] },
      { svg: svgPendiente, width: ANCHO_UTIL, margin: [0, 0, 0, 4] }
    ]
  }

  // Gráfica de Recaudación por Mes de Pago (Caja Real - Flujo de Efectivo)
  const svgCajaRealString = generarSvgCajaRealPdf(recaudacionCaja, ANCHO_UTIL, 105)
  const seccionCajaReal = {
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
              { text: [{ text: 'TOTAL EN CAJA: ', fontSize: 7, color: THEME.textLight }, { text: money(totalCajaReal), fontSize: 9.5, bold: true, color: THEME.chartTeal }] },
              { text: `${fmt(totalTransaccionesCaja)} cobros registrados`, fontSize: 6.5, color: THEME.textMuted }
            ]
          }
        ]
      },
      { svg: svgCajaRealString, width: ANCHO_UTIL, margin: [0, 2, 0, 2] },
      {
        columns: [
          { text: '■ Recaudación Efectiva Ingresada en Ventanilla (Flujo de Efectivo)', fontSize: 7, color: THEME.chartTeal },
          { text: `Total Depositado en Caja: ${money(totalCajaReal)}`, fontSize: 7, bold: true, color: THEME.textDark, alignment: 'right' }
        ],
        margin: [4, 0, 4, 6]
      }
    ],
    margin: [0, 0, 0, 8]
  }

  // Tabla de Desglose Histórico Financiero
  let tablaDesgloseFinanciero = null
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

    tablaDesgloseFinanciero = {
      stack: [
        { text: 'DESGLOSE MENSUAL DE FACTURACIÓN DETERMINADA Y RECAUDACIÓN APLICADA', bold: true, fontSize: 7.5, color: THEME.textDark, margin: [0, 0, 0, 3] },
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
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 2.5,
            paddingBottom: () => 2.5
          }
        }
      ],
      margin: [0, 0, 0, 8]
    }
  }

  // Tabla 4: Detalle de Flujo Efectivo Percibido en Caja por Mes de Cobro (Tabla faltante añadida)
  let tablaDetalleCajaReal = null
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
      const pct = totalCajaReal > 0 ? (cobrado / totalCajaReal) * 100 : 0
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
      { text: money(totalCajaReal), bold: true, fontSize: 7, color: THEME.chartTeal, alignment: 'right', fillColor: '#f0fdfa' },
      { text: '100.0%', bold: true, fontSize: 7, alignment: 'right', fillColor: '#f0fdfa' }
    ])

    tablaDetalleCajaReal = {
      stack: [
        { text: 'DETALLE DE FLUJO EFECTIVO PERCIBIDO EN CAJA POR MES DE COBRO', bold: true, fontSize: 7.5, color: THEME.textDark, margin: [0, 0, 0, 3] },
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
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 2.5,
            paddingBottom: () => 2.5
          }
        }
      ],
      margin: [0, 0, 0, 8]
    }
  }

  // Balance Financiero Consolidado (Términos contables y financieros rigurosos)
  const tablaBalanceFinanciero = {
    stack: [
      { text: 'BALANCE INTEGRAL DE DERECHOS, COBRANZA Y CARTERA DEUDORA', bold: true, fontSize: 7.5, color: THEME.textDark, margin: [0, 0, 0, 3] },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: ['*', 120, 140],
          body: [
            [
              { text: 'Concepto Financiero y Contable', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg },
              { text: 'Cuentas / Recibos', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
              { text: 'Importe Consolidado ($ MXN)', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' }
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
              { text: money(totalCajaReal), bold: true, fontSize: 8.5, color: THEME.chartTeal, alignment: 'right', fillColor: '#f0fdfa' }
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
    margin: [0, 0, 0, 8]
  }

  // Métodos de Pago
  let seccionMetodosPago = null
  if (metodosPago.length > 0) {
    const metodosBody = [
      [
        { text: 'Medio de Pago / Canal de Cobro', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderSub },
        { text: 'Operaciones', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderSub, alignment: 'right' },
        { text: 'Total Percibido ($ MXN)', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderSub, alignment: 'right' },
        { text: '% Participación', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderSub, alignment: 'right' }
      ]
    ]
    metodosPago.forEach((mp, idx) => {
      const tot = Number(mp.total || 0)
      const pct = totalMetodosPago > 0 ? (tot / totalMetodosPago) * 100 : 0
      const isEven = idx % 2 === 0
      metodosBody.push([
        { text: (mp.metodo || 'Sin clasificar').toUpperCase(), bold: true, fontSize: 7, fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: fmt(mp.cantidad || mp.transacciones || 0), fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: money(tot), bold: true, fontSize: 7, color: THEME.chartGreen, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' },
        { text: percent(pct), bold: true, fontSize: 7, alignment: 'right', fillColor: isEven ? THEME.cardBgAlt : '#ffffff' }
      ])
    })

    metodosBody.push([
      { text: 'TOTAL INGRESOS CANALIZADOS', bold: true, fontSize: 7, fillColor: '#eff6ff' },
      { text: fmt(totalOperacionesMetodos), bold: true, fontSize: 7, alignment: 'right', fillColor: '#eff6ff' },
      { text: money(totalMetodosPago), bold: true, fontSize: 7, color: THEME.headerBg, alignment: 'right', fillColor: '#eff6ff' },
      { text: '100.0%', bold: true, fontSize: 7, alignment: 'right', fillColor: '#eff6ff' }
    ])

    seccionMetodosPago = {
      stack: [
        { text: 'CLASIFICACIÓN DE INGRESOS POR MEDIO DE PAGO', bold: true, fontSize: 7.5, color: THEME.textDark, margin: [0, 0, 0, 3] },
        {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: ['*', 100, 130, 90],
            body: metodosBody
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => THEME.borderLight,
            vLineColor: () => THEME.borderLight,
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 2.5,
            paddingBottom: () => 2.5
          }
        }
      ],
      margin: [0, 0, 0, 6]
    }
  }

  // Página 3: Estructura visual financiera ordenada (Comparativa -> 3 Subgráficas)
  content.push(seccionFinanzas)
  content.push(seccionSubgraficasFinancieras)

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 4: TABLAS FINANCIERAS Y CAJA REAL (FLUJO DE EFECTIVO)
  // ═══════════════════════════════════════════════════════════════════
  content.push({ text: '', pageBreak: 'before' })

  if (tablaDesgloseFinanciero) content.push(tablaDesgloseFinanciero)
  content.push(seccionCajaReal)
  if (tablaDetalleCajaReal) content.push(tablaDetalleCajaReal)

  // Tarifas y Medidores en dos columnas
  const tarifasBody = [
    [
      { text: 'Régimen / Esquema Tarifario', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg },
      { text: 'Cuentas Registradas', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
      { text: '% Distribución del Padrón', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' }
    ]
  ]

  if (tarifasDistribucion.length > 0) {
    tarifasDistribucion.forEach((t) => {
      tarifasBody.push([
        { text: t.nombre, bold: true, fontSize: 7 },
        { text: fmt(t.cantidadClientes), fontSize: 7, alignment: 'right' },
        { text: percent(t.porcentaje), bold: true, fontSize: 7, color: THEME.headerBg, alignment: 'right' }
      ])
    })
  } else {
    tarifasBody.push([
      { text: 'Doméstica Estándar', bold: true, fontSize: 7 },
      { text: fmt(totalClientes), fontSize: 7, alignment: 'right' },
      { text: '100.0%', bold: true, fontSize: 7, alignment: 'right' }
    ])
  }

  const seccionTarifasYMedidores = {
    columns: [
      {
        width: '52%',
        stack: [
          { text: 'SECCIÓN IV. PADRÓN DE USUARIOS Y ESTRUCTURA TARIFARIA', bold: true, fontSize: 8, color: THEME.headerBg, margin: [0, 0, 0, 3] },
          {
            table: {
              widths: ['*', 55, 55],
              body: tarifasBody
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => THEME.borderLight,
              vLineColor: () => THEME.borderLight,
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 2.5,
              paddingBottom: () => 2.5
            }
          }
        ]
      },
      {
        width: '45%',
        margin: [16, 0, 0, 0],
        stack: [
          { text: 'PARQUE DE MEDICIÓN Y TIPOS DE SUMINISTRO', bold: true, fontSize: 8, color: THEME.headerBg, margin: [0, 0, 0, 3] },
          {
            table: {
              widths: ['*', 70],
              body: [
                [{ text: 'Padrón Total de Cuentas Contratadas:', fontSize: 7, color: THEME.textMuted }, { text: `${fmt(totalClientes)} cuentas`, bold: true, fontSize: 7, alignment: 'right' }],
                [{ text: 'Cuentas Activas con Suministro:', fontSize: 7, color: THEME.textMuted }, { text: fmt(clientesActivos), bold: true, fontSize: 7, alignment: 'right' }],
                [{ text: 'Tomas con Servicio Medido (Medidor):', fontSize: 7, color: THEME.textMuted }, { text: fmt(clientesConMedidor), bold: true, fontSize: 7, alignment: 'right' }],
                [{ text: 'Tomas de Cuota Fija (Servicio Directo):', fontSize: 7, color: THEME.textMuted }, { text: fmt(clientesSinMedidor), bold: true, fontSize: 7, alignment: 'right' }],
                [{ text: 'Medidores en Taller / Inventario:', fontSize: 7, color: THEME.textDark, bold: true, fillColor: '#f1f5f9' }, { text: fmt(medidoresRetirados), bold: true, fontSize: 7, alignment: 'right', fillColor: '#f1f5f9' }]
              ]
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => THEME.borderLight,
              vLineColor: () => THEME.borderLight,
              paddingLeft: () => 5,
              paddingRight: () => 5,
              paddingTop: () => 2.5,
              paddingBottom: () => 2.5
            }
          }
        ]
      }
    ],
    margin: [0, 0, 0, 10]
  }

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 5: BALANCE CONTABLE, MEDIOS DE PAGO Y SECCIÓN IV (USUARIOS Y TARIFAS)
  // ═══════════════════════════════════════════════════════════════════
  content.push({ text: '', pageBreak: 'before' })
  content.push(tablaBalanceFinanciero)
  if (seccionMetodosPago) content.push(seccionMetodosPago)
  content.push(seccionTarifasYMedidores)

  // Document Definition para pdfmake con Header y Footer Oficial
  const docDefinition = {
    pageSize: 'LETTER',
    pageOrientation: 'portrait',
    pageMargins: [36, 36, 36, 44],
    content,
    images: hasLogo ? { escudoLogo: logoBase64 } : {},
    header: (currentPage) => {
      if (currentPage === 1) return null
      return {
        margin: [36, 12, 36, 0],
        columns: [
          { text: 'COMISIÓN MUNICIPAL DE AGUA POTABLE Y ALCANTARILLADO — VILLA PESQUEIRA, SONORA', fontSize: 6.5, bold: true, color: THEME.textLight },
          { text: 'INFORME GENERAL EJECUTIVO', fontSize: 6.5, bold: true, color: THEME.headerBg, alignment: 'right' }
        ]
      }
    },
    footer: (currentPage, pageCount) => {
      if (currentPage === 1) {
        return {
          margin: [36, 8, 36, 0],
          columns: [
            { text: 'Sistema de Gestión y Facturación AguaVP · Organismo Operador Municipal', fontSize: 7, color: THEME.textLight },
            { text: 'Certificación Administrativa Oficial', fontSize: 7, color: THEME.textLight, alignment: 'right' }
          ]
        }
      }
      return {
        margin: [36, 8, 36, 0],
        stack: [
          {
            canvas: [
              { type: 'line', x1: 0, y1: 0, x2: ANCHO_UTIL, y2: 0, lineWidth: 0.5, lineColor: THEME.border }
            ]
          },
          {
            columns: [
              { text: `AGUA VILLA PESQUEIRA · Informe General Ejecutivo · Emisión: ${fechaHoyCorta} ${horaHoy}`, fontSize: 7, color: THEME.textLight, margin: [0, 4, 0, 0] },
              { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7.5, bold: true, color: THEME.headerBg, alignment: 'right', margin: [0, 4, 0, 0] }
            ]
          }
        ]
      }
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 8,
      color: THEME.textDark
    }
  }

  const pdfDoc = pdfmake.createPdf(docDefinition)
  return await pdfDoc.getBuffer()
}
