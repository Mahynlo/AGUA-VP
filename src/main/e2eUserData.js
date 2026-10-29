import { app } from 'electron'

// Solo para las pruebas E2E (Playwright): usar otra carpeta de datos (con una copia de la base)
// para no tocar la base real ni la configuración de la nube. Se importa antes que todo lo demás
// porque varios módulos calculan sus rutas al cargarse. La app instalada lo ignora.
const carpeta = process.env.AGUAVP_E2E_USER_DATA
if (carpeta && !app.isPackaged) {
  app.setPath('userData', carpeta)
}
