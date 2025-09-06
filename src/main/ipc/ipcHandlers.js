
import { ipcMain, BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';


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
        const isDev = !app.isPackaged; // Usar app.isPackaged para determinar entorno
        let ayudaPath;
        
        if (isDev) {
          ayudaPath = path.join(process.cwd(), 'ayuda');
        } else {
          ayudaPath = path.join(process.resourcesPath, 'ayuda');
        }
        
        console.log(`📁 Buscando en directorio: ${ayudaPath}`);
        
        if (!fs.existsSync(ayudaPath)) {
          console.warn(`⚠️ Directorio de ayuda no encontrado: ${ayudaPath}`);
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
        const isDev = !app.isPackaged; // Usar app.isPackaged para determinar entorno
        let ayudaPath;
        
        if (isDev) {
          ayudaPath = path.join(process.cwd(), 'ayuda');
        } else {
          ayudaPath = path.join(process.resourcesPath, 'ayuda');
        }
        
        const filePath = path.join(ayudaPath, section, fileName);
        console.log(`📁 Buscando archivo en: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
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
    
    console.log("✅ Handlers de documentación registrados");
    
}


