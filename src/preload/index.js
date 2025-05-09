import { contextBridge,ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  fetchClientes: async () => {
    return await ipcRenderer.invoke("fetch-clientes");
  },
  fetchMedidores: async () => {
    return await ipcRenderer.invoke("fetch-medidores");
  },
  register: (data) => ipcRenderer.invoke("register", data),
  registerClient: (data) => ipcRenderer.invoke("register-cliente", data),
  login: (data) => ipcRenderer.invoke("login", data),
  verifySession: (token) => ipcRenderer.invoke("verify-session", token),
  updateClient: (data) => ipcRenderer.invoke("update-cliente", data),
  logout: (token) => ipcRenderer.invoke("logout", token),
  getSession: (usuario_id) => ipcRenderer.invoke("active-sessions-user", usuario_id),
  registerMeter: (data) => ipcRenderer.invoke("register-medidor", data),

  printComponent: async (url, callback) => {
    let response = await ipcRenderer.invoke('printComponent', url);
    callback(response);  // Aquí pasas el resultado de la operación al callback
  },
  previewComponent: async (url, callback) => {
    let response = await ipcRenderer.invoke('previewComponent', url);
    callback(response);  // Aquí pasas el resultado de la operación al callback
  },

  printReport: async (url, callback) => {
    let response = await ipcRenderer.invoke('printReport', url);
    callback(response);  // Aquí pasas el resultado de la operación al callback
  },
  previewReport: async (url, callback) => {
    let response = await ipcRenderer.invoke('previewReport', url);
    callback(response);  // Aquí pasas el resultado de la operación al callback
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("minimize"),
  maximize: () => ipcRenderer.send("maximize"),
  close: () => ipcRenderer.send("close"),
});
