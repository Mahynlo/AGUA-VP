/**
 * systemHandlers.js — Handlers IPC para la Consola de Administración del Sistema.
 *
 * Canales:
 *  - system:logs           → Obtener logs del buffer + archivo
 *  - system:log-stats      → Estadísticas de logging
 *  - system:clear-logs     → Limpiar buffer en memoria
 *  - system:backup-create  → Crear backup manual
 *  - system:backup-list    → Listar backups disponibles
 *  - system:backup-restore → Restaurar desde un backup
 *  - system:backup-config  → Leer/modificar configuración de backups
 *  - system:db-info        → Información de la base de datos
 *  - system:migrations     → Historial de migraciones aplicadas
 *  - system:server-status  → Estado del servidor API
 *  - system:read-log-file  → Leer archivo de logs histórico
 *
 * Seguridad: Las operaciones destructivas (restore) validan que el
 * usuario tenga rol superadmin vía el token JWT en la petición.
 *
 * Compatibilidad: Mantiene los channels originales de ipcHandlersServer.js
 * (server:status, server:backup, server:list-backups) como aliases.
 */

import { ipcMain } from 'electron';
import logManager from '../../managers/logManager.js';
import {
    getApiServerStatus,
    createBackup,
    listBackups,
    restoreBackup,
    getDatabaseInfo,
    getMigrationHistory,
    updateBackupConfig,
    getBackupConfig,
    getTursoConfig,
    saveTursoConfig,
    clearTursoConfig,
    testTursoConnection,
    triggerTursoSync,
    getTursoSyncStatus,
    verifySessionToken,
    previewCloudRestore,
    restoreFromCloud,
    restartAppForRestore
} from '../../managers/apiManager.js';

const ADMIN_ROLES = ['administrador', 'superadmin'];

/**
 * Verifica que el token de sesión sea válido (firmado por la API embebida y vigente)
 * y pertenezca a un usuario con rol administrador o superadmin.
 * @param {string} userToken - Token JWT de la sesión del usuario
 * @returns {{ valid: boolean, error?: string, decoded?: object }}
 */
function requireAdmin(userToken) {
    const decoded = verifySessionToken(userToken);
    if (!decoded) {
        return { valid: false, error: 'Sesión no válida o expirada. Vuelve a iniciar sesión e inténtalo de nuevo.' };
    }
    if (!ADMIN_ROLES.includes(decoded.rol)) {
        return { valid: false, error: `Permiso denegado: se requiere rol administrador o superadmin (rol actual: ${decoded.rol || 'desconocido'})` };
    }
    return { valid: true, decoded };
}

