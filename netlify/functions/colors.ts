import type { Handler } from '@netlify/functions';
import { getSql, jsonResponse } from './_db';

const toRows = (result: any) => (Array.isArray(result) ? result : result?.rows ?? []);

const buildColorSelect = () => `
  SELECT
    c.id,
    c.name,
    c.hex,
    c.is_active,
    c.created_at,
    c.updated_at
  FROM colors c
`;

const fetchColors = async (includeInactive = false) => {
  const sql = getSql();
  const query = `${buildColorSelect()} ${
    includeInactive ? '' : 'WHERE c.is_active = true'
  } ORDER BY c.created_at DESC`;
  return toRows(await sql(query));
};

const fetchColorById = async (id: string) => {
  const sql = getSql();
  const query = `${buildColorSelect()} WHERE c.id = $1 LIMIT 1`;
  const rows = toRows(await sql(query, [id]));
  return rows[0] || null;
};

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const path = event.path || '';
  const colorMatch = path.match(/colors\/([^/]+)$/);
  const colorId = colorMatch?.[1] || null;

  try {
    if (method === 'GET' && !colorId) {
      const colors = await fetchColors(event.queryStringParameters?.include_inactive === 'true');
      return jsonResponse(200, { data: colors });
    }

    if (method === 'GET' && colorId) {
      const color = await fetchColorById(colorId);
      if (!color) {
        return jsonResponse(404, { message: 'Color no encontrado' });
      }
      return jsonResponse(200, { data: color });
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Colors function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

