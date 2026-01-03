/**
 * Utilidades para cálculos estadísticos de clientes
 * Funciones puras para análisis de datos
 */

/**
 * Calcula estadísticas generales de clientes
 * @param {Array} clientes - Array de clientes
 * @returns {Object} - Estadísticas calculadas
 */
export const calcularEstadisticas = (clientes) => {
  if (!clientes || clientes.length === 0) {
    return {
      total: 0,
      activos: 0,
      nuevosEsteMes: 0,
      ciudades: 0,
      porcentajeActivos: 0
    };
  }

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const nuevosEsteMes = clientes.filter(cliente => {
    if (cliente.fechaRegistro || cliente.fecha_creacion) {
      const fechaRegistro = new Date(cliente.fechaRegistro || cliente.fecha_creacion);
      return fechaRegistro >= inicioMes;
    }
    return false;
  }).length;

  const activos = clientes.filter(
    cliente => cliente.estado_cliente === "Activo" || cliente.estado === "Activo" || !cliente.estado_cliente
  ).length;

  const ciudadesUnicas = [...new Set(clientes.map(cliente => cliente.ciudad))].filter(Boolean).length;

  return {
    total: clientes.length,
    activos,
    nuevosEsteMes,
    ciudades: ciudadesUnicas,
    porcentajeActivos: clientes.length > 0 ? ((activos / clientes.length) * 100).toFixed(1) : 0
  };
};

/**
 * Calcula el crecimiento mensual de clientes
 * @param {Array} clientes - Array de clientes
 * @param {string} periodo - Periodo a analizar ('6meses', '12meses', etc.)
 * @returns {Object} - Datos de crecimiento
 */
export const calcularCrecimiento = (clientes, periodo = '6meses') => {
  const hoy = new Date();
  const mesesAtras = periodo === '12meses' ? 12 : 6;
  const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, 1);
  
  const clientesEnPeriodo = clientes.filter(cliente => {
    if (cliente.fechaRegistro || cliente.fecha_creacion) {
      const fechaRegistro = new Date(cliente.fechaRegistro || cliente.fecha_creacion);
      return fechaRegistro >= fechaInicio;
    }
    return false;
  });

  // Agrupar por mes
  const porMes = {};
  clientesEnPeriodo.forEach(cliente => {
    const fecha = new Date(cliente.fechaRegistro || cliente.fecha_creacion);
    const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    porMes[mesAno] = (porMes[mesAno] || 0) + 1;
  });

  return {
    total: clientesEnPeriodo.length,
    porMes,
    promedioPorMes: clientesEnPeriodo.length / mesesAtras
  };
};

/**
 * Agrupa clientes por ciudad
 * @param {Array} clientes - Array de clientes
 * @returns {Object} - Clientes agrupados por ciudad
 */
export const agruparPorCiudad = (clientes) => {
  const porCiudad = {};
  
  clientes.forEach(cliente => {
    const ciudad = cliente.ciudad || 'Sin ciudad';
    if (!porCiudad[ciudad]) {
      porCiudad[ciudad] = [];
    }
    porCiudad[ciudad].push(cliente);
  });

  return porCiudad;
};

/**
 * Calcula estadísticas por ciudad
 * @param {Array} clientes - Array de clientes
 * @returns {Array} - Array de objetos con estadísticas por ciudad
 */
export const calcularEstadisticasPorCiudad = (clientes) => {
  const porCiudad = agruparPorCiudad(clientes);
  
  return Object.entries(porCiudad).map(([ciudad, clientesCiudad]) => ({
    ciudad,
    total: clientesCiudad.length,
    activos: clientesCiudad.filter(c => c.estado_cliente === "Activo" || c.estado === "Activo").length,
    porcentaje: ((clientesCiudad.length / clientes.length) * 100).toFixed(1)
  })).sort((a, b) => b.total - a.total);
};

/**
 * Calcula el porcentaje de clientes activos
 * @param {Array} clientes - Array de clientes
 * @returns {number} - Porcentaje de activos
 */
export const calcularPorcentajeActivos = (clientes) => {
  if (!clientes || clientes.length === 0) return 0;
  
  const activos = clientes.filter(
    c => c.estado_cliente === "Activo" || c.estado === "Activo" || !c.estado_cliente
  ).length;
  
  return ((activos / clientes.length) * 100).toFixed(1);
};

/**
 * Obtiene los clientes más recientes
 * @param {Array} clientes - Array de clientes
 * @param {number} limite - Número de clientes a retornar
 * @returns {Array} - Clientes más recientes
 */
export const obtenerClientesRecientes = (clientes, limite = 5) => {
  return [...clientes]
    .filter(c => c.fechaRegistro || c.fecha_creacion)
    .sort((a, b) => {
      const fechaA = new Date(a.fechaRegistro || a.fecha_creacion);
      const fechaB = new Date(b.fechaRegistro || b.fecha_creacion);
      return fechaB - fechaA;
    })
    .slice(0, limite);
};

/**
 * Genera datos para gráficas de clientes por mes
 * @param {Array} clientes - Array de clientes
 * @param {number} meses - Número de meses a incluir
 * @returns {Array} - Datos formateados para gráficas
 */
export const generarDatosGraficaMeses = (clientes, meses = 6) => {
  const hoy = new Date();
  const datos = [];

  for (let i = meses - 1; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const nombreMes = fecha.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
    
    const clientesDelMes = clientes.filter(cliente => {
      if (cliente.fechaRegistro || cliente.fecha_creacion) {
        const fechaRegistro = new Date(cliente.fechaRegistro || cliente.fecha_creacion);
        return fechaRegistro.getFullYear() === fecha.getFullYear() &&
               fechaRegistro.getMonth() === fecha.getMonth();
      }
      return false;
    }).length;

    datos.push({
      mes: nombreMes,
      mesAno,
      cantidad: clientesDelMes
    });
  }

  return datos;
};
