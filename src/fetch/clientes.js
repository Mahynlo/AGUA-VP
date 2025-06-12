
import {leerToken} from '../appConfig/authApp'; // Asegúrate de que la ruta sea correcta
const URL_CLIENTES = import.meta.env.VITE_API_FETCH_CLIENTES; // URL del endpoint de clientes

/**************************************************************************************************************
|      Funcion Fetch clientes
************************************************************************************************************* */

export const fetchClientes = async (token_session ) => {
  try {
    const token_app = leerToken(); // Asegúrate de que esta función retorne el token correctamente
    if (!token_app) {
      console.error("Token app no disponible");
      return [];
    }
    if (!token_session) {
      console.error("Token de sesión no disponible");
      return [];
    }

    const response = await fetch(URL_CLIENTES, {
      method: "GET",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      }
    });


    if (!response.ok) {
      // Podrías leer el mensaje del backend si viene uno
      const errorBody = await response.text();
      throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
    }

    if (!response.ok) {
      throw new Error("Error al obtener clientes");
    }

    const data = await response.json();
    return data; // Esto debe ser un array de clientes
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return [];
  }
};

