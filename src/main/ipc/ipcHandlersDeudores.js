import { ipcMain } from 'electron';
import { 
    fetchConfiguracionCorte,
    updateConfiguracionCorte,
    recalcularVencimientosPorPeriodo,
    fetchCandidatosCorte,
    ejecutarCorte,
    registrarReconexion,
    crearConvenio,
    obtenerConvenio,
    pagarParcialidad,
    fetchResumenCobroConvenio,
    pagarIntegradoConvenio
} from '../../fetch/deudores.js';

export default function IpcHandlerDeudores() {
    
    ipcMain.handle('fetch-configuracion-corte', async (event, token) => {
        return await fetchConfiguracionCorte(token);
    });

    ipcMain.handle('update-configuracion-corte', async (event, token, config) => {
        return await updateConfiguracionCorte(token, config);
    });

    ipcMain.handle('recalcular-vencimientos-por-periodo', async (event, token, data) => {
        return await recalcularVencimientosPorPeriodo(token, data);
    });

    ipcMain.handle('fetch-candidatos-corte', async (event, token) => {
        return await fetchCandidatosCorte(token);
    });

    ipcMain.handle('ejecutar-corte', async (event, token, data) => {
        return await ejecutarCorte(token, data);
    });

    ipcMain.handle('registrar-reconexion', async (event, token, data) => {
        return await registrarReconexion(token, data);
    });

    ipcMain.handle('crear-convenio', async (event, token, data) => {
        return await crearConvenio(token, data);
    });

    // Nuevos handlers para Fase 2
    ipcMain.handle('obtener-convenio', async (event, token, convenioId) => {
        return await obtenerConvenio(token, convenioId);
    });

    ipcMain.handle('pagar-parcialidad', async (event, token, data) => {
        return await pagarParcialidad(token, data);
    });

    ipcMain.handle('fetch-resumen-cobro-convenio', async (event, token, medidorId) => {
        return await fetchResumenCobroConvenio(token, medidorId);
    });

    ipcMain.handle('pagar-integrado-convenio', async (event, token, data) => {
        return await pagarIntegradoConvenio(token, data);
    });
}
