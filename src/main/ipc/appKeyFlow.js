import { ensureFreshAppToken, recuperarORegistrarTokenApp } from '../../appConfig/authApp';

function hasAppKeyError(value) {
  if (!value) return false;

  const text = typeof value === 'string'
    ? value
    : (value.error || value.message || value.code || '');

  const normalized = String(text).toLowerCase();
  return normalized.includes('appkey') || normalized.includes('app key') || normalized.includes('midappkey');
}

function defaultFailure(message) {
  return { success: false, message };
}

export async function runWithAppKeyFlow(operation, options = {}) {
  const {
    appName = 'Electron App',
    refreshThresholdMinutes = 30,
    fallbackValue,
    retryOnAppKeyError = true
  } = options;

  const fail = (message) => (fallbackValue !== undefined ? fallbackValue : defaultFailure(message));

  const ensured = await ensureFreshAppToken(appName, refreshThresholdMinutes);
  if (!ensured?.success) {
    return fail(ensured?.message || 'No se pudo validar token de app');
  }

  try {
    const firstResult = await operation();

    if (retryOnAppKeyError && hasAppKeyError(firstResult)) {
      const recovered = await recuperarORegistrarTokenApp(appName);
      if (recovered?.success) {
        return await operation();
      }
      return firstResult;
    }

    return firstResult;
  } catch (error) {
    if (retryOnAppKeyError && hasAppKeyError(error?.message || error)) {
      const recovered = await recuperarORegistrarTokenApp(appName);
      if (recovered?.success) {
        try {
          return await operation();
        } catch (retryError) {
          return fail(retryError?.message || 'Error tras reintento con token de app');
        }
      }
    }

    return fail(error?.message || 'Error ejecutando operación');
  }
}
