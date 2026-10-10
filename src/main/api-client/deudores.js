// fetch/deudores.js
import { leerToken } from '../appConfig/authApp';
import { authHeaders } from '../main/api-client/http.js';

// USAR LA MISMA VARIABLE DE ENTORNO QUE reports.js
const API_URL = import.meta.env.VITE_URL_BASE_API_AGUAVP || 'http://localhost:3000';

const getHeaders = (token_session) => {
    const token_app = leerToken();

    // Debugging (Eliminar en producción)
    console.log(`[Deudores] Token Session: ${token_session ? 'OK' : 'MISSING'}`);
    console.log(`[Deudores] Token App: ${token_app ? 'OK' : 'MISSING'}`);

    if (!token_app || !token_session) {
        throw new Error("Tokens de autenticación faltantes o inválidos");
    }

    return authHeaders(token_app, token_session);
};

// Error con el código y texto de estado HTTP
const errorPorEstado = async (response) => {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
};

// Error con el mensaje `error` que devuelve el backend
const errorDelBackend = async (response) => {
    const errorData = await response.json();
    throw new Error(errorData.error || `Error ${response.status}`);
};

// Petición a /api/v2/deudores… ; si la respuesta no es OK delega en `onError` (que lanza)
const request = async (path, { method = 'GET', token, body, onError = errorPorEstado } = {}) => {
    const options = { method, headers: getHeaders(token) };
    if (body !== undefined) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}/api/v2/deudores${path}`, options);
    if (!response.ok) {
        await onError(response);
    }
    return await response.json();
};

/**
 * Obtiene la configuración actual de cortes
 */
async function fetchConfiguracionCorte(token) {
    try {
        return await request('/configuracion', { token });
    } catch (error) {
        console.error('Error en fetchConfiguracionCorte:', error);
        throw error;
    }
}

/**
 * Actualiza la configuración de cortes
 */
async function updateConfiguracionCorte(token, config) {
    try {
        return await request('/configuracion', { method: 'POST', token, body: config });
    } catch (error) {
        console.error('Error en updateConfiguracionCorte:', error);
        throw error;
    }
}

/**
 * Recalcula fechas de vencimiento para facturas de un período específico
 */
async function recalcularVencimientosPorPeriodo(token, data) {
    try {
        return await request('/configuracion/recalcular-vencimientos', {
            method: 'POST',
            token,
            body: data,
            onError: async (response) => {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            }
        });
    } catch (error) {
        console.error('Error en recalcularVencimientosPorPeriodo:', error);
        throw error;
    }
}

/**
 * Obtiene lista de candidatos a corte
 */
async function fetchCandidatosCorte(token) {
    try {
        return await request('/candidatos', { token });
    } catch (error) {
        console.error('Error en fetchCandidatosCorte:', error);
        throw error;
    }
}

/**
 * Ejecuta un corte de servicio
 */
async function ejecutarCorte(token, data) {
    try {
        return await request('/cortar', { method: 'POST', token, body: data });
    } catch (error) {
        console.error('Error en ejecutarCorte:', error);
        throw error;
    }
}

/**
 * Registra una reconexión
 */
async function registrarReconexion(token, data) {
    try {
        return await request('/reconectar', { method: 'POST', token, body: data });
    } catch (error) {
        console.error('Error en registrarReconexion:', error);
        throw error;
    }
}

/**
 * Crea un convenio de pago
 */
async function crearConvenio(token, data) {
    try {
        return await request('/convenios', {
            method: 'POST',
            token,
            body: data,
            onError: errorDelBackend
        });
    } catch (error) {
        console.error('Error en crearConvenio:', error);
        throw error;
    }
}

/**
 * Obtiene un convenio con sus parcialidades
 */
async function obtenerConvenio(token, convenioId) {
    try {
        return await request(`/convenios/${convenioId}`, { token, onError: errorDelBackend });
    } catch (error) {
        console.error('Error en obtenerConvenio:', error);
        throw error;
    }
}

/**
 * Paga una parcialidad de convenio
 */
async function pagarParcialidad(token, data) {
    try {
        return await request('/convenios/pagar-parcialidad', {
            method: 'POST',
            token,
            body: data,
            onError: errorDelBackend
        });
    } catch (error) {
        console.error('Error en pagarParcialidad:', error);
        throw error;
    }
}

/**
 * Obtiene resumen de cobro combinado por medidor
 */
async function fetchResumenCobroConvenio(token, medidorId) {
    try {
        return await request(`/convenios/resumen-cobro/${medidorId}`, {
            token,
            onError: errorDelBackend
        });
    } catch (error) {
        console.error('Error en fetchResumenCobroConvenio:', error);
        throw error;
    }
}

/**
 * Registra pago integrado (factura + convenio)
 */
async function pagarIntegradoConvenio(token, data) {
    try {
        return await request('/convenios/pagar-integrado', {
            method: 'POST',
            token,
            body: data,
            onError: errorDelBackend
        });
    } catch (error) {
        console.error('Error en pagarIntegradoConvenio:', error);
        throw error;
    }
}

export {
    fetchConfiguracionCorte,
    updateConfiguracionCorte,
    recalcularVencimientosPorPeriodo,
    fetchCandidatosCorte,
    ejecutarCorte,
    registrarReconexion,
    crearConvenio,
    obtenerConvenio,
    pagarParcialidad,
    fetchResumenCobroConvenio,
    pagarIntegradoConvenio
};
