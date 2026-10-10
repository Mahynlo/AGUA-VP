import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pdfmake from 'pdfmake'
import { getEffectiveLogoBase64 } from '../managers/logoManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── RESOLUCIÓN SEGURA DE FUENTES ───────────────────────────────────────────
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

// ─── PALETA INSTITUCIONAL AGUAVP ───────────────────────────────────────────
const THEME = {
  headerBg: '#1e3a8a',       // Azul marino institucional profundo
  headerAccent: '#1d4ed8',   // Azul medio
  headerSub: '#1e40af',      // Azul insignia
  textDark: '#0f172a',       // Slate 900
  textMuted: '#475569',      // Slate 600
  textLight: '#64748b',      // Slate 500
  border: '#cbd5e1',         // Slate 300
  borderLight: '#e2e8f0',    // Slate 200
  bgLight: '#f8fafc',        // Slate 50
  bgStrip: '#f0f9ff',        // Sky 50
  borderStrip: '#bfdbfe',    // Sky 200
  // Pagado (Verde)
  paidGreen: '#15803d',      // Emerald 700
  paidGreenBg: '#f0fdf4',    // Emerald 50
  paidGreenBorder: '#bbf7d0',// Emerald 200
  // Pago Parcial (Ámbar)
  amber: '#b45309',          // Amber 700
  amberBg: '#fffbeb',        // Amber 50
  amberBorder: '#fde68a'     // Amber 200
}

