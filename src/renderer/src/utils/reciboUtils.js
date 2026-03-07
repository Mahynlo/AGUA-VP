/**
 * Utilidades para manejo de recibos e impresión
 */

/**
 * Genera opciones de períodos para los últimos N meses
 * @param {number} cantidadMeses - Cantidad de meses a generar (default: 12)
 * @returns {Array} Array de objetos {value, label}
 */
export const generarOpcionesPeriodos = (cantidadMeses = 12) => {
  const opciones = [];
  const hoy = new Date();
  
  for (let i = 0; i < cantidadMeses; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const periodo = fecha.toISOString().slice(0, 7); // YYYY-MM
    const nombreMes = fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    opciones.push({
      value: periodo,
      label: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
    });
  }
  
  return opciones;
};

/**
 * Filtra facturas que tengan lecturas válidas
 * @param {Array} facturas - Array de facturas
 * @returns {Array} Facturas con lecturas válidas
 */
export const filtrarFacturasConLecturas = (facturas) => {
  return facturas.filter(factura => 
    factura.saldo_pendiente !== null && 
    factura.total > 0 &&
    factura.consumo_m3 > 0
  );
};

/**
 * Agrupa recibos en páginas (2 por página)
 * @param {Array} facturas - Array de facturas a imprimir
 * @returns {Array} Array de arrays, cada uno con máximo 2 facturas
 */
export const agruparRecibosPorPagina = (facturas) => {
  const paginas = [];
  for (let i = 0; i < facturas.length; i += 2) {
    const recibosPagina = facturas.slice(i, i + 2);
    paginas.push(recibosPagina);
  }
  return paginas;
};

/**
 * Obtiene la URL base correcta según el entorno
 * @returns {string} URL base
 */
export const obtenerURLBase = () => {
  const currentUrl = window.location.href;
  const currentOrigin = window.location.origin;
  
  // En desarrollo (http://localhost:5173)
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    return currentOrigin;
  }
  
  // En producción empaquetada (file:// protocol)
  if (window.location.protocol === 'file:') {
    // Obtener la base sin el hash
    const basePath = currentUrl.split('#')[0];
    return basePath;
  }
  
  // Fallback
  return currentOrigin;
};

/**
 * Construye URL para impresión con datos de facturas
 * @param {Array} facturas - Facturas a imprimir
 * @param {boolean} esPrevisualizacion - Si es vista previa o impresión directa
 * @returns {string} URL completa con datos codificados
 */
export const construirURLImpresion = async (facturas, esPrevisualizacion = false) => {
  const paginasRecibos = agruparRecibosPorPagina(facturas);
  const baseUrl = obtenerURLBase();
  
  // Guardar datos usando IPC (FileSystem) - Devuelve UUID
  const dataKey = await window.api.savePrintData(JSON.stringify(paginasRecibos));
  
  // SOLUCIÓN ROBUSTA: Construcción explícita basada en window.location
  const { protocol, origin, href } = window.location;

  // Producción (Electron empaquetado - protocolo file:)
  if (protocol === 'file:') {
    // Tomamos la ruta base completa hasta antes del hash
    // Ejemplo: file:///C:/Users/App/index.html
    const base = href.split('#')[0];
    
    // IMPORTANTE: Asegurar que termine en / si es necesario, pero split('#')[0] suele ser correcto.
    // Concatenamos el hash.
    return `${base}#/recibo?print=true&dataKey=${dataKey}`;
  }

  // Desarrollo (Vite / localhost)
  // Usamos origin (http://localhost:5173) + / + hash
  return `${origin}/#/recibo?print=true&dataKey=${dataKey}`;
};

/**
 * Calcula estadísticas de impresión
 * @param {Array} facturas - Facturas seleccionadas
 * @returns {Object} Objeto con totales calculados
 */
