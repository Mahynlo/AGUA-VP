// Obtiene los clientes desde la base de datos SQLite y los devuelve como un array de objetos.

import { db } from '../db/Cliente.js'; // Importa la base de datos SQLite
/**************************************************************************************************************
 * Funcion Fetch clientes
 * ************************************************************************************************************ */

// Función para obtener clientes desde la base de datos
export const fetchClientes = async () => {
  try {
    const result = await db.execute("SELECT * FROM clientes");
    return result.rows;  // Devolver solo las filas de la consulta
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return [];
  }
};
