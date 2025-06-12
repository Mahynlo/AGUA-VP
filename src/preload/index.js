import { contextBridge,ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'



// Custom APIs for renderer
const api = {
  fetchClientes: async (token_session) => {
    return await ipcRenderer.invoke("fetch-clientes", token_session);
  },
  fetchMedidores: async (token_session) => {
    return await ipcRenderer.invoke("fetch-medidores",token_session);
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
  previewRecibohtml: async (data) => {
    // Invoca la llamada al main process
    let response = await ipcRenderer.invoke('previewRecibohtml', data);
    return response;  // Regresa la respuesta (en este caso, solo un mensaje de éxito)
  },


}

// objecto para manejar la autenticación de la aplicación
const authApp = {
  leerToken: () => ipcRenderer.invoke('auth-app:leer-token'),
  leerId: () => ipcRenderer.invoke('auth-app:leer-id'),
  registrarApp: (nombreApp = 'Electron App') => ipcRenderer.invoke('auth-app:registrar-app', nombreApp),
  borrarToken: () => ipcRenderer.invoke('auth-app:borrar-token')
};

// objecto para manejar las tarifas de la aplicación
const tarifasApp = {
  registerTarifa: (data) => ipcRenderer.invoke('register-tarifa', data),
  registrarRangosTarifa: (data) => ipcRenderer.invoke('registrar-rangos-tarifa', data),
  fetchTarifas: (data) => ipcRenderer.invoke('fetch-tarifas', data),
  updateTarifa: (data) => ipcRenderer.invoke('update-tarifa', data),
  updateRangosTarifa: (data) => ipcRenderer.invoke('update-rangos-tarifa', data),
};


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('authApp', authApp);
    contextBridge.exposeInMainWorld('tarifasApp', tarifasApp)

  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
  window.authApp = authApp;
  window.tarifasApp = tarifasApp;

}

// context para botones de la ventana
contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("minimize"),
  maximize: () => ipcRenderer.send("maximize"),
  close: () => ipcRenderer.send("close"),
});