// ─── FORMATEADORES AUXILIARES ──────────────────────────────────────────────
const money = (val) =>
  `$${Number(val || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

function formatFechaCorta(raw) {
  if (!raw) return '—'
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return String(raw)
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (e) {
    return String(raw)
  }
}

function formatFechaHora(raw) {
  if (!raw) return '—'
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return String(raw)
    return d.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (e) {
    return String(raw)
  }
}

// ─── NORMALIZADOR DE DATOS DE COMPROBANTE ──────────────────────────────────
function normalizeData(payload) {
  const data = Array.isArray(payload) ? (payload[0] || {}) : (payload || {})
  const factura = data.factura || {}
  const pago = data.pago || {}

  const folioPago =
    data.folio_pago ||
    pago.id ||
    pago.folio ||
    data.folio ||
    '000000'

  const facturaId =
    factura.id ||
    pago.factura_id ||
    factura.factura_id ||
    '—'

  const clienteNombre =
    factura.cliente_nombre ||
    pago.cliente_nombre ||
    data.cliente_nombre ||
    'PÚBLICO EN GENERAL'

  const direccionCliente =
    factura.direccion_cliente ||
    pago.direccion_cliente ||
    data.direccion_cliente ||
    'Domicilio conocido'

  const clienteCiudad =
    factura.cliente_ciudad ||
    pago.cliente_ciudad ||
    data.cliente_ciudad ||
    'Villa Pesqueira, Sonora'

  const medidorSerie =
    factura.medidor_serie ||
    pago.medidor_numero_serie ||
    factura.medidor?.numero_serie ||
    'S/N'

  const tarifaNombre =
    factura.tarifa_nombre ||
    pago.tarifa_nombre ||
    factura.tarifa ||
    'Doméstica'

  const periodo =
    factura.periodo ||
    pago.periodo_facturado ||
    factura.mes_facturado ||
    '—'

  const consumoM3 =
    factura.consumo_m3 !== undefined && factura.consumo_m3 !== null
      ? factura.consumo_m3
      : '—'

  const totalFactura = Number(
    factura.total ??
    pago.total_factura ??
    factura.total_factura ??
    0
  )

  const montoPagado = Number(
    pago.monto ??
    data.monto ??
    0
  )

  const cantidadRecibida = Number(
    pago.cantidad_entregada ??
    data.cantidad_entregada ??
    montoPagado
  )

  const cambio = Number(
    data.cambio ??
    (cantidadRecibida > montoPagado ? cantidadRecibida - montoPagado : 0)
  )

  const saldoRestante = Number(
    factura.saldo_restante ??
    pago.saldo_pendiente_factura ??
    factura.saldo_pendiente ??
    (totalFactura > montoPagado ? totalFactura - montoPagado : 0)
  )

  const esPagoParcial =
    data.es_pago_parcial !== undefined
      ? Boolean(data.es_pago_parcial)
      : saldoRestante > 0.01

  const metodoPago =
    pago.metodo_pago ||
    data.metodo_pago ||
    'Efectivo'

  const comentario =
    pago.comentario ||
    data.comentario ||
    ''

  const operador =
    data.operador ||
    pago.modificado_por_nombre ||
    'Ventanilla / Caja'

  const fechaPago =
    pago.fecha_pago ||
    data.fecha_pago ||
    data.fecha_hora_emision ||
    new Date().toISOString()

  const fechaEmision =
    data.fecha_hora_emision ||
    data.fecha_emision ||
    pago.fecha_creacion ||
    new Date().toISOString()

  const historialPagos = Array.isArray(data.historial_pagos)
    ? data.historial_pagos
    : []

  return {
    folioPago,
    facturaId,
    clienteNombre,
    direccionCliente,
    clienteCiudad,
    medidorSerie,
    tarifaNombre,
    periodo,
    consumoM3,
    totalFactura,
    montoPagado,
    cantidadRecibida,
    cambio,
    saldoRestante,
    esPagoParcial,
    metodoPago,
    comentario,
    operador,
    fechaPago,
    fechaEmision,
    historialPagos
  }
}

// ─── GENERADOR PRINCIPAL DEL COMPROBANTE DE PAGO EN PDFMAKE ─────────────────
export async function generarComprobantePagoPdf(rawData, options = {}) {
  ensureFonts()

  const info = normalizeData(rawData)
  const logoBase64 = getEffectiveLogoBase64(options.customLogo)

  // Dimensiones útiles: Carta Vertical (Letter Portrait: 612 x 792 pt)
  // Márgenes: [30, 24, 30, 24] -> Ancho útil: 612 - 60 = 552 pt
  const ANCHO_UTIL = 552

  const content = []

  // ── 1. ENCABEZADO INSTITUCIONAL AZUL MARINO ───────────────────────────────
  const logoCell = logoBase64
    ? { image: logoBase64, fit: [50, 50], alignment: 'center', margin: [0, 2, 0, 2] }
    : { text: 'AGUA VP', bold: true, fontSize: 13, color: '#ffffff', alignment: 'center', margin: [0, 16, 0, 0] }

  content.push({
    table: {
      widths: [58, '*', 115],
      body: [
        [
          logoCell,
          {
            stack: [
              {
                text: 'COMISIÓN MUNICIPAL DE AGUA POTABLE Y ALCANTARILLADO',
                bold: true,
                fontSize: 12,
                color: '#ffffff',
                letterSpacing: 0.3
              },
              {
                text: 'H. AYUNTAMIENTO DE VILLA PESQUEIRA, SONORA',
                bold: true,
                fontSize: 8.5,
                color: '#93c5fd',
                margin: [0, 2, 0, 0],
                letterSpacing: 0.4
              },
              {
                text: 'COMPROBANTE OFICIAL DE INGRESO Y RECAUDACIÓN',
                bold: true,
                fontSize: 8,
                color: '#dbeafe',
                margin: [0, 2, 0, 0],
                letterSpacing: 0.3
              }
            ],
            margin: [4, 2, 0, 2]
          },
          {
            fillColor: THEME.headerSub,
            stack: [
              {
                text: 'FOLIO DE PAGO',
                fontSize: 7,
                color: '#bfdbfe',
                alignment: 'center',
                bold: true,
                letterSpacing: 0.8
              },
              {
                text: `#${String(info.folioPago).padStart(6, '0')}`,
                fontSize: 16,
                color: '#ffffff',
                alignment: 'center',
                bold: true,
                margin: [0, 2, 0, 0]
              }
            ],
            margin: [0, 3, 0, 3]
          }
        ]
      ]
    },
    layout: {
      fillColor: (i, node, ci) => (ci === 2 ? THEME.headerSub : THEME.headerBg),
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 6,
      paddingBottom: () => 6
    },
    margin: [0, 0, 0, 0]
  })

  // ── 2. BANDA DE ESTATUS Y METADATOS ───────────────────────────────────────
  const badgeText = info.esPagoParcial ? '● ABONO / PAGO PARCIAL' : '● PAGADO EN SU TOTALIDAD'
  const badgeColor = info.esPagoParcial ? THEME.amber : THEME.paidGreen
  const badgeBg = info.esPagoParcial ? THEME.amberBg : THEME.paidGreenBg
  const badgeBorder = info.esPagoParcial ? THEME.amberBorder : THEME.paidGreenBorder

  content.push({
    table: {
      widths: ['*', 'auto'],
      body: [
        [
          {
            text: [
              { text: 'COMPROBANTE DE PAGO ', bold: true, color: THEME.headerBg, fontSize: 8.5 },
              { text: '· Constancia administrativa oficial para el contribuyente', color: THEME.textMuted, fontSize: 8 }
            ],
            margin: [4, 3, 0, 3]
          },
          {
            columns: [
              {
                table: {
                  body: [
                    [
                      {
                        text: badgeText,
                        fillColor: badgeBg,
                        color: badgeColor,
                        bold: true,
                        fontSize: 7.5,
                        alignment: 'center'
                      }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: () => 0.6,
                  vLineWidth: () => 0.6,
                  hLineColor: () => badgeBorder,
                  vLineColor: () => badgeBorder,
                  paddingLeft: () => 8,
                  paddingRight: () => 8,
                  paddingTop: () => 2,
                  paddingBottom: () => 2
                }
              },
              {
                text: `Emisión: ${formatFechaHora(info.fechaEmision)}`,
                fontSize: 7.5,
                color: THEME.textLight,
                bold: true,
                margin: [8, 3, 4, 0]
              }
            ],
            margin: [0, 1, 4, 1]
          }
        ]
      ]
    },
    layout: {
      fillColor: () => THEME.bgStrip,
      hLineWidth: (i) => (i === 1 ? 1 : 0),
      vLineWidth: () => 0,
      hLineColor: () => THEME.borderStrip,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 4,
      paddingBottom: () => 4
    },
    margin: [0, 0, 0, 10]
  })

  // ── 3. DOS TARJETAS: CLIENTE Y DETALLES DEL COMPROBANTE ───────────────────
  const tarjetaWidth = (ANCHO_UTIL - 12) / 2 // 270 pt cada una

  const clienteCard = {
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: 'DATOS DEL CONTRIBUYENTE / TITULAR',
            fillColor: THEME.headerBg,
            color: '#ffffff',
            bold: true,
            fontSize: 7.5,
            letterSpacing: 0.6,
            padding: [8, 4, 8, 4]
          }
        ],
        [
          {
            fillColor: '#ffffff',
            stack: [
              {
                text: String(info.clienteNombre).toUpperCase(),
                bold: true,
                fontSize: 10,
                color: THEME.textDark,
                margin: [0, 0, 0, 4]
              },
              {
                canvas: [
                  { type: 'line', x1: 0, y1: 0, x2: tarjetaWidth - 16, y2: 0, lineWidth: 0.6, lineColor: THEME.borderLight }
                ],
                margin: [0, 0, 0, 5]
              },
              {
                table: {
                  widths: [70, '*'],
                  body: [
                    [
                      { text: 'DIRECCIÓN:', fontSize: 7, bold: true, color: THEME.textLight },
                      { text: info.direccionCliente, fontSize: 8, color: THEME.textDark, alignment: 'right' }
                    ],
                    [
                      { text: 'LOCALIDAD:', fontSize: 7, bold: true, color: THEME.textLight },
                      { text: info.clienteCiudad, fontSize: 8, color: THEME.textDark, alignment: 'right' }
                    ],
                    [
                      { text: 'N° MEDIDOR:', fontSize: 7, bold: true, color: THEME.textLight },
                      { text: info.medidorSerie, fontSize: 8, bold: true, color: THEME.textDark, alignment: 'right' }
                    ],
                    [
                      { text: 'TARIFA:', fontSize: 7, bold: true, color: THEME.textLight },
                      { text: info.tarifaNombre, fontSize: 8, bold: true, color: THEME.textDark, alignment: 'right' }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: () => 0,
                  vLineWidth: () => 0,
                  paddingTop: () => 1.5,
                  paddingBottom: () => 1.5,
                  paddingLeft: () => 0,
                  paddingRight: () => 0
                }
              }
            ],
            padding: [8, 7, 8, 7]
          }
        ]
      ]
    },
    layout: {
      hLineWidth: (i) => (i === 1 ? 0 : 0.6),
      vLineWidth: () => 0.6,
      hLineColor: () => THEME.borderLight,
      vLineColor: () => THEME.borderLight,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    }
  }

  const comprobanteCard = {
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: 'DETALLES DE LA OPERACIÓN Y PAGO',
            fillColor: THEME.headerBg,
            color: '#ffffff',
            bold: true,
            fontSize: 7.5,
            letterSpacing: 0.6,
            padding: [8, 4, 8, 4]
          }
        ],
        [
          {
            fillColor: '#ffffff',
            stack: [
              {
                table: {
                  widths: [95, '*'],
                  body: [
                    [
                      { text: 'FOLIO COMPROBANTE:', fontSize: 7, bold: true, color: THEME.textLight },
                      { text: `#${String(info.folioPago).padStart(6, '0')}`, fontSize: 9, bold: true, color: THEME.headerSub, alignment: 'right' }
                    ],
                    [
                      { text: 'FACTURA / RECIBO:', fontSize: 7, bold: true, color: THEME.textLight },
                      { text: `#${info.facturaId}`, fontSize: 8.5, bold: true, color: THEME.textDark, alignment: 'right' }
                    ],
                    [
                      { text: 'PERÍODO FACTURADO:', fontSize: 7, bold: true, color: THEME.textLight },
                      { text: info.periodo, fontSize: 8, bold: true, color: THEME.textDark, alignment: 'right' }
                    ],
                    [
                      { text: 'FECHA DE PAGO:', fontSize: 7, bold: true, color: THEME.textLight },
                      { text: formatFechaCorta(info.fechaPago), fontSize: 8, bold: true, color: THEME.textDark, alignment: 'right' }
                    ],
                    [
                      { text: 'MÉTODO DE PAGO:', fontSize: 7, bold: true, color: THEME.textLight },
                      { text: info.metodoPago, fontSize: 8, bold: true, color: THEME.textDark, alignment: 'right' }
                    ],
                    [
                      { text: 'CAJERO / OPERADOR:', fontSize: 7, bold: true, color: THEME.textLight },
                      { text: info.operador, fontSize: 7.5, color: THEME.textMuted, alignment: 'right' }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: () => 0,
                  vLineWidth: () => 0,
                  paddingTop: () => 1.5,
                  paddingBottom: () => 1.5,
                  paddingLeft: () => 0,
                  paddingRight: () => 0
                }
              }
            ],
            padding: [8, 7, 8, 7]
          }
        ]
      ]
    },
    layout: {
      hLineWidth: (i) => (i === 1 ? 0 : 0.6),
      vLineWidth: () => 0.6,
      hLineColor: () => THEME.borderLight,
      vLineColor: () => THEME.borderLight,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    }
  }

  content.push({
    columns: [
      { width: tarjetaWidth, ...clienteCard },
      { width: 12, text: '' },
      { width: tarjetaWidth, ...comprobanteCard }
    ],
    margin: [0, 0, 0, 10]
  })

  // ── 4. TABLA DE CONCEPTOS FACTURADOS ──────────────────────────────────────
  content.push({
    table: {
      widths: ['*', 75, 80, 95],
      body: [
        [
          { text: 'CONCEPTO / DESCRIPCIÓN DEL SERVICIO', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.headerBg, alignment: 'left' },
          { text: 'PERÍODO', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.headerBg, alignment: 'center' },
          { text: 'CONSUMO', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.headerBg, alignment: 'center' },
          { text: 'IMPORTE FACTURA', bold: true, fontSize: 7.5, color: '#ffffff', fillColor: THEME.headerBg, alignment: 'right' }
        ],
        [
          {
            stack: [
              { text: 'Servicio de Agua Potable y Alcantarillado', bold: true, fontSize: 8.5, color: THEME.textDark },
              { text: `Factura oficial #${info.facturaId} · Tarifa regular de suministro`, fontSize: 7, color: THEME.textLight, margin: [0, 1.5, 0, 0] }
            ],
            alignment: 'left',
            margin: [0, 2, 0, 2]
          },
          { text: info.periodo, bold: true, fontSize: 8, alignment: 'center', margin: [0, 4, 0, 0] },
          { text: `${info.consumoM3} m³`, fontSize: 8, alignment: 'center', margin: [0, 4, 0, 0] },
          { text: money(info.totalFactura), bold: true, fontSize: 8.5, alignment: 'right', margin: [0, 4, 0, 0] }
        ]
      ]
    },
    layout: {
      hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.4),
      vLineWidth: () => 0.4,
      hLineColor: (i) => (i === 1 ? THEME.headerBg : THEME.borderLight),
      vLineColor: () => THEME.borderLight,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 5,
      paddingBottom: () => 5
    },
    margin: [0, 0, 0, 10]
  })

  // ── 5. SECCIÓN MEDIA: NOTA INSTITUCIONAL (IZQ) Y TOTALES DESGLOSADOS (DER) ──
  const leftColWidth = 280
  const rightColWidth = ANCHO_UTIL - leftColWidth - 12 // 260 pt

  const leftStack = []

  // Observaciones si existen
  if (info.comentario) {
    leftStack.push({
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                { text: 'OBSERVACIONES DE LA OPERACIÓN:', fontSize: 6.8, bold: true, color: THEME.textLight, letterSpacing: 0.5 },
                { text: info.comentario, fontSize: 7.5, italics: true, color: THEME.textDark, margin: [0, 2, 0, 0] }
              ],
              fillColor: THEME.bgLight,
              padding: [8, 5, 8, 5]
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => THEME.borderLight,
        vLineColor: () => THEME.borderLight,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0
      },
      margin: [0, 0, 0, 6]
    })
  }

  // Certificación y validez oficial
  leftStack.push({
    table: {
      widths: ['*'],
      body: [
        [
          {
            stack: [
              {
                text: 'CERTIFICACIÓN INSTITUCIONAL DE RECEPCIÓN DE FONDOS',
                fontSize: 6.8,
                bold: true,
                color: THEME.headerBg,
                letterSpacing: 0.4
              },
              {
                text: 'El presente comprobante ampara el ingreso correspondiente al servicio de agua potable y alcantarillado. Válido legal y administrativamente ante cualquier aclaración futura. Todo pago queda debidamente registrado en el sistema oficial del municipio.',
                fontSize: 6.5,
                color: THEME.textMuted,
                lineHeight: 1.25,
                margin: [0, 2.5, 0, 0]
              }
            ],
            fillColor: THEME.bgStrip,
            padding: [8, 6, 8, 6]
          }
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => THEME.borderStrip,
      vLineColor: () => THEME.borderStrip,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    }
  })

  // Totales desglosados (derecha)
  const totalsTableBody = [
    [
      { text: 'Total de la Factura:', fontSize: 7.5, color: THEME.textLight, bold: true },
      { text: money(info.totalFactura), fontSize: 8, bold: true, color: THEME.textDark, alignment: 'right' }
    ],
    [
      { text: info.esPagoParcial ? 'Abono Aplicado:' : 'Importe Pagado:', fontSize: 8, bold: true, color: badgeColor },
      { text: money(info.montoPagado), fontSize: 8.5, bold: true, color: badgeColor, alignment: 'right' }
    ],
    [
      { text: 'Cantidad Recibida:', fontSize: 7.5, color: THEME.textLight },
      { text: money(info.cantidadRecibida), fontSize: 7.5, color: THEME.textDark, alignment: 'right' }
    ]
  ]

  if (info.cambio > 0) {
    totalsTableBody.push([
      { text: 'Cambio Entregado:', fontSize: 7.5, color: THEME.amber, bold: true },
      { text: money(info.cambio), fontSize: 7.5, bold: true, color: THEME.amber, alignment: 'right' }
    ])
  }

  totalsTableBody.push([
    {
      text: 'Saldo Pendiente:',
      fontSize: 8.5,
      bold: true,
      color: info.saldoRestante > 0 ? THEME.amber : THEME.paidGreen,
      margin: [0, 2, 0, 0]
    },
    {
      text: money(info.saldoRestante),
      fontSize: 9.5,
      bold: true,
      color: info.saldoRestante > 0 ? THEME.amber : THEME.paidGreen,
      alignment: 'right',
      margin: [0, 2, 0, 0]
    }
  ])

  const totalsBox = {
    table: {
      widths: ['*', 'auto'],
      body: totalsTableBody
    },
    layout: {
      fillColor: () => THEME.bgLight,
      hLineWidth: (i, node) => (i === node.table.body.length - 1 ? 0.8 : 0.4),
      vLineWidth: () => 0.4,
      hLineColor: (i, node) => (i === node.table.body.length - 1 ? THEME.border : THEME.borderLight),
      vLineColor: () => THEME.borderLight,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 2.5,
      paddingBottom: () => 2.5
    }
  }

  content.push({
    columns: [
      { width: leftColWidth, stack: leftStack },
      { width: 12, text: '' },
      { width: rightColWidth, ...totalsBox }
    ],
    margin: [0, 0, 0, 8]
  })

  // ── 6. BANNER PRINCIPAL DESTACADO (MONTO PAGADO) ──────────────────────────
  content.push({
    table: {
      widths: ['*', 'auto'],
      body: [
        [
          {
            stack: [
              {
                text: info.esPagoParcial ? 'ABONO PARCIAL REGISTRADO' : 'TOTAL PAGADO EN VENTANILLA',
                fontSize: 10,
                bold: true,
                color: '#ffffff',
                letterSpacing: 0.8
              },
              {
                text: info.esPagoParcial
                  ? 'PAGO PARCIAL APLICADO A CUENTA · SUJETO A LIQUIDACIÓN POSTERIOR'
                  : 'IMPORTE CUBIERTO SATISFACTORIAMENTE EN CAJA',
                fontSize: 6.8,
                color: info.esPagoParcial ? '#fef08a' : '#dcfce7',
                margin: [0, 1.5, 0, 0]
              }
            ],
            margin: [4, 2, 0, 2]
          },
          {
            text: `${money(info.montoPagado)} MXN`,
            fontSize: 20,
            bold: true,
            color: '#ffffff',
            alignment: 'right',
            margin: [0, 0, 4, 0]
          }
        ]
      ]
    },
    layout: {
      fillColor: () => (info.esPagoParcial ? THEME.amber : THEME.paidGreen),
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 10,
      paddingRight: () => 10,
      paddingTop: () => 6,
      paddingBottom: () => 6
    },
    margin: [0, 0, 0, 8]
  })

  // ── 7. HISTORIAL DE PAGOS (SI CONTIENE REGISTROS) ─────────────────────────
  if (info.historialPagos && info.historialPagos.length > 0) {
    const historyRows = [
      [
        { text: 'FOLIO', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.headerBg, alignment: 'center' },
        { text: 'FECHA DE PAGO', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.headerBg, alignment: 'center' },
        { text: 'MÉTODO', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.headerBg, alignment: 'left' },
        { text: 'MONTO ABONADO', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.headerBg, alignment: 'right' },
        { text: 'ESTADO', bold: true, fontSize: 7, color: '#ffffff', fillColor: THEME.headerBg, alignment: 'center' }
      ]
    ]

    info.historialPagos.forEach((p, idx) => {
      const esCurrent = String(p.id) === String(info.folioPago)
      const pMonto = Number(p.monto || 0)
      const pFecha = p.fecha_pago ? formatFechaCorta(p.fecha_pago) : '—'
      const pMetodo = p.metodo_pago || '—'
      const rowFill = esCurrent ? THEME.paidGreenBg : (idx % 2 === 0 ? '#ffffff' : THEME.bgLight)

      historyRows.push([
        { text: `#${p.id || idx + 1}`, fontSize: 7.5, bold: esCurrent, color: esCurrent ? THEME.paidGreen : THEME.textLight, alignment: 'center', fillColor: rowFill },
        { text: pFecha, fontSize: 7.5, bold: esCurrent, color: THEME.textDark, alignment: 'center', fillColor: rowFill },
        { text: pMetodo, fontSize: 7.5, color: THEME.textMuted, alignment: 'left', fillColor: rowFill },
        { text: money(pMonto), fontSize: 7.5, bold: true, color: esCurrent ? THEME.paidGreen : THEME.textDark, alignment: 'right', fillColor: rowFill },
        {
          text: esCurrent ? 'ESTE PAGO' : 'ANTERIOR',
          fontSize: 6.8,
          bold: true,
          color: esCurrent ? THEME.paidGreen : THEME.textLight,
          alignment: 'center',
          fillColor: rowFill
        }
      ])
    })

    content.push({
      text: `HISTORIAL DE PAGOS REGISTRADOS — FACTURA #${info.facturaId}`,
      bold: true,
      fontSize: 7.5,
      color: THEME.headerBg,
      letterSpacing: 0.4,
      margin: [0, 0, 0, 3]
    })

    content.push({
      table: {
        widths: [50, 95, 120, 110, '*'],
        body: historyRows
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 0.6 : 0.3),
        vLineWidth: () => 0.3,
        hLineColor: () => THEME.borderLight,
        vLineColor: () => THEME.borderLight,
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 2.5,
        paddingBottom: () => 2.5
      },
      margin: [0, 0, 0, 8]
    })
  }

  // ── 8. PIE DE PÁGINA: ATENDIDO POR Y FIRMA / SELLO ────────────────────────
  content.push({
    table: {
      widths: ['*', 170],
      body: [
        [
          {
            stack: [
              {
                text: [
                  { text: 'Atendido por: ', fontSize: 7.5, color: THEME.textLight, bold: true },
                  { text: String(info.operador).toUpperCase(), fontSize: 8, bold: true, color: THEME.textDark }
                ]
              },
              {
                text: `Sistema AguaVP · Organismo Operador de Agua Potable de Villa Pesqueira, Sonora · Ejercicio ${new Date().getFullYear()}`,
                fontSize: 6.8,
                color: THEME.textLight,
                margin: [0, 2, 0, 0]
              },
              {
                text: 'Este comprobante tiene plena validez fiscal y administrativa sin tachaduras ni enmendaduras.',
                fontSize: 6.5,
                italics: true,
                color: THEME.textLight,
                margin: [0, 1.5, 0, 0]
              }
            ],
            margin: [2, 4, 0, 0]
          },
          {
            stack: [
              {
                canvas: [
                  { type: 'line', x1: 15, y1: 0, x2: 155, y2: 0, lineWidth: 0.8, lineColor: THEME.border }
                ],
                margin: [0, 18, 0, 0]
              },
              {
                text: 'FIRMA / SELLO DE CAJA',
                fontSize: 7,
                bold: true,
                color: THEME.textLight,
                alignment: 'center',
                letterSpacing: 0.6,
                margin: [0, 3, 0, 0]
              }
            ]
          }
        ]
      ]
    },
    layout: {
      fillColor: () => THEME.bgLight,
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      hLineColor: () => THEME.borderLight,
      vLineColor: () => THEME.borderLight,
      paddingLeft: () => 10,
      paddingRight: () => 10,
      paddingTop: () => 6,
      paddingBottom: () => 6
    },
    margin: [0, 4, 0, 0]
  })

  // ── DEFINICIÓN DEL DOCUMENTO ──────────────────────────────────────────────
  const docDefinition = {
    pageSize: 'LETTER',
    pageOrientation: 'portrait',
    pageMargins: [30, 24, 30, 24],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 7.5,
      color: THEME.textDark
    },
    content
  }

  const pdfDoc = pdfmake.createPdf(docDefinition)
  return await pdfDoc.getBuffer()
}