export const calcularEstadisticas = (facturas) => {
  return {
    totalCobrar: facturas.reduce((sum, f) => sum + (f.total || 0), 0),
    consumoTotal: facturas.reduce((sum, f) => sum + (f.consumo_m3 || 0), 0),
    adeudosTotal: facturas.reduce((sum, f) => sum + (f.saldo_pendiente || 0), 0),
    cantidadRecibos: facturas.length,
    paginasEstimadas: Math.ceil(facturas.length / 2),
    recibosPorPagina: facturas.length % 2 === 1 ? '1+1' : '2'
  };
};

/**
 * Genera datos mock para pruebas
 * @returns {Array} Array de facturas mock
 */
export const generarDatosMock = () => {
    // ... (mantener existente)
    return [
       // ...
    ];
};

/**
 * Adapta el objeto de recibo de la API v2 al formato esperado por el componente Recibo
 * @param {Object} reciboAPI - Objeto devuelto por /api/v2/reports/recibos
 * @returns {Object} Objeto con estructura legacy para Recibo.jsx
 */
export const adaptarReciboAPI = (reciboAPI) => {
    console.log("Datos recibo API:", reciboAPI); // Debug
    return {
        id: reciboAPI.folio_factura,
        cliente_nombre: reciboAPI.datos_cliente.nombre,
        direccion_cliente: reciboAPI.datos_cliente.direccion,
        cliente_ciudad: reciboAPI.datos_cliente.pueblo,
        
        // Consumo y Medición
        consumo_m3: reciboAPI.informacion_servicio.consumo_mes_m3,
        lectura_anterior: reciboAPI.informacion_servicio.lectura_anterior,
        lectura_actual: reciboAPI.informacion_servicio.lectura_actual,
        
        // Datos de Servicio directos
        tarifa_nombre: reciboAPI.informacion_servicio.tarifa_nombre || "Doméstica",
        ruta: { nombre: reciboAPI.informacion_servicio.ruta_nombre || "N/A" },
        medidor: { numero_serie: reciboAPI.informacion_servicio.numero_medidor || "S/N" },
        
        // Facturación
        mes_facturado: reciboAPI.detalle_facturacion.mes_facturado || "PERIODO ACTUAL",
        fecha_emision: reciboAPI.detalle_facturacion.fecha_lectura 
            ? new Date(reciboAPI.detalle_facturacion.fecha_lectura).toISOString() 
            : new Date().toISOString(),
        
        // Montos
        total: reciboAPI.detalle_facturacion.total_mes, // Lo que se facturó este mes
        saldo_pendiente: reciboAPI.detalle_facturacion.deuda_acumulada_anterior, // Deudas previas
        
        // Info Extra (Estadísticas)
        stats: {
            anterior: reciboAPI.informacion_consumo?.consumo_anterior,
            promedio: reciboAPI.informacion_consumo?.consumo_actual, // Usar actual como proxy si promedio no viene
            variacion: reciboAPI.informacion_consumo?.variacion_porcentaje
        },
        // Historial de Consumo (Formateado para Gráfica)
        historicoConsumo: (reciboAPI.informacion_consumo?.historial_ano_actual || []).map(h => {
             // Convertir YYYY-MM a "Ene", "Feb"...
             const [y, m] = h.mes.split('-');
             const date = new Date(parseInt(y), parseInt(m) - 1, 1);
             const mesNombre = date.toLocaleDateString('es-MX', { month: 'short' });
             return {
                 mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
                 consumo: h.consumo
             };
        })
    };
};

/**
 * Imprime información de debug en consola
 * @param {Object} config - Configuración de debug
 */
export const imprimirDebugInfo = ({ facturas, seleccionados, periodo }) => {
  console.log('=== URL TEST ===');
  console.log('Base URL:', obtenerURLBase());
  console.log('Facturas disponibles:', facturas.length);
  console.log('Clientes seleccionados:', seleccionados.size);
  console.log('Período:', periodo);
  console.log('Environment:', window.location.protocol === 'file:' ? 'Production (Packaged)' : 'Development');
  console.log('===============');
};

