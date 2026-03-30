import { contextBridge,ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  //clintes
  fetchClientes: async (token_session, params) => {
    return await ipcRenderer.invoke("fetch-clientes", token_session, params);
  },
  fetchClientesEstadisticas: async (token_session) => {
    return await ipcRenderer.invoke("fetch-clientes-estadisticas", token_session);
  },
  registerClient: (data) => ipcRenderer.invoke("register-cliente", data),
  updateClient: (data) => ipcRenderer.invoke("update-cliente", data),
  asignarTarifaCliente: (data) => ipcRenderer.invoke("asignar-tarifa-cliente", data),

  //medidores
  fetchMedidores: async (token_session, params) => {
    return await ipcRenderer.invoke("fetch-medidores", token_session, params);
  },
  registerMeter: (data) => ipcRenderer.invoke("register-medidor", data),
  updateMedidor: (data) => ipcRenderer.invoke("update-medidor", data),
  
  
  //login y registro de usuario
  login: (data) => ipcRenderer.invoke("login", data),
  register: (data) => ipcRenderer.invoke("register", data),

  // Gestión de Usuarios (Admin V2)
  fetchUsuarios: async (token, params) => ipcRenderer.invoke("fetch-usuarios", token, params),
  createUser: (data, token) => ipcRenderer.invoke("create-user", data, token),
  updateUser: (data, token) => ipcRenderer.invoke("update-user", data, token),
  deleteUser: (data, token) => ipcRenderer.invoke("delete-user", data, token),
  reactivateUser: (id, token) => ipcRenderer.invoke("reactivate-user", id, token),

  //sesiones (cerrar sesión, verificar sesión, obtener sesiones activas, renovar token)
  verifySession: (token) => ipcRenderer.invoke("verify-session", token),
  logout: (token) => ipcRenderer.invoke("logout", token),
  getSession: (usuario_id, token) => ipcRenderer.invoke("active-sessions-user", usuario_id, token),
  refreshToken: (refreshToken) => ipcRenderer.invoke("refresh-token", refreshToken),
  closeSpecificSession: (sesionId, token) => ipcRenderer.invoke("close-specific-session", sesionId, token),
  closeAllUserSessions: (usuarioId, token) => ipcRenderer.invoke("close-all-user-sessions", usuarioId, token),
  changePassword: (passwords, token) => ipcRenderer.invoke("change-password", passwords, token),
  checkServerStatus: () => ipcRenderer.invoke("check-server-status"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  

  // Rutas
  calcularRuta: async (puntos_gps) => {
    return await ipcRenderer.invoke("calcular-ruta", puntos_gps);
  },
  registerRuta: async (data) => ipcRenderer.invoke("registrar-ruta", data),
  modificarRuta: async (token_session, id_ruta, datosActualizados) => {
    return await ipcRenderer.invoke("modificar-ruta", token_session, id_ruta, datosActualizados);
  },
  listarRutas: async (token_session, params) => {
    return await ipcRenderer.invoke("listar-rutas", token_session, params);
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

  // Rectificar / modificar una lectura ya registrada (antes de generar factura)
  modificarLectura: async (lecturaId, datos, token_session) => {
    return await ipcRenderer.invoke("modificar-lectura", lecturaId, datos, token_session);
  },

  // Generar facturas para todas las lecturas pendientes de una ruta
  generarFacturasRuta: async (params, token_session) => {
    return await ipcRenderer.invoke("generar-facturas-ruta", params, token_session);
  },


  // Fetch de pagos
  fetchPagos: async (token_session, params) => {
    return await ipcRenderer.invoke("fetch-pagos", token_session, params);
  },

  // Registro de pagos
  registerPago: async (pago, token_session) => {
    return await ipcRenderer.invoke("register-pago", pago, token_session);
  },

  // Fetch de facturas
  fetchFacturas: async (token_session, params) => {
    return await ipcRenderer.invoke("fetch-facturas", { token_session, params });
  },

  // Registro de facturas
  registerFactura: async (factura, token_session) => {
    return await ipcRenderer.invoke("register-factura", factura, token_session);
  },
  
  // Dashboard
  fetchDashboardStats: async (token_session) => {
    return await ipcRenderer.invoke("fetch-dashboard-stats", token_session);
  },

  // Reportes
  fetchReporteRecibos: async (token_session, periodo, rutaId, estadoPago) => {
    return await ipcRenderer.invoke("fetch-reporte-recibos", token_session, periodo, rutaId, estadoPago);
  },
  fetchReporteLecturas: async (token_session, periodo, localidad) => {
    return await ipcRenderer.invoke("fetch-reporte-lecturas", token_session, periodo, localidad);
  },

  // Deudores y Cortes
  deudores: {
    fetchConfiguracion: async (token) =>ipcRenderer.invoke('fetch-configuracion-corte', token),
    updateConfiguracion: async (token, config) => ipcRenderer.invoke('update-configuracion-corte', token, config),
    fetchCandidatos: async (token) => ipcRenderer.invoke('fetch-candidatos-corte', token),
    ejecutarCorte: async (token, data) => ipcRenderer.invoke('ejecutar-corte', token, data),
    registrarReconexion: async (token, data) => ipcRenderer.invoke('registrar-reconexion', token, data),
    crearConvenio: async (token, data) => ipcRenderer.invoke('crear-convenio', token, data),
    obtenerConvenio: async (token, convenioId) => ipcRenderer.invoke('obtener-convenio', token, convenioId),
    pagarParcialidad: async (token, data) => ipcRenderer.invoke('pagar-parcialidad', token, data)
  },




 //impresion
  printComponent: async (url, callback) => {
    let response = await ipcRenderer.invoke('printComponent', url);
    callback(response);  // Aquí pasas el resultado de la operación al callback
  },
  previewComponent: async (url) => {
    return await ipcRenderer.invoke('previewComponent', url);
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

  // Transferencia de datos segura (FileSystem)
  savePrintData: (data) => ipcRenderer.invoke('savePrintData', data),
  getPrintData: (id) => ipcRenderer.invoke('getPrintData', id),
  
  // Zoom Controls
  zoomIn: () => ipcRenderer.invoke('zoom-in'),
  zoomOut: () => ipcRenderer.invoke('zoom-out'),
  zoomReset: () => ipcRenderer.invoke('zoom-reset'),
  getZoomLevel: () => ipcRenderer.invoke('get-zoom-level'),
  onZoomLevelChanged: (callback) => ipcRenderer.on('zoom-changed', (event, level) => callback(level)),

  // Exportar archivos nativamente
  saveFile: (data) => ipcRenderer.invoke('save-file-dialog', data),
  savePdf: (fileUrl) => ipcRenderer.invoke('save-pdf', fileUrl),

  // Logo e imágenes personalizables
  selectLogo: () => ipcRenderer.invoke('select-logo'),
  selectLoginImages: () => ipcRenderer.invoke('select-login-images'),

  // Impresión avanzada (diálogo personalizado en la UI)
  getPrinters: () => ipcRenderer.invoke('getPrinters'),
  printSilent: (url, config) => ipcRenderer.invoke('print-silent', url, config),

  // Servidor embebido (estado, backup manual)
  serverStatus: () => ipcRenderer.invoke('server:status'),
  serverBackup: () => ipcRenderer.invoke('server:backup'),
  serverListBackups: () => ipcRenderer.invoke('server:list-backups'),

  // ── Consola de Administración del Sistema ──────────────────────────────
  system: {
    // Logs
    getLogs: (options) => ipcRenderer.invoke('system:logs', options),
    getLogStats: () => ipcRenderer.invoke('system:log-stats'),
    clearLogs: () => ipcRenderer.invoke('system:clear-logs'),
    readLogFile: (lines) => ipcRenderer.invoke('system:read-log-file', lines),
    onLogEntry: (callback) => {
      ipcRenderer.on('system:log-entry', (_event, entry) => callback(entry));
      // Retornar función de limpieza
      return () => ipcRenderer.removeAllListeners('system:log-entry');
    },

    // Backups
    createBackup: () => ipcRenderer.invoke('system:backup-create'),
    listBackups: () => ipcRenderer.invoke('system:backup-list'),
    restoreBackup: (backupPath, userToken) => ipcRenderer.invoke('system:backup-restore', backupPath, userToken),
    getBackupConfig: () => ipcRenderer.invoke('system:backup-config'),
    updateBackupConfig: (config) => ipcRenderer.invoke('system:backup-config', config),

    // Base de datos
    getDatabaseInfo: () => ipcRenderer.invoke('system:db-info'),
    getMigrations: () => ipcRenderer.invoke('system:migrations'),

    // Estado del servidor
    getServerStatus: () => ipcRenderer.invoke('system:server-status'),

    // Actualizaciones (conectadas con UpdateManager)
    checkForUpdates: () => ipcRenderer.invoke('system:update-check'),
    downloadUpdate: () => ipcRenderer.invoke('system:update-download'),
    getUpdateStatus: () => ipcRenderer.invoke('system:update-status'),
    installUpdate: () => ipcRenderer.invoke('system:update-install'),
    onUpdateProgress: (callback) => {
      ipcRenderer.on('system:update-progress', (_event, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('system:update-progress');
    },
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
  fetchTarifas: (data) => ipcRenderer.invoke('fetch-tarifas', data), // data = { token_session, params }
  updateTarifa: (data) => ipcRenderer.invoke('update-tarifa', data),
  updateRangosTarifa: (data) => ipcRenderer.invoke('update-rangos-tarifa', data),
};

// objeto para manejar la documentación de ayuda
const docsApp = {
  loadDocumentationFile: (section, fileName) => ipcRenderer.invoke('load-documentation-file', section, fileName),
  listDocumentationFiles: (section = null) => ipcRenderer.invoke('list-documentation-files', section),
};


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('authApp', authApp);
    contextBridge.exposeInMainWorld('tarifasApp', tarifasApp);
    contextBridge.exposeInMainWorld('docsApp', docsApp);

  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
  window.authApp = authApp;
  window.tarifasApp = tarifasApp;
  window.docsApp = docsApp;
}

// context para botones de la ventana
contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("minimize"),
  maximize: () => ipcRenderer.send("maximize"),
  close: () => ipcRenderer.send("close"),
});




