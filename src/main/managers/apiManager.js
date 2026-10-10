/**
 * apiManager.js — Gestiona el ciclo de vida del servidor API embebido.
 *
 * Responsabilidades:
 *  1. Generar y persistir secretos JWT/AppKey en first-run (cifrado con safeStorage)
 *  2. Crear backup de la base de datos antes de cada arranque
 *  3. Iniciar / detener AguaVPServer
 *  4. Exponer estado, backup, restauración e info de BD para los IPC handlers
 *  5. Gestionar historial de migraciones
 */

import { app, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import logManager from './logManager.js';
import {
    snapshotDatabase, stageRestore, applyPendingRestore, cleanupRestoreLeftovers,
    planBackupRotation, backupReason, PROTECTED_REASONS
} from './dbFiles.js';
// AguaVPServer se carga con dynamic import para evitar que electron-vite
// transforme el import ESM a require() (que falla con módulos ES puros).

// ── Constantes ────────────────────────────────────────────────────────────────

const SECRETS_FILE  = 'api-secrets.enc';   // Almacenado en userData, cifrado
const DB_FILENAME   = 'agua-vp.db';
const API_PORT      = 3000;

// ── Configuración mutable ─────────────────────────────────────────────────────

const BACKUP_CONFIG_FILE = 'backup-config.json';
const DEFAULT_BACKUP_CONFIG = { maxBackups: 5, diasDiarios: 14, maxProtegidos: 10 };

/** Configuración de respaldos guardada en userData (sobrevive a reinicios). */
function loadBackupConfig() {
    try {
        const file = path.join(app.getPath('userData'), BACKUP_CONFIG_FILE);
        if (fs.existsSync(file)) return { ...DEFAULT_BACKUP_CONFIG, ...JSON.parse(fs.readFileSync(file, 'utf-8')) };
    } catch (err) {
        logManager.warn(`Configuración de respaldos ilegible, se usan valores por defecto: ${err.message}`, 'backup');
    }
    return { ...DEFAULT_BACKUP_CONFIG };
}

function saveBackupConfig(config) {
    fs.writeFileSync(path.join(app.getPath('userData'), BACKUP_CONFIG_FILE), JSON.stringify(config, null, 2));
}

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
            logManager.warn(`Secretos corruptos — regenerando: ${err.message}`, 'system');
        }
    }

    // Primera ejecución o archivo dañado: generar secretos nuevos
    const secrets = {
        jwtSecret:    crypto.randomBytes(64).toString('hex'),
        secretAppKey: crypto.randomBytes(32).toString('hex')
    };

    const encrypted = safeStorage.encryptString(JSON.stringify(secrets));
    fs.writeFileSync(file, encrypted, { mode: 0o600 });
    logManager.info('Secretos generados y guardados correctamente', 'system');
    return secrets;
}

/**
 * Guarda los secretos cifrados con safeStorage en userData.
 */
function saveSecrets(secrets) {
    const file = path.join(app.getPath('userData'), SECRETS_FILE);
    const encrypted = safeStorage.encryptString(JSON.stringify(secrets));
    fs.writeFileSync(file, encrypted, { mode: 0o600 });
}

// ── Backup ────────────────────────────────────────────────────────────────────

/**
 * Crea una copia de seguridad de la base de datos.
 * Usa VACUUM INTO (incluye los cambios que aún están en el WAL); copiar solo el archivo principal
 * perdería los cambios recientes. Mantiene solo los `maxBackups` backups más recientes.
 * @param {string} reason
 * @param {{ strict?: boolean }} [options] - strict: lanza si VACUUM INTO falla (sin copia de respaldo simple)
 * @returns {string|null} Ruta del backup creado, o null si la BD no existe aún.
 */
