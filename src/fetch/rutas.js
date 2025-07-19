import { leerToken } from '../appConfig/authApp';

export const fetchRutas = async (token_session, periodo) => {
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


    // Construir la URL con el período
    const url = `${import.meta.env.VITE_API_FETCH_RUTAS}?periodo=${periodo}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Error al obtener rutas");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener rutas:", error);
    return [];
  }
};
