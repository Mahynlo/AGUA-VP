
import { ipcMain, BrowserWindow } from 'electron';
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
    
    const recibos = [
      {
        usuario: "Juan Pérez",
        direccion: "Calle 123",
        pueblo: "San Juan",
        medidor: "12345678",
        consumoMedio: 25,
        tarifa: "$2.50/m³",
        ruta: "A-12",
        mesFacturado: "Mayo 2025",
        periodo: "01/04/2025 - 30/04/2025",
        totalMes: 100,
        adeudo: 50,
        totalPagar: 150,
        info: "Evita el desperdicio de agua.",
        consumoEquivalente: "Equivale a 1000 litros",
        grafica: {
          meses: ["Ene", "Feb", "Mar", "Abr", "May"],
          valores: [20, 22, 18, 30, 25]
        }
      },
      {
        usuario: "Ana Gómez",
        direccion: "Av. Libertad 45",
        pueblo: "Villa Hermosa",
        medidor: "87654321",
        consumoMedio: 30,
        tarifa: "$2.50/m³",
        ruta: "B-3",
        mesFacturado: "Mayo 2025",
        periodo: "01/04/2025 - 30/04/2025",
        totalMes: 120,
        adeudo: 20,
        totalPagar: 140,
        info: "Cuida el agua, cuida el planeta.",
        consumoEquivalente: "Equivale a 1200 litros",
        grafica: {
          meses: ["Ene", "Feb", "Mar", "Abr", "May"],
          valores: [28, 29, 27, 35, 30]
        }
      }
    ];
    
      const dataStr = encodeURIComponent(JSON.stringify(recibos));
      // Asegúrate de que la ruta al archivo HTML sea correcta
      const filePath = path.join(__dirname, '../../src/renderer/src/Impresion/Resibo.html'); // Si la carpeta está en la raíz de tu proyecto, ajusta la ruta.
      const urlHTML = `file://${filePath}?data=${dataStr}`;
      win.loadURL(urlHTML);
     
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
    
    
    ipcMain.handle('previewRecibohtml', async (event, data) => {
      const { nombre, monto, fecha } = data;
    
      const win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        title: 'Vista previa de recibo',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        }
      });
    
      // Asegúrate de que la ruta al archivo HTML sea correcta
      const filePath = path.join(__dirname, '../../src/Impresion/Resibo.html'); // Si la carpeta está en la raíz de tu proyecto, ajusta la ruta.
      const url = `file://${filePath}?nombre=${encodeURIComponent(nombre)}&monto=${monto}&fecha=${encodeURIComponent(fecha)}`;
    
      await win.loadURL(url);
      win.show(); // Mostrar la ventana de vista previa
    });
    
}


