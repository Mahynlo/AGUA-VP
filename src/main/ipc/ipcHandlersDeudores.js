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
import { runWithAppKeyFlow } from './appKeyFlow.js';

export default function IpcHandlerDeudores() {
    
    ipcMain.handle('fetch-configuracion-corte', async (event, token) => {
        return await runWithAppKeyFlow(() => fetchConfiguracionCorte(token));
    });

    ipcMain.handle('update-configuracion-corte', async (event, token, config) => {
        return await runWithAppKeyFlow(() => updateConfiguracionCorte(token, config));
    });

    ipcMain.handle('recalcular-vencimientos-por-periodo', async (event, token, data) => {
        return await runWithAppKeyFlow(() => recalcularVencimientosPorPeriodo(token, data));
    });

    ipcMain.handle('fetch-candidatos-corte', async (event, token) => {
        return await runWithAppKeyFlow(() => fetchCandidatosCorte(token));
    });

    ipcMain.handle('ejecutar-corte', async (event, token, data) => {
        return await runWithAppKeyFlow(() => ejecutarCorte(token, data));
    });

    ipcMain.handle('registrar-reconexion', async (event, token, data) => {
        return await runWithAppKeyFlow(() => registrarReconexion(token, data));
    });

    ipcMain.handle('crear-convenio', async (event, token, data) => {
        return await runWithAppKeyFlow(() => crearConvenio(token, data));
    });

    // Nuevos handlers para Fase 2
    ipcMain.handle('obtener-convenio', async (event, token, convenioId) => {
        return await runWithAppKeyFlow(() => obtenerConvenio(token, convenioId));
    });

    ipcMain.handle('pagar-parcialidad', async (event, token, data) => {
        return await runWithAppKeyFlow(() => pagarParcialidad(token, data));
    });

    ipcMain.handle('fetch-resumen-cobro-convenio', async (event, token, medidorId) => {
        return await runWithAppKeyFlow(() => fetchResumenCobroConvenio(token, medidorId));
    });

    ipcMain.handle('pagar-integrado-convenio', async (event, token, data) => {
        return await runWithAppKeyFlow(() => pagarIntegradoConvenio(token, data));
    });
}
