// Opciones base de impresión / printToPDF de Chromium
export const DEFAULT_PRINT_OPTIONS = {
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

// Normalizar pageSize (Electron requiere Capitalized). Modifica el objeto recibido.
export const normalizePageSize = (opts) => {
  if (opts.pageSize) {
    const size = String(opts.pageSize).toLowerCase()
    if (size === 'letter') opts.pageSize = 'Letter'
    else if (size === 'legal') opts.pageSize = 'Legal'
    else if (size === 'a4') opts.pageSize = 'A4'
  }
}