export function createBackup(reason = 'manual', { strict = false } = {}) {
    const dbPath = path.join(app.getPath('userData'), DB_FILENAME);

    if (!fs.existsSync(dbPath)) {
        logManager.info('No existe BD aún — backup omitido (primera instalación)', 'backup');
        return null;
    }

    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // El motivo va en el nombre: los respaldos previos a restaurar/actualizar se conservan aparte
    const motivo = ['pre-arranque', 'manual', 'pre-update', 'pre-restore'].includes(reason) ? reason : 'manual';
    const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let dest = path.join(backupDir, `agua-vp-backup-${ts}-${motivo}.db`);
    for (let n = 1; fs.existsSync(dest); n++) {
        dest = path.join(backupDir, `agua-vp-backup-${ts}-${n}-${motivo}.db`);
    }
    try {
        snapshotDatabase(dbPath, dest);
    } catch (err) {
        fs.rmSync(dest, { force: true });
        if (strict) throw new Error(`No se pudo crear el respaldo (${reason}): ${err.message}`);
        logManager.warn(`VACUUM INTO falló (${err.message}) — copia simple del archivo (puede omitir cambios del WAL)`, 'backup');
        fs.copyFileSync(dbPath, dest);
    }
    logManager.info(`Backup creado (${reason}): ${dest}`, 'backup');

    // Rotación: recientes + uno por día + protegidos (pre-restore / pre-update) aparte
    const config = loadBackupConfig();
    const all = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('agua-vp-backup-') && f.endsWith('.db'))
        .map(f => ({ name: f, mtimeMs: fs.statSync(path.join(backupDir, f)).mtimeMs }));
    for (const name of planBackupRotation(all, {
        maxRecientes: config.maxBackups,
        diasDiarios: config.diasDiarios,
        maxProtegidos: config.maxProtegidos
    })) {
        if (path.join(backupDir, name) === dest) continue;
        try {
            fs.unlinkSync(path.join(backupDir, name));
            logManager.info(`Backup antiguo eliminado: ${name}`, 'backup');
        } catch (err) {
            logManager.warn(`No se pudo eliminar el backup ${name}: ${err.message}`, 'backup');
        }
    }

    // -wal / -shm sin su .db (quedan si un respaldo en modo WAL se abrió en solo lectura antes de rotarse)
    for (const f of fs.readdirSync(backupDir)) {
        const m = /^(agua-vp-backup-.+\.db)-(wal|shm)$/.exec(f);
        if (m && !fs.existsSync(path.join(backupDir, m[1]))) {
            try { fs.rmSync(path.join(backupDir, f), { force: true }); } catch (_) { /* en uso: siguiente respaldo */ }
        }
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
            const motivo = backupReason(f);
            return {
                name:      f,
                path:      fullPath,
                size:      stat.size,
                createdAt: stat.mtime.toISOString(),
                motivo,
                protegido: PROTECTED_REASONS.includes(motivo)
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
        logManager.warn('El servidor ya está corriendo', 'api');
        return;
    }

    // Inicializar LogManager al arranque
    logManager.init();
    logManager.info('Iniciando ciclo de vida del servidor API', 'system');

    const userDataPath = app.getPath('userData');
    const dbPath       = path.join(userDataPath, DB_FILENAME);
    const secrets      = loadOrCreateSecrets();

    // Restauración pendiente (respaldo local o copia de la nube): se aplica antes de abrir la base
    try {
        const restore = applyPendingRestore(dbPath, () => createBackup('pre-restore', { strict: true }));
        if (restore?.applied) {
            logManager.warn(`Restauración aplicada. Respaldo de la base anterior: ${restore.backup || 'no había base'}`, 'backup');
        } else if (restore?.error) {
            logManager.error(restore.error, 'backup');
        }
    } catch (err) {
        logManager.error(`No se pudo aplicar la restauración pendiente: ${err.message}. La base actual no se modificó.`, 'backup');
    }

    // Restos de restauraciones anteriores (archivos temporales, bases preparadas no aplicadas)
    for (const f of cleanupRestoreLeftovers(dbPath, path.join(userDataPath, 'restauraciones'))) {
        logManager.info(`Archivo temporal de restauración eliminado: ${path.basename(f)}`, 'backup');
    }

    // Backup antes de migraciones
    createBackup('pre-arranque');

    const appKeyInicial = import.meta.env.VITE_APPKEY_INICIAL;
    if (!appKeyInicial) {
        throw new Error('[apiManager] VITE_APPKEY_INICIAL no está definido en el entorno.');
    }

    const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
    const resendFromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL;
    const appPublicUrl = import.meta.env.VITE_APP_PUBLIC_URL || import.meta.env.VITE_APP_URL;

    if (resendApiKey && !process.env.RESEND_API_KEY) {
        process.env.RESEND_API_KEY = resendApiKey;
    }

    if (resendFromEmail && !process.env.RESEND_FROM_EMAIL) {
        process.env.RESEND_FROM_EMAIL = resendFromEmail;
    }

    if (appPublicUrl && !process.env.APP_PUBLIC_URL) {
        process.env.APP_PUBLIC_URL = appPublicUrl;
    }

    // Dynamic import: vite-main no lo transforma a require(), así el módulo ESM carga correctamente
    const { default: AguaVPServer } = await import('@aguavp/api-server');

    apiServer = new AguaVPServer({
        port:         API_PORT,
        dbPath,
        jwtSecret:    secrets.jwtSecret,
        secretAppKey: secrets.secretAppKey,
        appKeyInicial,
        tursoDatabaseUrl: secrets.tursoUrl || '',
        tursoAuthToken: secrets.tursoToken || '',
        tursoAutoSync: secrets.autoSync !== false,
        tursoEquipoId: getEquipoId(),
        nodeEnv:      import.meta.env.PROD ? 'production' : 'development',
        autoMigrate:  true
    });

    // Redirigir logs del servidor API al LogManager
    apiServer.on('log',     msg => logManager.info(msg, 'api'));
    apiServer.on('error',   err => logManager.error(String(err), 'api'));
    // Sincronización con Turso → visor de logs (fuente 'nube'); antes solo iba a la consola
    apiServer.on('sync-log', ({ nivel, mensaje } = {}) => {
        if (nivel === 'error') logManager.error(mensaje, 'nube');
        else if (nivel === 'warn') logManager.warn(mensaje, 'nube');
        else logManager.info(mensaje, 'nube');
    });
    apiServer.on('started', info => logManager.info(`Servidor listo en http://localhost:${info.port}`, 'api'));

    await apiServer.start();
}

