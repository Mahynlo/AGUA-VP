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
  reportefinancieropagos: 'reporte_financiero',
  reportelecturasmetricas: 'reporte_metricas_lecturas',
  reportegeneral: 'reporte_general'
}

// Extrae la ruta (en minúsculas) y los parámetros del hash de una URL de impresión
// (ej. 'http://localhost/#/reporteGeneral?print=true&dataKey=…').
export const parsePrintUrl = (url) => {
  const hashMatch = url.match(/#\/([^?#]+)(?:\?([^#]*))?/)
  const route = hashMatch ? hashMatch[1].toLowerCase() : ''
  const params = new URLSearchParams(hashMatch ? hashMatch[2] || '' : '')
  return { route, params }
}

// Nombre del PDF temporal: aguavp_<documento>_<mes>_<año> o aguavp_<documento>_<timestamp>
export const buildPdfFilename = (url) => {
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
