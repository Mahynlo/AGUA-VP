import { leerToken } from '../../auth/appKey.js';
import { apiFetch } from '../http.js';
const URL_REGISTRAR_PAGOS = import.meta.env.VITE_API_REGISTRAR_PAGOS; // URL del endpoint de registro de pagos
const URL_DISTRIBUIR_PAGOS = import.meta.env.VITE_API_DISTRIBUIR_PAGOS
    || (URL_REGISTRAR_PAGOS?.includes('/registrar')
        ? URL_REGISTRAR_PAGOS.replace('/registrar', '/distribuir')
        : undefined);
/**************************************************************************************************************
 * registro de pagos
 *  Función para registrar pagos de lecturas
 * *************************************************************************************************************/
//funcion para registrar pagos de lecturas
const registerPagos = async (pago, token_session) => {
     try {
        const token_app = leerToken();

        if (!token_app) {
            return { success: false, message: "Token de aplicación no disponible(ipcmain-pago)" };
        }

        if (!token_session) {
            return { success: false, message: "Token de sesión no disponible(ipcmain-pago)" };
        }

        const response = await apiFetch(URL_REGISTRAR_PAGOS, {
            method: "POST",
            token_app,
            token_session,
            body: pago
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, message: data.error || "Error al registrar pago(ipcmain)" };
        }

        return { success: true, message: data.mensaje, pagoID: data.pago_id, monto_aplicado: data.monto_aplicado, cambio: data.cambio };
    } catch (error) {
        console.error("Error al registrar pago(ipcmain):", error);
        return { success: false, message: "Hubo un error al registrar el pago(ipcmain)." };
    }
}

const registerPagoDistribuido = async (pagoDistribuido, token_session) => {
    try {
        const token_app = leerToken();

        if (!token_app) {
            return { success: false, message: "Token de aplicación no disponible(ipcmain-pago-distribuido)" };
        }

        if (!token_session) {
            return { success: false, message: "Token de sesión no disponible(ipcmain-pago-distribuido)" };
        }

        if (!URL_DISTRIBUIR_PAGOS) {
            return { success: false, message: "Endpoint de pago distribuido no configurado(ipcmain-pago-distribuido)" };
        }

        const response = await apiFetch(URL_DISTRIBUIR_PAGOS, {
            method: "POST",
            token_app,
            token_session,
            body: pagoDistribuido
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, message: data.error || "Error al registrar pago distribuido(ipcmain)" };
        }

        return {
            success: true,
            message: data.mensaje,
            data
        };
    } catch (error) {
        console.error("Error al registrar pago distribuido(ipcmain):", error);
        return { success: false, message: "Hubo un error al registrar el pago distribuido(ipcmain)." };
    }
};

// Anulación: misma base que el registro (…/pagos/registrar → …/pagos/anular/:id)
const URL_ANULAR_PAGOS = URL_REGISTRAR_PAGOS?.includes('/registrar')
    ? URL_REGISTRAR_PAGOS.replace('/registrar', '/anular')
    : undefined;

/** Anula un pago (solo administradores). Devuelve { success, message, data? }. */
const anularPago = async (pagoId, motivo, token_session) => {
    try {
        const token_app = leerToken();
        if (!token_app) return { success: false, message: "Token de aplicación no disponible(ipcmain-anular-pago)" };
        if (!token_session) return { success: false, message: "Token de sesión no disponible(ipcmain-anular-pago)" };
        if (!URL_ANULAR_PAGOS) return { success: false, message: "Endpoint de anulación no configurado(ipcmain-anular-pago)" };

        const response = await apiFetch(`${URL_ANULAR_PAGOS}/${pagoId}`, {
            method: "POST",
            token_app,
            token_session,
            body: { motivo }
        });
        const data = await response.json();
        if (!response.ok) {
            const detalle = data.detalles?.[0]?.mensaje;
            return { success: false, message: detalle || data.error || "No se pudo anular el pago" };
        }
        return { success: true, message: data.message, data };
    } catch (error) {
        console.error("Error al anular pago(ipcmain):", error);
        return { success: false, message: "Hubo un error al anular el pago(ipcmain)." };
    }
};

export { registerPagos, registerPagoDistribuido, anularPago };
