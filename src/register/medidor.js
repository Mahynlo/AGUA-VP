import { db } from '../db/Cliente.js'; // Importa la base de datos SQLite


/**************************************************************************************************************
 * registro de medidor
 * ************************************************************************************************************
 */
// Función para registrar medidores
const registerMedidor = async (
    cliente_id = null,
    numero_serie,
    ubicacion,
    fecha_instalacion,
    latitud,
    longitud,
    estado_medidor = "Activo"
  ) => {
    try {
      // 🔍 Verificar si ya existe un medidor con el mismo número de serie
      const existingMedidor = await db.execute({
        sql: "SELECT id FROM medidores WHERE numero_serie = ?",
        args: [numero_serie],
      });
  
      if (existingMedidor.rows.length > 0) {
        return { success: false, message: "El medidor ya está registrado." };
      }
  
      // 🟢 Insertar el medidor, permitiendo cliente_id = null
      await db.execute({
        sql: `
          INSERT INTO medidores (
            cliente_id, numero_serie, ubicacion, fecha_instalacion, latitud, longitud, estado_medidor
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          cliente_id ?? null, // Si cliente_id es null, se inserta como NULL en la base de datos
          numero_serie,
          ubicacion,
          fecha_instalacion,
          latitud,
          longitud,
          estado_medidor,
        ],
      });
  
      return { success: true, message: "Medidor registrado con éxito." };
    } catch (error) {
      console.error("Error al registrar medidor:", error);
      return { success: false, message: "Hubo un error al registrar el medidor." };
    }
  };
  

  export { registerMedidor };