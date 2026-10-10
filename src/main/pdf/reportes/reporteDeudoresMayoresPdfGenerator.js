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

const MESES_MAP = {
  '01': 'ENE',
  '02': 'FEB',
  '03': 'MAR',
  '04': 'ABR',
  '05': 'MAY',
  '06': 'JUN',
  '07': 'JUL',
  '08': 'AGO',
  '09': 'SEP',
  '10': 'OCT',
  '11': 'NOV',
  '12': 'DIC'
}

const normalizeMonth = (raw) => {
  if (!raw) return ''
  const str = String(raw).trim()

  const yyyyMm = str.match(/^(\d{4})-(\d{2})$/)
  if (yyyyMm) return MESES_MAP[yyyyMm[2]] || str.toUpperCase()

  const onlyMonth = str.match(/^(\d{1,2})$/)
  if (onlyMonth) {
    const mm = String(Number(onlyMonth[1])).padStart(2, '0')
    return MESES_MAP[mm] || str.toUpperCase()
  }

  return str.slice(0, 3).toUpperCase()
}

const extractMesesDeuda = (row) => {
  if (Array.isArray(row.meses_deuda) && row.meses_deuda.length > 0) {
    return row.meses_deuda.map(normalizeMonth).filter(Boolean)
  }

  if (typeof row.meses_deuda === 'string' && row.meses_deuda.trim()) {
    return row.meses_deuda
      .split(/[,;|\s]+/)
      .map(normalizeMonth)
      .filter(Boolean)
  }

  const facturas = Array.isArray(row.facturas) ? row.facturas : []
  const fromFacturas = facturas
    .filter((f) => {
      const est = (f?.estado || f?.estatus || '').toString().toLowerCase()
      return est.includes('pend') || est.includes('venc') || est === ''
    })
    .map((f) => f?.periodo_mes || f?.periodo || f?.mes)
    .map(normalizeMonth)
    .filter(Boolean)

  return [...new Set(fromFacturas)]
}

const getRecibosConDeuda = (row, meses) => {
  const explicit = row.recibos_con_deuda ?? row.facturas_con_deuda ?? row.deuda?.facturas_vencidas
  if (explicit !== undefined && explicit !== null && explicit !== '') return Number(explicit) || 0

  if (Array.isArray(row.facturas)) {
    return row.facturas.filter((f) => {
      const est = (f?.estado || f?.estatus || '').toString().toLowerCase()
      return est.includes('pend') || est.includes('venc') || est === ''
    }).length
  }

  return meses.length
}

const getRawRows = (payload) => {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  if (Array.isArray(payload.deudores)) return payload.deudores
  if (Array.isArray(payload.candidatos)) return payload.candidatos
  if (Array.isArray(payload.data)) return payload.data
  return []
}

const normalizeRow = (row) => {
  const noPredio =
    row.numero_predio ||
    row.predio ||
    row.cliente?.numero_predio ||
    row.cliente_numero_predio ||
    '—'

  const nombreCliente =
    row.nombre ||
    row.cliente_nombre ||
    row.cliente?.nombre ||
    row.nombre_cliente ||
    'SIN NOMBRE'

  const medidor =
    row.medidor?.numero_serie ||
    row.medidor?.serie ||
    row.numero_serie ||
    row.medidor ||
    'S/N'

  const meses = extractMesesDeuda(row)
  const recibosConDeuda = getRecibosConDeuda(row, meses)
  const ciudad = row.ciudad || row.cliente?.ciudad || 'Sin Ciudad'

  const totalAdeudo = Number(
    row.total_adeudo ??
      row.adeudo_total ??
      row.saldo_pendiente ??
      row.deuda?.total ??
      row.deuda_total ??
      0
  )

  return {
    id: row.id || `${noPredio}-${nombreCliente}`,
    noPredio,
    nombreCliente,
    ciudad,
    medidor,
    meses,
    recibosConDeuda,
    totalAdeudo
  }
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
  chartBlue: '#2563eb',      // Indicadores azules
  chartRed: '#dc2626',       // Alertas / Adeudo rojo
  chartRedDark: '#991b1b',   // Rojo oscuro institucional
  chartAmber: '#d97706'      // Advertencias ámbar
}

