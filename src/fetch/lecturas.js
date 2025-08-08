import {leerToken} from '../appConfig/authApp'; // Asegúrate de que la ruta sea correcta
const URL_LECTURAS = import.meta.env.VITE_API_FETCH_LECTURAS; // URL del endpoint de lecturas

/**************************************************************************************************************
|      Funcion Fetch lecturas
************************************************************************************************************* */
export const fetchLecturas = async (token_session) => {
  try {
    const token_app = leerToken(); // Asegúrate de que esta función retorne el token correctamente
    if (!token_app) {
      console.error("Token app no disponible(ipcmain-fetch-lecturas)");
      return [];
    }
    if (!token_session) {
      console.error("Token de sesión no disponible(ipcmain-fetch-lecturas)");
      return [];
    }

    const response = await fetch(URL_LECTURAS, {
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
      throw new Error("Error al obtener lecturas(ipcmain-fetch-lecturas)");
    }

    const data = await response.json();
    return data; // Esto debe ser un array de lecturas
  } catch (error) {
    console.error("Error en fetchLecturas:", error," (ipcmain-fetch-lecturas)");
    return [];
  }
};