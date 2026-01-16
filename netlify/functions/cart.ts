import type { Handler } from '@netlify/functions';
import { getLocale, getSql, jsonResponse } from './_db';

type CartItemPayload = {
  user_id: string;
  product_id: string;
  quantity: number;
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

const buildCartSelect = () => `
  SELECT
    ci.user_id,
    ci.product_id,
    ci.quantity,
    ci.created_at,
    ci.updated_at,
    jsonb_build_object(
      'id', p.id,
      'vendor_id', p.vendor_id,
      'price', p.price,
      'stock', p.stock,
      'availability', p.availability,
      'height_cm', p.height_cm,
      'width_cm', p.width_cm,
      'depth_cm', p.depth_cm,
      'sku', p.sku,
      'is_active', p.is_active,
      'is_featured', p.is_featured,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'name', COALESCE(pt.name, ''),
      'description', COALESCE(pt.description, ''),
      'image', (
        SELECT image_path
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.is_primary DESC, pi."order" ASC NULLS LAST
        LIMIT 1
      ),
      'vendor', CASE
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
      END
    ) AS product
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  LEFT JOIN product_translations pt
    ON pt.product_id = p.id AND pt.locale = $2
  LEFT JOIN vendors v ON v.id = p.vendor_id
`;

const fetchCart = async (userId: string, locale: string) => {
  const sql = getSql();
  const query = `${buildCartSelect()} WHERE ci.user_id = $1 ORDER BY ci.updated_at DESC`;
  return toRows(await sql(query, [userId, locale]));
};

const upsertCartItem = async (payload: CartItemPayload) => {
  const sql = getSql();
  await sql(
    `INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at)
     VALUES ($1,$2,$3,NOW(),NOW())
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()`,
    [payload.user_id, payload.product_id, payload.quantity]
  );
};

const removeCartItem = async (userId: string, productId: string) => {
  const sql = getSql();
  await sql(`DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`, [
    userId,
    productId,
  ]);
};

const clearCart = async (userId: string) => {
  const sql = getSql();
  await sql(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
};

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const path = event.path || '';
  const locale = (getLocale(event.headers) || 'es').slice(0, 2);

  try {
    if (method === 'GET') {
      const userId = event.queryStringParameters?.user_id;
      if (!userId) {
        return jsonResponse(400, { message: 'user_id es requerido' });
      }
      const items = await fetchCart(userId, locale);
      return jsonResponse(200, { data: items });
    }

    if (method === 'POST') {
      const payload = readBody(event.body) as CartItemPayload | null;
      if (!payload?.user_id || !payload?.product_id) {
        return jsonResponse(400, { message: 'user_id y product_id son requeridos' });
      }
      if (!payload.quantity || payload.quantity <= 0) {
        return jsonResponse(400, { message: 'quantity debe ser mayor a 0' });
      }
      await upsertCartItem(payload);
      const items = await fetchCart(payload.user_id, locale);
      return jsonResponse(200, { data: items });
    }

    if (method === 'DELETE' && path.endsWith('/cart/clear')) {
      const userId = event.queryStringParameters?.user_id;
      if (!userId) {
        return jsonResponse(400, { message: 'user_id es requerido' });
      }
      await clearCart(userId);
      return jsonResponse(204, {});
    }

    if (method === 'DELETE') {
      const userId = event.queryStringParameters?.user_id;
      const productId = event.queryStringParameters?.product_id;
      if (!userId || !productId) {
        return jsonResponse(400, { message: 'user_id y product_id son requeridos' });
      }
      await removeCartItem(userId, productId);
      const items = await fetchCart(userId, locale);
      return jsonResponse(200, { data: items });
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Cart function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

