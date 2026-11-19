/**
 * Sesión del usuario en el proceso principal.
 *
 * Los tokens de sesión no se entregan al renderer ni se guardan en localStorage:
 *  - el access token (15 min) vive solo en memoria;
 *  - el refresh token (7 días) se guarda en userData cifrado con safeStorage (DPAPI en Windows),
 *    igual que api-secrets.enc, para que la sesión sobreviva a reiniciar la app.
 *
 * El renderer solo recibe los datos del usuario y un marcador sin valor (MARCADOR_SESION); las
 * cabeceras de cada petición se arman aquí con el token real (ver api-client/http.js).
 */

import { app, safeStorage } from 'electron'
import fs from 'fs'
import path from 'path'

const SESSION_FILE = 'session.enc'

/** Valor que el renderer usa en lugar del token: no autentica nada, solo indica "hay sesión". */
export const MARCADOR_SESION = 'sesion-en-proceso-principal'

let accessToken = null
let refreshToken = null
let cargado = false

const archivo = () => path.join(app.getPath('userData'), SESSION_FILE)

function cargar() {
  if (cargado) return
  cargado = true
  try {
    const file = archivo()
    if (!fs.existsSync(file) || !safeStorage.isEncryptionAvailable()) return
    const datos = JSON.parse(safeStorage.decryptString(fs.readFileSync(file)))
    if (typeof datos?.refreshToken === 'string' && datos.refreshToken) {
      refreshToken = datos.refreshToken
    }
  } catch (error) {
    // Archivo ilegible (otro usuario de Windows, archivo dañado): se empieza sin sesión
    console.warn('[Sesión] No se pudo leer la sesión guardada:', error.message)
    borrarArchivo()
  }
}

function borrarArchivo() {
  try {
    fs.rmSync(archivo(), { force: true })
  } catch (error) {
    console.warn('[Sesión] No se pudo borrar la sesión guardada:', error.message)
  }
}

function persistir() {
  try {
    // Sin cifrado disponible no se escribe nada: la sesión dura lo que dure la app abierta
    if (!refreshToken || !safeStorage.isEncryptionAvailable()) return borrarArchivo()
    fs.writeFileSync(archivo(), safeStorage.encryptString(JSON.stringify({ refreshToken })))
  } catch (error) {
    console.warn('[Sesión] No se pudo guardar la sesión:', error.message)
  }
}

const pareceJwt = (valor) => typeof valor === 'string' && valor.split('.').length === 3

/** Datos del access token sin verificar la firma (la verifica la API en cada petición). */
function leerPayload(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

export function getAccessToken() {
  return accessToken
}

export function getRefreshToken() {
  cargar()
  return refreshToken
}

/** Guarda los tokens de un inicio de sesión o de una renovación. */
export function guardarSesion({ accessToken: nuevoAccess, refreshToken: nuevoRefresh } = {}) {
  cargar()
  accessToken = pareceJwt(nuevoAccess) ? nuevoAccess : null
  if (typeof nuevoRefresh === 'string' && nuevoRefresh) refreshToken = nuevoRefresh
  persistir()
}

export function borrarSesion() {
  cargado = true
  accessToken = null
  refreshToken = null
  borrarArchivo()
}

/**
 * Usuario de la sesión actual y segundos que le quedan al access token.
 * @returns {{ user: object, segundosRestantes: number, segundosDesdeEmision: number } | null}
 */
export function sesionActual() {
  if (!accessToken) return null
  const payload = leerPayload(accessToken)
  if (!payload?.id || !payload?.correo || !payload?.rol) return null
  const ahora = Math.floor(Date.now() / 1000)
  return {
    user: {
      id: payload.id,
      nombre: payload.nombre,
      username: payload.username,
      correo: payload.correo,
      rol: payload.rol,
      fecha_creacion: payload.fecha_creacion
    },
    segundosRestantes: payload.exp ? payload.exp - ahora : 0,
    segundosDesdeEmision: payload.iat ? ahora - payload.iat : Infinity
  }
}
