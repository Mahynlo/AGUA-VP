/**
 * Obtiene la URL base (Reutilizamos la lógica que ya tenías)
 */
export const obtenerURLBase = () => {
    const currentUrl = window.location.href;
    const currentOrigin = window.location.origin;
    
    // Desarrollo
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        return currentOrigin;
    }
    // Producción (Electron file://)
    if (window.location.protocol === 'file:') {
        return currentUrl.split('#')[0];
    }
    return currentOrigin;
};

/**
 * Construye la URL para imprimir cualquier tipo de reporte
 * @param {Array} datos - Array de objetos a imprimir
 * @param {string} tipoReporte - Identificador ('clientes', 'deudores', 'lecturas')
 * @param {boolean} esPrevisualizacion
 */
export const construirURLReporte = (datos, tipoReporte, esPrevisualizacion = false) => {
    // 1. Mapeo de rutas (Asegúrate de tener estas rutas en tu App.jsx)
    const rutasReportes = {
        'clientes': '/reporteClientes',
        'deudores': '/print/reporte-deudores',
        'lecturas': '/reporteLecturas',
        'pagos': '/print/historial-pagos'
    };

    const ruta = rutasReportes[tipoReporte];
    
    if (!ruta) {
        console.error(`Tipo de reporte no configurado: ${tipoReporte}`);
        return null;
    }

    // 2. Serializar datos
    // Nota: Si son miles de datos, considera usar localStorage o IPC en lugar de URL
    const datosSerializados = encodeURIComponent(JSON.stringify(datos));
    const baseUrl = obtenerURLBase();

    // 3. Construir URL
    // Agregamos timestamp (t) para evitar caché en previsualizaciones
    return `${baseUrl}#${ruta}?data=${datosSerializados}&preview=${esPrevisualizacion}&t=${Date.now()}`;
};