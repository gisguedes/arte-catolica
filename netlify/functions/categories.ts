import type { Handler } from '@netlify/functions';
import { getLocale, getSql, jsonResponse } from './_db';

const toRows = (result: any) => (Array.isArray(result) ? result : result?.rows ?? []);

const normalizeLocale = (locale?: string | null) =>
  (locale || 'es').trim().slice(0, 2) || 'es';

const buildCategorySelect = () => `
  SELECT
    c.id,
    c.slug,
    c.is_active,
    c.created_at,
    c.updated_at,
    COALESCE(ct.name, '') AS name,
    COALESCE(ct.description, '') AS description
  FROM categories c
  LEFT JOIN category_translations ct
    ON ct.category_id = c.id AND ct.locale = $1
`;

const fetchCategories = async (locale: string, includeInactive = false) => {
  const sql = getSql();
  const query = `${buildCategorySelect()} ${
    includeInactive ? '' : 'WHERE c.is_active = true'
  } ORDER BY c.created_at DESC`;
  return toRows(await sql(query, [locale]));
};

const fetchCategoryById = async (locale: string, id: string) => {
  const sql = getSql();
  const query = `${buildCategorySelect()} WHERE c.id = $2 LIMIT 1`;
  const rows = toRows(await sql(query, [locale, id]));
  return rows[0] || null;
};

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const locale = normalizeLocale(getLocale(event.headers));
  const path = event.path || '';
  const categoryMatch = path.match(/categories\/([^/]+)$/);
  const categoryId = categoryMatch?.[1] || null;

  try {
    if (method === 'GET' && !categoryId) {
      const categories = await fetchCategories(
        locale,
        event.queryStringParameters?.include_inactive === 'true'
      );
      return jsonResponse(200, { data: categories });
    }

    if (method === 'GET' && categoryId) {
      const category = await fetchCategoryById(locale, categoryId);
      if (!category) {
        return jsonResponse(404, { message: 'Categoría no encontrada' });
      }
      return jsonResponse(200, { data: category });
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Categories function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

