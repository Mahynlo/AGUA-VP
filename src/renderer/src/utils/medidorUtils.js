/**
 * Utilidades para manejo de medidores
 * Funciones puras para operaciones con medidores
 */

/**
 * Filtra medidores disponibles (sin cliente asignado)
 * @param {Array} medidores - Array de medidores
 * @returns {Array} - Medidores disponibles
 */
export const filtrarMedidoresDisponibles = (medidores) => {
  return medidores.filter(medidor => !medidor.cliente_id);
};

/**
 * Obtiene medidores asignados a un cliente específico
 * @param {Array} medidores - Array de medidores
 * @param {number} clienteId - ID del cliente
 * @returns {Array} - Medidores del cliente
 */
export const obtenerMedidoresCliente = (medidores, clienteId) => {
  return medidores.filter(medidor => medidor.cliente_id === clienteId);
};

/**
 * Determina el estado de un medidor
 * @param {Object} medidor - Objeto medidor
 * @param {number} clienteId - ID del cliente actual (opcional)
 * @returns {Object} - Estado con color y texto
 */
export const obtenerEstadoMedidor = (medidor, clienteId = null) => {
  if (!medidor.cliente_id) {
    return {
      estado: 'libre',
      color: 'warning',
      texto: 'Libre',
      disponible: true
    };
  } else if (medidor.cliente_id === clienteId) {
    return {
      estado: 'propio',
      color: 'primary',
      texto: 'De este cliente',
      disponible: true
    };
  } else {
    return {
      estado: 'asignado',
      color: 'success',
      texto: 'Asignado',
      disponible: false
    };
  }
};

/**
 * Formatea el número de serie de un medidor
 * @param {string} serie - Número de serie
 * @returns {string} - Serie formateada
 */
export const formatearNumeroSerie = (serie) => {
  if (!serie) return "Sin serie";
  return serie.toUpperCase().trim();
};

/**
 * Busca medidores por texto (número de serie o ubicación)
 * @param {Array} medidores - Array de medidores
 * @param {string} busqueda - Texto de búsqueda
 * @returns {Array} - Medidores que coinciden
 */
export const buscarMedidores = (medidores, busqueda) => {
  if (!busqueda || !busqueda.trim()) return [];
  
  const textoBusqueda = busqueda.toLowerCase().trim();
  
  return medidores.filter(medidor => {
    const numeroSerie = (medidor.numero_serie || '').toLowerCase();
    const ubicacion = (medidor.ubicacion || '').toLowerCase();
    const nombreCliente = (medidor.cliente_nombre || '').toLowerCase();
    
    return numeroSerie.includes(textoBusqueda) || 
           ubicacion.includes(textoBusqueda) ||
           nombreCliente.includes(textoBusqueda);
  });
};

/**
 * Agrupa medidores por estado
 * @param {Array} medidores - Array de medidores
 * @returns {Object} - Medidores agrupados
 */
export const agruparMedidoresPorEstado = (medidores) => {
  return {
    libres: medidores.filter(m => !m.cliente_id),
    asignados: medidores.filter(m => m.cliente_id),
    activos: medidores.filter(m => m.estado === 'Activo'),
    inactivos: medidores.filter(m => m.estado === 'Inactivo')
  };
};

/**
 * Valida si un medidor puede ser asignado a un cliente
 * @param {Object} medidor - Medidor a validar
 * @param {number} clienteId - ID del cliente
 * @returns {Object} - Resultado de validación
 */
export const validarAsignacionMedidor = (medidor, clienteId) => {
  if (!medidor) {
    return { valido: false, mensaje: 'Medidor no encontrado' };
  }

  if (medidor.cliente_id && medidor.cliente_id !== clienteId) {
    return { 
      valido: false, 
      mensaje: `Este medidor ya está asignado a otro cliente: ${medidor.cliente_nombre || 'Desconocido'}` 
    };
  }

  if (medidor.estado === 'Inactivo') {
    return { 
      valido: false, 
      mensaje: 'Este medidor está inactivo y no puede ser asignado' 
    };
  }

  return { valido: true, mensaje: 'Medidor disponible para asignación' };
};

/**
 * Genera un ID de medidor único
 * @param {string} ciudad - Ciudad del cliente
 * @param {number} numero - Número secuencial
 * @returns {string} - ID del medidor
 */
export const generarIdMedidor = (ciudad, numero) => {
  const prefijos = {
    'Nacori Grande': 'NG',
    'Matape': 'MP',
    'Adivino': 'AD'
  };
  
  const prefijo = prefijos[ciudad] || 'GEN';
  return `${prefijo}-${String(numero).padStart(6, '0')}`;
};