/**
 * Genera el buffer PDF del Reporte de Mayores Deudores usando pdfmake.
 * @param {Array|Object} payload - Lista de deudores o paquete con { deudores, orden }
 * @param {Object} options - Parámetros adicionales (customLogo, etc.)
 */
export async function generarReporteDeudoresMayoresPdf(payload, options = {}) {
  ensureFonts()

  const logoBase64 = getEffectiveLogoBase64(options.customLogo)

  const orden =
    options.orden ||
    (payload && !Array.isArray(payload) && typeof payload === 'object' && payload.orden) ||
    'mayor'

  // Procesar y ordenar filas
  const rawRows = getRawRows(payload)
  const rows = rawRows
    .map(normalizeRow)
    .filter((r) => r.totalAdeudo > 0 || r.recibosConDeuda > 0 || r.meses.length > 0)
    .sort((a, b) => {
      if (orden === 'predio') {
        const valA = String(a.noPredio || '')
        const valB = String(b.noPredio || '')
        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
      }
      if (orden === 'menor') {
        return a.totalAdeudo - b.totalAdeudo || a.recibosConDeuda - b.recibosConDeuda || a.nombreCliente.localeCompare(b.nombreCliente)
      }
      // "mayor" (por defecto)
      return b.totalAdeudo - a.totalAdeudo || b.recibosConDeuda - a.recibosConDeuda || a.nombreCliente.localeCompare(b.nombreCliente)
    })

  // Agrupar por ciudad / localidad
  const deudoresPorCiudad = {}
  rows.forEach((r) => {
    const ciudad = (r.ciudad || 'Padrón General').toUpperCase()
    if (!deudoresPorCiudad[ciudad]) deudoresPorCiudad[ciudad] = []
    deudoresPorCiudad[ciudad].push(r)
  })

  const ordenLabel =
    {
      mayor: 'Mayor deudor primero',
      menor: 'Menor deudor primero',
      predio: 'Por número de predio'
    }[orden] || 'Mayor deudor primero'

  // Métricas globales
  const totalAdeudoGeneral = rows.reduce((acc, r) => acc + Number(r.totalAdeudo || 0), 0)
  const totalRecibosRezago = rows.reduce((acc, r) => acc + Number(r.recibosConDeuda || 0), 0)
  const deudaPromedio = rows.length > 0 ? totalAdeudoGeneral / rows.length : 0
  const maxDeuda = rows.reduce((max, r) => Math.max(max, Number(r.totalAdeudo || 0)), 0)

  const fechaHoyLarga = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const fechaHoyFormateada = fechaHoyLarga.charAt(0).toUpperCase() + fechaHoyLarga.slice(1)
  const fechaHoyCorta = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const horaHoy = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  // Ancho útil en Carta Portrait (612 - 56 = 556pt)
  const ANCHO_UTIL = 556

  const content = []

  // 1. ENCABEZADO INSTITUCIONAL OFICIAL
  const logoCell = logoBase64
    ? { image: logoBase64, fit: [54, 54], alignment: 'center' }
    : { text: 'AGUA VP', bold: true, fontSize: 13, color: '#ffffff', alignment: 'center' }

  content.push({
    table: {
      widths: [64, '*', 88],
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
                text: 'VILLA PESQUEIRA, SONORA — REPORTE DE MAYORES DEUDORES (CARTERA VENCIDA)',
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
              { text: 'TOTAL DEUDORES', fontSize: 6.5, color: '#bfdbfe', alignment: 'center', bold: true },
              {
                text: String(rows.length),
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

  // 2. CINTILLO DE METADATOS Y CRITERIOS DE SECUENCIA
  content.push({
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          {
            text: [
              { text: 'OBJETO DEL CONTROL\n', fontSize: 6.5, color: THEME.textLight, bold: true },
              { text: 'CARTERA VENCIDA PRIORITARIA', bold: true, fontSize: 8, color: THEME.chartRedDark }
            ]
          },
          {
            text: [
              { text: 'CRITERIO DE SECUENCIA\n', fontSize: 6.5, color: THEME.textLight, bold: true },
              { text: ordenLabel.toUpperCase(), bold: true, fontSize: 8, color: THEME.textDark }
            ]
          },
          {
            text: [
              { text: 'COBERTURA GEOGRÁFICA\n', fontSize: 6.5, color: THEME.textLight, bold: true },
              { text: `${Object.keys(deudoresPorCiudad).length} SECTOR(ES) / LOCALIDAD(ES)`, bold: true, fontSize: 8, color: THEME.textMuted }
            ]
          },
          {
            text: [
              { text: 'EXPEDICIÓN OFICIAL\n', fontSize: 6.5, color: THEME.textLight, bold: true },
              { text: fechaHoyFormateada, bold: true, fontSize: 7.5, color: THEME.textMuted }
            ],
            alignment: 'right'
          }
        ]
      ]
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

  // 3. TARJETAS DE KPIS FINANCIEROS Y OPERATIVOS DE COBRANZA
  content.push({
    table: {
      widths: ['20%', '20%', '20%', '20%', '20%'],
      body: [
        [
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'CARTERA VENCIDA TOTAL', bold: true, fontSize: 6.5, color: THEME.chartRedDark },
              { text: money(totalAdeudoGeneral), bold: true, fontSize: 11, color: THEME.chartRedDark, margin: [0, 2, 0, 0] },
              { text: 'Saldo total pendiente', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'CLIENTES CON REZAGO', bold: true, fontSize: 6.5, color: THEME.headerBg },
              { text: fmt(rows.length), bold: true, fontSize: 11, color: THEME.headerBg, margin: [0, 2, 0, 0] },
              { text: 'Padrón con adeudo activo', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'DEUDA PROMEDIO', bold: true, fontSize: 6.5, color: THEME.textMuted },
              { text: money(deudaPromedio), bold: true, fontSize: 11, color: THEME.textDark, margin: [0, 2, 0, 0] },
              { text: 'Por cliente deudor', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'MÁXIMA DEUDA REGISTRADA', bold: true, fontSize: 6.5, color: THEME.chartAmber },
              { text: money(maxDeuda), bold: true, fontSize: 11, color: THEME.chartAmber, margin: [0, 2, 0, 0] },
              { text: 'Caso prioritario mayor', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'RECIBOS CON REZAGO', bold: true, fontSize: 6.5, color: THEME.chartBlue },
              { text: fmt(totalRecibosRezago), bold: true, fontSize: 11, color: THEME.chartBlue, margin: [0, 2, 0, 0] },
              { text: 'Facturas pendientes', fontSize: 6, color: THEME.textLight }
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
    margin: [0, 0, 0, 10]
  })

  // 4. TABLAS DE COBRANZA Y REZAGO POR SECTOR / LOCALIDAD
  let globalCounter = 0

  if (rows.length === 0) {
    content.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: 'No se encontraron clientes con adeudo pendiente en el padrón.',
              alignment: 'center',
              fontSize: 9,
              color: THEME.textLight,
              margin: [0, 16, 0, 16]
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => THEME.border,
        vLineColor: () => THEME.border,
        fillColor: () => THEME.cardBgAlt
      },
      margin: [0, 10, 0, 0]
    })
  }

  const ciudadesKeys = Object.keys(deudoresPorCiudad)

  ciudadesKeys.forEach((ciudad, cIdx) => {
    const deudoresCiudad = deudoresPorCiudad[ciudad]
    if (!deudoresCiudad || deudoresCiudad.length === 0) return

    const totalDeudaCiudad = deudoresCiudad.reduce((sum, d) => sum + Number(d.totalAdeudo || 0), 0)

    // Barra de cabecera de la Localidad / Ciudad
    content.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              columns: [
                {
                  text: [
                    { text: 'SECTOR / LOCALIDAD: ', bold: true, fontSize: 8.5, color: THEME.headerBg },
                    { text: ciudad.toUpperCase(), bold: true, fontSize: 8.5, color: THEME.textDark }
                  ]
                },
                {
                  text: `Deudores: ${deudoresCiudad.length}  |  Cartera Vencida: ${money(totalDeudaCiudad)}`,
                  fontSize: 8,
                  color: THEME.chartRedDark,
                  alignment: 'right',
                  bold: true
                }
              ],
              fillColor: '#eff6ff',
              margin: [2, 1, 2, 1]
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#bfdbfe',
        vLineColor: () => '#bfdbfe',
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 3,
        paddingBottom: () => 3
      },
      margin: [0, cIdx === 0 ? 0 : 8, 0, 2],
      dontBreakRows: true
    })

    // Tabla Tabular de Deudores
    // Column widths: [ #, Predio, Cliente y Rezago, Medidor, Meses de Rezago, Total Adeudo, Control Cobranza ]
    // Ancho total dinámico: 22 + 46 + '*' + 56 + 86 + 72 + 50 = 556pt EXACTOS
    const tableBody = [
      [
        { text: '#', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'center' },
        { text: 'Predio', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'center' },
        { text: 'Nombre del Cliente / Titular', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg },
        { text: 'N° Medidor', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'center' },
        { text: 'Meses con Rezago', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'center' },
        { text: 'Total Adeudo', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'right' },
        { text: 'Abono / Pago', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'center' }
      ]
    ]

    deudoresCiudad.forEach((item, idx) => {
      globalCounter++
      const isEven = idx % 2 === 0
      const rowBg = isEven ? '#ffffff' : '#f8fafc'

      // Cliente con conteo de recibos en rezago
      const cellCliente = {
        stack: [
          { text: String(item.nombreCliente).toUpperCase(), bold: true, fontSize: 8.5, color: THEME.textDark },
          {
            text: `Recibos pendientes: ${item.recibosConDeuda}`,
            fontSize: 6.5,
            color: item.recibosConDeuda >= 3 ? THEME.chartRedDark : THEME.textLight,
            bold: item.recibosConDeuda >= 3,
            margin: [0, 1, 0, 0]
          }
        ],
        fillColor: rowBg
      }

      // Meses de deuda formateados
      const mesesStr = item.meses && item.meses.length > 0 ? item.meses.join(', ') : '—'

      // Celda de casilla de verificación y línea de abono/firma (vectorial ultra-rápido)
      const cellControl = {
        canvas: [
          { type: 'rect', x: 2, y: 3, w: 9, h: 9, lineWidth: 0.8, lineColor: '#94a3b8' },
          { type: 'line', x1: 15, y1: 12, x2: 44, y2: 12, lineWidth: 0.8, lineColor: '#94a3b8' }
        ],
        fillColor: rowBg,
        margin: [0, 1, 0, 1]
      }

      tableBody.push([
        { text: String(globalCounter), fontSize: 7.5, color: THEME.textLight, alignment: 'center', fillColor: rowBg },
        {
          text: String(item.noPredio || '—'),
          bold: true,
          fontSize: 8.5,
          color: THEME.headerBg,
          alignment: 'center',
          fillColor: isEven ? '#eff6ff' : '#dbeafe'
        },
        cellCliente,
        {
          text: String(item.medidor || 'S/N'),
          fontSize: 8,
          color: item.medidor && item.medidor !== 'S/N' ? THEME.textDark : '#c2410c',
          bold: true,
          alignment: 'center',
          fillColor: rowBg
        },
        {
          text: mesesStr,
          fontSize: 7.5,
          bold: true,
          color: THEME.textMuted,
          alignment: 'center',
          fillColor: rowBg
        },
        {
          text: money(item.totalAdeudo),
          fontSize: 9.5,
          bold: true,
          color: THEME.chartRedDark,
          alignment: 'right',
          fillColor: rowBg
        },
        cellControl
      ])
    })

    content.push({
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: [22, 46, '*', 56, 86, 72, 50],
        body: tableBody
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.4),
        vLineWidth: () => 0.4,
        hLineColor: (i, node) => (i === 1 ? THEME.tableHeaderBg : THEME.borderLight),
        vLineColor: () => THEME.borderLight,
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 3,
        paddingBottom: () => 3
      },
      margin: [0, 0, 0, 10]
    })
  })

  // Definición del documento pdfmake
  const docDefinition = {
    pageSize: 'LETTER',
    pageOrientation: 'portrait',
    pageMargins: [28, 28, 28, 34],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 7.5,
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
            {
              text: `AGUA VILLA PESQUEIRA · Reporte Oficial de Mayores Deudores · Emisión: ${fechaHoyCorta} ${horaHoy}`,
              fontSize: 7,
              color: THEME.textLight,
              margin: [0, 4, 0, 0]
            },
            {
              text: `Página ${currentPage} de ${pageCount}`,
              fontSize: 7.5,
              bold: true,
              color: THEME.headerBg,
              alignment: 'right',
              margin: [0, 4, 0, 0]
            }
          ]
        }
      ]
    }),
    content
  }

  const pdfDoc = pdfmake.createPdf(docDefinition)
  return await pdfDoc.getBuffer()
}
