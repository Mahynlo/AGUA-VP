import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const path = require('path');  // Asegúrate de importar el módulo 'path'

/**Funciones de funcionamiento de la aplicacion(login,registro de usuarios y clientes etc.Asi como actualizacion y eleiminacion de los mismos)**/
import { loginUser,verifyToken,cerrarSesion,obtenerSesionesActivas} from '../auth/auth.js'; // Importa la función loginUser
import { registerUser } from '../register/usuario.js'; // Importa la función registerUser
import { registerClientes } from '../register/cliente.js'; // Importa la función registerClientes
import { registerMedidor } from '../register/medidor.js'; // Importa la función registerMedidor
import { updateCliente } from '../update/cliente.js'; // Importa la función updateCliente

// Función para verificar actualizaciones
import { checkForUpdates } from '../updatesApp/checkUpdates.js'
import { console } from 'inspector'

//Fetch de clientes
import { fetchClientes } from '../fetch/clientes.js'; // Importa la función fetchClientes
import { fetchMedidores } from '../fetch/medidores.js' // Importa la función fetchMedidores

function createWindow() {
  // Splash screen
  const splash = new BrowserWindow({
    width: 400, // Ancho de la pantalla de inicio
    height: 300, // Altura de la pantalla de inicio
    frame: false, // Sin marco
    transparent: true, // Fondo transparente
    alwaysOnTop: true, // Siempre en la parte superior
    resizable: false, // No redimensionable
    center: true, // Centrar la pantalla de inicio
    show: true // Mostrar la pantalla de inicio
  });

  splash.loadFile(join(__dirname, '../renderer/splash.html'));

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200, // Ancho inicial 
    height: 750, // Altura Inicial
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

  mainWindow.on('ready-to-show', () => { // Mostrar la ventana cuando esté lista 
    setTimeout(() => {
      splash.destroy();       // Cierra la pantalla de carga
      mainWindow.show();      // Muestra la app
    }, 1500); // duración mínima del splash
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
  return await fetchClientes();
});

ipcMain.handle("fetch-medidores", async () => {  // Usa ipcMain.handle en lugar de ipcMain.on para manejar promesas
  return await fetchMedidores();
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
  if (!data.nombre || !data.direccion || !data.telefono || !data.ciudad || !data.correo) { // Validar campos obligatorios
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

// 📌 cerrar session 
ipcMain.handle("logout", async (event, token) => {
  return await cerrarSesion(token);
});


// 📌 Manejar verificación de sesión
ipcMain.handle("verify-session", async (event, token) => {
  return verifyToken(token) ? { success: true, user: verifyToken(token) } : { success: false };
});

// 📌 Sessiones activas de usuario
ipcMain.handle("active-sessions-user", async (event,usuario_id ) => {
 return obtenerSesionesActivas(usuario_id);
});


// 📌 Manejar registro de medidor
ipcMain.handle("register-medidor", async (event, data) => {
  try {
    // Asegúrate de que los datos necesarios estén presentes
    if (!data.numero_serie || !data.fecha_instalacion || !data.latitud || !data.longitud) {
      throw new Error("Faltan datos obligatorios.");
    }

    const response = await registerMedidor(
      data.cliente_id,
      data.numero_serie,
      data.ubicacion,
      data.fecha_instalacion,
      data.latitud,
      data.longitud,
      data.estado_medidor || "Activo"
    );

    return response; // Se devuelve el resultado de la función
  } catch (error) {
    console.error("Error al registrar medidor:", error.message);
    return { success: false, message: `Error al registrar el medidor: ${error.message}` };
  }
});


// vista previa de la impresion 

const printOptions = {
  silent: false, // Para mostrar el diálogo de impresión 
  printBackground: true, // Para imprimir el fondo 
  color: true,
  margin: { // Márgenes de impresión
    marginType: 'printableArea', 
  },
  landscape: true, // Para orientación horizontal
  pagesPerSheet: 1,
  collate: false, 
  copies: 1,
  header: 'Page header', // Encabezado de la página
  footer: 'Page footer', // Pie de página
  pageSize: 'letter', // Tamaño carta (A4 sería 'A4')
};

 
//handle print
ipcMain.handle('printComponent', (event, url) => {
  let win = new BrowserWindow({ show: false });
 
  win.loadURL(url);
 
  win.webContents.on('did-finish-load', () => {
   win.webContents.print(printOptions, (success, failureReason) => {
    console.log('Print Initiated in Main...');
    if (!success) console.log(failureReason);
   });
  });
  return 'shown print dialog';
});
 
 //handle preview
ipcMain.handle('previewComponent', (event, url) => {
  let win = new BrowserWindow({ title: 'Preview', show: false, autoHideMenuBar: true });
  win.loadURL(url);
 
  win.webContents.once('did-finish-load', () => {
   win.webContents.printToPDF(printOptions).then((data) => {
     let buf = Buffer.from(data);
     var data = buf.toString('base64');
     let url = 'data:application/pdf;base64,' + data;
 
     win.webContents.on('ready-to-show', () => {
      win.show();
      win.setTitle('Preview');
     });
   
     win.webContents.on('closed', () => win = null);
     win.loadURL(url);
    })
    .catch((error) => {
     console.log(error);
    });
  });
  return 'shown preview window';
});


//impresion de reporte 
const printOptionsReporte = {
  silent: false, // Para mostrar el diálogo de impresión 
  printBackground: true, // Para imprimir el fondo 
  color: true,
  margin: { // Márgenes de impresión
    marginType: 'printableArea', 
  },
  landscape: false, // Para orientación horizontal
  pagesPerSheet: 1,
  collate: false, 
  copies: 1,
  header: 'Page header', // Encabezado de la página (puedes personalizarlo también)
  footer: `Página {{pageNumber}} de {{totalPages}}`, // Aquí agregamos el número de página
  pageSize: 'letter', // Tamaño carta (A4 sería 'A4')
};


//handle print
ipcMain.handle('printReport', (event, url) => {
  let win = new BrowserWindow({ show: false });
 
  win.loadURL(url);
 
  win.webContents.on('did-finish-load', () => {
   win.webContents.print(printOptionsReporte, (success, failureReason) => {
    console.log('Print Initiated in Main...');
    if (!success) console.log(failureReason);
   });
  });
  return 'mostrando diálogo de impresión';
});
 
//handle preview
ipcMain.handle('previewReport', (event, url) => {
  let win = new BrowserWindow({ title: 'Preview', show: false, autoHideMenuBar: true });
  win.loadURL(url);
 
  win.webContents.once('did-finish-load', () => {
   win.webContents.printToPDF(printOptionsReporte).then((data) => {
     let buf = Buffer.from(data);
     var data = buf.toString('base64');
     let url = 'data:application/pdf;base64,' + data;
 
     win.webContents.on('ready-to-show', () => {
      win.show();
      win.setTitle('Preview');
     });
   
     win.webContents.on('closed', () => win = null);
     win.loadURL(url);
    })
    .catch((error) => {
     console.log(error);
    });
  });
  return 'mostrando diálogo de previsualizacion impresión';
});