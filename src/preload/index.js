import { contextBridge,ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  //clintes
  fetchClientes: async (token_session) => {
    return await ipcRenderer.invoke("fetch-clientes", token_session);
  },
  registerClient: (data) => ipcRenderer.invoke("register-cliente", data),
  updateClient: (data) => ipcRenderer.invoke("update-cliente", data),

  //medidores
  fetchMedidores: async (token_session) => {
    return await ipcRenderer.invoke("fetch-medidores",token_session);
  },
  registerMeter: (data) => ipcRenderer.invoke("register-medidor", data),
  
  
  //login y registro de usuario
  login: (data) => ipcRenderer.invoke("login", data),
  register: (data) => ipcRenderer.invoke("register", data),

  //sesiones (cerrar sesión, verificar sesión, obtener sesiones activas)
  verifySession: (token) => ipcRenderer.invoke("verify-session", token),
  logout: (token) => ipcRenderer.invoke("logout", token),
  getSession: (usuario_id) => ipcRenderer.invoke("active-sessions-user", usuario_id),
  

  // Rutas
  calcularRuta: async (puntos_gps) => {
    return await ipcRenderer.invoke("calcular-ruta", puntos_gps);
  },
  registerRuta: async (data) => ipcRenderer.invoke("registrar-ruta", data),
  listarRutas: async (token_session, periodo) => {
    return await ipcRenderer.invoke("listar-rutas", token_session, periodo);
  },
  listarRutasInfoMedidores: async (token_session, id_ruta) => {
    return await ipcRenderer.invoke("listar-rutas-info-medidores", token_session, id_ruta);
  },

  // Fetch de lecturas
  listarLecturas:async (token_session) => {
    return await ipcRenderer.invoke("listar-lecturas", token_session);
  },

  // Registro de lecturas
  registerLectura: async (lectura, token_session) => {
    return await ipcRenderer.invoke("register-lectura", lectura, token_session);
  },

  // Fetch de pagos
  fetchPagos: async (token_session, periodo) => {
    return await ipcRenderer.invoke("fetch-pagos", token_session, periodo);
  },

  // Registro de pagos
  registerPago: async (pago, token_session) => {
    return await ipcRenderer.invoke("register-pago", pago, token_session);
  },

  // Fetch de facturas
  fetchFacturas: async (token_session, periodo) => {
    return await ipcRenderer.invoke("fetch-facturas", token_session, periodo);
  },

  // Registro de facturas
  registerFactura: async (factura, token_session) => {
    return await ipcRenderer.invoke("register-factura", factura, token_session);
  },




 //impresion
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

  // NOTA: previewRecibohtml eliminado - no se usaba
  // El sistema ahora usa solo componentes React para consistencia



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




