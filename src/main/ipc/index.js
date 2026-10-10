// Punto único de registro de todos los handlers IPC (lo llama src/main/index.js).
// Estructura y responsabilidades: ver ./README.md

// core/ — funciones de la aplicación (impresión, PDF, ayuda, exportación, logo, sistema)
import registerCoreHandlers from './core/index.js'
import registerSystemHandlers from './core/systemHandlers.js'

// auth/ — sesión de usuario, gestión de usuarios y AppKey de la aplicación
import registerUsuariosHandlers from './auth/usuariosHandlers.js'
import registerAppKeyHandlers from './auth/appKeyHandlers.js'

// dominios/ — módulos de negocio (llaman a la API vía src/main/api-client)
import registerClientesHandlers from './dominios/clientesHandlers.js'
import registerMedidoresHandlers from './dominios/medidoresHandlers.js'
import registerTarifasHandlers from './dominios/tarifasHandlers.js'
import registerRutasHandlers from './dominios/rutasHandlers.js'
import registerFacturasHandlers from './dominios/facturasHandlers.js'
import registerLecturasHandlers from './dominios/lecturasHandlers.js'
import registerPagosHandlers from './dominios/pagosHandlers.js'
import registerDashboardHandlers from './dominios/dashboardHandlers.js'
import registerReportesHandlers from './dominios/reportesHandlers.js'
import registerDeudoresHandlers from './dominios/deudoresHandlers.js'

export function AllIpcHandlers() {
  // Se conserva el orden de registro original
  registerCoreHandlers()
  registerClientesHandlers()
  registerUsuariosHandlers()
  registerMedidoresHandlers()
  registerAppKeyHandlers()
  registerTarifasHandlers()
  registerRutasHandlers()
  registerFacturasHandlers()
  registerLecturasHandlers()
  registerPagosHandlers()
  registerDashboardHandlers()
  registerReportesHandlers()
  registerDeudoresHandlers()
  registerSystemHandlers() // Consola de administración del sistema
}
