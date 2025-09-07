const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY; // clave secreta para firmar el token de acceso a la API
import {leerToken} from '../appConfig/authApp.js'
const URL_LOGIN = import.meta.env.VITE_API_LOGIN; // URL del endpoint de login
const os = require('os');
const nombreDispositivo = `${os.hostname()}`;
const URL_BASE_API_AGUAVP = import.meta.env.VITE_URL_BASE_API_AGUAVP; // URL base de la API

// 📌 Función para obtener la IP local del equipo
const obtenerIPLocal = () => {
  try {
    const interfaces = os.networkInterfaces();
    
    // Buscar la primera interfaz de red que no sea loopback y que esté activa
    for (const nombre of Object.keys(interfaces)) {
      const interfaz = interfaces[nombre];
      
      for (const config of interfaz) {
        // Filtrar solo IPv4, no loopback, y que esté activo
        if (config.family === 'IPv4' && !config.internal && config.address) {
          return config.address;
        }
      }
    }
    
    // Si no encuentra ninguna IP externa, usar localhost como fallback
    console.log("⚠️ No se pudo detectar IP externa, usando localhost");
    return '127.0.0.1';
  } catch (error) {
    console.error("❌ Error al obtener IP local:", error);
    return '127.0.0.1'; // Fallback
  }
};
/**************************************************************************************************************
 * Login de usuario
 * ************************************************************************************************************
 */
// 📌 Función para autenticar usuarios
const loginUser = async (correo, contrasena) => {
  try {

    // 1. Leer token de la app
    const token = leerToken();
    if (!token) {
      return { success: false, message: "Token de la app no disponible" };
    }

    // 2. Obtener IP local del equipo
    const direccionIP = obtenerIPLocal();
    console.log("🌐 Login desde IP:", direccionIP, "Dispositivo:", nombreDispositivo);

    const response = await fetch(URL_LOGIN, {
      method: "POST",
      headers: {
        "x-app-key": `AppKey ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        correo, 
        contraseña: contrasena,
        dispositivo: nombreDispositivo,
        ip: direccionIP
      })
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
    console.log("🔄 Iniciando proceso de logout en backend para token:", token_session);
    
    const token = leerToken();
    if (!token) {
      console.log("❌ Token de la app no disponible");
      return { success: false, message: "Token de la app no disponible" };
    }
    
    console.log("🔑 Token de la app obtenido:", token);
    const response = await fetch(`${URL_BASE_API_AGUAVP}/api/v2/auth/logout`, {
      method: "POST",
      headers: {
        "x-app-key": `AppKey ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token: token_session }) // Enviar el token de sesión para cerrar sesión
    });

    const data = await response.json();
    console.log("📤 Respuesta del servidor al cerrar sesión:", data);

    if (!response.ok) {
      console.log("❌ Error en respuesta del servidor:", data.error);
      return { success: false, message: data.error || "Error al cerrar sesión" };
    }

    console.log("✅ Logout exitoso en backend");
    return { success: true, message: data.mensaje };
  } catch (error) {
    console.error("💥 Error al cerrar sesión:", error);
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
    const response = await fetch(`${URL_BASE_API_AGUAVP}/api/v2/auth/sesionesActivas/${usuario_id}`, {
      method: "GET",
      headers: {
        "x-app-key": `AppKey ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Error al obtener sesiones" };
    }

    // El servidor devuelve un objeto con la propiedad 'sesiones_activas'
    return {
      success: true,
      sesiones: Array.isArray(data.sesiones_activas) ? data.sesiones_activas : []
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




