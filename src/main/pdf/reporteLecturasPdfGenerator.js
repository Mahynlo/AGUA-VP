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

const formatMonthYearLong = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || 'Período Ordinario'
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
  chartBlue: '#2563eb',      // Indicadores azules
  chartGreen: '#059669',     // Medidores nuevos
  chartAmber: '#d97706',     // Sin medidor / cambio
  chartRed: '#dc2626'        // Alertas
}

// --- ORDENAMIENTO ALFANUMÉRICO INTELIGENTE ---
const sortLecturasItems = (items, campo = 'numero_predio') => {
  return [...items].sort((a, b) => {
    if (campo === 'id') {
      return (Number(a?.id) || 0) - (Number(b?.id) || 0)
    }
    const valA = String(a?.numero_predio || '')
    const valB = String(b?.numero_predio || '')
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
  })
}

// Normalización de datos en grupos
const normalizeLecturasData = (raw) => {
  if (!raw) return []
  if (!Array.isArray(raw)) {
    if (Array.isArray(raw.data)) return normalizeLecturasData(raw.data)
    if (Array.isArray(raw.clientes)) return [{ localidad: raw.localidad || 'Padrón General', clientes: raw.clientes }]
    return []
  }
  if (raw.length === 0) return []
  if (raw[0]?.clientes && Array.isArray(raw[0].clientes)) {
    return raw
  }
  const hasLocalidades = raw.some((c) => c._localidad || c.localidad || c.ruta)
  if (hasLocalidades) {
    const map = new Map()
    raw.forEach((c) => {
      const loc = c._localidad || c.localidad || c.ruta || 'Localidad General'
      if (!map.has(loc)) map.set(loc, [])
      map.get(loc).push(c)
    })
    return Array.from(map.entries()).map(([localidad, clientes]) => ({ localidad, clientes }))
  }
  return [{ localidad: 'Padrón General de Lecturas', clientes: raw }]
}

/**
 * Genera el buffer PDF del Reporte de Toma de Lecturas usando pdfmake.
 * @param {Array|Object} data - Datos agrupados o planos de tomas de lectura
 * @param {Object} options - Parámetros adicionales (mes, ordenarPor, customLogo, etc.)
 */
