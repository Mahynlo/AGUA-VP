import { leerToken } from '../appConfig/authApp';
const URL_MEDIDORES = import.meta.env.VITE_API_FETCH_MEDIDORES; // URL del endpoint de medidores
// Asumiendo que VITE_API_FETCH_MEDIDORES apunta a /api/v2/medidores
 

export const fetchMedidores = async (token_session, isRetry = false) => {
  try {
    const token_app = leerToken();
    if (!token_app) {
      console.error("Token app no disponible");
      return [];
    }

    if (!token_session) {
      console.error("Token de sesión no disponible");
      return [];
    }

    // console.log("Token de la app (medidores):", token_app);
    // console.log("Token de sesión (medidores):", token_session);

    const response = await fetch(URL_MEDIDORES, {
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
        console.log("🔄 Token expirado en fetchMedidores, solicitando renovación...");
        window.dispatchEvent(new CustomEvent('token-expired'));
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newToken = localStorage.getItem('token');
        if (newToken && newToken !== token_session) {
          console.log("✅ Token renovado, reintentando fetchMedidores...");
          return fetchMedidores(newToken, true);
        }
      }
      
      throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    // console.log("Datos obtenidos de medidores:", data);
    return data;

  } catch (error) {
    console.error("Error al obtener medidores:", error.message || error);
    return [];
  }
};


