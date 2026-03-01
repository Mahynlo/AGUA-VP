
import { ipcMain, BrowserWindow, app, shell, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';


export default function IpcHandlers () {
    
    console.log("🔧 Registrando handlers IPC principales...");
    
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

    // === ZOOM HANDLERS ===
    ipcMain.handle('zoom-in', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
            const current = win.webContents.getZoomFactor();
            const newFactor = Math.min(current + 0.1, 3.0);
            win.webContents.setZoomFactor(newFactor);
            win.webContents.send('zoom-changed', newFactor); // Notificar cambio
            return newFactor;
        }
        return 1;
    });

    ipcMain.handle('zoom-out', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
            const current = win.webContents.getZoomFactor();
            const newFactor = Math.max(current - 0.1, 0.5);
            win.webContents.setZoomFactor(newFactor);
            win.webContents.send('zoom-changed', newFactor); // Notificar cambio
            return newFactor;
        }
        return 1;
    });

    ipcMain.handle('zoom-reset', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
            win.webContents.setZoomFactor(1.0);
            win.webContents.send('zoom-changed', 1.0); // Notificar cambio
            return 1.0;
        }
        return 1;
    });

    ipcMain.handle('get-zoom-level', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        return win ? win.webContents.getZoomFactor() : 1;
    });

    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });
    
     
    //handle print - Con verificación de seguridad
    ipcMain.handle('printComponent', (event, url, options = {}) => {
      //console.log('=== PRINT DEBUG ===');
      //console.log('Printing from URL:', url);
      const printOptions = {
        silent: false,
        printBackground: true,
        color: true,
        margin: { marginType: 'printableArea' },
        landscape: true,
        pagesPerSheet: 1,
        collate: false,
        copies: 1,
        header: 'Page header',
        footer: 'Page footer',
        pageSize: 'letter',
        ...options 
      };
      
      return new Promise((resolve, reject) => {
        // SEGURIDAD: Verificar que la URL contenga el parámetro print=true
        if (!url.includes('print=true')) {
          //console.error('Intento de impresión sin parámetro de seguridad');
          resolve('Error: Modo impresión no autorizado'); // Resolvemos para no romper el flujo, pero con error
          return;
        }
        
        let win = new BrowserWindow({ 
          show: false,
          backgroundColor: '#ffffff', // FORCE WHITE BACKGROUND
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            cache: false,
            webSecurity: app.isPackaged || !url.includes('localhost'),
            allowRunningInsecureContent: !app.isPackaged && url.includes('localhost')
          }
        });
      
        win.loadURL(url);
      
        win.webContents.on('did-finish-load', async () => {
          console.log('Print window loaded successfully');
          
          // FORZAR MODO CLARO (Hack para evitar borde negro en preview)
          try {
             await win.webContents.insertCSS('html, body { color-scheme: light !important; background-color: #ffffff !important; }');
             await win.webContents.executeJavaScript('document.documentElement.classList.remove("dark"); document.body.classList.remove("dark");');
          } catch (e) {
             console.error('Error forcing light mode:', e);
          }

          // Pequeño delay para asegurar que la página esté completamente renderizada
          setTimeout(() => {
            // Si options.silent es true, aseguramos que se envíe así
            if (options.silent) {
                printOptions.silent = true;
            }

            // Normalizar pageSize (Electron requiere Capitalized)
            if (printOptions.pageSize) {
                const size = printOptions.pageSize.toLowerCase();
                if (size === 'letter') printOptions.pageSize = 'Letter';
                else if (size === 'legal') printOptions.pageSize = 'Legal';
                else if (size === 'a4') printOptions.pageSize = 'A4';
            }

            win.webContents.print(printOptions, (success, failureReason) => {
              console.log('Print Initiated in Main...');
              if (!success) {
                console.error('Print failed:', failureReason);
                reject('Print failed: ' + failureReason);
              } else {
                console.log('Print successful');
                resolve('shown print dialog'); 
              }
              // Cerrar ventana oculta tras imprimir (opcional, pero buena práctica si es silent)
              if (printOptions.silent) {
                   win.close();
              }
            });
          }, 1000); // 1 segundo de delay
        });

        win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
          console.error('Failed to load URL for printing:', errorCode, errorDescription, validatedURL);
          reject(`Failed to load: ${errorDescription}`);
        });

        // Filtrar algunos logs de console para reducir ruido
        win.webContents.on('console-message', (event, level, message) => {
          if (!message.includes('React DevTools') && 
              !message.includes('Electron Security Warning') &&
              !message.includes('[vite]')) {
            console.log('Print window console:', level, message);
          }
        });
      });
    });
     
     // === GESTIÓN DE DATOS TEMPORALES (FileSystem) ===
     // Solución para grandes volúmenes de datos que exceden localStorage
     
     ipcMain.handle('savePrintData', async (event, dataStr) => {
        try {
            const id = require('crypto').randomUUID();
            const tempPath = path.join(app.getPath('temp'), `print_data_${id}.json`);
            
            // Escribir archivo temporalmente
            await fs.promises.writeFile(tempPath, dataStr, 'utf-8');
            
            // Limpieza automática después de 10 minutos
            setTimeout(() => {
                fs.unlink(tempPath, (err) => {
                    if (!err) console.log('Archivo temporal borrado:', tempPath);
                });
            }, 10 * 60 * 1000);
            
            return id;
        } catch (error) {
            console.error('Error saving temp print data:', error);
            throw error;
        }
     });

     ipcMain.handle('getPrintData', async (event, id) => {
        try {
            const tempPath = path.join(app.getPath('temp'), `print_data_${id}.json`);
            
            if (fs.existsSync(tempPath)) {
                const data = await fs.promises.readFile(tempPath, 'utf-8');
                // Intentar borrar inmediatamente después de leer para ahorrar espacio
                // (Opcional: se puede dejar que el timeout lo borre si se necesita recargar)
                return data;
            }
            return null;
        } catch (error) {
            console.error('Error reading temp print data:', error);
            return null; // Retornar null en lugar de lanzar error para manejarlo suavemente
        }
     });

     //handle preview
    ipcMain.handle('previewComponent', (event, url) => {
      console.log('Preview from URL:', url);
      
      return new Promise((resolve, reject) => {
        let win = new BrowserWindow({ 
          title: 'Preview', 
          show: false, 
          backgroundColor: '#ffffff', // FORCE WHITE BACKGROUND
          autoHideMenuBar: true,
          webPreferences: {
            sandbox: false,
            nodeIntegration: false,
            contextIsolation: true,
            cache: false,
            plugins: true, // NECESARIO para que el visor de PDF funcione en Production
            webSecurity: false, // NECESARIO para cargar file:/// desde una ventana creada
            allowRunningInsecureContent: true,
            preload: path.join(__dirname, '../preload/index.js')
          }
        });
      
        // Usar directamente la URL de la aplicación React en lugar del archivo HTML estático
        win.loadURL(url);

        win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
          console.error('Failed to load URL for preview:', errorCode, errorDescription, validatedURL);
          reject(`Failed to load: ${errorDescription}`);
        });

        // Filtrar algunos logs de console para reducir ruido
        win.webContents.on('console-message', (event, level, message) => {
          if (!message.includes('React DevTools') && 
              !message.includes('Electron Security Warning') &&
              !message.includes('[vite]')) {
            console.log('Preview window console:', level, message);
          }
        });
      
        win.webContents.once('did-finish-load', async () => {
          // FORZAR MODO CLARO PARA PDF
          try {
             await win.webContents.insertCSS('html, body { color-scheme: light !important; background-color: #ffffff !important; }');
             await win.webContents.executeJavaScript('document.documentElement.classList.remove("dark"); document.body.classList.remove("dark");');
          } catch(e) {}

          // Si es la carga inicial de React, generar PDF
          // Pequeño delay asegurando renderizado completo
          setTimeout(() => {
            win.webContents.printToPDF(printOptions).then(async (data) => {
              try {
                  // GUARDAR PDF EN DISCO (Evita error ERR_INVALID_URL por longitud de Data URI)
                  const pdfPath = path.join(app.getPath('temp'), `preview_recibos_${Date.now()}.pdf`);
                  console.log('PDF generado en:', pdfPath);
                  
                  // OPTIMIZACIÓN DE MEMORIA (Modo Efímero):
                  // 1. Guardar PDF
                  await fs.promises.writeFile(pdfPath, data);
                  
                  // 2. Destruir la ventana de generación inmediatamente
                  win.close();

                  // 3. Retornar la ruta del archivo para que el render (Modal) lo muestre
                  resolve({ success: true, path: pathToFileURL(pdfPath).href });

              } catch (err) {
                  console.error('Error guardando PDF temporal:', err);
                  // Solo mostrar ventana si falló la apertura externa (fallback)
                  win.show();
              }
             })


             .catch((error) => {
              console.error('Error generating PDF:', error);
              // Si falla el PDF, mostrar lo que haya (fallback)
              win.show();
              reject(error);
             });
          }, 2500); // 2.5s delay para asegurar que las gráficas carguen
        });

      });
    });

    // Obtener lista de impresoras
    ipcMain.handle('getPrinters', async () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
             const printers = await win.webContents.getPrintersAsync();
             return printers;
        }
        return [];
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
        backgroundColor: '#ffffff', // FORCE WHITE BACKGROUND
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
     
      win.webContents.on('did-finish-load', async () => {
        console.log('Print report window loaded successfully');
        
        // FORZAR MODO CLARO (Hack para evitar borde negro en preview)
        try {
           await win.webContents.insertCSS('html, body { color-scheme: light !important; background-color: #ffffff !important; }');
           await win.webContents.executeJavaScript('document.documentElement.classList.remove("dark"); document.body.classList.remove("dark");');
        } catch (e) {
           console.error('Error forcing light mode in report:', e);
        }

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
        backgroundColor: '#ffffff', // FORCE WHITE BACKGROUND
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
      
      win.webContents.on('did-finish-load', async () => {
          // FORZAR MODO CLARO
          try {
             await win.webContents.insertCSS('html, body { color-scheme: light !important; background-color: #ffffff !important; }');
             await win.webContents.executeJavaScript('document.documentElement.classList.remove("dark"); document.body.classList.remove("dark");');
          } catch(e) {}
      });

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
    
    // =====================================
    // HANDLERS DE DOCUMENTACIÓN MEJORADOS
    // =====================================

    // Función helper para parsear frontmatter
    const parseFrontmatter = (content, fileName) => {
      const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/;
      const match = content.match(frontmatterRegex);
      
      let metadata = {
        titulo: fileName.replace('.md', '').replace(/-/g, ' '),
        orden: 999,
        descripcion: '',
        seccion: '',
        tags: []
      };
      
      if (match) {
        try {
          const frontmatterText = match[1];
          const frontmatterLines = frontmatterText.split(/\r?\n/).filter(line => line.trim());
          
          frontmatterLines.forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
              const key = line.substring(0, colonIndex).trim();
              let value = line.substring(colonIndex + 1).trim();
              
              // Remover comillas si existen
              value = value.replace(/^["']|["']$/g, '');
              
              // Convertir orden a número
              if (key === 'orden') {
                value = parseInt(value) || 999;
              }
              
              // Parsear arrays básicos (solo para strings)
              if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
                try {
                  value = JSON.parse(value);
                } catch {
                  // Mantener como string si no se puede parsear
                }
              }
              
              metadata[key] = value;
            }
          });
        } catch (parseError) {
          console.warn(`⚠️ Error parseando metadata de ${fileName}:`, parseError);
        }
      }
      
      return metadata;
    };

    // Handler para listar archivos de documentación
    ipcMain.handle('list-documentation-files', async (event, section = null) => {
      console.log(`📚 Handler documentación - Listando archivos de sección: ${section || 'todas'}`);
      
      try {
        const isDev = !app.isPackaged;
        let ayudaPath;
        
        if (isDev) {
          // En desarrollo: buscar en el directorio de trabajo
          ayudaPath = path.join(process.cwd(), 'ayuda');
        } else {
          // En producción: buscar en el directorio de la aplicación desempaquetada
          // Como está en asarUnpack, estará disponible en process.resourcesPath
          ayudaPath = path.join(process.resourcesPath, 'ayuda');
          
          // Verificar si existe, si no, intentar buscar en app.getAppPath()
          if (!fs.existsSync(ayudaPath)) {
            console.log('📁 Intentando ruta alternativa en app.getAppPath()');
            ayudaPath = path.join(app.getAppPath(), 'ayuda');
          }
        }
        
        console.log(`📁 Buscando en directorio: ${ayudaPath} (isDev: ${isDev})`);
        
        if (!fs.existsSync(ayudaPath)) {
          console.warn(`⚠️ Directorio de ayuda no encontrado: ${ayudaPath}`);
          // Intentar listar contenido del directorio padre para debug
          try {
            const parentDir = path.dirname(ayudaPath);
            const parentContents = fs.readdirSync(parentDir);
            console.log(`📁 Contenido del directorio padre (${parentDir}):`, parentContents);
          } catch (debugError) {
            console.log('❌ No se pudo listar directorio padre:', debugError.message);
          }
          return { success: false, error: 'Directorio de ayuda no encontrado', sections: {} };
        }
        
        const sections = {};
        
        if (section) {
          // Listar archivos de una sección específica
          const sectionPath = path.join(ayudaPath, section);
          if (fs.existsSync(sectionPath)) {
            const files = fs.readdirSync(sectionPath)
              .filter(file => file.endsWith('.md'))
              .map(file => {
                const filePath = path.join(sectionPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const metadata = parseFrontmatter(content, file);
                
                return {
                  fileName: file,
                  metadata: metadata
                };
              })
              .sort((a, b) => a.metadata.orden - b.metadata.orden);
              
            sections[section] = files;
          }
        } else {
          // Listar todas las secciones y sus archivos
          const sectionDirs = fs.readdirSync(ayudaPath)
            .filter(dir => fs.statSync(path.join(ayudaPath, dir)).isDirectory());
          
          for (const sectionDir of sectionDirs) {
            const sectionPath = path.join(ayudaPath, sectionDir);
            const files = fs.readdirSync(sectionPath)
              .filter(file => file.endsWith('.md'))
              .map(file => {
                const filePath = path.join(sectionPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const metadata = parseFrontmatter(content, file);
                metadata.seccion = sectionDir; // Asegurar que tenga la sección
                
                return {
                  fileName: file,
                  metadata: metadata
                };
              })
              .sort((a, b) => a.metadata.orden - b.metadata.orden);
              
            // Debug: Mostrar orden después del sort
            if (sectionDir === 'clientes') {
              console.log(`🔍 Orden en backend para ${sectionDir}:`, 
                files.map(f => ({
                  fileName: f.fileName,
                  titulo: f.metadata.titulo,
                  orden: f.metadata.orden
                }))
              );
            }
              
            if (files.length > 0) {
              sections[sectionDir] = files;
            }
          }
        }
        
        console.log(`✅ Documentación listada exitosamente: ${Object.keys(sections).length} secciones`);
        return { success: true, sections };
        
      } catch (error) {
        console.error('❌ Error listando documentación:', error);
        return { success: false, error: error.message, sections: {} };
      }
    });

    // Handler para cargar un archivo específico de documentación
    ipcMain.handle('load-documentation-file', async (event, section, fileName) => {
      console.log(`📄 Handler documentación - Solicitando archivo: ${section}/${fileName}`);
      
      try {
        const isDev = !app.isPackaged;
        let ayudaPath;
        
        if (isDev) {
          // En desarrollo: buscar en el directorio de trabajo
          ayudaPath = path.join(process.cwd(), 'ayuda');
        } else {
          // En producción: buscar en el directorio de la aplicación desempaquetada
          ayudaPath = path.join(process.resourcesPath, 'ayuda');
          
          // Verificar si existe, si no, intentar buscar en app.getAppPath()
          if (!fs.existsSync(ayudaPath)) {
            console.log('📁 Intentando ruta alternativa en app.getAppPath()');
            ayudaPath = path.join(app.getAppPath(), 'ayuda');
          }
        }
        
        const filePath = path.join(ayudaPath, section, fileName);
        console.log(`📁 Buscando archivo en: ${filePath} (isDev: ${isDev})`);
        
        if (!fs.existsSync(filePath)) {
          console.warn(`⚠️ Archivo no encontrado: ${filePath}`);
          // Debug: listar contenido del directorio de la sección
          try {
            const sectionPath = path.join(ayudaPath, section);
            if (fs.existsSync(sectionPath)) {
              const sectionContents = fs.readdirSync(sectionPath);
              console.log(`📁 Contenido de la sección (${sectionPath}):`, sectionContents);
            } else {
              console.log(`❌ Directorio de sección no existe: ${sectionPath}`);
            }
          } catch (debugError) {
            console.log('❌ Error en debug:', debugError.message);
          }
          return { success: false, error: 'Archivo no encontrado', content: '', metadata: {} };
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`✅ Archivo leído exitosamente: ${section}/${fileName} (${content.length} caracteres)`);
        
        // Parsear y remover frontmatter del contenido
        const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/;
        const match = content.match(frontmatterRegex);
        
        let cleanContent = content;
        let metadata = {};
        
        if (match) {
          // Remover frontmatter del contenido para renderizado
          cleanContent = content.replace(frontmatterRegex, '');
          
          // Parsear metadata
          metadata = parseFrontmatter(content, fileName);
          
          console.log(`✅ Frontmatter parseado: ${Object.keys(metadata).length} propiedades`);
        }
        
        return { 
          success: true, 
          content: cleanContent, 
          metadata: metadata 
        };
        
      } catch (error) {
        console.error('❌ Error cargando archivo de documentación:', error);
        return { success: false, error: error.message, content: '', metadata: {} };
      }
    });
    

    
    // === HANDLER DE GUARDADO DE ARCHIVOS ===
    ipcMain.handle('save-file-dialog', async (event, { data, fileName, format }) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        
        const options = {
            title: 'Guardar Archivo',
            defaultPath: path.join(app.getPath('downloads'), `${fileName}.${format === 'csv' ? 'csv' : 'xlsx'}`),
            filters: [
                { name: format === 'csv' ? 'Archivos CSV' : 'Archivos Excel', extensions: [format === 'csv' ? 'csv' : 'xlsx'] }
            ]
        };

        const { canceled, filePath } = await dialog.showSaveDialog(win, options);

        if (canceled || !filePath) {
            return { success: false, canceled: true };
        }

        try {
            // data viene como Buffer o string base64 dependiendo del formato
            let buffer;
            if (format === 'xlsx') {
                 // Si viene en base64 (XLSX)
                 buffer = Buffer.from(data, 'base64');
            } else {
                 // Si viene en string (CSV)
                 // Agregar BOM para soporte UTF-8 en Excel
                 buffer = Buffer.concat([Buffer.from('\uFEFF'), Buffer.from(data, 'utf-8')]);
            }
            
            await fs.promises.writeFile(filePath, buffer);
            return { success: true, filePath };
        } catch (error) {
            console.error('Error guardando archivo:', error);
            return { success: false, error: error.message };
        }
    });

    // ============================================================
    // IMPRESIÓN SILENCIOSA — sin diálogo del OS
    // El usuario elige la impresora y opciones desde la UI React
    // ============================================================
    ipcMain.handle('print-silent', (event, url, config = {}) => {
      const { printer = '', landscape = true, copies = 1, pageSize = 'Letter' } = config;

      return new Promise((resolve, reject) => {
        let win = new BrowserWindow({
          show: false,
          backgroundColor: '#ffffff',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            cache: false,
            webSecurity: app.isPackaged || !url.includes('localhost'),
            allowRunningInsecureContent: !app.isPackaged && url.includes('localhost')
          }
        });

        win.loadURL(url);

        win.webContents.once('did-finish-load', async () => {
          try {
            await win.webContents.insertCSS('html, body { color-scheme: light !important; background-color: #ffffff !important; }');
            await win.webContents.executeJavaScript('document.documentElement.classList.remove("dark"); document.body.classList.remove("dark");');
          } catch (e) {}

          const sizeMap = { letter: 'Letter', legal: 'Legal', a4: 'A4' };
          const normalizedSize = sizeMap[(pageSize || 'Letter').toLowerCase()] || 'Letter';

          setTimeout(() => {
            win.webContents.print({
              silent: true,
              printBackground: true,
              color: true,
              deviceName: printer,
              landscape: !!landscape,
              copies: Math.max(1, parseInt(copies) || 1),
              pageSize: normalizedSize,
              margins: { marginType: 'printableArea' }
            }, (success, failureReason) => {
              try { win.close(); } catch (e) {}
              if (success) resolve({ success: true });
              else {
                console.error('Silent print failed:', failureReason);
                reject(failureReason || 'Print failed');
              }
            });
          }, 1000);
        });

        win.webContents.on('did-fail-load', (e, code, desc) => {
          console.error('Failed to load for silent print:', desc);
          try { win.close(); } catch (e) {}
          reject(`Failed to load: ${desc}`);
        });
      });
    });

    console.log("✅ Handlers de documentación registrados");
    
}