/**
 * Detiene el servidor API de forma ordenada.
 */
export async function stopApiServer() {
    if (apiServer?.isRunning) {
        await apiServer.stop();
        logManager.info('Servidor API detenido', 'system');
    }
}

/**
 * Devuelve el estado actual del servidor.
 */
export function getApiServerStatus() {
    if (!apiServer) return { running: false, port: API_PORT };
    return apiServer.getStatus();
}

// ── Restauración de Backup ─────────────────────────────────────────────────────

/**
 * Restaura la base de datos desde un archivo de backup.
 * La base en uso tiene una conexión abierta en la API (modo WAL): copiar encima la corrompería o el WAL
 * desharía la restauración. Por eso el respaldo se valida y se deja preparado; se aplica al reiniciar
 * la app (`applyPendingRestore` en startApiServer), después de respaldar la base actual con su WAL.
 * @param {string} backupPath — Ruta absoluta al archivo de backup
 * @returns {Promise<{success: boolean, message: string, restartRequired?: boolean}>}
 */
export async function restoreBackup(backupPath) {
    const dbPath = path.join(app.getPath('userData'), DB_FILENAME);

    if (!fs.existsSync(backupPath)) {
        return { success: false, message: 'Archivo de backup no encontrado' };
    }

    try {
        stageRestore(backupPath, dbPath, { requireFullSync: true });
        logManager.warn(`Restauración preparada desde: ${path.basename(backupPath)} — se aplicará al reiniciar`, 'backup');
        return {
            success: true,
            restartRequired: true,
            message: `Respaldo ${path.basename(backupPath)} verificado. AguaVP se reiniciará para aplicarlo.`
        };
    } catch (error) {
        logManager.error(`Error preparando la restauración: ${error.message}`, 'backup');
        return { success: false, message: error.message };
    }
}

