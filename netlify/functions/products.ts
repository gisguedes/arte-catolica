import type { Handler } from '@netlify/functions';
import { randomUUID } from 'crypto';
import { getLocale, getSql, jsonResponse } from './_db';

type ProductPayload = {
  vendor_id?: string | null;
  price?: number;
  stock?: number;
  availability?: string | null;
  height_cm?: number | null;
  width_cm?: number | null;
  depth_cm?: number | null;
  sku?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  name?: string;
  description?: string;
  locale?: string;
  translations?: Array<{ locale: string; name: string; description?: string | null }>;
  category_ids?: string[];
  material_ids?: string[];
  color_ids?: string[];
  images?: Array<{
    image_path: string;
    order?: number | null;
    is_primary?: boolean | null;
  }>;
};

const toRows = (result: any) => (Array.isArray(result) ? result : result?.rows ?? []);

const readBody = (body: string | null) => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const normalizeLocale = (locale?: string | null) =>
  (locale || 'es').trim().slice(0, 2) || 'es';

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
    CASE
      WHEN v.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', v.id,
        'name', v.name,
        'surname', v.surname,
        'email', v.email,
        'phone', v.phone,
        'nif', v.nif,
        'bio', v.bio,
        'image', v.image,
        'website', v.website,
        'city', v.city,
        'country', v.country,
        'postal_code', v.postal_code,
        'opening_date', v.opening_date,
        'artist_types', '[]'::jsonb,
        'is_active', v.is_active,
        'created_at', v.created_at,
        'updated_at', v.updated_at
      )
    END AS vendor,
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
  LEFT JOIN vendors v ON v.id = p.vendor_id
`;

const fetchProducts = async (
  locale: string,
  filters: { categorySlug?: string; categoryId?: string; includeInactive?: boolean }
) => {
  const sql = getSql();
  const params: any[] = [locale];
  let whereClause = filters.includeInactive ? '1=1' : 'p.is_active = true';

  if (filters.categorySlug) {
    params.push(filters.categorySlug);
    whereClause += ` AND EXISTS (
      SELECT 1
      FROM category_product cp
      JOIN categories c ON c.id = cp.category_id
      WHERE cp.product_id = p.id AND c.slug = $${params.length}
    )`;
  }

  if (filters.categoryId) {
    params.push(filters.categoryId);
    whereClause += ` AND EXISTS (
      SELECT 1
      FROM category_product cp
      JOIN categories c ON c.id = cp.category_id
      WHERE cp.product_id = p.id AND c.id = $${params.length}
    )`;
  }

  const query = `${buildProductSelect()} WHERE ${whereClause} ORDER BY p.created_at DESC`;
  return toRows(await sql(query, params));
};

const fetchProductById = async (locale: string, id: string) => {
  const sql = getSql();
  const query = `${buildProductSelect()} WHERE p.id = $2 LIMIT 1`;
  const rows = toRows(await sql(query, [locale, id]));
  return rows[0] || null;
};

const insertTranslations = async (
  productId: string,
  translations: Array<{ locale: string; name: string; description?: string | null }>
) => {
  if (!translations.length) return;
  const sql = getSql();
  for (const translation of translations) {
    await sql(
      `INSERT INTO product_translations (id, product_id, locale, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [
        randomUUID(),
        productId,
        normalizeLocale(translation.locale),
        translation.name,
        translation.description ?? null,
      ]
    );
  }
};

const syncPivot = async (table: string, column: string, productId: string, ids?: string[]) => {
  if (!ids) return;
  const sql = getSql();
  await sql(`DELETE FROM ${table} WHERE product_id = $1`, [productId]);
  for (const id of ids) {
    await sql(
      `INSERT INTO ${table} (${column}, product_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())`,
      [id, productId]
    );
  }
};