export default function IpcHandlersSystem() {

    // ── Logs ──────────────────────────────────────────────────────────────────

    /**
     * Obtener logs del buffer en memoria.
     * @param {Object} options - { level?, source?, search?, limit? }
     */
    ipcMain.handle('system:logs', (_event, options = {}) => {
        try {
            return { success: true, logs: logManager.getLogs(options) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Obtener estadísticas del LogManager
     */
    ipcMain.handle('system:log-stats', () => {
        try {
            return { success: true, stats: logManager.getStats() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Limpiar buffer de logs en memoria (no afecta archivos)
     */
    ipcMain.handle('system:clear-logs', () => {
        try {
            logManager.clearBuffer();
            return { success: true, message: 'Buffer de logs limpiado' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Leer logs del archivo en disco (histórico)
     * @param {number} lines - Últimas N líneas (default: 200)
     */
    ipcMain.handle('system:read-log-file', (_event, lines = 200) => {
        try {
            const logLines = logManager.readLogFile(lines);
            return { success: true, lines: logLines, total: logLines.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ── Backups ───────────────────────────────────────────────────────────────

    /**
     * Crear un backup manual de la base de datos
     */
    ipcMain.handle('system:backup-create', () => {
        try {
            const dest = createBackup('manual');
            if (dest) {
                return { success: true, path: dest, message: 'Backup creado exitosamente' };
            }
            return { success: false, message: 'Base de datos no encontrada' };
        } catch (error) {
            logManager.error(`Error al crear backup: ${error.message}`, 'backup');
            return { success: false, error: error.message };
        }
    });

    /**
     * Listar backups disponibles
     */
    ipcMain.handle('system:backup-list', () => {
        try {
            const backups = listBackups();
            return { success: true, backups };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Restaurar base de datos desde un backup.
     * OPERACIÓN DESTRUCTIVA — requiere rol administrador + confirmación en UI.
     * @param {string} backupPath - Ruta absoluta del backup
     * @param {string} userToken  - JWT del usuario autenticado
     */
    ipcMain.handle('system:backup-restore', async (_event, backupPath, userToken) => {
        try {
            // Validar rol administrador
            const auth = requireAdmin(userToken);
            if (!auth.valid) {
                logManager.warn(`Intento de restauración denegado: ${auth.error}`, 'security');
                return { success: false, message: auth.error };
            }

            if (!backupPath || typeof backupPath !== 'string') {
                return { success: false, message: 'Ruta de backup no válida' };
            }

            logManager.info(`Restauración autorizada por usuario ${auth.decoded.correo || auth.decoded.username} (${auth.decoded.rol})`, 'backup');
            const result = await restoreBackup(backupPath);
            // La restauración se aplica al reiniciar (la API tiene la base abierta)
            if (result?.success && result.restartRequired) restartAppForRestore();
            return result;
        } catch (error) {
            logManager.error(`Error en restauración: ${error.message}`, 'backup');
            return { success: false, error: error.message };
        }
    });

    /**
     * Obtener o actualizar configuración de backups
     * @param {Object|null} newConfig - Si se proporciona, actualiza la config
     */
    ipcMain.handle('system:backup-config', (_event, newConfig = null) => {
        try {
            if (newConfig) {
                const updated = updateBackupConfig(newConfig);
                return { success: true, config: updated };
            }
            return { success: true, config: getBackupConfig() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ── Base de Datos ─────────────────────────────────────────────────────────

    /**
     * Obtener información detallada de la base de datos
     */
    ipcMain.handle('system:db-info', () => {
        try {
            const info = getDatabaseInfo();
            return { success: true, info };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Obtener historial de migraciones aplicadas
     */
    ipcMain.handle('system:migrations', () => {
        try {
            const migrations = getMigrationHistory();
            return { success: true, migrations, total: migrations.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ── Estado del Servidor ───────────────────────────────────────────────────

    /**
     * Obtener estado del servidor API embebido
     */
    ipcMain.handle('system:server-status', () => {
        try {
            const status = getApiServerStatus();
            return { success: true, ...status };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ── Sincronización Turso Cloud ──────────────────────────────────────────

    /**
     * Obtener configuración actual de Turso (ocultando token).
     */
    ipcMain.handle('system:turso-config-get', () => {
        try {
            return { success: true, config: getTursoConfig() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Guardar configuración de Turso (cifrada con safeStorage).
     */
    ipcMain.handle('system:turso-config-save', async (_event, config, userToken) => {
        const auth = requireAdmin(userToken);
        if (!auth.valid) return { success: false, error: auth.error };

        try {
            const saved = await saveTursoConfig(config);
            return { success: true, config: saved };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Eliminar configuración de Turso (volver a modo local puro).
     */
    ipcMain.handle('system:turso-config-clear', async (_event, userToken) => {
        const auth = requireAdmin(userToken);
        if (!auth.valid) return { success: false, error: auth.error };

        try {
            const cleared = await clearTursoConfig();
            return { success: true, config: cleared };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Probar conexión con credenciales de Turso.
     */
    ipcMain.handle('system:turso-test', async (_event, tursoUrl, tursoToken) => {
        try {
            const result = await testTursoConnection(tursoUrl, tursoToken);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Forzar sincronización inmediata (incremental o semilla).
     */
    ipcMain.handle('system:turso-sync-now', async (_event, seed, userToken, force = false) => {
        const auth = requireAdmin(userToken);
        if (!auth.valid) return { success: false, error: auth.error };

        try {
            const result = await triggerTursoSync(seed, force === true);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Resumen de la copia en la nube para confirmar una restauración.
     */
    ipcMain.handle('system:turso-restore-preview', async (_event, userToken) => {
        const auth = requireAdmin(userToken);
        if (!auth.valid) return { success: false, error: auth.error };
        return previewCloudRestore();
    });

    /**
     * Restaurar la base local desde la copia de la nube.
     * OPERACIÓN DESTRUCTIVA — requiere rol administrador + doble confirmación en UI.
     * La base restaurada se construye y valida aparte; se aplica al reiniciar la app,
     * después de respaldar la base actual.
     */
    ipcMain.handle('system:turso-restore', async (_event, userToken) => {
        const auth = requireAdmin(userToken);
        if (!auth.valid) return { success: false, error: auth.error };

        logManager.warn(`Restauración desde la nube autorizada por ${auth.decoded.correo || auth.decoded.username} (${auth.decoded.rol})`, 'backup');
        const result = await restoreFromCloud();
        if (result?.success && result.restartRequired) restartAppForRestore();
        return result;
    });

    /**
     * Consultar estado detallado del worker de sincronización.
     */
    ipcMain.handle('system:turso-sync-status', async () => {
        try {
            const result = await getTursoSyncStatus();
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ── Aliases de compatibilidad (ipcHandlersServer.js original) ─────────
    // Mantener los canales originales para que el preload actual siga funcionando

    ipcMain.handle('server:status', () => getApiServerStatus());

    ipcMain.handle('server:backup', () => {
        const dest = createBackup('manual');
        if (dest) return { success: true, path: dest };
        return { success: false, message: 'Base de datos no encontrada todavía' };
    });

    ipcMain.handle('server:list-backups', () => listBackups());

    logManager.info('IPC Handlers del Sistema registrados', 'system');
}
