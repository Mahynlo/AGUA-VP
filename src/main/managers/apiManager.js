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
import logManager from './logManager.js';
// AguaVPServer se carga con dynamic import para evitar que electron-vite
// transforme el import ESM a require() (que falla con módulos ES puros).

// ── Constantes ────────────────────────────────────────────────────────────────

const SECRETS_FILE  = 'api-secrets.enc';   // Almacenado en userData, cifrado
const DB_FILENAME   = 'agua-vp.db';
const API_PORT      = 3000;

// ── Configuración mutable ─────────────────────────────────────────────────────

let maxBackups = 5; // Configurable desde la UI

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

// ── Backup ────────────────────────────────────────────────────────────────────

/**
 * Crea una copia de seguridad de la base de datos.
 * Mantiene solo los MAX_BACKUPS backups más recientes.
 * @returns {string|null} Ruta del backup creado, o null si la BD no existe aún.
 */
export function createBackup(reason = 'manual') {
    const dbPath = path.join(app.getPath('userData'), DB_FILENAME);

    if (!fs.existsSync(dbPath)) {
        logManager.info('No existe BD aún — backup omitido (primera instalación)', 'backup');
        return null;
    }

    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dest = path.join(backupDir, `agua-vp-backup-${ts}.db`);
    fs.copyFileSync(dbPath, dest);
    logManager.info(`Backup creado (${reason}): ${dest}`, 'backup');

    // Limpiar backups viejos
    const all = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('agua-vp-backup-') && f.endsWith('.db'))
        .map(f => ({ name: f, mtimeMs: fs.statSync(path.join(backupDir, f)).mtimeMs }))
        .sort((a, b) => a.mtimeMs - b.mtimeMs);

    while (all.length > maxBackups) {
        const oldest = all.shift();
        fs.unlinkSync(path.join(backupDir, oldest.name));
        logManager.info(`Backup antiguo eliminado: ${oldest.name}`, 'backup');
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
        logManager.warn('El servidor ya está corriendo', 'api');
        return;
    }

    // Inicializar LogManager al arranque
    logManager.init();
    logManager.info('Iniciando ciclo de vida del servidor API', 'system');

    const userDataPath = app.getPath('userData');
    const dbPath       = path.join(userDataPath, DB_FILENAME);
    const secrets      = loadOrCreateSecrets();

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
        nodeEnv:      import.meta.env.PROD ? 'production' : 'development',
        autoMigrate:  true
    });

    // Redirigir logs del servidor API al LogManager
    apiServer.on('log',     msg => logManager.info(msg, 'api'));
    apiServer.on('error',   err => logManager.error(String(err), 'api'));
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
 * Proceso: detener server → copiar backup → integrity check → reiniciar server.
 * Si la integridad falla, revierte al archivo original.
 * @param {string} backupPath — Ruta absoluta al archivo de backup
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function restoreBackup(backupPath) {
    const dbPath = path.join(app.getPath('userData'), DB_FILENAME);

    if (!fs.existsSync(backupPath)) {
        return { success: false, message: 'Archivo de backup no encontrado' };
    }

    logManager.warn(`Iniciando restauración desde: ${path.basename(backupPath)}`, 'backup');

    // 1. Crear backup de seguridad del estado actual antes de restaurar
    const safetyBackup = createBackup('pre-restore');

    // 2. Detener servidor
    const wasRunning = apiServer?.isRunning;
    if (wasRunning) {
        await stopApiServer();
    }

    try {
        // 3. Verificar integridad del backup ANTES de copiar
        const testDb = new Database(backupPath, { readonly: true });
        const integrityResult = testDb.pragma('integrity_check');
        testDb.close();

        if (integrityResult[0]?.integrity_check !== 'ok') {
            logManager.error('Backup corrupto — restauración abortada', 'backup');
            // Reiniciar con la DB original
            if (wasRunning) await startApiServer();
            return { success: false, message: 'El archivo de backup está corrupto (integrity_check falló)' };
        }

        // 4. Copiar backup sobre la DB actual
        fs.copyFileSync(backupPath, dbPath);
        logManager.info('Archivo de base de datos restaurado', 'backup');

        // 5. Verificar integridad de la DB restaurada
        const verifyDb = new Database(dbPath, { readonly: true });
        const verifyResult = verifyDb.pragma('integrity_check');
        verifyDb.close();

        if (verifyResult[0]?.integrity_check !== 'ok') {
            // Revertir al backup de seguridad
            logManager.error('DB restaurada corrupta — revirtiendo', 'backup');
            if (safetyBackup) {
                fs.copyFileSync(safetyBackup, dbPath);
            }
            if (wasRunning) await startApiServer();
            return { success: false, message: 'La restauración corrompió la base de datos. Se revirtió al estado anterior.' };
        }

        // 6. Reiniciar servidor con la BD restaurada
        if (wasRunning) {
            await startApiServer();
        }

        logManager.info(`Restauración completada exitosamente desde: ${path.basename(backupPath)}`, 'backup');
        return { success: true, message: `Base de datos restaurada exitosamente desde ${path.basename(backupPath)}` };

    } catch (error) {
        logManager.error(`Error en restauración: ${error.message}`, 'backup');
        // Intentar reiniciar con lo que haya
        if (wasRunning) {
            try { await startApiServer(); } catch { /* silenciar */ }
        }
        return { success: false, message: `Error en restauración: ${error.message}` };
    }
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
    if (config.maxBackups && config.maxBackups >= 1 && config.maxBackups <= 50) {
        maxBackups = config.maxBackups;
        logManager.info(`Configuración de backups actualizada: maxBackups=${maxBackups}`, 'backup');
    }
    return { maxBackups };
}

/**
 * Obtiene la configuración actual de backups.
 */
export function getBackupConfig() {
    return {
        maxBackups,
        backupDir: path.join(app.getPath('userData'), 'backups'),
        dbPath: path.join(app.getPath('userData'), DB_FILENAME)
    };
}
