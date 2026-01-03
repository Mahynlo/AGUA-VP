import { leerToken } from '../appConfig/authApp';

/**
 * Wrapper de fetch que simplemente agrega los headers de autenticación
 * Nota: Esta función se ejecuta en el main process donde NO hay localStorage
 * La renovación de tokens se maneja en el renderer process (AuthContext)
 */
export const fetchWithAuth = async (url, options = {}, token_session) => {
  const token_app = leerToken();
  
  if (!token_app) {
    throw new Error("Token de la app no disponible");
  }
  
  if (!token_session) {
    throw new Error("Token de sesión no disponible");
  }

  // Configurar headers con autenticación
  const headers = {
    "x-app-key": `AppKey ${token_app}`,
    "Authorization": `Bearer ${token_session}`,
    "Content-Type": "application/json",
    ...options.headers
  };

  try {
    // Realizar la petición
    const response = await fetch(url, {
      ...options,
      headers
    });

    return response;

  } catch (error) {
    console.error("Error en fetchWithAuth:", error);
    throw error;
  }
};
