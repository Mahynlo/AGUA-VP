import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { db } from '../db/Cliente.js'; // Importa la base de datos SQLite
import { console } from 'inspector'
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "mi_secreto_super_seguro"; // Cambia esto en producción

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


// Función para verificar actualizaciones
function checkForUpdates(mainWindow) {

  autoUpdater.setFeedURL({ // Configuracion de la actualización automática con GitHub
    provider: 'github',
    owner: 'Mahynlo',
    repo: 'AGUA-VP',
    token: import.meta.env.VITE_GITHUB_TOKEN
  })

  autoUpdater.checkForUpdatesAndNotify() // Comprobar actualizaciones y notificar al usuario

  // Notificar cuando haya una actualización disponible
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización disponible',
      message: `Nueva versión ${info.version} disponible. Se descargará en segundo plano.`,
      buttons: ['OK']
    })
  })

  // Notificar cuando la actualización se haya descargado
  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox(mainWindow, {
        type: 'question',
        title: 'Instalar actualización',
        message: 'La actualización se ha descargado. ¿Desea instalarla ahora?',
        buttons: ['Reiniciar', 'Más tarde']
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  // Manejar errores en la actualización
  autoUpdater.on('error', (err) => {
    console.error('Error en la actualización:', err)
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Error en actualización',
      message: `Hubo un problema al buscar actualizaciones: ${err.message}`
    })
  })
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
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.close();
});


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






// 📌 Función para registrar usuarios
const registerUser = async (correo, contrasena, username, rol) => {
  const hashedPassword = await bcrypt.hash(contrasena, 10);

  try {
    await db.execute({
      sql: "INSERT INTO usuarios (correo, contraseña, username, rol) VALUES (?, ?, ?, ?)",
      args: [correo, hashedPassword, username, rol],
    });

    return { success: true, message: "Usuario registrado con éxito" };
  } catch (error) {
    return { success: false, message: "El usuario ya existe o hubo un error" };
  }
};

// 📌 Función para autenticar usuarios
const loginUser = async (correo, contrasena) => {
  try {

    // Realizar la consulta a la base de datos
    const result = await db.execute({
      sql: "SELECT * FROM usuarios WHERE correo = ?",
      args: [correo],
    });

    if (!result || !result.rows || result.rows.length === 0) {
      return { success: false, message: "Usuario no encontrado", result: null };
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10); // Encriptar la contraseña ingresada por el usuario para compararla con la almacenada

    // Verificar la contraseña ingresada contra la almacenada
    const isMatch = await bcrypt.compare(contrasena,hashedPassword);
    if (!isMatch) {
      return { success: false, message: "Contraseña incorrecta", result: null };
    }

    // Generar el token JWT si la contraseña es correcta
    const token = jwt.sign(
      { id: result.rows[0].id, correo: result.rows[0].correo, rol: result.rows[0].rol },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return { success: true, token, username: result.rows[0].username, rol: result.rows[0].rol };

  } catch (error) {
    console.error("Error en loginUser:", error);
    return { success: false, message: "Error en la autenticación", result: null };
  }
};



// 📌 Manejar autenticación login
ipcMain.handle("login", async (event, data) => {
  return await loginUser(data.correo, data.contrasena);
});



// 📌 Función para verificar token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};

// 📌 Manejar autenticación registro
ipcMain.handle("register", async (event, data) => {
  return await registerUser(data.correo, data.contrasena, data.username, data.rol);
});

// 📌 Manejar verificación de sesión
ipcMain.handle("verify-session", async (event, token) => {
  return verifyToken(token) ? { success: true, user: verifyToken(token) } : { success: false };
});



