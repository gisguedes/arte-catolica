import type { Handler } from '@netlify/functions';
import { getLocale, getSql, jsonResponse } from './_db';

const toRows = (result: any) => (Array.isArray(result) ? result : result?.rows ?? []);

const normalizeLocale = (locale?: string | null) =>
  (locale || 'es').trim().slice(0, 2) || 'es';

const buildMaterialSelect = () => `
  SELECT
    m.id,
    m.slug,
    m.is_active,
    m.created_at,
    m.updated_at,
    COALESCE(mt.name, '') AS name
  FROM materials m
  LEFT JOIN material_translations mt
    ON mt.material_id = m.id AND mt.locale = $1
`;

const fetchMaterials = async (locale: string, includeInactive = false) => {
  const sql = getSql();
  const query = `${buildMaterialSelect()} ${
    includeInactive ? '' : 'WHERE m.is_active = true'
  } ORDER BY m.created_at DESC`;
  return toRows(await sql(query, [locale]));
};

const fetchMaterialById = async (locale: string, id: string) => {
  const sql = getSql();
  const query = `${buildMaterialSelect()} WHERE m.id = $2 LIMIT 1`;
  const rows = toRows(await sql(query, [locale, id]));
  return rows[0] || null;
};

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const locale = normalizeLocale(getLocale(event.headers));
  const path = event.path || '';
  const materialMatch = path.match(/materials\/([^/]+)$/);
  const materialId = materialMatch?.[1] || null;

  try {
    if (method === 'GET' && !materialId) {
      const materials = await fetchMaterials(
        locale,
        event.queryStringParameters?.include_inactive === 'true'
      );
      return jsonResponse(200, { data: materials });
    }

    if (method === 'GET' && materialId) {
      const material = await fetchMaterialById(locale, materialId);
      if (!material) {
        return jsonResponse(404, { message: 'Material no encontrado' });
      }
      return jsonResponse(200, { data: material });
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Materials function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

