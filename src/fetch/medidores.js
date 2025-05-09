// Obtiene los medidores desde la base de datos SQLite y los devuelve como un array de objetos.

import { db } from '../db/Cliente.js'; // Importa la base de datos SQLite

/**************************************************************************************************************
 * Función fetchMedidores
 * ************************************************************************************************************ */

// Función para obtener medidores desde la base de datos
export const fetchMedidores = async () => {
    
  try {
    const result = await db.execute("SELECT * FROM medidores");
    return result.rows; // Devolver solo las filas de la consulta
  } catch (error) {
    console.error("Error al obtener medidores:", error);
    return [];
  }
};
