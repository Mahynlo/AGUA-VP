/**
 * textUtils.js - Utilidades comunes para manipulación y búsqueda de texto
 */

/**
 * Normaliza una cadena de texto convirtiéndola a minúsculas y removiendo acentos/diacríticos.
 * Útil para realizar búsquedas parciales insensibles a mayúsculas y acentos.
 * 
 * @param {string} str - Texto a normalizar
 * @returns {string} - Texto normalizado y limpio
 */
export const normalizarTexto = (str) => {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};
