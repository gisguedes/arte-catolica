import type { Handler } from '@netlify/functions';
import { getLocale, getSql, jsonResponse } from './_db';

const toRows = (result: any) => (Array.isArray(result) ? result : result?.rows ?? []);

const normalizeLocale = (locale?: string | null) =>
  (locale || 'es').trim().slice(0, 2) || 'es';

const buildVendorSelect = () => `
  SELECT
    v.id,
    v.name,
    v.surname,
    v.email,
    v.phone,
    v.nif,
    v.bio,
    v.image,
    v.website,
    v.city,
    v.country,
    v.postal_code,
    v.opening_date,
    v.is_active,
    v.created_at,
    v.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', at.id,
            'slug', at.slug,
            'name', at.name
          )
        )
        FROM artist_type_vendor atv
        JOIN artist_types at ON at.id = atv.artist_type_id
        WHERE atv.vendor_id = v.id
      ),
      '[]'::jsonb
    ) AS artist_types
  FROM vendors v
`;

const buildProductSelect = () => `
  SELECT
    p.id,
    p.vendor_id,
    p.price,
    p.stock,
    p.availability,
    p.height_cm,
    p.width_cm,
    p.depth_cm,
    p.sku,
    p.is_active,
    p.is_featured,
    p.created_at,
    p.updated_at,
    COALESCE(pt.name, '') AS name,
    COALESCE(pt.description, '') AS description,
    (
      SELECT image_path
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.is_primary DESC, pi."order" ASC NULLS LAST
      LIMIT 1
    ) AS image,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', c.id,
          'slug', c.slug,
          'name', COALESCE(ct.name, ''),
          'description', COALESCE(ct.description, ''),
          'is_active', c.is_active,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        ))
        FROM category_product cp
        JOIN categories c ON c.id = cp.category_id
        LEFT JOIN category_translations ct
          ON ct.category_id = c.id AND ct.locale = $1
        WHERE cp.product_id = p.id
      ),
      '[]'::jsonb
    ) AS categories,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', m.id,
          'slug', m.slug,
          'name', COALESCE(mt.name, ''),
          'is_active', m.is_active
        ))
        FROM material_product mp
        JOIN materials m ON m.id = mp.material_id
        LEFT JOIN material_translations mt
          ON mt.material_id = m.id AND mt.locale = $1
        WHERE mp.product_id = p.id
      ),
      '[]'::jsonb
    ) AS materials,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', co.id,
          'name', co.name,
          'hex', co.hex,
          'is_active', co.is_active
        ))
        FROM color_product cp
        JOIN colors co ON co.id = cp.color_id
        WHERE cp.product_id = p.id
      ),
      '[]'::jsonb
    ) AS colors,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pi.id,
            'image_path', pi.image_path,
            'order', pi."order",
            'is_primary', pi.is_primary
          )
          ORDER BY pi."order" ASC NULLS LAST
        )
        FROM product_images pi
        WHERE pi.product_id = p.id
      ),
      '[]'::jsonb
    ) AS images
  FROM products p
  LEFT JOIN product_translations pt
    ON pt.product_id = p.id AND pt.locale = $1
`;

const fetchVendors = async (includeInactive = false) => {
  const sql = getSql();
  const query = `${buildVendorSelect()} ${
    includeInactive ? '' : 'WHERE v.is_active = true'
  } ORDER BY v.created_at DESC`;
  return toRows(await sql(query));
};

const fetchVendorById = async (id: string) => {
  const sql = getSql();
  const query = `${buildVendorSelect()} WHERE v.id = $1 LIMIT 1`;
  const rows = toRows(await sql(query, [id]));
  return rows[0] || null;
};

const fetchVendorProducts = async (locale: string, vendorId: string) => {
  const sql = getSql();
  const query = `${buildProductSelect()} WHERE p.vendor_id = $2 AND p.is_active = true ORDER BY p.created_at DESC`;
  return toRows(await sql(query, [locale, vendorId]));
};

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const locale = normalizeLocale(getLocale(event.headers));
  const path = event.path || '';
  const vendorMatch = path.match(/vendors\/([^/]+)(?:\/products)?$/);
  const vendorId = vendorMatch?.[1] || null;
  const isProductsRoute = path.includes('/products');

  try {
    if (method === 'GET' && !vendorId) {
      const vendors = await fetchVendors(
        event.queryStringParameters?.include_inactive === 'true'
      );
      return jsonResponse(200, { data: vendors });
    }

    if (method === 'GET' && vendorId && !isProductsRoute) {
      const vendor = await fetchVendorById(vendorId);
      if (!vendor) {
        return jsonResponse(404, { message: 'Artista no encontrado' });
      }
      return jsonResponse(200, { data: vendor });
    }

    if (method === 'GET' && vendorId && isProductsRoute) {
      const products = await fetchVendorProducts(locale, vendorId);
      return jsonResponse(200, { data: products });
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Vendors function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

