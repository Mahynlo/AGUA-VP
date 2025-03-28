import { db } from '../db/Cliente.js'; // Importa la base de datos SQLite

/**************************************************************************************************************
 * Funcion de Registro de clientes
 * ************************************************************************************************************
 */
// 📌 Función para registrar clientes con validación y campo 'modificado_por'
const registerClientes = async (nombre, direccion, telefono, ciudad, correo, estado_cliente = "Activo", modificado_por = null) => {
  try {
    // 🔍 Validar si el cliente ya existe (por correo o teléfono)
    const existingClient = await db.execute({
      sql: "SELECT id FROM clientes WHERE correo = ? OR telefono = ?",
      args: [correo, telefono],
    });

    if (existingClient.rows.length > 0) {
      return { success: false, message: "El cliente ya está registrado." };
    }

    // 🟢 Insertar nuevo cliente, permitiendo que 'modificado_por' sea NULL si no se envía
    await db.execute({
      sql: "INSERT INTO clientes (nombre, direccion, telefono, ciudad, correo, estado_cliente, modificado_por) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [nombre, direccion, telefono, ciudad, correo, estado_cliente, modificado_por],
    });

    return { success: true, message: "Cliente registrado con éxito." };
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    return { success: false, message: "Hubo un error al registrar el cliente." };
  }
};


export { registerClientes };