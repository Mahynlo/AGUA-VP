
import { leerToken } from '../appConfig/authApp';

const BASE_URL = import.meta.env.VITE_URL_BASE_API_AGUAVP;

/**
 * Fetch para obtener datos masivos de recibos para impresión
 * @param {string} token_session - Token JWT del usuario
 * @param {string} periodo - Periodo en formato YYYY-MM
 * @param {number} rutaId - (Opcional) ID de la ruta
 * @param {string} estadoPago - (Opcional) 'pendiente', 'pagado', etc.
 */
export const fetchReporteRecibos = async (token_session, periodo, rutaId = null, estadoPago = null) => {
    try {
        const token_app = leerToken();
        if (!token_app || !token_session) {
            throw new Error("Tokens de autenticación faltantes");
        }

        // Construir URL con query params
        const url = new URL(`${BASE_URL}/api/v2/reports/recibos`);
        url.searchParams.append('mes', periodo);
        if (rutaId) url.searchParams.append('ruta_id', rutaId);
        if (estadoPago) url.searchParams.append('estado_pago', estadoPago);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'x-app-key': `AppKey ${token_app}`,
                'Authorization': `Bearer ${token_session}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        return data; // Retorna { periodo, total_recibos, recibos: [...] }

    } catch (error) {
        console.error("Error en fetchReporteRecibos:", error);
        throw error;
    }
};

/**
 * Fetch para obtener lista de lecturas por localidad
 * @param {string} token_session - Token JWT del usuario
 * @param {string} periodo - Periodo en formato YYYY-MM
 * @param {string} localidad - (Opcional) Localidad para filtrar
 */
export const fetchReporteLecturas = async (token_session, periodo, localidad = null) => {
    try {
        const token_app = leerToken();
        if (!token_app || !token_session) {
            throw new Error("Tokens de autenticación faltantes");
        }

        // Construir URL con query params
        const url = new URL(`${BASE_URL}/api/v2/reports/lecturas`);
        url.searchParams.append('mes', periodo);
        if (localidad) url.searchParams.append('localidad', localidad);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'x-app-key': `AppKey ${token_app}`,
                'Authorization': `Bearer ${token_session}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
        }

        return await response.json(); // Retorna estructura de reporte lecturas
    } catch (error) {
        console.error("Error en fetchReporteLecturas:", error);
        throw error;
    }
};

/**
 * Fetch para obtener reporte financiero consolidado
 * @param {string} token_session - Token JWT del usuario
 * @param {Object} filtros - Filtros del reporte
 */
export const fetchReporteFinanciero = async (token_session, filtros = {}) => {
    try {
        const token_app = leerToken();
        if (!token_app || !token_session) {
            throw new Error("Tokens de autenticación faltantes");
        }

        const url = new URL(`${BASE_URL}/api/v2/reports/financiero`);
        Object.entries(filtros || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.append(key, String(value));
            }
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'x-app-key': `AppKey ${token_app}`,
                'Authorization': `Bearer ${token_session}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error en fetchReporteFinanciero:", error);
        throw error;
    }
};