export async function generarReporteLecturasPdf(data, options = {}) {
  ensureFonts()

  const mesParam = options.mes || ''
  const ordenarPor = options.ordenarPor || 'numero_predio'
  const logoBase64 = getEffectiveLogoBase64(options.customLogo)

  const grupos = normalizeLecturasData(data)

  // Estadísticas globales del padrón a levantar
  let totalTomas = 0
  let conMedidor = 0
  let sinMedidor = 0
  let cambiosMedidor = 0
  let medidoresNuevos = 0

  grupos.forEach((g) => {
    ;(g.clientes || []).forEach((c) => {
      totalTomas++
      const esSinMedidor = c.sin_medidor || (!c.medidor && c.medidor !== 0)
      if (esSinMedidor) {
        sinMedidor++
      } else {
        conMedidor++
      }
      const lectAnt = typeof c.lectura_anterior === 'object' ? c.lectura_anterior : null
      if (lectAnt?.es_cambio_medidor) cambiosMedidor++
      if (lectAnt?.es_medidor_nuevo) medidoresNuevos++
    })
  })

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

  const periodoLabel = formatMonthYearLong(mesParam)

  // Ancho útil en Carta Portrait (612 - 56 = 556pt)
  const ANCHO_UTIL = 556

  const content = []

  // 1. ENCABEZADO INSTITUCIONAL OFICIAL
  const logoCell = logoBase64
    ? { image: logoBase64, fit: [54, 54], alignment: 'center' }
    : { text: 'AGUA VP', bold: true, fontSize: 13, color: '#ffffff', alignment: 'center' }

  content.push({
    table: {
      widths: [64, '*', 85],
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
                text: 'VILLA PESQUEIRA, SONORA — FORMATO DE TOMA DE LECTURAS',
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
              { text: 'TOTAL TOMAS', fontSize: 6.5, color: '#bfdbfe', alignment: 'center', bold: true },
              {
                text: String(totalTomas),
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
  content.push({
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [
        [
          {
            text: [
              { text: 'PERÍODO A LEVANTAR\n', fontSize: 6.5, color: THEME.textLight, bold: true },
              { text: periodoLabel.toUpperCase(), bold: true, fontSize: 8, color: THEME.headerBg }
            ]
          },
          {
            text: [
              { text: 'CRITERIO DE SECUENCIA\n', fontSize: 6.5, color: THEME.textLight, bold: true },
              {
                text: ordenarPor === 'id' ? 'ID DE SISTEMA' : 'NÚMERO DE PREDIO',
                bold: true,
                fontSize: 8,
                color: THEME.textDark
              }
            ]
          },
          {
            text: [
              { text: 'COBERTURA EN RUTA\n', fontSize: 6.5, color: THEME.textLight, bold: true },
              { text: `${grupos.length} SECTOR(ES) / LOCALIDAD(ES)`, bold: true, fontSize: 8, color: THEME.textMuted }
            ]
          },
          {
            text: [
              { text: 'EXPEDICIÓN OFICIAL\n', fontSize: 6.5, color: THEME.textLight, bold: true },
              { text: fechaHoyLarga, bold: true, fontSize: 7.5, color: THEME.textMuted }
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

  // 3. TARJETAS DE KPIS OPERATIVOS DE CAMPO
  content.push({
    table: {
      widths: ['20%', '20%', '20%', '20%', '20%'],
      body: [
        [
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'TOMAS EN LISTADO', bold: true, fontSize: 6.5, color: THEME.textMuted },
              { text: fmt(totalTomas), bold: true, fontSize: 11, color: THEME.textDark, margin: [0, 2, 0, 0] },
              { text: 'Padrón activo a medir', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'CON MEDIDOR ACTIVO', bold: true, fontSize: 6.5, color: THEME.chartBlue },
              { text: fmt(conMedidor), bold: true, fontSize: 11, color: THEME.chartBlue, margin: [0, 2, 0, 0] },
              { text: 'Lectura física obligatoria', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'CUOTA FIJA / SIN MEDIDOR', bold: true, fontSize: 6.5, color: THEME.chartAmber },
              { text: fmt(sinMedidor), bold: true, fontSize: 11, color: THEME.chartAmber, margin: [0, 2, 0, 0] },
              { text: 'Sin registro volumétrico', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'CAMBIOS DE MEDIDOR', bold: true, fontSize: 6.5, color: THEME.chartAmber },
              { text: fmt(cambiosMedidor), bold: true, fontSize: 11, color: THEME.chartAmber, margin: [0, 2, 0, 0] },
              { text: 'Requiere verificación', fontSize: 6, color: THEME.textLight }
            ]
          },
          {
            fillColor: '#ffffff',
            stack: [
              { text: 'MEDIDORES NUEVOS', bold: true, fontSize: 6.5, color: THEME.chartGreen },
              { text: fmt(medidoresNuevos), bold: true, fontSize: 11, color: THEME.chartGreen, margin: [0, 2, 0, 0] },
              { text: 'Primer ciclo de lectura', fontSize: 6, color: THEME.textLight }
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

  // 4. TABLAS DE TOMA DE LECTURA POR SECTOR / LOCALIDAD
  let globalOffset = 0

  if (totalTomas === 0) {
    content.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: 'No se encontraron tomas de lectura programadas para el período seleccionado.',
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

  grupos.forEach((grupo, gIdx) => {
    const clientesOrdenados = sortLecturasItems(grupo.clientes || [], ordenarPor)
    if (clientesOrdenados.length === 0) return

    // Barra de cabecera de grupo
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
                    {
                      text: (grupo.localidad || grupo.ruta || 'Padrón General').toUpperCase(),
                      bold: true,
                      fontSize: 8.5,
                      color: THEME.textDark
                    }
                  ]
                },
                {
                  text: `${clientesOrdenados.length} tomas programadas en esta sección`,
                  fontSize: 7.5,
                  color: THEME.textLight,
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
      margin: [0, gIdx === 0 ? 0 : 8, 0, 2],
      dontBreakRows: true
    })

    // Definición de tabla tabular de campo
    // Column widths: [ #, Predio, Cliente y Dirección, Medidor, Mes Ant., Lect. Ant., Lect. Actual, Consumo ]
    // Uso dinámico de '*' en la columna de cliente para ajustarse EXACTAMENTE al 100% del ancho imprimible (556pt) sin desbordar los márgenes
    const tableBody = [
      [
        { text: '#', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'center' },
        {
          text: ordenarPor === 'id' ? 'ID' : 'Predio',
          bold: true,
          fontSize: 7.5,
          color: '#ffffff',
          fillColor: THEME.tableHeaderBg,
          alignment: 'center'
        },
        { text: 'Usuario / Titular y Ubicación', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg },
        { text: 'N° Medidor', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg },
        { text: 'Mes Ant.', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'center' },
        { text: 'Lect. Ant.', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'center' },
        { text: 'Lect. Actual', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'center' },
        { text: 'Consumo', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.tableHeaderBg, alignment: 'center' }
      ]
    ]

    clientesOrdenados.forEach((item, idx) => {
      globalOffset++
      const nombre = item.nombre || item.cliente || 'Sin Nombre'
      const sinMed = item.sin_medidor || (!item.medidor && item.medidor !== 0)
      const medidorObj = typeof item.medidor === 'object' ? item.medidor : null
      const serie = sinMed ? null : medidorObj ? medidorObj.serie || medidorObj.numero_serie || 'S/N' : item.medidor || 'S/N'
      const direccion = medidorObj?.ubicacion || item.direccion || ''

      const lectAntObj = typeof item.lectura_anterior === 'object' ? item.lectura_anterior : null
      const consumoAnt = sinMed
        ? ''
        : lectAntObj?.consumo_registrado ?? (typeof item.lectura_anterior === 'number' ? item.lectura_anterior : '')
      const lecturaFisicaAnt = sinMed ? '' : lectAntObj?.lectura_fisica ?? lectAntObj?.valor ?? ''
      const esCambio = !sinMed && !!lectAntObj?.es_cambio_medidor
      const esNuevo = !sinMed && !esCambio && !!lectAntObj?.es_medidor_nuevo

      const isEven = idx % 2 === 0
      const rowBg = sinMed ? '#fffbeb' : isEven ? '#ffffff' : '#f8fafc'

      // Columna Medidor
      const cellMedidor = sinMed
        ? { text: 'SIN MEDIDOR', fontSize: 7.5, color: '#c2410c', bold: true, fillColor: rowBg }
        : {
            stack: [
              { text: String(serie), bold: true, fontSize: 8.5, color: THEME.textDark },
              ...(esCambio ? [{ text: 'CAMBIO MEDIDOR', fontSize: 6, bold: true, color: '#b45309', margin: [0, 1, 0, 0] }] : []),
              ...(esNuevo ? [{ text: 'MEDIDOR NUEVO', fontSize: 6, bold: true, color: '#047857', margin: [0, 1, 0, 0] }] : [])
            ],
            fillColor: rowBg
          }

      // Columna Nombre y Dirección
      const cellCliente = {
        stack: [
          { text: String(nombre).toUpperCase(), bold: true, fontSize: 8.5, color: THEME.textDark },
          ...(direccion ? [{ text: String(direccion).toUpperCase(), fontSize: 6.5, color: THEME.textLight, margin: [0, 1, 0, 0] }] : [])
        ],
        fillColor: rowBg
      }

      tableBody.push([
        { text: String(globalOffset), fontSize: 7.5, color: THEME.textLight, alignment: 'center', fillColor: rowBg },
        {
          text: String(ordenarPor === 'id' ? item.id || '—' : item.numero_predio || '—'),
          bold: true,
          fontSize: 8.5,
          color: sinMed ? '#c2410c' : THEME.headerBg,
          alignment: 'center',
          fillColor: sinMed ? '#fef3c7' : isEven ? '#eff6ff' : '#dbeafe'
        },
        cellCliente,
        cellMedidor,
        // Mes Ant.: número más grande para lectura rápida en campo
        {
          text: sinMed
            ? '—'
            : consumoAnt !== ''
            ? [
                { text: `${fmt(consumoAnt)}`, fontSize: 12, bold: true, color: THEME.chartBlue },
                { text: ' m³', fontSize: 7.5, bold: true, color: THEME.textLight }
              ]
            : '—',
          alignment: 'center',
          fillColor: rowBg
        },
        // Lect. Ant.: número más grande y destacado
        {
          text: sinMed ? '—' : lecturaFisicaAnt !== '' ? String(lecturaFisicaAnt) : '—',
          fontSize: 12.5,
          bold: true,
          color: sinMed ? THEME.textLight : THEME.headerBg,
          alignment: 'center',
          fillColor: rowBg
        },
        // Espacio en blanco con borde nítido para escritura manual de la lectura física
        {
          text: sinMed ? '—' : ' ',
          fontSize: sinMed ? 9 : 8,
          color: '#94a3b8',
          bold: true,
          alignment: 'center',
          fillColor: sinMed ? '#fef3c7' : '#ffffff',
          margin: [0, 3, 0, 3]
        },
        // Espacio para escribir el consumo / diferencia
        {
          text: sinMed ? '—' : 'm³',
          fontSize: sinMed ? 9 : 6,
          color: '#94a3b8',
          bold: true,
          alignment: sinMed ? 'center' : 'right',
          fillColor: sinMed ? '#fef3c7' : '#ffffff',
          margin: sinMed ? [0, 3, 0, 3] : [0, 5, 2, 0]
        }
      ])
    })

    content.push({
      table: {
        headerRows: 1,
        dontBreakRows: true,
        widths: [18, 42, '*', 62, 50, 54, 58, 46],
        body: tableBody
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.4),
        vLineWidth: () => 0.4,
        hLineColor: (i, node) => (i === 1 ? THEME.tableHeaderBg : THEME.borderLight),
        vLineColor: () => THEME.borderLight,
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 3.5,
        paddingBottom: () => 3.5
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
              text: `AGUA VILLA PESQUEIRA · Formato Oficial de Toma de Lecturas · Emisión: ${fechaHoyCorta} ${horaHoy}`,
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
