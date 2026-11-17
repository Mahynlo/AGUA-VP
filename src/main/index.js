import './e2eUserData.js' // primero: en pruebas E2E cambia la carpeta de datos antes de que otros módulos la lean
import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Gestión de actualizaciones
import initUpdateManager from './managers/updateManager.js'

import { AllIpcHandlers } from './ipc/index.js' // se exportan los IpcMain de la app
import { startApiServer, stopApiServer, debeSubirAlCerrar, flushCloudBeforeQuit } from './managers/apiManager.js'
import { startSyncMonitor } from './managers/syncMonitor.js'
import { setupWindowState } from './windowState.js'
import { restoreZoom, getSavedZoom } from './managers/zoomManager.js'
import { urlPantallaInicio, esperarVisible } from './pantallaInicio.js'
import logManager from './managers/logManager.js'
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

// true mientras la ventana principal muestra la pantalla de inicio y la API arranca (ver pantallaInicio.js)
let arrancando = false;

// Cierre: mientras se suben a la nube los cambios pendientes ya no hay ventanas, pero el proceso sigue vivo
let subiendoAlCerrar = false;
let relanzarAlCerrar = false;

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

/**
 * Crea la ventana principal.
 * @param {{ conPantallaInicio?: boolean }} [opciones] - con `conPantallaInicio` la ventana muestra
 *   primero la pantalla de inicio y la interfaz se carga después con cargarInterfaz(); sin ella se
 *   carga la interfaz directamente.
 */
function createWindow({ conPantallaInicio = false } = {}) {
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

  // Mientras arranca la API no se puede cerrar (Alt+F4): se detendría el servidor a medio arrancar,
  // quizá durante las migraciones. El bloqueo va en la propia ventana (setClosable) porque el hilo
  // principal está ocupado cargando la API: un evento 'close' quedaría en cola y se atendería después,
  // cuando el arranque ya terminó, cerrando la app. En cuanto carga la interfaz se cierra con normalidad.
  mainWindow.on('close', (event) => {
    if (arrancando) event.preventDefault();
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

  if (conPantallaInicio) {
    arrancando = true;
    mainWindow.setClosable(false);
    mainWindow.loadURL(urlPantallaInicio(icon));
  } else {
    cargarInterfaz(mainWindow);
  }
}

/** Carga la interfaz (React) en la ventana; si mostraba la pantalla de inicio, la reemplaza. */
function cargarInterfaz(win) {
  arrancando = false;
  if (!win || win.isDestroyed()) return;
  win.setClosable(true);

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    recargarSiFallaLaCargaEnDev(win, process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Abrir las herramientas de desarrollo
  // if (is.dev) {
  //   win.webContents.openDevTools();
  // }

  // Inicializar el gestor de actualizaciones (aquí y no al crear la ventana: sus avisos van a la
  // interfaz, y durante la pantalla de inicio no habría quién los recibiera)
  initUpdateManager(win);
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
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    } else if (subiendoAlCerrar && !relanzarAlCerrar && app.isPackaged) {
      // El usuario volvió a abrir la app mientras terminaba de cerrarse: se abre de nuevo al terminar
      relanzarAlCerrar = true;
      app.relaunch();
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

    // La ventana aparece de inmediato con la pantalla de inicio; la interfaz se carga en ella cuando
    // la API ya responde (arrancarla puede tardar varios segundos). Las pruebas E2E la desactivan
    // (AGUAVP_SIN_PANTALLA_INICIO=1): Playwright espera que la ventana cargue ya la interfaz.
    const conPantallaInicio = process.env.AGUAVP_SIN_PANTALLA_INICIO !== '1';
    if (conPantallaInicio) {
      createWindow({ conPantallaInicio: true });
      // Hay que esperar a que se vea: cargar la API ocupa el hilo principal y, mientras tanto,
      // la ventana no llega a pintarse.
      await esperarVisible(mainWindow);
      logManager.info('Pantalla de inicio visible', 'system');
    }

    // Iniciar servidor API embebido (aplica migraciones y crea backup automáticamente)
    try {
      await startApiServer();
    } catch (err) {
      console.error('❌ Error al iniciar el servidor API:', err);
      // La app continúa — el renderer mostrará error de conexión
    }

    if (conPantallaInicio) {
      cargarInterfaz(mainWindow) // reemplaza la pantalla de inicio por la interfaz
    } else {
      createWindow() // crea la ventana ya con la interfaz
    }
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
    if (debeSubirAlCerrar()) {
      subiendoAlCerrar = true;
      await flushCloudBeforeQuit();
    }
    await stopApiServer();
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // Cierre con app.quit() (botón de cerrar del titleBar): las ventanas ya se cerraron. Si hay nube
  // vinculada, se suben los cambios pendientes (unos segundos como máximo) y después termina el cierre.
  // Sin nube vinculada no se interviene.
  app.on('will-quit', (event) => {
    if (!debeSubirAlCerrar()) return;
    event.preventDefault();
    subiendoAlCerrar = true;
    flushCloudBeforeQuit().finally(() => app.quit());
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



