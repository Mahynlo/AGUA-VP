import { notifyTokenExpired } from './tokenExpiredHelper.js'

// Cliente HTTP común para la API local (@aguavp/api-server).
// Centraliza cabeceras, envío y manejo de respuestas no-OK. Cada módulo de src/fetch,
// src/register y src/update conserva sus propias validaciones, mensajes y valores de retorno.

// Cabeceras de una petición autenticada: AppKey de la aplicación + token de sesión del usuario
export const authHeaders = (token_app, token_session) => ({
  'x-app-key': `AppKey ${token_app}`,
  Authorization: `Bearer ${token_session}`,
  'Content-Type': 'application/json'
})

// Cabeceras de una petición solo con AppKey (registro/estado de la app, login, etc.)
export const appKeyHeaders = (token_app) => ({
  'Content-Type': 'application/json',
  'x-app-key': `AppKey ${token_app}`
})

// fetch con cabeceras autenticadas. `body` se serializa a JSON si se proporciona.
export function apiFetch(url, { method = 'GET', token_app, token_session, body, cache } = {}) {
  const options = { method, headers: authHeaders(token_app, token_session) }
  if (cache) options.cache = cache
  if (body !== undefined) options.body = JSON.stringify(body)
  return fetch(url, options)
}

const isSessionAuthError = (status) => status === 401 || status === 403

// Si la respuesta no es OK: lee el cuerpo, avisa al renderer de token expirado (401/403,
// salvo en reintentos) y lanza Error('Error HTTP <status>: <cuerpo>').
export async function assertOk(
  response,
  { isRetry = false, notifyOnAuthError = true, formatError } = {}
) {
  if (response.ok) return
  const errorBody = await response.text()

  if (notifyOnAuthError && isSessionAuthError(response.status) && !isRetry) {
    notifyTokenExpired()
  }

  throw new Error(
    formatError ? formatError(response.status, errorBody) : `Error HTTP ${response.status}: ${errorBody}`
  )
}

// GET autenticado que devuelve el JSON o lanza (ver assertOk)
export async function getJson(
  url,
  { token_app, token_session, cache, isRetry = false, notifyOnAuthError = true, formatError } = {}
) {
  const response = await apiFetch(url, { token_app, token_session, cache })
  await assertOk(response, { isRetry, notifyOnAuthError, formatError })
  return response.json()
}

// Agrega a un objeto URL los parámetros con valor (omite undefined, null y '')
export function appendDefinedParams(url, params) {
  if (!params) return url
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value)
    }
  })
  return url
}

export { notifyTokenExpired }
