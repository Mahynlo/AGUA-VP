import './e2eUserData.js' // primero: en pruebas E2E cambia la carpeta de datos antes de que otros módulos la lean
import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Gestión de actualizaciones
import initUpdateManager from './managers/updateManager.js'

import { AllIpcHandlers } from './ipc/index.js' // se exportan los IpcMain de la app
import { startApiServer, stopApiServer } from './managers/apiManager.js'
import { startSyncMonitor } from './managers/syncMonitor.js'
import { setupWindowState } from './windowState.js'
import { restoreZoom, getSavedZoom } from './managers/zoomManager.js'
import contextMenu from 'electron-context-menu';

// Configurar menú contextual en Español
contextMenu({
    showLookUpSelection: false,
    showSearchWithGoogle: false,
    showCopyImage: false,
    showInspectElement: is.dev, // Solo en desarrollo
    labels: {
        cut: 'Cortar',
        copy: 'Copiar',
        paste: 'Pegar',
        saveImageAs: 'Guardar imagen como...',
        copyLink: 'Copiar enlace',
        inspect: 'Inspeccionar elemento',
        lookUpSelection: 'Buscar "{selection}"',
        searchWithGoogle: 'Buscar en Google',
        selectAll: 'Seleccionar todo'
    }
});

const createMenu = () => {
  const template = [
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

let mainWindow = null;

// Solo en desarrollo: la ventana carga cientos de módulos desde el servidor de Vite. Si el
// proceso de red de Chromium se cae mientras tanto ("Network service crashed… restarting"),
// las peticiones en curso se pierden y la ventana queda en blanco. Se recarga sola unos
// intentos en vez de tener que reiniciar `npm run dev`. En producción se carga con loadFile.
function recargarSiFallaLaCargaEnDev(win, url) {
  const MAX_INTENTOS = 5;
  const ESPERA_CARGA_MS = 20000;
  let intentos = 0;
  let cargada = false;
  let vigilante = null;

  // Si la interfaz no termina de cargar a tiempo (peticiones colgadas tras la caída del
  // proceso de red), se muestra la ventana igual y se recarga: 'ready-to-show' nunca llegaría.
  const vigilarCarga = () => {
    clearTimeout(vigilante);
    vigilante = setTimeout(() => {
      if (win.isDestroyed() || cargada) return;
      if (!win.isVisible()) win.show();
      recargar(`la interfaz no terminó de cargar en ${ESPERA_CARGA_MS / 1000} s`);
    }, ESPERA_CARGA_MS);
  };

  const recargar = (motivo) => {
    if (win.isDestroyed() || intentos >= MAX_INTENTOS) {
      console.warn(`⚠️ [dev] ${motivo}; sin más reintentos automáticos (usa Ctrl+R)`);
      return;
    }
    intentos++;
    cargada = false;
    console.warn(`⚠️ [dev] ${motivo}; recargando (${intentos}/${MAX_INTENTOS})…`);
    setTimeout(() => {
      if (win.isDestroyed()) return;
      win.loadURL(url);
      vigilarCarga();
    }, 1000);
  };

  win.webContents.on('did-fail-load', (_e, code, desc, failedUrl, isMainFrame) => {
    console.warn(`⚠️ [dev] did-fail-load ${code} ${desc} (${isMainFrame ? 'ventana' : 'subrecurso'}) ${failedUrl}`);
    if (isMainFrame && code !== -3 /* ERR_ABORTED: navegación reemplazada */) recargar(`falló la carga: ${code} ${desc}`);
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    console.warn(`⚠️ [dev] render-process-gone ${JSON.stringify(details)}`);
    recargar(`se cerró el proceso de la interfaz: ${details.reason}`);
  });

  // Registro de cualquier proceso hijo que se cae, para diagnosticar ("Network service crashed")
  const alCaerseProceso = (_e, details) => {
    console.warn(`⚠️ [dev] child-process-gone ${JSON.stringify(details)}`);
    if (/network/i.test(`${details.serviceName || ''} ${details.name || ''}`)) {
      recargar(`se reinició el proceso de red: ${details.reason}`);
    }
  };
  app.on('child-process-gone', alCaerseProceso);
  win.once('closed', () => { clearTimeout(vigilante); app.removeListener('child-process-gone', alCaerseProceso) });

  win.webContents.on('did-finish-load', () => {
    cargada = true;
    clearTimeout(vigilante);
    intentos = 0;
    console.log('✅ [dev] interfaz cargada');
  });
  vigilarCarga();
}

function createWindow() {
  createMenu();
  
  // Setup Window Persistence
  const windowState = setupWindowState();

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: windowState.width, 
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800, // Ancho mínimo
    minHeight: 750, // Altura mínima
    show: false, // Ocultar la ventana hasta que esté lista
    autoHideMenuBar: true, // Ocultar la barra de menú
    frame: false, // Sin marco
    backgroundColor: '#f8fafc', // Fondo nativo para cálculo de contraste de cursor en Windows
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, // Deshabilitar el aislamiento del contexto
      webSecurity: !is.dev, // Permitir carga de archivos locales en iframe durante desarrollo
      spellcheck: true,
      zoomFactor: getSavedZoom()
    }

  })

  // Track window state events
  windowState.track(mainWindow);

  // Configurar autocorrector en Español
  mainWindow.webContents.session.setSpellCheckerLanguages(['es']);


  mainWindow.on('ready-to-show', () => { // Mostrar la ventana cuando esté lista 
    restoreZoom(mainWindow);
    mainWindow.show();      // Muestra la app
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Restaurar la escala visual guardada tras cada carga (Electron reinicia
  // el zoom a 100% en cada navegación/recarga).
  mainWindow.webContents.on('did-finish-load', () => {
    restoreZoom(mainWindow);
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    recargarSiFallaLaCargaEnDev(mainWindow, process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Abrir las herramientas de desarrollo
  // if (is.dev) {
  //   mainWindow.webContents.openDevTools();
  // }

  // Inicializar el gestor de actualizaciones
  initUpdateManager(mainWindow);
}


// Bloqueo de instancia única (Single Instance Lock)
// Evita múltiples procesos concurrentes que choquen con la API embebida o SQLite
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Si ya hay una instancia en ejecución, salir de inmediato
  app.quit();
} else {
  app.on('second-instance', () => {
    // Si el usuario intenta abrir otra instancia, restaurar y enfocar la ventana existente
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    // Set app user model id for windows (coincide con appId de electron-builder)
    electronApp.setAppUserModelId('com.electron.app')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Iniciar servidor API embebido (aplica migraciones y crea backup automáticamente)
    try {
      await startApiServer();
    } catch (err) {
      console.error('❌ Error al iniciar el servidor API:', err);
      // La app continúa — el renderer mostrará error de conexión
    }

    createWindow() // crea la ventana
    startSyncMonitor() // vigila la copia en la nube y avisa si falla

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', async () => {
    await stopApiServer();
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // In this file you can include the rest of your app"s specific main process
  // code. You can also put them in separate files and require them here.

  //Botones para el titleBar personalizado
  ipcMain.on("minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });

  ipcMain.on("maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.on("close", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
    if (win) {
      if (mainWindow && win === mainWindow) {
        if (process.platform !== 'darwin') {
          app.quit();
        }
      } else {
        win.close();
      }
    } else {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    }
  });

  // Handlers de aplicación
  AllIpcHandlers();
}



