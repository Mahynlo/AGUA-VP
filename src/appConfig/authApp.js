//file : authApp.js
import { app, safeStorage } from "electron"; // Asegúrate de tener instalado electron
import path from "path"; // Asegúrate de tener instalado el módulo 'path'
import fs from "fs"; // Asegúrate de tener instalado el módulo 'fs'
import fetch from "node-fetch"; // Asegúrate de tener instalado node-fetch

const tokenPath = path.join(app.getPath("userData"), "Token_Key_App.enc"); // Ruta para guardar el token encriptado
const appId = path.join(app.getPath("userData"), "Id_App.enc"); // Ruta para guardar el ID de la app
const APP_KEY_INICIAL = import.meta.env.VITE_APPKEY_INICIAL; // Clave inicial de la app
const API_URL = import.meta.env.VITE_API_REGISTRAR_APP; // URL de registro de la app

// 🔐 Función para guardar token encriptado
function guardarToken(token) {
  const encrypted = safeStorage.encryptString(token);
  fs.writeFileSync(tokenPath, encrypted, { mode: 0o600 });
}

// 🔒 Guardar ID de app
function guardarIdApp(id) {
  const encrypted = safeStorage.encryptString(id);
  fs.writeFileSync(appId, encrypted, { mode: 0o600 });
}

// 🔓 Función para leer token encriptado
export function leerToken() {
  if (!fs.existsSync(tokenPath)) return null;
  try {
    const encrypted = fs.readFileSync(tokenPath);
    const decrypted = safeStorage.decryptString(encrypted);
    return decrypted.toString("utf-8");
  } catch (err) {
    console.error("Error al leer token:", err);
    return null;
  }
}


//leer id
export function leerId() {
  if (!fs.existsSync(appId)) return null;
  try {
    const encrypted = fs.readFileSync(appId);
    const decrypted = safeStorage.decryptString(encrypted);
    return decrypted.toString("utf-8");
  } catch (err) {
    console.error("Error al leer ID de la app:", err);
    return null;
  }
}

// Función para borrar el token (solo para pruebas)
export function borrarToken() {
  if (fs.existsSync(tokenPath)) {
    fs.unlinkSync(tokenPath);
  }

  return null;
}

// 🔁 Función que registra la app al iniciar y guarda el token
export async function registrarApp(nombre = "Electron App") {
 
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-key": `AppKey ${APP_KEY_INICIAL}`
      },
      body: JSON.stringify({ nombre })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      guardarToken(data.token);
      guardarIdApp(data.app_id);
      return { success: true, token: data.token, app_id: data.app_id }; // Retorna el token y el ID de la app
    } else {
      return { success: false, message: data.error || "Registro fallido" };
    }
  } catch (err) {
    console.error("Error en registro de app:", err);
    return { success: false, message: "Error de red o intento verifique su conexion a Internet" };
  }
}

