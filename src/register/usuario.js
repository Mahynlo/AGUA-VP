import { db } from '../db/Cliente.js'; // Importa la base de datos SQLite
import bcrypt from 'bcryptjs';

/**************************************************************************************************************
 * registro de usuario
 * ************************************************************************************************************
 */
// Función para registrar usuarios
const registerUser = async (correo, contrasena, username, rol) => {
    const hashedPassword = await bcrypt.hash(contrasena, 10);
  
    try {
      await db.execute({
        sql: "INSERT INTO usuarios (correo, contraseña, username, rol) VALUES (?, ?, ?, ?)",
        args: [correo, hashedPassword, username, rol],
      });
  
      return { success: true, message: "Usuario registrado con éxito" };
    } catch (error) {
      return { success: false, message: "El usuario ya existe o hubo un error" };
    }
};

export { registerUser };