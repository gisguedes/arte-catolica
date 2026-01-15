import { neon } from '@netlify/neon';

export type SqlClient = ReturnType<typeof neon>;

export const getSql = (): SqlClient => neon();

export const getLocale = (headers: Record<string, string | undefined>): string => {
  const acceptLanguage = headers['accept-language'] || headers['Accept-Language'];
  if (!acceptLanguage) {
    return 'es';
  }
  return acceptLanguage.split(',')[0].trim().slice(0, 2) || 'es';
};

export const jsonResponse = (statusCode: number, payload: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

