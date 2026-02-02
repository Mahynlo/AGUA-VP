
import {leerToken} from '../appConfig/authApp'; // Asegúrate de que la ruta sea correcta
const URL_CLIENTES = import.meta.env.VITE_API_FETCH_CLIENTES; // URL del endpoint de clientes

/**************************************************************************************************************
|      Funcion Fetch clientes
************************************************************************************************************* */

export const fetchClientes = async (token_session, params = {}, isRetry = false) => {
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

    // Construir URL con parámetros
    const url = new URL(URL_CLIENTES);
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
      });
    }

    const response = await fetch(url.toString(), {
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
      
      // Si es error 403 y no es reintento, intentar renovar token
      if (response.status === 403 && !isRetry) {
        console.log("🔄 Token expirado en fetchClientes, solicitando renovación...");
        window.dispatchEvent(new CustomEvent('token-expired'));
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newToken = localStorage.getItem('token');
        if (newToken && newToken !== token_session) {
          console.log("✅ Token renovado, reintentando fetchClientes...");
          return fetchClientes(newToken, params, true);
        }
      }
      
      throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data; // Puede ser array o objeto {data, pagination}
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return [];
  }
};

/**************************************************************************************************************
|      Funcion Fetch estadísticas de clientes
************************************************************************************************************* */

export const fetchClientesEstadisticas = async (token_session, isRetry = false) => {
  try {
    const token_app = leerToken();
    if (!token_app) {
      console.error("Token app no disponible");
      return null;
    }
    if (!token_session) {
      console.error("Token de sesión no disponible");
      return null;
    }

    // Construir URL base desde URL_CLIENTES
    const baseURL = URL_CLIENTES.replace('/listar', '');
    const URL_ESTADISTICAS = `${baseURL}/estadisticas`;

    const response = await fetch(URL_ESTADISTICAS, {
      method: "GET",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      
      // Si es error 403 y no es reintento, intentar renovar token
      if (response.status === 403 && !isRetry) {
        console.log("🔄 Token expirado en fetchClientesEstadisticas, solicitando renovación...");
        window.dispatchEvent(new CustomEvent('token-expired'));
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newToken = localStorage.getItem('token');
        if (newToken && newToken !== token_session) {
          console.log("✅ Token renovado, reintentando fetchClientesEstadisticas...");
          return fetchClientesEstadisticas(newToken, true);
        }
      }
      
      throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener estadísticas de clientes:", error);
    return null;
  }
};
