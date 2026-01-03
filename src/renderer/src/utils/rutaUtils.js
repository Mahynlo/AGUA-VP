// utils/rutaUtils.js
// Utilidades compartidas para la gestión de rutas

/**
 * Determina el prefijo dominante (más frecuente) en un array de números de serie
 * @param {Array<string>} arr - Array de números de serie
 * @returns {string} - Prefijo dominante (NG, MP, AD)
 */
export const prefijoDominante = (arr = []) => {
  const freq = {};
  arr.forEach(s => {
    const p = s.slice(0, 2).toUpperCase();
    freq[p] = (freq[p] || 0) + 1;
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
};

/**
 * Retorna la imagen correspondiente según el prefijo
 * @param {string} prefijo - Prefijo de la ruta (NG, MP, AD)
 * @returns {string} - Path de la imagen
 */
export const imgPorPrefijo = (prefijo, imagenes) => {
  const p = prefijo?.toUpperCase();
  if (p === "NG") return imagenes.nacori;
  if (p === "MP") return imagenes.matape;
  if (p === "AD") return imagenes.adivino;
  return imagenes.nacori; // Por defecto
};

/**
 * Genera opciones de periodos (meses) para seleccionar
 * @param {number} cantidadMeses - Cantidad de meses hacia atrás
 * @returns {Array<{val: string, label: string}>} - Lista de periodos
 */
export const generarOpcionesPeriodo = (cantidadMeses = 12) => {
  const hoy = new Date();
  const lista = [];
  for (let i = 0; i < cantidadMeses; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const val = d.toISOString().slice(0, 7); // YYYY-MM
    const label = d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    lista.push({ val, label });
  }
  return lista;
};

/**
 * Valida los campos requeridos para crear/editar una ruta
 * @param {Object} datos - Datos de la ruta
 * @returns {Object} - Objeto con errores encontrados
 */
export const validarCamposRuta = (datos) => {
  const errores = {};
  
  if (!datos.nombre?.trim()) {
    errores.nombre = true;
  }
  
  if (!datos.descripcion?.trim()) {
    errores.descripcion = true;
  }
  
  if (!datos.puntosRuta || datos.puntosRuta.length < 2) {
    errores.puntos = true;
  }
  
  if (!datos.rutaCalculada || 
      !Array.isArray(datos.rutaCalculada.ruta) || 
      datos.rutaCalculada.ruta.length === 0) {
    errores.rutaCalculada = true;
  }
  
  return errores;
};

/**
 * Genera un mensaje de error descriptivo según los campos faltantes
 * @param {Object} errores - Objeto con los errores
 * @returns {string} - Mensaje de error
 */
export const generarMensajeError = (errores) => {
  const camposFaltantes = [];
  
  if (errores.nombre) camposFaltantes.push("Nombre");
  if (errores.descripcion) camposFaltantes.push("Descripción");
  if (errores.puntos) camposFaltantes.push("Al menos 2 puntos en el mapa");
  if (errores.rutaCalculada) camposFaltantes.push("Ruta calculada (usa 'Dibujar Ruta')");
  
  return `Los siguientes campos son obligatorios: ${camposFaltantes.join(", ")}`;
};

/**
 * Calcula estadísticas generales de rutas
 * @param {Array} rutas - Array de rutas
 * @returns {Object} - Objeto con estadísticas calculadas
 */
export const calcularEstadisticasRutas = (rutas = []) => {
  const totalRutas = rutas.length;
  const rutasCompletas = rutas.filter(r => r.completadas === r.total_puntos).length;
  const rutasPendientes = rutas.filter(r => r.completadas < r.total_puntos).length;
  const totalLecturas = rutas.reduce((acc, r) => acc + (r.total_puntos || 0), 0);
  const lecturasCompletadas = rutas.reduce((acc, r) => acc + (r.completadas || 0), 0);
  const porcentajeProgreso = totalLecturas > 0 
    ? Math.round((lecturasCompletadas / totalLecturas) * 100) 
    : 0;
  
  return {
    totalRutas,
    rutasCompletas,
    rutasPendientes,
    totalLecturas,
    lecturasCompletadas,
    porcentajeProgreso
  };
};

/**
 * Prepara los datos de la ruta para enviar al API
 * @param {Object} params - Parámetros de la ruta
 * @returns {Object} - Objeto formateado para el API
 */
export const prepararDatosRuta = ({ nombre, descripcion, puntosRuta, rutaCalculada, userId }) => {
  return {
    nombre,
    descripcion,
    puntos: puntosRuta.map(p => ({ id: p.id })),
    ruta_calculada: rutaCalculada?.ruta || [],
    distancia_km: rutaCalculada?.distancia_total_km || 0,
    instrucciones: rutaCalculada?.instrucciones || [],
    creado_por: userId,
  };
};

/**
 * Prepara los datos de la ruta para actualización
 * @param {Object} params - Parámetros de la ruta
 * @returns {Object} - Objeto formateado para actualización
 */
export const prepararDatosActualizacion = ({ nombre, descripcion, puntosRuta, rutaCalculada }) => {
  return {
    nombre,
    descripcion,
    puntos: puntosRuta.map(p => ({ id: p.id })),
    ruta_calculada: (rutaCalculada?.ruta || []).map(coord => ({
      lat: coord[0],
      lng: coord[1]
    })),
    distancia_km: rutaCalculada?.distancia_total_km || 0,
    instrucciones: rutaCalculada?.instrucciones?.map(inst => inst.accion) || [],
  };
};
