// File: src/main/ipc/ipcHandlersRutas.js
const { ipcMain } = require("electron");
import { GenerarRutaLectura } from "../../generador_rutas/generar_ruta.js";
import {registrarRutas} from "../../register/rutas.js"; // Asegúrate de que esta ruta sea correcta
import {fetchRutas} from "../../fetch/rutas.js"; // Asegúrate de que esta ruta sea correcta
import {fetchRutasInfoMedidores} from "../../fetch/infoRutas.js"; // Asegúrate de que esta ruta sea correcta
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


    ipcMain.handle("registrar-ruta", async (event, data) => {
    try {
      console.log("📌 Ruta a registrar:", data);

      const { ruta, token_session } = data;

      if (!ruta || !token_session) {
        throw new Error("Datos de ruta o token de sesión no proporcionados");
      }

      if (!ruta.nombre || !ruta.descripcion || !Array.isArray(ruta.puntos) || ruta.puntos.length < 2) {
        throw new Error("La ruta debe contener al menos dos puntos, un nombre y una descripción");
      }

      const result = await registrarRutas(ruta, token_session);
      return result;

    } catch (error) {
      console.error("❌ Error al registrar ruta:", error.message);
      return { success: false, message: error.message };
    }
  });


  ipcMain.handle("listar-rutas", async (event, token_session,periodo) => {
    try {
      console.log("📌 Listando rutas con token de sesión:", token_session);

      if (!token_session) {
        throw new Error("Token de sesión no proporcionado");
      }

      //si periodo tine el formato correcto en string YYYY-MM
      if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
        throw new Error("Periodo debe estar en formato YYYY-MM");
      }

      const rutas = await fetchRutas(token_session,periodo);
      return rutas;

    } catch (error) {
      console.error("❌ Error al listar rutas:", error.message);
      return [];
    }
  });

  ipcMain.handle("listar-rutas-info-medidores", async (event, token_session, id_ruta) => {
    try {
      console.log("📌 Listando información de medidores para la ruta con ID:", id_ruta);

      if (!token_session) {
        throw new Error("Token de sesión no proporcionado");
      }

      const medidores = await fetchRutasInfoMedidores(token_session, id_ruta);
      return medidores;

    } catch (error) {
      console.error("❌ Error al listar información de medidores:", error.message);
      return [];
    }
  });

  ipcMain.handle("modificar-ruta", async (event, token_session, id_ruta, datosActualizados) => {
    try {
      console.log("📌 Modificando ruta con ID:", id_ruta);
      console.log("📌 Datos actualizados:", datosActualizados);

      if (!token_session) {
        throw new Error("Token de sesión no proporcionado");
      }

      if (!id_ruta) {
        throw new Error("ID de ruta no proporcionado");
      }

      if (!datosActualizados) {
        throw new Error("Datos actualizados no proporcionados");
      }

      // Importar dinámicamente la función de actualización
      const { actualizarRuta } = await import("../../fetch/rutas.js");
      
      const result = await actualizarRuta(token_session, id_ruta, datosActualizados);
      return result;

    } catch (error) {
      console.error("❌ Error al modificar ruta:", error.message);
      return { success: false, message: error.message };
    }
  });


}

