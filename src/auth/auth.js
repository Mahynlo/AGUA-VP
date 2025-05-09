import { db } from '../db/Cliente.js'; // Importa la base de datos SQLite
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
import os from 'os';

/**************************************************************************************************************
 * Login de usuario
 * ************************************************************************************************************
 */
// 📌 Función para autenticar usuarios
const loginUser = async (correo, contrasena) => {
  try {

    // Realizar la consulta a la base de datos
    const result = await db.execute({
      sql: "SELECT * FROM usuarios WHERE correo = ?",
      args: [correo],
    });

    if (!result || !result.rows || result.rows.length === 0) {
      return { success: false, message: "Usuario no encontrado", result: null };
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10); // Encriptar la contraseña ingresada por el usuario para compararla con la almacenada

    // Verificar la contraseña ingresada contra la almacenada
    const isMatch = await bcrypt.compare(contrasena,hashedPassword);
    if (!isMatch) {
      return { success: false, message: "Contraseña incorrecta", result: null };
    }

    // Generar el token JWT si la contraseña es correcta
    const token = jwt.sign(
      { id: result.rows[0].id, correo: result.rows[0].correo, rol: result.rows[0].rol },
      SECRET_KEY,
      { expiresIn: "30d" } // expiración del token en 30 días
    );

    const getDeviceInfo = () => {
      const hostname = os.hostname(); // Nombre del equipo
      const platform = `${os.type()} ${os.release()} (${os.arch()})`; // Sistema operativo
      return `${hostname} - ${platform}`;
    };

    // 💾 Registrar la sesión en la base de datos
    await db.execute({
      sql: `INSERT INTO sesiones (usuario_id, token, direccion_ip, dispositivo)
            VALUES (?, ?, ?, ?)`,
      args: [result.rows[0].id, token, '127.0.0.1', getDeviceInfo()] // puedes obtener IP real si la tienes
    });

    return { success: true, token, username: result.rows[0].username, rol: result.rows[0].rol };

  } catch (error) {
    console.error("Error en loginUser:", error);
    return { success: false, message: "Error en la autenticación", result: null };
  }
};


/**************************************************************************************************************
 * Verificacion de Token
 * ************************************************************************************************************
 */
// 📌 Función para verificar token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};

/**************************************************************************************************************
 * Cerrar sesión
 * ************************************************************************************************************
 */
const cerrarSesion = async (token) => {
  try {
    //const decoded = jwt.verify(token, SECRET_KEY);
    // Decodificar el token sin verificar expiración
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.id) { // Verificar si el token es válido y contiene el id del usuario
      throw new Error("Token inválido");
    }

    await db.execute({
      sql: `
        UPDATE sesiones 
        SET fecha_fin = datetime('now'), activo = 0
        WHERE token = ? AND usuario_id = ? AND fecha_fin IS NULL
      `,
      args: [token, decoded.id]
    });

    return { success: true };
  } catch (error) {
    console.error("Error cerrando sesión en BD:", error);
    return { success: false, error: error.message };
  }
};


/**************************************************************************************************************
 * Obtener sesiones activas del usuario
 * ************************************************************************************************************
 */
const obtenerSesionesActivas = async (usuario_id) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT id, token, fecha_inicio, direccion_ip, dispositivo, ubicacion
        FROM sesiones
        WHERE usuario_id = ? AND fecha_fin IS NULL AND activo = 1
        ORDER BY fecha_inicio DESC
      `,
      args: [usuario_id]
    });

    return {
      success: true,
      sesiones: result.rows
    };
  } catch (error) {
    console.error("Error al obtener sesiones activas:", error);
    return {
      success: false,
      error: error.message
    };
  }
};



// Exportar la función para poder importarla en otros archivos
export { loginUser, verifyToken, cerrarSesion, obtenerSesionesActivas };




