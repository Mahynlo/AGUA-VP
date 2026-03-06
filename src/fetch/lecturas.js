import {leerToken} from '../appConfig/authApp'; // Asegúrate de que la ruta sea correcta
const URL_LECTURAS = import.meta.env.VITE_API_FETCH_LECTURAS; // URL del endpoint de lecturas
const URL_BASE = import.meta.env.VITE_URL_BASE_API_AGUAVP;

export const modificarLectura = async (lecturaId, datos, token_session) => {
  try {
    const token_app = leerToken();
    if (!token_app) return { success: false, message: 'Token de aplicación no disponible' };
    if (!token_session) return { success: false, message: 'Token de sesión no disponible' };

    const response = await fetch(`${URL_BASE}/api/v2/lecturas/modificar/${lecturaId}`, {
      method: 'PUT',
      headers: {
        'x-app-key': `AppKey ${token_app}`,
        'Authorization': `Bearer ${token_session}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    const data = await response.json();
    if (!response.ok) {
      let msg = data.error || data.message || 'Error al modificar la lectura';
      if (data.detalles?.length) msg += ' — ' + data.detalles.map(d => `${d.campo}: ${d.mensaje}`).join('; ');
      return { success: false, message: msg };
    }
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error en modificarLectura:', error);
    return { success: false, message: 'Error al modificar la lectura' };
  }
};

/**************************************************************************************************************
|      Funcion Fetch lecturas
************************************************************************************************************* */
export const fetchLecturas = async (token_session, isRetry = false) => {
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
      
      // Si es error 401/403 y no es reintento, intentar renovar token
      if ((response.status === 401 || response.status === 403) && !isRetry && typeof window !== 'undefined') {
        console.log("🔄 Token expirado en fetchLecturas, solicitando renovación...");
        window.dispatchEvent(new CustomEvent('token-expired'));
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newToken = localStorage.getItem('token');
        if (newToken && newToken !== token_session) {
          console.log("✅ Token renovado, reintentando fetchLecturas...");
          return fetchLecturas(newToken, true);
        }
      }
      
      throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data; // Esto debe ser un array de lecturas
  } catch (error) {
    console.error("Error en fetchLecturas:", error," (ipcmain-fetch-lecturas)");
    return [];
  }
};