/**
 * Reinicia la app para aplicar una restauración preparada.
 * En desarrollo (electron-vite) no se relanza: hay que volver a ejecutar `npm run dev`.
 */
export function restartAppForRestore(delayMs = 2000) {
    setTimeout(() => {
        if (app.isPackaged) app.relaunch();
        app.exit(0);
    }, delayMs);
}

// ── Información de la Base de Datos ────────────────────────────────────────────

/**
 * Obtiene información detallada de la base de datos.
 * @returns {{ size, tables, integrityOk, foreignKeyErrors, path, walSize }}
 */
export function getDatabaseInfo() {
    const dbPath = path.join(app.getPath('userData'), DB_FILENAME);

    if (!fs.existsSync(dbPath)) {
        return { exists: false, path: dbPath };
    }

    try {
        const stat = fs.statSync(dbPath);
        const db = new Database(dbPath, { readonly: true });

        // Tablas y su conteo de filas
        const tables = db.prepare(
            `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle_%' ORDER BY name`
        ).all().map(t => {
            const row = db.prepare(`SELECT COUNT(*) as cnt FROM "${t.name}"`).get();
            return { name: t.name, count: row.cnt };
        });

        // Integrity check
        const integrity = db.pragma('integrity_check');
        const integrityOk = integrity[0]?.integrity_check === 'ok';

        // Foreign key check
        const fkErrors = db.pragma('foreign_key_check');

        // WAL file size
        const walPath = `${dbPath}-wal`;
        const walSize = fs.existsSync(walPath) ? fs.statSync(walPath).size : 0;

        db.close();

        return {
            exists: true,
            path: dbPath,
            size: stat.size,
            walSize,
            tables,
            totalTables: tables.length,
            integrityCheck: integrityOk ? 'ok' : 'error',
            foreignKeyCheck: fkErrors,
            lastModified: stat.mtime.toISOString()
        };
    } catch (error) {
        logManager.error(`Error obteniendo info de BD: ${error.message}`, 'system');
        return { exists: true, path: dbPath, error: error.message };
    }
}

// ── Historial de Migraciones ───────────────────────────────────────────────────

/**
 * Lee el historial de migraciones aplicadas desde __drizzle_migrations.
 * @returns {Array<{id, hash, created_at, tag}>}
 */
export function getMigrationHistory() {
    const dbPath = path.join(app.getPath('userData'), DB_FILENAME);

    if (!fs.existsSync(dbPath)) {
        return [];
    }

    try {
        const db = new Database(dbPath, { readonly: true });

        // Verificar que la tabla existe
        const tableExists = db.prepare(
            `SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'`
        ).get();

        if (!tableExists) {
            db.close();
            return [];
        }

        const migrations = db.prepare(
            `SELECT id, hash, created_at FROM "__drizzle_migrations" ORDER BY created_at ASC`
        ).all();

        db.close();

        // Enriquecer con nombres de migración si es posible
        return migrations.map(m => ({
            id: m.id,
            hash: m.hash,
            created_at: m.created_at,
            // Convertir timestamp a fecha legible
            applied_at: new Date(Number(m.created_at)).toISOString()
        }));
    } catch (error) {
        logManager.error(`Error leyendo migraciones: ${error.message}`, 'system');
        return [];
    }
}

// ── Configuración de backups ───────────────────────────────────────────────────

/**
 * Actualiza la configuración de backups.
 * @param {{ maxBackups?: number }} config
 */
export function updateBackupConfig(config) {
    const actual = loadBackupConfig();
    if (config.maxBackups && config.maxBackups >= 1 && config.maxBackups <= 50) actual.maxBackups = config.maxBackups;
    if (config.diasDiarios && config.diasDiarios >= 1 && config.diasDiarios <= 365) actual.diasDiarios = config.diasDiarios;
    saveBackupConfig(actual);
    logManager.info(`Configuración de backups actualizada: ${actual.maxBackups} recientes, ${actual.diasDiarios} días`, 'backup');
    return { maxBackups: actual.maxBackups, diasDiarios: actual.diasDiarios };
}

