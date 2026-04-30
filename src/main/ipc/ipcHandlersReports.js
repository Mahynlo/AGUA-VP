
import { ipcMain } from 'electron';
import { fetchReporteRecibos, fetchReporteLecturas, fetchReporteFinanciero, fetchReporteConsumoAgua } from '../../fetch/reports.js';
import { runWithAppKeyFlow } from './appKeyFlow.js';

export default function IpcHandlerReports() {
    ipcMain.handle("fetch-reporte-recibos", async (event, token_session, periodo, rutaId, estadoPago) => {
        return await runWithAppKeyFlow(
            () => fetchReporteRecibos(token_session, periodo, rutaId, estadoPago),
            { fallbackValue: null }
        );
    });

    ipcMain.handle("fetch-reporte-lecturas", async (event, token_session, periodo, localidad) => {
        return await runWithAppKeyFlow(
            () => fetchReporteLecturas(token_session, periodo, localidad),
            { fallbackValue: null }
        );
    });

    ipcMain.handle("fetch-reporte-financiero", async (event, token_session, filtros) => {
        return await runWithAppKeyFlow(
            () => fetchReporteFinanciero(token_session, filtros),
            { fallbackValue: null }
        );
    });

    ipcMain.handle("fetch-reporte-consumo-agua", async (event, token_session, filtros) => {
        return await runWithAppKeyFlow(
            () => fetchReporteConsumoAgua(token_session, filtros),
            { fallbackValue: null }
        );
    });
}
