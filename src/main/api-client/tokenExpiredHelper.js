import { BrowserWindow } from 'electron';

export function notifyTokenExpired() {
  console.warn("🔄 [Fetch Helper] Token expirado detectado en el proceso principal. Notificando al renderer...");
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('auth:token-expired');
  }
}