/**
 * Obtiene la configuración actual de backups.
 */
export function getBackupConfig() {
    const config = loadBackupConfig();
    return {
        maxBackups: config.maxBackups,
        diasDiarios: config.diasDiarios,
        maxProtegidos: config.maxProtegidos,
        backupDir: path.join(app.getPath('userData'), 'backups'),
        dbPath: path.join(app.getPath('userData'), DB_FILENAME)
    };
}

// ── Sincronización Turso Cloud ────────────────────────────────────────────────

/**
 * Identificador de ESTA computadora para la copia en la nube. Se guarda en api-secrets.enc (fuera de la base
 * de datos): si la misma base se usa en otra computadora, la API detecta que otro equipo escribe en la copia.
 */
export function getEquipoId() {
    const secrets = loadOrCreateSecrets();
    if (!secrets.equipoId) {
        secrets.equipoId = crypto.randomUUID();
        saveSecrets(secrets);
    }
    return secrets.equipoId;
}

/**
 * Headers para /api/v2/sync/*: la API acepta la clave interna (el mismo secretAppKey que
 * esta app le entrega al arrancar) en lugar de una sesión de usuario.
 */
function syncHeaders() {
    const secrets = loadOrCreateSecrets();
    return {
        'Content-Type': 'application/json',
        'x-aguavp-internal-key': secrets.secretAppKey
    };
}

/**
 * Verifica un token de sesión con el secreto JWT real de la API embebida.
 * @returns {Object|null} payload ({ rol, ... }) o null si es inválido o expiró.
 */
export function verifySessionToken(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        return jwt.verify(token, loadOrCreateSecrets().jwtSecret);
    } catch {
        return null;
    }
}

/**
 * Obtiene la configuración de Turso (sin revelar el token completo).
 */
export function getTursoConfig() {
    const secrets = loadOrCreateSecrets();
    return {
        configured: Boolean(secrets.tursoUrl && secrets.tursoToken),
        tursoUrl: secrets.tursoUrl || '',
        hasToken: Boolean(secrets.tursoToken),
        autoSync: secrets.autoSync !== false,
        lastSync: secrets.lastSync || null
    };
}

/**
 * Guarda la configuración de Turso cifrada en api-secrets.enc.
 */
export async function saveTursoConfig({ tursoUrl, tursoToken, autoSync }) {
    const secrets = loadOrCreateSecrets();
    if (tursoUrl !== undefined) secrets.tursoUrl = (tursoUrl || '').trim();
    if (tursoToken !== undefined && tursoToken.trim().length > 0) {
        secrets.tursoToken = tursoToken.trim();
    }
    if (autoSync !== undefined) secrets.autoSync = Boolean(autoSync);

    saveSecrets(secrets);
    logManager.info('Configuración de Turso guardada de forma cifrada', 'system');

    // Notificar al servidor en caliente si está corriendo
    if (apiServer?.isRunning) {
        try {
            await fetch(`http://localhost:${API_PORT}/api/v2/sync/configure`, {
                method: 'POST',
                headers: syncHeaders(),
                body: JSON.stringify({
                    tursoUrl: secrets.tursoUrl,
                    tursoToken: secrets.tursoToken,
                    autoSync: secrets.autoSync,
                    equipoId: getEquipoId()
                })
            });
        } catch (e) {
            logManager.warn(`No se pudo notificar a la API sobre Turso: ${e.message}`, 'system');
        }
    }

    return getTursoConfig();
}

/**
 * Elimina las credenciales de Turso regresando a modo local puro.
 */
