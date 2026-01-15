import type { Handler } from '@netlify/functions';
import { getSql, jsonResponse } from './_db';

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
      'updated_at', p.updated_at
    ) AS product
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
`;

const fetchCart = async (userId: string) => {
  const sql = getSql();
  const query = `${buildCartSelect()} WHERE ci.user_id = $1 ORDER BY ci.updated_at DESC`;
  return toRows(await sql(query, [userId]));
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

  try {
    if (method === 'GET') {
      const userId = event.queryStringParameters?.user_id;
      if (!userId) {
        return jsonResponse(400, { message: 'user_id es requerido' });
      }
      const items = await fetchCart(userId);
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
      const items = await fetchCart(payload.user_id);
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
      const items = await fetchCart(userId);
      return jsonResponse(200, { data: items });
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Cart function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

