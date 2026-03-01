// ipcHandlersServer.js
// Handlers IPC para operaciones del servidor embebido: estado, backup y info de BD.

import { ipcMain } from 'electron';
import { getApiServerStatus, createBackup, listBackups } from '../managers/apiManager.js';

export default function IpcHandlersServer() {

    // Obtener estado del servidor embebido
    ipcMain.handle('server:status', () => {
        return getApiServerStatus();
    });

    // Crear backup manual de la base de datos
    ipcMain.handle('server:backup', () => {
        const dest = createBackup();
        if (dest) {
            return { success: true, path: dest };
        }
        return { success: false, message: 'Base de datos no encontrada todavía' };
    });

    // Listar backups disponibles
    ipcMain.handle('server:list-backups', () => {
        return listBackups();
    });
}