export async function clearTursoConfig() {
    const secrets = loadOrCreateSecrets();
    delete secrets.tursoUrl;
    delete secrets.tursoToken;
    secrets.autoSync = false;

    saveSecrets(secrets);
    logManager.info('Credenciales de Turso eliminadas. Modo local puro activo.', 'system');

    if (apiServer?.isRunning) {
        try {
            await fetch(`http://localhost:${API_PORT}/api/v2/sync/configure`, {
                method: 'POST',
                headers: syncHeaders(),
                body: JSON.stringify({ tursoUrl: '', tursoToken: '', autoSync: false })
            });
        } catch (_) {}
    }

    return getTursoConfig();
}

/**
 * Prueba la conexión con Turso Cloud.
 */
export async function testTursoConnection(tursoUrl, tursoToken) {
    const secrets = loadOrCreateSecrets();
    const url = tursoUrl || secrets.tursoUrl;
    const token = tursoToken || secrets.tursoToken;

    if (!url || !token) {
        return { success: false, error: 'Debe ingresar la URL y el Token de Turso' };
    }

    try {
        const response = await fetch(`http://localhost:${API_PORT}/api/v2/sync/test`, {
            method: 'POST',
            headers: syncHeaders(),
            body: JSON.stringify({ tursoUrl: url, tursoToken: token })
        });
        const data = await response.json();
        return data;
    } catch (e) {
        return { success: false, error: `Error conectando con API local: ${e.message}` };
    }
}

/**
 * Ejecuta sincronización inmediata (incremental o semilla).
 * Si la API bloquea la carga semilla para proteger la nube, devuelve
 * { success: false, conflict: true, motivos, comparacion }.
 * @param {boolean} seed  - carga semilla completa
 * @param {boolean} force - reemplazar la nube aunque haya conflicto (confirmado por el admin)
 */
export async function triggerTursoSync(seed = false, force = false) {
    const endpoint = seed ? 'seed' : 'now';
    try {
        const response = await fetch(`http://localhost:${API_PORT}/api/v2/sync/${endpoint}`, {
            method: 'POST',
            headers: syncHeaders(),
            body: JSON.stringify(seed && force ? { force: true } : {})
        });
        const data = await response.json();
        if (data.success && data.data?.timestamp) {
            const secrets = loadOrCreateSecrets();
            secrets.lastSync = data.data.timestamp;
            saveSecrets(secrets);
        }
        return data;
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Resumen de la copia en la nube (fecha, registros) para confirmar una restauración.
 */
export async function previewCloudRestore() {
    try {
        const response = await fetch(`http://localhost:${API_PORT}/api/v2/sync/restore/preview`, {
            headers: syncHeaders()
        });
        return await response.json();
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Restaura desde la nube: la API construye y valida una base nueva con el esquema actual y los datos de
 * Turso (sin tocar la base en uso); aquí se deja preparada para aplicarse al reiniciar la app.
 */
export async function restoreFromCloud() {
    const dbPath = path.join(app.getPath('userData'), DB_FILENAME);
    try {
        const response = await fetch(`http://localhost:${API_PORT}/api/v2/sync/restore/prepare`, {
            method: 'POST',
            headers: syncHeaders(),
            body: '{}'
        });
        const data = await response.json();
        if (!data.success) return data;

        stageRestore(data.data.archivo, dbPath, { move: true });
        logManager.warn(`Restauración desde la nube preparada (${data.data.totalRegistros} registros) — se aplicará al reiniciar`, 'backup');
        const { archivo: _archivo, ...resumen } = data.data;
        return {
            success: true,
            restartRequired: true,
            message: `Copia de la nube verificada (${data.data.totalRegistros} registros). AguaVP se reiniciará para aplicarla.`,
            data: resumen
        };
    } catch (e) {
        logManager.error(`Error en restauración desde la nube: ${e.message}`, 'backup');
        return { success: false, error: e.message };
    }
}

/**
 * Obtiene el estado detallado de sincronización de la API.
 */
export async function getTursoSyncStatus() {
    try {
        const response = await fetch(`http://localhost:${API_PORT}/api/v2/sync/status`, {
            headers: syncHeaders()
        });
        const data = await response.json();
        return data;
    } catch (e) {
        return { success: false, error: e.message };
    }
}

