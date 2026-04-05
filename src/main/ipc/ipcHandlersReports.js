
import { ipcMain } from 'electron';
import { fetchReporteRecibos, fetchReporteLecturas, fetchReporteFinanciero } from '../../fetch/reports.js';

export default function IpcHandlerReports() {
    ipcMain.handle("fetch-reporte-recibos", async (event, token_session, periodo, rutaId, estadoPago) => {
        return await fetchReporteRecibos(token_session, periodo, rutaId, estadoPago);
    });

    ipcMain.handle("fetch-reporte-lecturas", async (event, token_session, periodo, localidad) => {
        return await fetchReporteLecturas(token_session, periodo, localidad);
    });

    ipcMain.handle("fetch-reporte-financiero", async (event, token_session, filtros) => {
        return await fetchReporteFinanciero(token_session, filtros);
    });
}
