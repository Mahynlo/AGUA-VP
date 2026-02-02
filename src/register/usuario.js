import {leerToken} from '../appConfig/authApp.js'; // Asegúrate de que la ruta sea correcta
import fetch from 'node-fetch';
const URL_REGISTRO_USUARIO = import.meta.env.VITE_API_REGISTRAR_USUARIO; // URL de registro de usuario

/**************************************************************************************************************
 * registro de usuario
 * ************************************************************************************************************
 */
// Función para registrar usuarios
const registerUser = async (correo, nombre, contrasena, username, rol, confirmar_contrasena) => {
    
    try {
      // 1. Leer token de la app
    const token = leerToken();
    if (!token) {
      return { success: false, message: "Token de la app no disponible" };
    }

      // 2. Enviar datos al servidor con token
    const response = await fetch(URL_REGISTRO_USUARIO , {
      method: "POST",
      headers: {
        "x-app-key": `AppKey ${token}`,
        "Content-Type": "application/json"
      },
      // Aseguramos que se envía confirmar_contrasena para que Zod no falle
      body: JSON.stringify({ 
          correo, 
          nombre, 
          contrasena, 
          username, 
          rol,
          confirmar_contrasena: confirmar_contrasena || contrasena // Fallback si no viene
      }),
    });

    const data = await response.json();


    if (!response.ok) {
      return { success: false, message: data.error || "Error en servidor remoto" };
    }
  
      return { success: true, message: "Usuario registrado con éxito" };
    } catch (error) {
      console.error("Error en registerUser:", error);
      return { 
        success: false, 
        message: error.message || "Error de conexión o servidor no disponible" 
      };
    }
};

export { registerUser };