//file : authApp.js
import { app, safeStorage } from "electron"; // Asegúrate de tener instalado electron
import path from "path"; // Asegúrate de tener instalado el módulo 'path'
import fs from "fs"; // Asegúrate de tener instalado el módulo 'fs'
import fetch from "node-fetch"; // Asegúrate de tener instalado node-fetch

const tokenPath = path.join(app.getPath("userData"), "Token_Key_App.enc"); // Ruta para guardar el token encriptado
const appId = path.join(app.getPath("userData"), "Id_App.enc"); // Ruta para guardar el ID de la app
const APP_KEY_INICIAL = import.meta.env.VITE_APPKEY_INICIAL; // Clave inicial de la app
const API_BASE_URL = (import.meta.env.VITE_URL_BASE_API_AGUAVP || "http://localhost:3000").replace(/\/$/, "");
const API_URL_REGISTRAR = import.meta.env.VITE_API_REGISTRAR_APP || `${API_BASE_URL}/api/v2/app/registrarApp`; // URL de registro de la app
const API_URL_RECUPERAR = `${API_BASE_URL}/api/v2/app/recuperarToken`;

let ensureTokenInFlight = null;
let recoverOrRegisterInFlight = null;

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const payloadJson = Buffer.from(base64 + padding, 'base64').toString('utf8');
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

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

  if (fs.existsSync(appId)) {
    fs.unlinkSync(appId);
  }

  return null;
}

// 🔁 Función que registra la app al iniciar y guarda el token
export async function registrarApp(nombre = "Electron App") {
 
  try {
    const response = await fetch(API_URL_REGISTRAR, {
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

// Intenta recuperar (rotar) el token actual de la app sin re-registro.
export async function recuperarTokenApp(tokenActual = null) {
  const token = tokenActual || leerToken();

  if (!token) {
    return { success: false, message: "No hay token actual para recuperar" };
  }

  try {
    const response = await fetch(API_URL_RECUPERAR, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-key": `AppKey ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.nuevo_token) {
      guardarToken(data.nuevo_token);
      return { success: true, token: data.nuevo_token };
    }

    return { success: false, message: data.error || "No se pudo recuperar token" };
  } catch (err) {
    console.error("Error en recuperarTokenApp:", err);
    return { success: false, message: "Error de red al recuperar token" };
  }
}

// Garantiza que exista token de app válido en disco (si falta, intenta registrar la app).
export async function ensureAppToken(nombre = "Electron App") {
  const actual = leerToken();
  if (actual) {
    return { success: true, token: actual, source: "cache" };
  }

  if (ensureTokenInFlight) {
    return await ensureTokenInFlight;
  }

  ensureTokenInFlight = (async () => {
    const tokenRecienCreado = leerToken();
    if (tokenRecienCreado) {
      return { success: true, token: tokenRecienCreado, source: "cache" };
    }

    const registro = await registrarApp(nombre);
    if (registro?.success && registro.token) {
      return { success: true, token: registro.token, source: "register" };
    }

    return { success: false, message: registro?.message || "No se pudo asegurar token de app" };
  })();

  try {
    return await ensureTokenInFlight;
  } finally {
    ensureTokenInFlight = null;
  }
}

// Flujo resiliente: intenta recuperar token; si no se puede, re-registra la app.
export async function recuperarORegistrarTokenApp(nombre = "Electron App") {
  const actual = leerToken();
  if (actual) {
    return { success: true, token: actual, source: "cache" };
  }

  if (recoverOrRegisterInFlight) {
    return await recoverOrRegisterInFlight;
  }

  recoverOrRegisterInFlight = (async () => {
    const recuperado = await recuperarTokenApp();
    if (recuperado?.success && recuperado.token) {
      return { success: true, token: recuperado.token, source: "recover" };
    }

    const registro = await registrarApp(nombre);
    if (registro?.success && registro.token) {
      return { success: true, token: registro.token, source: "register" };
    }

    return { success: false, message: registro?.message || recuperado?.message || "No se pudo obtener token de app" };
  })();

  try {
    return await recoverOrRegisterInFlight;
  } finally {
    recoverOrRegisterInFlight = null;
  }
}

// Garantiza token existente y, si está próximo a expirar, lo rota de forma proactiva.
// Esto evita refresh periódico: solo se rota bajo demanda cuando conviene.
export async function ensureFreshAppToken(nombre = "Electron App", refreshThresholdMinutes = 30) {
  const ensured = await ensureAppToken(nombre);
  if (!ensured?.success || !ensured?.token) {
    return ensured;
  }

  const payload = decodeJwtPayload(ensured.token);
  if (!payload?.exp) {
    return await recuperarORegistrarTokenApp(nombre);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const remainingSeconds = payload.exp - nowSeconds;
  const thresholdSeconds = Math.max(1, refreshThresholdMinutes) * 60;

  if (remainingSeconds <= thresholdSeconds) {
    return await recuperarORegistrarTokenApp(nombre);
  }

  return ensured;
}

