import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { db } from '../db/Cliente.js'; // Importa la base de datos SQLite

/**Funciones de funcionamiento de la aplicacion(login,registro de usuarios y clientes etc.Asi como actualizacion y eleiminacion de los mismos)**/
import { loginUser,verifyToken } from '../auth/auth.js'; // Importa la función loginUser
import { registerUser } from '../register/usuario.js'; // Importa la función registerUser
import { registerClientes } from '../register/cliente.js'; // Importa la función registerClientes
import { updateCliente } from '../update/cliente.js'; // Importa la función updateCliente


// Función para verificar actualizaciones
import { checkForUpdates } from '../updatesApp/checkUpdates.js'
import { console } from 'inspector'


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1270,
    height: 750,
    minWidth: 1200, // Ancho mínimo
    minHeight: 750, // Altura mínima
    show: false, // Ocultar la ventana hasta que esté lista
    autoHideMenuBar: true, // Ocultar la barra de menú
    frame: false, // Sin marco
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false // Deshabilitar el aislamiento del contexto
      
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Abrir las herramientas de desarrollo
  mainWindow.webContents.openDevTools();
  // Iniciar la búsqueda de actualizaciones después de que la ventana esté lista
  setTimeout(() => {
    checkForUpdates(mainWindow)
  }, 5000)
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong')) 

  createWindow() // crea la ventana

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => { 
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.


//Botones para el titleBar personalizado
ipcMain.on("minimize", (event) => { // Minimizar la ventana
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.minimize();
});

ipcMain.on("maximize", (event) => { // Maximizar la ventana
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.on("close", (event) => { // Cerrar la ventana
  if (process.platform !== 'darwin') { // Solo cerrar en Windows y Linux (no en macOS)
    app.quit() // Cierra la aplicación por completo
  }
});


/**************************************************************************************************************
 * Fetch clientes
 * ************************************************************************************************************
 */
// Evento para obtener clientes desde la base de datos
ipcMain.handle("fetch-clientes", async () => {  // Usa ipcMain.handle en lugar de ipcMain.on para manejar promesas
  try {
    const result = await db.execute("SELECT * FROM clientes"); // Usa .execute() en lugar de .query()
    return result.rows; // Asegúrate de devolver solo las filas de la consulta
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return [];
  }
});



/**************************************************************************************************************
 * IpCMain Handlers para el manejo de las operaciones de la base de datos y autenticación
 * ************************************************************************************************************
 */

// 📌 Manejar la actualización de un cliente
ipcMain.handle("update-cliente", async (event, data) => {
  return await updateCliente(data.id, data.nuevosDatos, data.datosAnteriores, data.modificado_por);
});


// 📌 Manejar autenticación login
ipcMain.handle("login", async (event, data) => {
  return await loginUser(data.correo, data.contrasena);
});

// 📌 Manejar autenticación registro
ipcMain.handle("register", async (event, data) => {
  return await registerUser(data.correo, data.contrasena, data.username, data.rol);
});

// 📌 Manejar registro de cliente
ipcMain.handle("register-cliente", async (event, data) => {
  if (!data.nombre || !data.direccion || !data.telefono || !data.ciudad || !data.correo) {
    return { success: false, message: "Todos los campos son obligatorios(bakend)." };
  }

  return await registerClientes(
    data.nombre,
    data.direccion,
    data.telefono,
    data.ciudad,
    data.correo,
    data.estado_cliente || "Activo",
    data.modificado_por || null // Permite valores nulos si no se envía
  );
});


// 📌 Manejar verificación de sesión
ipcMain.handle("verify-session", async (event, token) => {
  return verifyToken(token) ? { success: true, user: verifyToken(token) } : { success: false };
});





