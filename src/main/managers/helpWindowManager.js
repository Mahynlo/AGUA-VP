import { BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import icon from '../../../resources/icon.png?asset';
import { restoreZoom, getSavedZoom } from './zoomManager.js';

let helpWindow = null;

export function getHelpWindow() {
  return helpWindow;
}

export function openHelpWindow(section = null, file = null) {
  // Si la ventana ya está abierta y no fue destruida
  if (helpWindow && !helpWindow.isDestroyed()) {
    if (helpWindow.isMinimized()) {
      helpWindow.restore();
    }
    helpWindow.show();
    helpWindow.focus();

    if (section && file) {
      helpWindow.webContents.send('navigate-to-doc', { section, file });
    }
    return helpWindow;
  }

  // Crear ventana dedicada de Ayuda
  helpWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: "Centro de Ayuda - AguaVP",
    show: false,
    autoHideMenuBar: true,
    frame: false, // Barra de título personalizada dragable
    backgroundColor: '#f8fafc',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: !is.dev,
      spellcheck: true,
      zoomFactor: getSavedZoom()
    }
  });

  // Configurar autocorrector en Español
  helpWindow.webContents.session.setSpellCheckerLanguages(['es']);

  // Evitar que index.html sobreescriba el título con el de la ventana principal
  helpWindow.on('page-title-updated', (event, title) => {
    event.preventDefault();
    if (title && title.includes('Centro de Ayuda')) {
      helpWindow.setTitle(title);
    } else {
      helpWindow.setTitle('Centro de Ayuda - AguaVP');
    }
  });

  helpWindow.on('ready-to-show', () => {
    restoreZoom(helpWindow);
    helpWindow.setTitle('Centro de Ayuda - AguaVP');
    helpWindow.show();
  });

  helpWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  helpWindow.webContents.on('did-finish-load', () => {
    helpWindow.setTitle('Centro de Ayuda - AguaVP');
    restoreZoom(helpWindow);
    if (section && file) {
      setTimeout(() => {
        if (helpWindow && !helpWindow.isDestroyed()) {
          helpWindow.webContents.send('navigate-to-doc', { section, file });
        }
      }, 300);
    }
  });

  // Query params en HashRouter para deep linking: #/ayuda?section=...&file=...
  let hash = '/ayuda';
  if (section && file) {
    hash += `?section=${encodeURIComponent(section)}&file=${encodeURIComponent(file)}`;
  }

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    helpWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`);
  } else {
    helpWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash });
  }

  helpWindow.on('closed', () => {
    helpWindow = null;
  });

  return helpWindow;
}
