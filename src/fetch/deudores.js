// fetch/deudores.js
import fetch from 'node-fetch'; 
import { leerToken } from '../appConfig/authApp';

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

    return {
        'Authorization': `Bearer ${token_session}`,
        'x-app-key': `AppKey ${token_app}`,
        'Content-Type': 'application/json'
    };
};

/**
 * Obtiene la configuración actual de cortes
 */
async function fetchConfiguracionCorte(token) {
    try {
        const response = await fetch(`${API_URL}/api/v2/deudores/configuracion`, {
            method: 'GET',
            headers: getHeaders(token)
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
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
        const response = await fetch(`${API_URL}/api/v2/deudores/configuracion`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error en updateConfiguracionCorte:', error);
        throw error;
    }
}

/**
 * Obtiene lista de candidatos a corte
 */
async function fetchCandidatosCorte(token) {
    try {
        const response = await fetch(`${API_URL}/api/v2/deudores/candidatos`, {
            method: 'GET',
            headers: getHeaders(token)
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
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
        const response = await fetch(`${API_URL}/api/v2/deudores/cortar`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
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
        const response = await fetch(`${API_URL}/api/v2/deudores/reconectar`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
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
        const response = await fetch(`${API_URL}/api/v2/deudores/convenios`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }

        return await response.json();
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
        const response = await fetch(`${API_URL}/api/v2/deudores/convenios/${convenioId}`, {
            method: 'GET',
            headers: getHeaders(token)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }

        return await response.json();
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
        const response = await fetch(`${API_URL}/api/v2/deudores/convenios/pagar-parcialidad`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error en pagarParcialidad:', error);
        throw error;
    }
}

export {
    fetchConfiguracionCorte,
    updateConfiguracionCorte,
    fetchCandidatosCorte,
    ejecutarCorte,
    registrarReconexion,
    crearConvenio,
    obtenerConvenio,
    pagarParcialidad
};
