import type { Handler } from '@netlify/functions';
import { getSql, jsonResponse } from './_db';

const toRows = (result: any) => (Array.isArray(result) ? result : result?.rows ?? []);

const buildArtistTypeSelect = () => `
  SELECT
    at.id,
    at.slug,
    at.name,
    at.created_at,
    at.updated_at
  FROM artist_types at
`;

const fetchArtistTypes = async () => {
  const sql = getSql();
  const query = `${buildArtistTypeSelect()} ORDER BY at.name ASC`;
  return toRows(await sql(query));
};

const fetchArtistTypeById = async (id: string) => {
  const sql = getSql();
  const query = `${buildArtistTypeSelect()} WHERE at.id = $1 LIMIT 1`;
  const rows = toRows(await sql(query, [id]));
  return rows[0] || null;
};

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const path = event.path || '';
  const typeMatch = path.match(/artist-types\/([^/]+)$/);
  const typeId = typeMatch?.[1] || null;

  try {
    if (method === 'GET' && !typeId) {
      const types = await fetchArtistTypes();
      return jsonResponse(200, { data: types });
    }

    if (method === 'GET' && typeId) {
      const type = await fetchArtistTypeById(typeId);
      if (!type) {
        return jsonResponse(404, { message: 'Tipo de artista no encontrado' });
      }
      return jsonResponse(200, { data: type });
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Artist types function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

