/**
 * syncHealth.js — Reglas de salud de la copia en la nube (sin dependencias de Electron, se puede probar).
 * Las usa syncMonitor.js para decidir cuándo avisar.
 */

const SIN_COPIA_MAX_MS = 24 * 60 * 60 * 1000;

/**
 * Evalúa el estado de la sincronización (función pura).
 * @param {Object} status - `status` de GET /api/v2/sync/status
 * @returns {{ clave: string, mensaje: string } | null}
 */
export function evaluarSaludSync(status, ahora = Date.now()) {
    if (!status?.configured) return null;

    if (status.conflicto) {
        return {
            clave: 'conflicto',
            mensaje: 'La copia en la nube está detenida para protegerla. Revisa Administrador → Mantenimiento → Nube.'
        };
    }
    if (status.fallosConsecutivos >= 3) {
        return {
            clave: 'fallos',
            mensaje: `La copia en la nube falló ${status.fallosConsecutivos} veces seguidas: ${status.lastError || 'error desconocido'}`
        };
    }
    const ultima = status.ultimaSincronizacionCorrecta ? Date.parse(status.ultimaSincronizacionCorrecta) : null;
    if (ultima && ahora - ultima > SIN_COPIA_MAX_MS) {
        const horas = Math.floor((ahora - ultima) / 3600000);
        return {
            clave: 'antigua',
            mensaje: `No hay una copia correcta en la nube desde hace ${horas} horas. Revisa la conexión a internet y el panel de la nube.`
        };
    }
    if (!ultima && status.fallosConsecutivos > 0) {
        return { clave: 'nunca', mensaje: 'Todavía no se ha completado ninguna copia en la nube y el último intento falló.' };
    }
    if (status.verificacion && status.verificacion.ok === false) {
        const tablas = (status.verificacion.diferencias || []).map(d => d.tabla).join(', ');
        return { clave: 'verificacion', mensaje: `La verificación de la copia en la nube encontró diferencias en: ${tablas}` };
    }
    if (status.fkViolaciones > 0) {
        return {
            clave: 'fk',
            mensaje: `La base local tiene ${status.fkViolaciones} referencia(s) huérfanas; la nube podría rechazarlas.`
        };
    }
    return null;
}
