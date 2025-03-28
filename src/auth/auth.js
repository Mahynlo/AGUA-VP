import { db } from '../db/Cliente.js'; // Importa la base de datos SQLite
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

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
      { expiresIn: "1h" }
    );

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


// Exportar la función para poder importarla en otros archivos
export { loginUser, verifyToken };




