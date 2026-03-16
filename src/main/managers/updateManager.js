/**
 * UpdateManager — Gestión controlada de actualizaciones para Agua VP
 *
 * Reemplaza el checkUpdates.js básico con:
 *  1. Backup automático obligatorio antes de instalar actualizaciones
 *  2. Progreso de descarga en tiempo real al renderer
 *  3. Control de cuándo instalar (ahora / más tarde / al cerrar)
 *  4. Información de la actualización (versión, release notes)
 *  5. Integración con LogManager para trazabilidad
 *
 * @module UpdateManager
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { net } from 'electron';
import logManager from './logManager.js';
import { createBackup } from './apiManager.js';

// ── Estado ────────────────────────────────────────────────────────────────────

const state = {
    checking: false,
    downloading: false,
    updateAvailable: false,
    updateDownloaded: false,
    updateInfo: null,        // { version, releaseNotes, releaseDate, ... }
    downloadProgress: null,  // { percent, bytesPerSecond, transferred, total }
    error: null,
    lastCheck: null,
    backupBeforeUpdate: null // Ruta del backup pre-actualización
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Verifica si hay conexión a Internet.
 */
function isOnline() {
    return new Promise((resolve) => {
        try {
            const request = net.request('https://www.google.com');
            request.on('response', (response) => {
                resolve(response.statusCode === 200);
            });
            request.on('error', () => resolve(false));
            request.end();
        } catch {
            resolve(false);
        }
    });
}

/**
 * Envía estado al renderer vía IPC push.
 */
function pushToRenderer(channel, data) {
    try {
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
            if (!win.isDestroyed() && win.webContents) {
                win.webContents.send(channel, data);
            }
        }
    } catch {
        // Silenciar — ventana puede no existir
    }
}

// ── Configurar autoUpdater ────────────────────────────────────────────────────

function configureAutoUpdater() {
    // No descargar automáticamente — el usuario decide cuándo
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    // Configurar feed (GitHub Releases públicas)
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'Mahynlo',
        repo: 'AGUA-VP'
    });

    // ── Eventos del autoUpdater ───────────────────────────────────────────

    autoUpdater.on('checking-for-update', () => {
        state.checking = true;
        state.error = null;
        logManager.info('Verificando actualizaciones...', 'update');
        pushToRenderer('system:update-progress', { event: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
        state.checking = false;
        state.updateAvailable = true;
        state.updateInfo = {
            version: info.version,
            releaseDate: info.releaseDate,
            releaseNotes: info.releaseNotes || 'Sin notas de versión disponibles',
            files: info.files?.map(f => ({ name: f.url, size: f.size })) || []
        };

        logManager.info(`Actualización disponible: v${info.version}`, 'update');
        pushToRenderer('system:update-progress', {
            event: 'update-available',
            info: state.updateInfo
        });
    });

    autoUpdater.on('update-not-available', (info) => {
        state.checking = false;
        state.updateAvailable = false;
        state.lastCheck = new Date().toISOString();

        logManager.info(`Sin actualizaciones. Versión actual: v${info.version}`, 'update');
        pushToRenderer('system:update-progress', {
            event: 'update-not-available',
            currentVersion: info.version
        });
    });

    autoUpdater.on('download-progress', (progress) => {
        state.downloading = true;
        state.downloadProgress = {
            percent: Math.round(progress.percent),
            bytesPerSecond: progress.bytesPerSecond,
            transferred: progress.transferred,
            total: progress.total
        };

        pushToRenderer('system:update-progress', {
            event: 'download-progress',
            progress: state.downloadProgress
        });
    });

    autoUpdater.on('update-downloaded', (info) => {
        state.downloading = false;
        state.updateDownloaded = true;

        logManager.info(`Actualización v${info.version} descargada y lista para instalar`, 'update');
        pushToRenderer('system:update-progress', {
            event: 'update-downloaded',
            version: info.version
        });
    });

    autoUpdater.on('error', (error) => {
        state.checking = false;
        state.downloading = false;
        state.error = error.message;

        logManager.error(`Error en actualización: ${error.message}`, 'update');
        pushToRenderer('system:update-progress', {
            event: 'error',
            error: error.message
        });
    });
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Inicializa el UpdateManager. Debe llamarse una vez al arranque.
 * @param {BrowserWindow} mainWindow — Ventana principal (para fallback)
 */
export function initUpdateManager(mainWindow) {
    configureAutoUpdater();
    registerIpcHandlers();

    logManager.info('UpdateManager inicializado', 'update');

    // Check automático 5 segundos después del arranque (solo si es producción)
    if (app.isPackaged) {
        setTimeout(() => {
            checkForUpdates();
        }, 5000);
    }
}

/**
 * Verifica si hay actualizaciones disponibles.
 */
export async function checkForUpdates() {
    if (state.checking || state.downloading) {
        logManager.warn('Ya hay una verificación/descarga en curso', 'update');
        return { success: false, message: 'Operación en curso' };
    }

    const online = await isOnline();
    if (!online) {
        logManager.warn('Sin conexión a Internet — verificación omitida', 'update');
        return { success: false, message: 'Sin conexión a Internet' };
    }

    try {
        state.lastCheck = new Date().toISOString();
        const result = await autoUpdater.checkForUpdates();
        return { success: true, updateAvailable: state.updateAvailable, info: state.updateInfo };
    } catch (error) {
        logManager.error(`Error al verificar actualizaciones: ${error.message}`, 'update');
        return { success: false, error: error.message };
    }
}

/**
 * Descarga la actualización disponible.
 */
export async function downloadUpdate() {
    if (!state.updateAvailable) {
        return { success: false, message: 'No hay actualización disponible' };
    }

    if (state.downloading) {
        return { success: false, message: 'Descarga ya en curso' };
    }

    try {
        logManager.info('Iniciando descarga de actualización...', 'update');
        await autoUpdater.downloadUpdate();
        return { success: true };
    } catch (error) {
        logManager.error(`Error al descargar: ${error.message}`, 'update');
        return { success: false, error: error.message };
    }
}

/**
 * Instala la actualización descargada.
 * OBLIGATORIAMENTE crea un backup antes de instalar.
 */
export async function installUpdate() {
    if (!state.updateDownloaded) {
        return { success: false, message: 'No hay actualización descargada para instalar' };
    }

    try {
        // BACKUP OBLIGATORIO antes de instalar
        logManager.info('Creando backup obligatorio pre-actualización...', 'update');
        const backupPath = createBackup('pre-update');

        if (!backupPath) {
            logManager.warn('No se pudo crear backup pre-update (¿primera instalación?)', 'update');
        } else {
            state.backupBeforeUpdate = backupPath;
            logManager.info(`Backup pre-update creado: ${backupPath}`, 'update');
        }

        logManager.info(`Instalando actualización v${state.updateInfo?.version}...`, 'update');

        // quitAndInstall reinicia la app
        autoUpdater.quitAndInstall(false, true);
        return { success: true };

    } catch (error) {
        logManager.error(`Error al instalar: ${error.message}`, 'update');
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene el estado actual del UpdateManager.
 */
export function getUpdateStatus() {
    return {
        currentVersion: app.getVersion(),
        ...state
    };
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────

function registerIpcHandlers() {

    ipcMain.handle('system:update-check', async () => {
        return await checkForUpdates();
    });

    ipcMain.handle('system:update-download', async () => {
        return await downloadUpdate();
    });

    ipcMain.handle('system:update-install', async () => {
        return await installUpdate();
    });

    ipcMain.handle('system:update-status', () => {
        return { success: true, ...getUpdateStatus() };
    });
}

export default initUpdateManager;
