/**
 * apiManager.js — Gestiona el ciclo de vida del servidor API embebido.
 *
 * Responsabilidades:
 *  1. Generar y persistir secretos JWT/AppKey en first-run (cifrado con safeStorage)
 *  2. Crear backup de la base de datos antes de cada arranque
 *  3. Iniciar / detener AguaVPServer
 *  4. Exponer estado y backup manual para los IPC handlers
 */

import { app, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
// AguaVPServer se carga con dynamic import para evitar que electron-vite
// transforme el import ESM a require() (que falla con módulos ES puros).

// ── Constantes ────────────────────────────────────────────────────────────────

const SECRETS_FILE  = 'api-secrets.enc';   // Almacenado en userData, cifrado
const DB_FILENAME   = 'agua-vp.db';
const MAX_BACKUPS   = 5;
const API_PORT      = 3000;

// ── Estado del módulo ─────────────────────────────────────────────────────────

let apiServer = null;

// ── Secretos ──────────────────────────────────────────────────────────────────

/**
 * Carga los secretos del fichero cifrado en userData.
 * Si no existe, los genera aleatoriamente y los persiste.
 */
function loadOrCreateSecrets() {
    const file = path.join(app.getPath('userData'), SECRETS_FILE);

    if (fs.existsSync(file)) {
        try {
            const encrypted = fs.readFileSync(file);
            const json = safeStorage.decryptString(encrypted);
            return JSON.parse(json);
        } catch (err) {
            console.warn('[apiManager] Secretos corruptos — regenerando:', err.message);
        }
    }

    // Primera ejecución o archivo dañado: generar secretos nuevos
    const secrets = {
        jwtSecret:    crypto.randomBytes(64).toString('hex'),
        secretAppKey: crypto.randomBytes(32).toString('hex')
    };

    const encrypted = safeStorage.encryptString(JSON.stringify(secrets));
    fs.writeFileSync(file, encrypted, { mode: 0o600 });
    console.log('[apiManager] Secretos generados y guardados correctamente.');
    return secrets;
}

// ── Backup ────────────────────────────────────────────────────────────────────

/**
 * Crea una copia de seguridad de la base de datos.
 * Mantiene solo los MAX_BACKUPS backups más recientes.
 * @returns {string|null} Ruta del backup creado, o null si la BD no existe aún.
 */
export function createBackup() {
    const dbPath = path.join(app.getPath('userData'), DB_FILENAME);

    if (!fs.existsSync(dbPath)) {
        console.log('[apiManager] No existe BD aún — backup omitido (primera instalación).');
        return null;
    }

    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dest = path.join(backupDir, `agua-vp-backup-${ts}.db`);
    fs.copyFileSync(dbPath, dest);
    console.log(`[apiManager] Backup creado: ${dest}`);

    // Limpiar backups viejos
    const all = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('agua-vp-backup-') && f.endsWith('.db'))
        .map(f => ({ name: f, mtimeMs: fs.statSync(path.join(backupDir, f)).mtimeMs }))
        .sort((a, b) => a.mtimeMs - b.mtimeMs);

    while (all.length > MAX_BACKUPS) {
        const oldest = all.shift();
        fs.unlinkSync(path.join(backupDir, oldest.name));
        console.log(`[apiManager] Backup antiguo eliminado: ${oldest.name}`);
    }

    return dest;
}

/**
 * Lista los backups disponibles en userData/backups/
 * @returns {{ name: string, path: string, size: number, createdAt: string }[]}
 */
export function listBackups() {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) return [];

    return fs.readdirSync(backupDir)
        .filter(f => f.startsWith('agua-vp-backup-') && f.endsWith('.db'))
        .map(f => {
            const fullPath = path.join(backupDir, f);
            const stat     = fs.statSync(fullPath);
            return {
                name:      f,
                path:      fullPath,
                size:      stat.size,
                createdAt: stat.mtime.toISOString()
            };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ── Ciclo de vida del servidor ─────────────────────────────────────────────────

/**
 * Inicia el servidor API embebido.
 * Proceso:
 *  1. Carga / genera secretos
 *  2. Crea backup de la BD (si existe)
 *  3. Arranca AguaVPServer (que ejecuta migraciones antes del listen)
 */
export async function startApiServer() {
    if (apiServer?.isRunning) {
        console.log('[apiManager] El servidor ya está corriendo.');
        return;
    }

    const userDataPath = app.getPath('userData');
    const dbPath       = path.join(userDataPath, DB_FILENAME);
    const secrets      = loadOrCreateSecrets();

    // Backup antes de migraciones
    createBackup();

    const appKeyInicial = import.meta.env.VITE_APPKEY_INICIAL;
    if (!appKeyInicial) {
        throw new Error('[apiManager] VITE_APPKEY_INICIAL no está definido en el entorno.');
    }

    // Dynamic import: vite-main no lo transforma a require(), así el módulo ESM carga correctamente
    const { default: AguaVPServer } = await import('@aguavp/api-server');

    apiServer = new AguaVPServer({
        port:         API_PORT,
        dbPath,
        jwtSecret:    secrets.jwtSecret,
        secretAppKey: secrets.secretAppKey,
        appKeyInicial,
        nodeEnv:      import.meta.env.PROD ? 'production' : 'development',
        autoMigrate:  true
    });

    apiServer.on('log',     msg => console.log(`[API] ${msg}`));
    apiServer.on('error',   err => console.error(`[API ERROR] ${err}`));
    apiServer.on('started', info => console.log(`[API] ✅ Servidor listo en http://localhost:${info.port}`));

    await apiServer.start();
}

/**
 * Detiene el servidor API de forma ordenada.
 */
export async function stopApiServer() {
    if (apiServer?.isRunning) {
        await apiServer.stop();
        console.log('[apiManager] Servidor detenido.');
    }
}

/**
 * Devuelve el estado actual del servidor.
 */
export function getApiServerStatus() {
    if (!apiServer) return { running: false, port: API_PORT };
    return apiServer.getStatus();
}
