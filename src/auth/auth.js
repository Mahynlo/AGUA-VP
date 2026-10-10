const jwt = require("jsonwebtoken");
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY; // clave secreta para firmar el token de acceso a la API

// NOTA: login, logout, renovación de token, sesiones y cambio de contraseña
// se gestionan en src/main/ipc/ipcHandlersUsuario.js (API V2).

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

export { verifyToken };
