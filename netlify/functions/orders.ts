import type { Handler } from '@netlify/functions';
import { randomUUID } from 'crypto';
import { getSql, jsonResponse } from './_db';

type OrderItemPayload = {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
};

type AddressPayload = {
  user_id: string;
  type?: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country?: string;
  phone?: string | null;
  is_default?: boolean;
};

type PaymentMethodPayload = {
  user_id: string;
  type?: string;
  provider?: string | null;
  last_four?: string | null;
  cardholder_name?: string | null;
  expires_at?: string | null;
  is_default?: boolean;
  metadata?: Record<string, unknown> | null;
};

type OrderPayload = {
  user_id: string;
  address_id?: string;
  payment_method_id?: string;
  address?: AddressPayload;
  payment_method?: PaymentMethodPayload;
  order_number?: string;
  status?: string;
  subtotal?: number;
  tax?: number;
  shipping_cost?: number;
  total?: number;
  notes?: string | null;
  items?: OrderItemPayload[];
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

const buildOrderSelect = () => `
  SELECT
    o.id,
    o.user_id,
    o.address_id,
    o.payment_method_id,
    o.order_number,
    o.status,
    o.subtotal,
    o.tax,
    o.shipping_cost,
    o.total,
    o.notes,
    o.created_at,
    o.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
        )
        FROM order_items oi
        WHERE oi.order_id = o.id
      ),
      '[]'::jsonb
    ) AS items,
    (
      SELECT jsonb_build_object(
        'id', a.id,
        'user_id', a.user_id,
        'type', a.type,
        'first_name', a.first_name,
        'last_name', a.last_name,
        'address_line_1', a.address_line_1,
        'address_line_2', a.address_line_2,
        'city', a.city,
        'state', a.state,
        'postal_code', a.postal_code,
        'country', a.country,
        'phone', a.phone,
        'is_default', a.is_default,
        'created_at', a.created_at,
        'updated_at', a.updated_at
      )
      FROM addresses a
      WHERE a.id = o.address_id
    ) AS address,
    (
      SELECT jsonb_build_object(
        'id', pm.id,
        'user_id', pm.user_id,
        'type', pm.type,
        'provider', pm.provider,
        'last_four', pm.last_four,
        'cardholder_name', pm.cardholder_name,
        'expires_at', pm.expires_at,
        'is_default', pm.is_default,
        'metadata', pm.metadata,
        'created_at', pm.created_at,
        'updated_at', pm.updated_at
      )
      FROM payment_methods pm
      WHERE pm.id = o.payment_method_id
    ) AS payment_method
  FROM orders o
`;

const generateOrderNumber = () =>
  `ORD-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.floor(
    Math.random() * 9000 + 1000
  )}`;

const createAddress = async (payload: AddressPayload) => {
  const sql = getSql();
  const addressId = randomUUID();
  await sql(
    `INSERT INTO addresses (
      id,
      user_id,
      type,
      first_name,
      last_name,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      phone,
      is_default,
      created_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
    [
      addressId,
      payload.user_id,
      payload.type ?? 'shipping',
      payload.first_name,
      payload.last_name,
      payload.address_line_1,
      payload.address_line_2 ?? null,
      payload.city,
      payload.state ?? null,
      payload.postal_code,
      payload.country ?? 'ES',
      payload.phone ?? null,
      payload.is_default ?? false,
    ]
  );
  return addressId;
};

const createPaymentMethod = async (payload: PaymentMethodPayload) => {
  const sql = getSql();
  const paymentId = randomUUID();
  await sql(
    `INSERT INTO payment_methods (
      id,
      user_id,
      type,
      provider,
      last_four,
      cardholder_name,
      expires_at,
      is_default,
      metadata,
      created_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
    [
      paymentId,
      payload.user_id,
      payload.type ?? 'card',
      payload.provider ?? null,
      payload.last_four ?? null,
      payload.cardholder_name ?? null,
      payload.expires_at ?? null,
      payload.is_default ?? false,
      payload.metadata ?? null,
    ]
  );
  return paymentId;
};

const fetchOrders = async (userId?: string) => {
  const sql = getSql();
  const query = `${buildOrderSelect()} ${
    userId ? 'WHERE o.user_id = $1' : ''
  } ORDER BY o.created_at DESC`;
  const params = userId ? [userId] : [];
  return toRows(await sql(query, params));
};

const fetchOrderById = async (id: string) => {
  const sql = getSql();
  const query = `${buildOrderSelect()} WHERE o.id = $1 LIMIT 1`;
  const rows = toRows(await sql(query, [id]));
  return rows[0] || null;
};

const createOrderItems = async (orderId: string, items: OrderItemPayload[]) => {
  if (!items.length) return;
  const sql = getSql();
  for (const item of items) {
    const total = item.total_price ?? item.unit_price * item.quantity;
    await sql(
      `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
      [randomUUID(), orderId, item.product_id, item.quantity, item.unit_price, total]
    );
  }
};

const createOrder = async (payload: OrderPayload) => {
  const sql = getSql();
  let addressId = payload.address_id;
  let paymentId = payload.payment_method_id;

  if (!addressId && payload.address) {
    addressId = await createAddress(payload.address);
  }

  if (!paymentId && payload.payment_method) {
    paymentId = await createPaymentMethod(payload.payment_method);
  }

  if (!addressId || !paymentId) {
    throw new Error('address_id y payment_method_id son requeridos');
  }

  const items = payload.items ?? [];
  const subtotal =
    payload.subtotal ??
    items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const tax = payload.tax ?? 0;
  const shippingCost = payload.shipping_cost ?? 0;
  const total = payload.total ?? subtotal + tax + shippingCost;

  const orderId = randomUUID();
  await sql(
    `INSERT INTO orders (
      id,
      user_id,
      address_id,
      payment_method_id,
      order_number,
      status,
      subtotal,
      tax,
      shipping_cost,
      total,
      notes,
      created_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())`,
    [
      orderId,
      payload.user_id,
      addressId,
      paymentId,
      payload.order_number ?? generateOrderNumber(),
      payload.status ?? 'pending',
      subtotal,
      tax,
      shippingCost,
      total,
      payload.notes ?? null,
    ]
  );

  await createOrderItems(orderId, items);
  return fetchOrderById(orderId);
};

const updateOrder = async (id: string, payload: OrderPayload) => {
  const sql = getSql();
  const updates: string[] = [];
  const values: any[] = [id];

  const setField = (field: string, value: any) => {
    values.push(value);
    updates.push(`${field} = $${values.length}`);
  };

  if (payload.status !== undefined) setField('status', payload.status);
  if (payload.subtotal !== undefined) setField('subtotal', payload.subtotal);
  if (payload.tax !== undefined) setField('tax', payload.tax);
  if (payload.shipping_cost !== undefined) setField('shipping_cost', payload.shipping_cost);
  if (payload.total !== undefined) setField('total', payload.total);
  if (payload.notes !== undefined) setField('notes', payload.notes);

  if (updates.length) {
    updates.push(`updated_at = NOW()`);
    await sql(`UPDATE orders SET ${updates.join(', ')} WHERE id = $1`, values);
  }

  if (payload.items) {
    await sql(`DELETE FROM order_items WHERE order_id = $1`, [id]);
    await createOrderItems(id, payload.items);
  }

  return fetchOrderById(id);
};

const deleteOrder = async (id: string) => {
  const sql = getSql();
  await sql(`DELETE FROM orders WHERE id = $1`, [id]);
};

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const path = event.path || '';
  const orderMatch = path.match(/orders\/([^/]+)$/);
  const orderId = orderMatch?.[1] || null;

  try {
    if (method === 'GET' && !orderId) {
      const orders = await fetchOrders(event.queryStringParameters?.user_id);
      return jsonResponse(200, { data: orders });
    }

    if (method === 'GET' && orderId) {
      const order = await fetchOrderById(orderId);
      if (!order) {
        return jsonResponse(404, { message: 'Orden no encontrada' });
      }
      return jsonResponse(200, { data: order });
    }

    if (method === 'POST' && !orderId) {
      const payload = readBody(event.body) as OrderPayload | null;
      if (!payload?.user_id) {
        return jsonResponse(400, { message: 'user_id es requerido' });
      }
      const order = await createOrder(payload);
      return jsonResponse(201, { data: order });
    }

    if ((method === 'PUT' || method === 'PATCH') && orderId) {
      const payload = readBody(event.body) as OrderPayload | null;
      if (!payload) {
        return jsonResponse(400, { message: 'Payload inválido' });
      }
      const order = await updateOrder(orderId, payload);
      if (!order) {
        return jsonResponse(404, { message: 'Orden no encontrada' });
      }
      return jsonResponse(200, { data: order });
    }

    if (method === 'DELETE' && orderId) {
      await deleteOrder(orderId);
      return jsonResponse(204, {});
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Orders function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

