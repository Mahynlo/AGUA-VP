import { leerToken } from '../appConfig/authApp';

export const fetchRutasInfoMedidores = async (token_session, id_ruta, periodo) => {
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

    // Construir la URL con el período si se proporciona
    const queryParams = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
    const url = `${import.meta.env.VITE_API_FETCH_RUTAS_INFO_MEDIDORES}/${id_ruta}/medidores${queryParams}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Error al obtener información de rutas y medidores");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener información de rutas y medidores:", error);
    return [];
  }
};