import { leerToken } from '../../auth/appKey.js';
import { apiFetch } from '../http.js';

const registrarRutas = async (ruta, token_session) => {
  try {
    const token_app = leerToken();

    if (!token_app) {
      return { success: false, message: "Token de aplicación no disponible" };
    }

    if (!token_session) {
      return { success: false, message: "Token de sesión no disponible" };
    }

    const response = await apiFetch(import.meta.env.VITE_API_REGISTRAR_RUTAS, {
      method: "POST",
      token_app,
      token_session,
      body: ruta
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        return {
          success: false,
          status: 409,
          message: data?.error || "Medidores ya asignados a otra ruta",
          medidores_duplicados: data?.medidores_duplicados || []
        };
      }
      return { success: false, message: data?.error || "Error al registrar ruta" };
    }

    return { success: true, message: data?.mensaje || "Ruta registrada", rutaID: data?.rutaID || null };
  } catch (error) {
    console.error("❌ Error al registrar ruta:", error);
    return { success: false, message: "Hubo un error al registrar la ruta" };
  }
};

export { registrarRutas };