const syncImages = async (productId: string, images?: ProductPayload['images']) => {
  if (!images) return;
  const sql = getSql();
  await sql(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
  for (const image of images) {
    await sql(
      `INSERT INTO product_images (id, product_id, image_path, "order", is_primary, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [
        randomUUID(),
        productId,
        image.image_path,
        image.order ?? 0,
        image.is_primary ?? false,
      ]
    );
  }
};

const createProduct = async (payload: ProductPayload, locale: string) => {
  const sql = getSql();
  const productId = randomUUID();
  const now = new Date().toISOString();

  await sql(
    `INSERT INTO products (
      id,
      vendor_id,
      price,
      stock,
      availability,
      height_cm,
      width_cm,
      depth_cm,
      sku,
      is_active,
      is_featured,
      created_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      productId,
      payload.vendor_id ?? null,
      payload.price ?? 0,
      payload.stock ?? 0,
      payload.availability ?? 'in_stock',
      payload.height_cm ?? null,
      payload.width_cm ?? null,
      payload.depth_cm ?? null,
      payload.sku ?? null,
      payload.is_active ?? true,
      payload.is_featured ?? false,
      now,
      now,
    ]
  );

  const translations =
    payload.translations?.length
      ? payload.translations
      : payload.name
        ? [
            {
              locale,
              name: payload.name,
              description: payload.description ?? null,
            },
          ]
        : [];

  await insertTranslations(productId, translations);
  await syncPivot('category_product', 'category_id', productId, payload.category_ids);
  await syncPivot('material_product', 'material_id', productId, payload.material_ids);
  await syncPivot('color_product', 'color_id', productId, payload.color_ids);
  await syncImages(productId, payload.images);

  return fetchProductById(locale, productId);
};

const updateProduct = async (id: string, payload: ProductPayload, locale: string) => {
  const sql = getSql();
  const updates: string[] = [];
  const values: any[] = [id];

  const setField = (field: string, value: any) => {
    values.push(value);
    updates.push(`${field} = $${values.length}`);
  };

  if (payload.vendor_id !== undefined) setField('vendor_id', payload.vendor_id);
  if (payload.price !== undefined) setField('price', payload.price);
  if (payload.stock !== undefined) setField('stock', payload.stock);
  if (payload.availability !== undefined) setField('availability', payload.availability);
  if (payload.height_cm !== undefined) setField('height_cm', payload.height_cm);
  if (payload.width_cm !== undefined) setField('width_cm', payload.width_cm);
  if (payload.depth_cm !== undefined) setField('depth_cm', payload.depth_cm);
  if (payload.sku !== undefined) setField('sku', payload.sku);
  if (payload.is_active !== undefined) setField('is_active', payload.is_active);
  if (payload.is_featured !== undefined) setField('is_featured', payload.is_featured);

  if (updates.length) {
    updates.push(`updated_at = NOW()`);
    await sql(`UPDATE products SET ${updates.join(', ')} WHERE id = $1`, values);
  }

  if (payload.translations || payload.name || payload.description) {
    await sql(`DELETE FROM product_translations WHERE product_id = $1`, [id]);
    const translations =
      payload.translations?.length
        ? payload.translations
        : payload.name
          ? [
              {
                locale,
                name: payload.name,
                description: payload.description ?? null,
              },
            ]
          : [];
    await insertTranslations(id, translations);
  }

  await syncPivot('category_product', 'category_id', id, payload.category_ids);
  await syncPivot('material_product', 'material_id', id, payload.material_ids);
  await syncPivot('color_product', 'color_id', id, payload.color_ids);
  await syncImages(id, payload.images);

  return fetchProductById(locale, id);
};

const deleteProduct = async (id: string) => {
  const sql = getSql();
  await sql(`DELETE FROM products WHERE id = $1`, [id]);
};

export const handler: Handler = async (event) => {
  const locale = normalizeLocale(getLocale(event.headers));
  const method = (event.httpMethod || 'GET').toUpperCase();
  const path = event.path || '';
  const idMatch = path.match(/products\/([^/]+)$/);
  const productId = idMatch?.[1] || null;

  try {
    if (method === 'GET' && !productId) {
      const products = await fetchProducts(locale, {
        categorySlug: event.queryStringParameters?.category_slug,
        categoryId: event.queryStringParameters?.category_id,
        includeInactive: event.queryStringParameters?.include_inactive === 'true',
      });
      return jsonResponse(200, { data: products });
    }

    if (method === 'GET' && productId) {
      const product = await fetchProductById(locale, productId);
      if (!product) {
        return jsonResponse(404, { message: 'Producto no encontrado' });
      }
      return jsonResponse(200, { data: product });
    }

    if (method === 'POST' && !productId) {
      const payload = readBody(event.body) as ProductPayload | null;
      if (!payload) {
        return jsonResponse(400, { message: 'Payload inválido' });
      }
      const product = await createProduct(payload, locale);
      return jsonResponse(201, { data: product });
    }

    if ((method === 'PUT' || method === 'PATCH') && productId) {
      const payload = readBody(event.body) as ProductPayload | null;
      if (!payload) {
        return jsonResponse(400, { message: 'Payload inválido' });
      }
      const product = await updateProduct(productId, payload, locale);
      if (!product) {
        return jsonResponse(404, { message: 'Producto no encontrado' });
      }
      return jsonResponse(200, { data: product });
    }

    if (method === 'DELETE' && productId) {
      await deleteProduct(productId);
      return jsonResponse(204, {});
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Products function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

