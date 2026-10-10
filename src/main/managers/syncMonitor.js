/**
 * syncMonitor.js — Vigila la salud de la copia en la nube (Turso) y avisa si algo va mal.
 *
 * Sin este monitor los fallos de sincronización solo quedaban en la consola: la copia podía quedar
 * días desactualizada sin que nadie lo supiera. Cada 30 minutos consulta el estado de la API y, si
 * detecta un problema, lo registra en el visor de logs (fuente 'nube') y envía 'sync:alerta' a las
 * ventanas (la interfaz lo muestra a los administradores). El mismo aviso se repite como máximo
 * cada 6 horas.
 */

import { BrowserWindow } from 'electron';
import logManager from './logManager.js';
import { getTursoSyncStatus } from './apiManager.js';
import { evaluarSaludSync } from './syncHealth.js';

const INTERVALO_MS = 30 * 60 * 1000;
const PRIMERA_REVISION_MS = 5 * 60 * 1000;
const REPETIR_AVISO_MS = 6 * 60 * 60 * 1000;

let timer = null;
const ultimosAvisos = new Map();

async function revisar() {
    try {
        const res = await getTursoSyncStatus();
        if (!res?.success) return;
        const alerta = evaluarSaludSync(res.status);
        if (!alerta) {
            ultimosAvisos.clear();
            return;
        }
        const previo = ultimosAvisos.get(alerta.clave);
        if (previo && Date.now() - previo < REPETIR_AVISO_MS) return;
        ultimosAvisos.set(alerta.clave, Date.now());

        logManager.warn(alerta.mensaje, 'nube');
        for (const win of BrowserWindow.getAllWindows()) {
            if (!win.isDestroyed()) win.webContents.send('sync:alerta', alerta);
        }
    } catch (err) {
        logManager.warn(`No se pudo revisar el estado de la copia en la nube: ${err.message}`, 'nube');
    }
}

export function startSyncMonitor() {
    if (timer) return;
    setTimeout(revisar, PRIMERA_REVISION_MS);
    timer = setInterval(revisar, INTERVALO_MS);
}

export function stopSyncMonitor() {
    if (timer) clearInterval(timer);
    timer = null;
}
