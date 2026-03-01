/**
 * Utilidades de validación para clientes
 * Funciones puras para validar datos de clientes
 */

/**
 * Valida todos los campos requeridos de un cliente
 * @param {Object} datos - Datos del cliente a validar
 * @param {Object} opciones - Opciones de validación
 * @param {boolean} opciones.esEdicion - Si es modo edición
 * @param {boolean} opciones.tieneTarifaAsignada - Si el cliente ya tiene una tarifa asignada
 * @returns {Object} - Objeto con los campos que tienen errores
 */
export const validarCamposCliente = (datos, opciones = {}) => {
  const { esEdicion = false, tieneTarifaAsignada = false } = opciones;
  const errores = {};

  if (!datos.nombre?.trim()) errores.nombre = true;
  if (!datos.direccion?.trim()) errores.direccion = true;
  if (!datos.telefono?.trim()) errores.telefono = true;
  if (!datos.ciudad?.trim()) errores.ciudad = true;
  if (!datos.correo?.trim()) errores.correo = true;
  
  // La tarifa solo es obligatoria al crear o al editar si no tiene tarifa asignada
  if (!esEdicion || !tieneTarifaAsignada) {
    if (!datos.tarifaSeleccionada) errores.tarifa = true;
  }

  return errores;
};

/**
 * Obtiene la lista de nombres de campos faltantes en español
 * @param {Object} errores - Objeto de errores de validación
 * @returns {Array<string>} - Array con nombres de campos en español
 */
export const obtenerCamposFaltantes = (errores) => {
  return Object.keys(errores).map((campo) => {
    const nombresCampos = {
      nombre: "Nombre",
      direccion: "Dirección",
      telefono: "Teléfono",
      ciudad: "Ciudad",
      correo: "Correo Electrónico",
      tarifa: "Tarifa"
    };
    return nombresCampos[campo] || campo;
  });
};

/**
 * Limpia y formatea los datos del cliente antes de enviar al servidor
 * @param {Object} datos - Datos del cliente
 * @returns {Object} - Datos limpios
 */
export const limpiarDatosCliente = (datos) => {
  return {
    numero_predio: datos.numero_predio?.trim().toUpperCase() || null,
    nombre: datos.nombre?.trim() || "",
    direccion: datos.direccion?.trim() || "",
    telefono: datos.telefono?.trim() || "",
    ciudad: datos.ciudad?.trim() || "",
    correo: datos.correo?.trim().toLowerCase() || "",
    tarifa_id: datos.tarifaSeleccionada || null,
    estado_cliente: datos.estadoCliente || "Activo"
  };
};

/**
 * Formatea un número de teléfono a formato estándar
 * @param {string} telefono - Número de teléfono
 * @returns {string} - Teléfono formateado
 */
export const formatearTelefono = (telefono) => {
  if (!telefono) return "";
  
  // Remover todo excepto números
  const soloNumeros = telefono.replace(/\D/g, "");
  
  // Formatear si tiene 10 dígitos
  if (soloNumeros.length === 10) {
    return `(${soloNumeros.slice(0, 3)}) ${soloNumeros.slice(3, 6)}-${soloNumeros.slice(6)}`;
  }
  
  return telefono;
};

/**
 * Valida el formato de un correo electrónico
 * @param {string} correo - Correo a validar
 * @returns {boolean} - true si es válido
 */
export const validarEmail = (correo) => {
  if (!correo) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
};

/**
 * Valida que el teléfono tenga al menos 10 dígitos
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} - true si es válido
 */
export const validarTelefono = (telefono) => {
  if (!telefono) return false;
  const soloNumeros = telefono.replace(/\D/g, "");
  return soloNumeros.length >= 10;
};
