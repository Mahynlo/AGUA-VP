import {leerToken} from '../appConfig/authApp.js'; // Asegúrate de que la ruta sea correcta
import fetch from 'node-fetch';
const URL_REGISTRO_USUARIO = import.meta.env.VITE_API_REGISTRAR_USUARIO; // URL de registro de usuario

/**************************************************************************************************************
 * registro de usuario
 * ************************************************************************************************************
 */
// Función para registrar usuarios
const registerUser = async (correo, contrasena, username, rol) => {
    
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
      body: JSON.stringify({ correo, contrasena, username, rol }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Error en servidor remoto" };
    }
  
      return { success: true, message: "Usuario registrado con éxito" };
    } catch (error) {
      return { success: false, message: "El usuario ya existe o hubo un error" };
    }
};

export { registerUser };