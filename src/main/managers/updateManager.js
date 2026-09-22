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

import { app, BrowserWindow, ipcMain, net } from 'electron';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import path from 'path';
import https from 'https';
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

    // Permitir verificación de actualizaciones en desarrollo si dev-app-update.yml está presente
    if (!app.isPackaged) {
        autoUpdater.forceDevUpdateConfig = true;
    }

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

        let notes = info.releaseNotes;
        if (!notes || notes === 'Sin notas de versión disponibles') {
            const cachedMatch = cachedChangelog?.releases?.find(r => matchesVersion(r.version, info.version) || matchesVersion(r.tag, info.version));
            if (cachedMatch?.notes || cachedMatch?.body) {
                notes = cachedMatch.notes || cachedMatch.body;
            }
        }

        state.updateInfo = {
            version: info.version,
            releaseDate: info.releaseDate,
            releaseNotes: notes || 'Sin notas de versión disponibles',
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
        state.updateInfo = null;
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
export function initUpdateManager() {
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
        pushToRenderer('system:update-progress', {
            event: 'error',
            error: 'Sin conexión a Internet'
        });
        return { success: false, message: 'Sin conexión a Internet', error: 'Sin conexión a Internet' };
    }

    try {
        state.checking = true;
        state.error = null;
        pushToRenderer('system:update-progress', { event: 'checking' });
        state.lastCheck = new Date().toISOString();
        await autoUpdater.checkForUpdates();
        return { success: true, updateAvailable: state.updateAvailable, info: state.updateInfo };
    } catch (error) {
        state.checking = false;
        logManager.error(`Error al verificar actualizaciones: ${error.message}`, 'update');
        pushToRenderer('system:update-progress', {
            event: 'error',
            error: error.message
        });
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

// ── Gestión del Changelog y Notas de Versión ─────────────────────────────────

let cachedChangelog = null;
let lastChangelogFetch = 0;

/**
 * Lee el archivo de changelog local desde docs o resources.
 */
function readLocalChangelog() {
    const candidates = [
        path.join(process.cwd(), 'docs', 'releases_changelog.md'),
        path.join(process.cwd(), 'resources', 'releases_changelog.md'),
        path.join(app.getAppPath(), 'docs', 'releases_changelog.md'),
        path.join(app.getAppPath(), 'resources', 'releases_changelog.md'),
        ...(process.resourcesPath ? [
            path.join(process.resourcesPath, 'resources', 'releases_changelog.md'),
            path.join(process.resourcesPath, 'releases_changelog.md')
        ] : [])
    ];

    for (const candidate of candidates) {
        try {
            if (fs.existsSync(candidate)) {
                const content = fs.readFileSync(candidate, 'utf8');
                if (content && content.trim().length > 0) {
                    return content;
                }
            }
        } catch {
            // Continuar con el siguiente candidato
        }
    }
    return null;
}

/**
 * Normaliza y compara si dos versiones corresponden al mismo lanzamiento.
 */
function matchesVersion(tagOrVersion, appVersion) {
    if (!tagOrVersion || !appVersion) return false;
    const cleanTag = String(tagOrVersion).replace(/^v/, '').trim();
    const cleanApp = String(appVersion).replace(/^v/, '').trim();
    return cleanTag === cleanApp || cleanTag.startsWith(cleanApp) || cleanApp.startsWith(cleanTag.split('-')[0]);
}

/**
 * Parsea el changelog en markdown dividiéndolo en secciones por versión.
 */
function parseChangelogMarkdown(markdown) {
    if (!markdown) return [];
    const regex = /(?=^#{1,2}\s+.*Notas de la versi)/m;
    const parts = markdown.split(regex);
    const releases = [];

    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const firstLine = trimmed.split('\n')[0];
        const match = /(?:v)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/i.exec(firstLine);
        if (match) {
            const version = match[1].replace(/^v/, '');
            const tag = `v${version}`;
            const isBeta = /beta|rc|pre-release/i.test(firstLine);

            const dateMatch = /\*\*📅 Fecha de lanzamiento:\*\*\s*([^\n\r]+)/.exec(trimmed);
            const releaseDate = dateMatch ? dateMatch[1].trim() : null;

            releases.push({
                tag,
                version,
                name: firstLine.replace(/^#{1,2}\s+/, '').trim(),
                releaseDate,
                publishedAt: releaseDate,
                isPrerelease: isBeta,
                notes: trimmed,
                body: trimmed
            });
        }
    }
    return releases;
}

/**
 * Consulta la API de GitHub para obtener los releases publicados (con timeout).
 */
function fetchGitHubReleases(timeoutMs = 3500) {
    return new Promise((resolve) => {
        let isDone = false;
        const timer = setTimeout(() => {
            if (!isDone) {
                isDone = true;
                resolve(null);
            }
        }, timeoutMs);

        try {
            const req = https.get('https://api.github.com/repos/Mahynlo/AGUA-VP/releases', {
                headers: {
                    'User-Agent': 'AguaVP-UpdateManager',
                    'Accept': 'application/vnd.github+json'
                }
            }, (res) => {
                if (res.statusCode && res.statusCode >= 400) {
                    clearTimeout(timer);
                    if (!isDone) {
                        isDone = true;
                        resolve(null);
                    }
                    return;
                }
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    clearTimeout(timer);
                    if (!isDone) {
                        isDone = true;
                        try {
                            const parsed = JSON.parse(data);
                            resolve(Array.isArray(parsed) ? parsed : null);
                        } catch {
                            resolve(null);
                        }
                    }
                });
            });

            req.on('error', () => {
                clearTimeout(timer);
                if (!isDone) {
                    isDone = true;
                    resolve(null);
                }
            });
        } catch {
            clearTimeout(timer);
            if (!isDone) {
                isDone = true;
                resolve(null);
            }
        }
    });
}

/**
 * Obtiene el registro completo de versiones y notas de la versión actual.
 */
export async function getChangelog(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedChangelog && (now - lastChangelogFetch < 300000)) {
        return cachedChangelog;
    }

    const currentAppVersion = app.getVersion();
    const localMd = readLocalChangelog();
    const localReleases = parseChangelogMarkdown(localMd);

    let githubReleases = null;
    try {
        const online = await isOnline();
        if (online) {
            githubReleases = await fetchGitHubReleases(3500);
        }
    } catch {
        // Fallback a archivos locales
    }

    const unifiedReleases = [];
    const seenTags = new Set();

    if (Array.isArray(githubReleases) && githubReleases.length > 0) {
        for (const gr of githubReleases) {
            const tag = gr.tag_name || `v${gr.name}`;
            const cleanVer = tag.replace(/^v/, '');
            seenTags.add(cleanVer);
            seenTags.add(tag);

            unifiedReleases.push({
                tag,
                version: cleanVer,
                name: gr.name || tag,
                releaseDate: gr.published_at ? new Date(gr.published_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : null,
                publishedAt: gr.published_at || null,
                isPrerelease: Boolean(gr.prerelease),
                htmlUrl: gr.html_url || null,
                notes: gr.body || 'Sin notas de versión disponibles en GitHub.',
                body: gr.body || 'Sin notas de versión disponibles en GitHub.'
            });
        }
    }

    for (const lr of localReleases) {
        if (!seenTags.has(lr.version) && !seenTags.has(lr.tag)) {
            seenTags.add(lr.version);
            seenTags.add(lr.tag);
            unifiedReleases.push(lr);
        }
    }

    if (unifiedReleases.length === 0 && localMd) {
        unifiedReleases.push({
            tag: `v${currentAppVersion}`,
            version: currentAppVersion,
            name: `Notas de la versión v${currentAppVersion}`,
            releaseDate: null,
            publishedAt: null,
            isPrerelease: false,
            notes: localMd,
            body: localMd
        });
    }

    let currentRelease = unifiedReleases.find(r => matchesVersion(r.version, currentAppVersion) || matchesVersion(r.tag, currentAppVersion));
    if (!currentRelease && unifiedReleases.length > 0) {
        currentRelease = unifiedReleases[0];
    }

    const releasesWithCurrent = unifiedReleases.map(r => ({
        ...r,
        isCurrent: Boolean(currentRelease && (r.version === currentRelease.version || r.tag === currentRelease.tag))
    }));

    cachedChangelog = {
        success: true,
        currentVersion: currentAppVersion,
        currentReleaseNotes: currentRelease ? currentRelease.notes : (localMd || 'Notas de versión no disponibles.'),
        currentReleaseInfo: currentRelease || null,
        releases: releasesWithCurrent,
        fullChangelog: localMd || ''
    };
    lastChangelogFetch = now;

    return cachedChangelog;
}

/**
 * Obtiene el estado actual del UpdateManager.
 */
export function getUpdateStatus() {
    const currentAppVersion = app.getVersion();
    let currentReleaseNotes = cachedChangelog?.currentReleaseNotes || null;
    let releases = cachedChangelog?.releases || [];

    if (!currentReleaseNotes) {
        const localMd = readLocalChangelog();
        const parsed = parseChangelogMarkdown(localMd);
        const match = parsed.find(r => matchesVersion(r.version, currentAppVersion) || matchesVersion(r.tag, currentAppVersion));
        currentReleaseNotes = match?.notes || localMd || null;
        if (releases.length === 0 && parsed.length > 0) {
            releases = parsed.map(r => ({
                ...r,
                isCurrent: Boolean(match && (r.version === match.version || r.tag === match.tag))
            }));
        }
    }

    return {
        currentVersion: currentAppVersion,
        currentReleaseNotes,
        releases,
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

    ipcMain.handle('system:get-changelog', async (_event, forceRefresh) => {
        return await getChangelog(forceRefresh);
    });
}

export default initUpdateManager;
