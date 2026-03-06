/**
 * ipcHandlersSystem.js — Handlers IPC para la Consola de Administración del Sistema.
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
import logManager from '../managers/logManager.js';
import { verifyToken } from '../../auth/auth.js';
import {
    getApiServerStatus,
    createBackup,
    listBackups,
    restoreBackup,
    getDatabaseInfo,
    getMigrationHistory,
    updateBackupConfig,
    getBackupConfig
} from '../managers/apiManager.js';

/**
 * Verifica que el token JWT pertenezca a un usuario con rol administrador.
 * @param {string} userToken - Token JWT del usuario
 * @returns {{ valid: boolean, error?: string, decoded?: object }}
 */
function requireAdmin(userToken) {
    if (!userToken || typeof userToken !== 'string') {
        return { valid: false, error: 'Token de usuario no proporcionado' };
    }
    const decoded = verifyToken(userToken);
    if (!decoded) {
        return { valid: false, error: 'Token de usuario inválido o expirado' };
    }
    if (decoded.rol !== 'administrador') {
        return { valid: false, error: `Permiso denegado: se requiere rol administrador (rol actual: ${decoded.rol})` };
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
