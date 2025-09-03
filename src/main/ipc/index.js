//este archivo es el que se encarga de importar todos los ipcHandlers y exportarlos para ser utilizados en el main.js
import IpcHandlers from "./ipcHandlers.js"
import IpcHandlerClientes from './ipcHandlersClientes.js'
import IpcHandlerUsuario from './ipcHandlersUsuario.js'
import IpcHandlersMedidores from './ipcHandlersMedidores.js'
import IpcHandlersAuthApp from './ipcHandlersAuthApp.js'
import IpcHandlersTarifas from './ipcHandlersTarifas.js'
import IpcHandlersRutas from './ipcHandlersGRutas.js'
import IpcHandlerFacturas from './ipcHandlersFacturas.js'
import IpcHandlerLecturas from './ipcHandlersLecturas.js'
import IpcHandlerPagos from './ipcHandlersPagos.js'

export  function AllIpcHandlers() {
    IpcHandlers(); // Importa y ejecuta el archivo ipcHandlers.js
    IpcHandlerClientes(); // Importa y ejecuta el archivo ipcHandlersClientes.js
    IpcHandlerUsuario(); // Importa y ejecuta el archivo ipcHandlersUsuario.js
    IpcHandlersMedidores(); // Importa y ejecuta el archivo ipcHandlersMedidores.js
    IpcHandlersAuthApp(); // Importa y ejecuta el archivo ipcHandlersAuthApp.js
    IpcHandlersTarifas(); // Importa y ejecuta el archivo ipcHandlersTarifas.js
    IpcHandlersRutas(); // Importa y ejecuta el archivo ipcHandlersRutas.js
    IpcHandlerFacturas(); // Importa y ejecuta el archivo ipcHandlersFacturas.js
    IpcHandlerLecturas(); // Importa y ejecuta el archivo ipcHandlersLecturas.js
    IpcHandlerPagos(); // Importa y ejecuta el archivo ipcHandlersPagos.js
} 