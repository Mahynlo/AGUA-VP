import { ipcMain } from 'electron';
import { 
    fetchConfiguracionCorte,
    updateConfiguracionCorte,
    fetchCandidatosCorte,
    ejecutarCorte,
    registrarReconexion,
    crearConvenio
} from '../../fetch/deudores.js';

export default function IpcHandlerDeudores() {
    
    ipcMain.handle('fetch-configuracion-corte', async (event, token) => {
        return await fetchConfiguracionCorte(token);
    });

    ipcMain.handle('update-configuracion-corte', async (event, token, config) => {
        return await updateConfiguracionCorte(token, config);
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
}
