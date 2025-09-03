
import { ipcMain, BrowserWindow, app } from 'electron';
import path from 'path';


export default function IpcHandlers () {
    
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
    
     
    //handle print - Con verificación de seguridad
    ipcMain.handle('printComponent', (event, url) => {
      //console.log('=== PRINT DEBUG ===');
      //console.log('Printing from URL:', url);
      //console.log('App packaged:', app.isPackaged);
      //console.log('Process platform:', process.platform);
      
      // SEGURIDAD: Verificar que la URL contenga el parámetro print=true
      if (!url.includes('print=true')) {
        //console.error('Intento de impresión sin parámetro de seguridad');
        return 'Error: Modo impresión no autorizado';
      }
      
      let win = new BrowserWindow({ 
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          // Deshabilitar cache para evitar problemas de carga
          cache: false,
          // Solo deshabilitar webSecurity en desarrollo para localhost
          webSecurity: app.isPackaged || !url.includes('localhost'),
          // No permitir contenido inseguro en producción
          allowRunningInsecureContent: !app.isPackaged && url.includes('localhost')
        }
      });
     
      win.loadURL(url);
     
      win.webContents.on('did-finish-load', () => {
        console.log('Print window loaded successfully');
        // Pequeño delay para asegurar que la página esté completamente renderizada
        setTimeout(() => {
          win.webContents.print(printOptions, (success, failureReason) => {
            console.log('Print Initiated in Main...');
            if (!success) {
              console.error('Print failed:', failureReason);
            } else {
              console.log('Print successful');
            }
          });
        }, 1000); // 1 segundo de delay
      });

      win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load URL for printing:', errorCode, errorDescription, validatedURL);
      });

      // Filtrar algunos logs de console para reducir ruido
      win.webContents.on('console-message', (event, level, message) => {
        if (!message.includes('React DevTools') && 
            !message.includes('Electron Security Warning') &&
            !message.includes('[vite]')) {
          console.log('Print window console:', level, message);
        }
      });

      return 'shown print dialog';
    });
     
     //handle preview
    ipcMain.handle('previewComponent', (event, url) => {
      console.log('Preview from URL:', url);
      let win = new BrowserWindow({ 
        title: 'Preview', 
        show: false, 
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          // Deshabilitar cache para evitar problemas de carga
          cache: false,
          // Solo deshabilitar webSecurity en desarrollo para localhost
          webSecurity: app.isPackaged || !url.includes('localhost'),
          // No permitir contenido inseguro en producción
          allowRunningInsecureContent: !app.isPackaged && url.includes('localhost')
        }
      });
    
      // Usar directamente la URL de la aplicación React en lugar del archivo HTML estático
      win.loadURL(url);

      win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load URL for preview:', errorCode, errorDescription, validatedURL);
      });

      // Filtrar algunos logs de console para reducir ruido
      win.webContents.on('console-message', (event, level, message) => {
        if (!message.includes('React DevTools') && 
            !message.includes('Electron Security Warning') &&
            !message.includes('[vite]')) {
          console.log('Preview window console:', level, message);
        }
      });
     
      win.webContents.once('did-finish-load', () => {
        // Pequeño delay para asegurar que la página esté completamente renderizada
        setTimeout(() => {
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
            console.error('Error generating PDF:', error);
           });
        }, 1000); // 1 segundo de delay
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
    
    
    //handle print report - Optimizado igual que printComponent
    ipcMain.handle('printReport', (event, url) => {
      console.log('=== PRINT REPORT DEBUG ===');
      console.log('Printing report from URL:', url);
      console.log('App packaged:', app.isPackaged);
      console.log('Process platform:', process.platform);
      
      let win = new BrowserWindow({ 
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          // Deshabilitar cache para evitar problemas de carga
          cache: false,
          // Solo deshabilitar webSecurity en desarrollo para localhost
          webSecurity: app.isPackaged || !url.includes('localhost'),
          // No permitir contenido inseguro en producción
          allowRunningInsecureContent: !app.isPackaged && url.includes('localhost')
        }
      });
     
      win.loadURL(url);
     
      win.webContents.on('did-finish-load', () => {
        console.log('Print report window loaded successfully');
        // Pequeño delay para asegurar que la página esté completamente renderizada
        setTimeout(() => {
          win.webContents.print(printOptionsReporte, (success, failureReason) => {
            console.log('Print Report Initiated in Main...');
            if (!success) {
              console.error('Print report failed:', failureReason);
            } else {
              console.log('Print report successful');
            }
          });
        }, 1000); // 1 segundo de delay
      });

      win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load URL for report printing:', errorCode, errorDescription, validatedURL);
      });

      // Filtrar algunos logs de console para reducir ruido
      win.webContents.on('console-message', (event, level, message) => {
        if (!message.includes('React DevTools') && 
            !message.includes('Electron Security Warning') &&
            !message.includes('[vite]')) {
          console.log('Print report window console:', level, message);
        }
      });

      return 'mostrando diálogo de impresión de reporte';
    });
     
    //handle preview report - Optimizado igual que previewComponent
    ipcMain.handle('previewReport', (event, url) => {
      console.log('=== PREVIEW REPORT DEBUG ===');
      console.log('Preview report from URL:', url);
      console.log('App packaged:', app.isPackaged);
      
      let win = new BrowserWindow({ 
        title: 'Preview Report', 
        show: false, 
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          // Deshabilitar cache para evitar problemas de carga
          cache: false,
          // Solo deshabilitar webSecurity en desarrollo para localhost
          webSecurity: app.isPackaged || !url.includes('localhost'),
          // No permitir contenido inseguro en producción
          allowRunningInsecureContent: !app.isPackaged && url.includes('localhost')
        }
      });
      
      win.loadURL(url);

      win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load URL for report preview:', errorCode, errorDescription, validatedURL);
      });

      // Filtrar algunos logs de console para reducir ruido
      win.webContents.on('console-message', (event, level, message) => {
        if (!message.includes('React DevTools') && 
            !message.includes('Electron Security Warning') &&
            !message.includes('[vite]')) {
          console.log('Preview report window console:', level, message);
        }
      });
     
      win.webContents.once('did-finish-load', () => {
        console.log('Preview report window loaded successfully');
        // Pequeño delay para asegurar que la página esté completamente renderizada
        setTimeout(() => {
          win.webContents.printToPDF(printOptionsReporte).then((data) => {
            let buf = Buffer.from(data);
            var data = buf.toString('base64');
            let url = 'data:application/pdf;base64,' + data;
        
            win.webContents.on('ready-to-show', () => {
             win.show();
             win.setTitle('Preview Report');
            });
          
            win.webContents.on('closed', () => win = null);
            win.loadURL(url);
           })
           .catch((error) => {
            console.error('Error generating report PDF:', error);
           });
        }, 1000); // 1 segundo de delay
      });
      return 'mostrando diálogo de previsualizacion de reporte';
    });
    
    // NOTA: Handler previewRecibohtml eliminado - no se usaba
    // El sistema ahora usa solo componentes React para consistencia
    
}


