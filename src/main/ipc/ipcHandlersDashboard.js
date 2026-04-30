import { ipcMain } from 'electron';
import { fetchDashboardStats } from '../../fetch/dashboard.js';
import { runWithAppKeyFlow } from './appKeyFlow.js';

export default function IpcHandlerDashboard() {
    /**************************************************************************************************************
     * Fetch Dashboard Stats
     * ************************************************************************************************************
     */
    ipcMain.handle("fetch-dashboard-stats", async (event, token_session) => {
      return await runWithAppKeyFlow(
        () => fetchDashboardStats(token_session),
        { fallbackValue: null }
      );
    });
}
