import { ipcMain } from 'electron';
import { fetchDashboardStats } from '../../fetch/dashboard.js';

export default function IpcHandlerDashboard() {
    /**************************************************************************************************************
     * Fetch Dashboard Stats
     * ************************************************************************************************************
     */
    ipcMain.handle("fetch-dashboard-stats", async (event, token_session) => {
      return await fetchDashboardStats(token_session);
    });
}
