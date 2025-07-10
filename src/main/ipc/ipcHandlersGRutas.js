// File: src/main/ipc/ipcHandlersRutas.js
const { ipcMain } = require("electron");
import { GenerarRutaLectura } from "../../generador_rutas/generar_ruta.js";

export default function IpcHandlersRutas() {

ipcMain.handle("calcular-ruta", async (event, puntos_gps) => {
  try {
    console.log("📌 Puntos GPS recibidos:", puntos_gps); // debe ser array directamente

    if (!Array.isArray(puntos_gps) || puntos_gps.length < 2) {
      throw new Error("Se requieren al menos dos puntos GPS para generar una ruta");
    }

    return await GenerarRutaLectura(puntos_gps); // aquí usas "puntos" que no está definido, debe ser puntos_gps
  } catch (error) {
    console.error("❌ Error al calcular ruta:", error.message);
    throw error;
  }
});



}

