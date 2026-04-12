import { leerToken } from '../appConfig/authApp';

export const fetchRutas = async (token_session, periodo, isRetry = false) => {
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

    // Preparar parámetros
    let queryParams = "";
    
    if (typeof periodo === 'object') {
      const params = new URLSearchParams();
      Object.keys(periodo).forEach(key => {
        if (periodo[key] !== null && periodo[key] !== undefined && periodo[key] !== '') {
          params.append(key, periodo[key]);
        }
      });
      queryParams = params.toString();
    } else if (periodo) {
       // Legacy string support
       queryParams = `periodo=${periodo}`;
    }

    // Construir la URL con parámetros
    const url = `${import.meta.env.VITE_API_FETCH_RUTAS}?${queryParams}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      
      // Si es error 401/403 y no es reintento, intentar renovar token
      if ((response.status === 401 || response.status === 403) && !isRetry && typeof window !== 'undefined') {
        console.log("🔄 Token expirado en fetchRutas, solicitando renovación...");
        window.dispatchEvent(new CustomEvent('token-expired'));
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newToken = localStorage.getItem('token');
        if (newToken && newToken !== token_session) {
          console.log("✅ Token renovado, reintentando fetchRutas...");
          return fetchRutas(newToken, periodo, true);
        }
      }
      
      throw new Error(`Error al obtener rutas: ${errorBody}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener rutas:", error);
    return [];
  }
};

export const actualizarRuta = async (token_session, id_ruta, datosActualizados) => {
  try {
    const token_app = leerToken();
    if (!token_app) {
      throw new Error("Token app no disponible");
    }
    if (!token_session) {
      throw new Error("Token de sesión no disponible");
    }
    if (!id_ruta) {
      throw new Error("ID de ruta no proporcionado");
    }

    // Construir URL correcta eliminando '/listar' si existe y agregando el ID
    const baseUrl = import.meta.env.VITE_API_FETCH_RUTAS.replace('/listar', '');
    const url = `${baseUrl}/${id_ruta}`;
    
    console.log("🔄 URL para actualizar ruta:", url);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datosActualizados)
    });

    console.log("📡 Status de respuesta:", response.status, response.statusText);

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorData;
      
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        const textError = await response.text();
        console.error("❌ Respuesta no-JSON del servidor:", textError.substring(0, 200));
        throw new Error(`Error del servidor (${response.status}): ${response.statusText}`);
      }
      
      const backendMessage =
        errorData?.message ||
        errorData?.error ||
        (Array.isArray(errorData?.error) ? errorData.error.join(", ") : null) ||
        "Error al actualizar ruta";

      return {
        success: false,
        status: response.status,
        message: backendMessage,
        details: errorData
      };
    }

    const data = await response.json();
    console.log("✅ Ruta actualizada exitosamente:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error al actualizar ruta:", error);
    return { success: false, message: error.message };
  }
};

