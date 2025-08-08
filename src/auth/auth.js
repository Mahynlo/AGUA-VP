const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY; // clave secreta para firmar el token de acceso a la API
import {leerToken} from '../appConfig/authApp.js'
const URL_LOGIN = import.meta.env.VITE_API_LOGIN; // URL del endpoint de login
const os = require('os');
const nombreDispositivo = `${os.hostname()}`;

/**************************************************************************************************************
 * Login de usuario
 * ************************************************************************************************************
 */
// 📌 Función para autenticar usuarios
const loginUser = async (correo, contrasena) => {
  try {

    // 1. Leer token de la app
    const token = leerToken();
    console.log("Token de la app:", token); // Para depuración, puedes eliminarlo después
    if (!token) {
      return { success: false, message: "Token de la app no disponible" };
    }

    const response = await fetch(URL_LOGIN, {
      method: "POST",
      headers: {
        "x-app-key": `AppKey ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ correo, contraseña: contrasena,dispositivo: nombreDispositivo }) // Ojo con "contraseña" vs "contrasena"
    });

    const data = await response.json();
    console.log("Respuesta del servidor:", data); // Para depuración

    if (!response.ok) {
      return { success: false, message: data.error || "Error al iniciar sesión" };
    }

    // Validar que la respuesta tenga la estructura esperada
    if (!data.user) {
      console.error("Error: La respuesta no contiene el objeto 'user':", data);
      return { success: false, message: "Estructura de respuesta inválida del servidor" };
    }

    // Validar campos específicos del usuario
    if (!data.user.username || !data.user.nombre || !data.user.rol || !data.user.id) {
      console.error("Error: Faltan campos en el objeto user:", data.user);
      return { success: false, message: "Datos de usuario incompletos en la respuesta" };
    }

    //retornar como string
    return {
      success: true,
      token: data.token,
      username: data.user.username,
      nombre: data.user.nombre,
      rol: data.user.rol,
      id: data.user.id
    };

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
const cerrarSesion = async (token_session) => {
  try {
    const token = leerToken();
    if (!token) {
      return { success: false, message: "Token de la app no disponible" };
    }
    console.log("Token de la app:", token_session); // Para depuración, puedes eliminarlo después
    const response = await fetch('http://localhost:3000/api/auth/logout', {
      method: "POST",
      headers: {
        "x-app-key": `AppKey ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token: token_session }) // Enviar el token de sesión para cerrar sesión
    });


    const data = await response.json();
    console.log("Respuesta del servidor al cerrar sesión:", data); // Para depuración, puedes eliminarlo después

    if (!response.ok) {
      return { success: false, message: data.error || "Error al cerrar sesión" };
    }

    return { success: true, message: data.mensaje };
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return { success: false, message: "Error de red" };
  }
};



/**************************************************************************************************************
 * Obtener sesiones activas del usuario
 * ************************************************************************************************************
 */
const obtenerSesionesActivas = async (usuario_id) => {
  try {

    console.log("Obteniendo sesiones activas para el usuario:", usuario_id); // Para depuración, puedes eliminarlo después
    const token = leerToken();
    if (!token) {
      return { success: false, message: "Token de la app no disponible" };
    }
    const response = await fetch(`http://localhost:3000/api/v1/auth/sesionesActivas/${usuario_id}`, {
      method: "GET",
      headers: {
        "x-app-key": `AppKey ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    console.log("Respuesta del servidor al obtener sesiones:", data); // Para depuración, puedes eliminarlo después

    if (!response.ok) {
      return { success: false, message: data.error || "Error al obtener sesiones" };
    }

    return {
      success: true,
      sesiones: data
    };
  } catch (error) {
    console.error("Error al obtener sesiones activas:", error);
    return {
      success: false,
      message: "Error de red o servidor no disponible"
    };
  }
};




// Exportar la función para poder importarla en otros archivos
export { loginUser, verifyToken, cerrarSesion, obtenerSesionesActivas };




