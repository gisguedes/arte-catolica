const getLocale = (req) => {
  const acceptLanguage = req.headers['accept-language'];
  if (!acceptLanguage) {
    return 'es';
  }
  return acceptLanguage.split(',')[0].trim().slice(0, 2) || 'es';
};

/**
 * Formato de error para respuestas API.
 * Incluye paso/ubicación para facilitar identificación.
 * En desarrollo (NODE_ENV !== 'production') incluye más detalle del error.
 */
function formatApiError(step, error, defaultMessage = 'Error interno del servidor') {
  const isDev = process.env.NODE_ENV !== 'production';
  const err = error && typeof error === 'object' ? error : {};
  const code = err.code;
  const detail = err.detail;
  const message = err.message;

  let userMessage = defaultMessage;
  if (step) {
    userMessage = `${defaultMessage} (paso: ${step})`;
  }
  if (isDev && (code || message || detail)) {
    const extra = [code, message, detail].filter(Boolean).join(' ');
    if (extra) userMessage += ` [${extra}]`;
  }
  return userMessage;
}

module.exports = { getLocale, formatApiError };






