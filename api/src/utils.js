const getLocale = (req) => {
  const acceptLanguage = req.headers['accept-language'];
  if (!acceptLanguage) {
    return 'es';
  }
  return acceptLanguage.split(',')[0].trim().slice(0, 2) || 'es';
};

module.exports = { getLocale };

