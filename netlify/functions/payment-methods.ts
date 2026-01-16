import type { Handler } from '@netlify/functions';
import { randomUUID } from 'crypto';
import { getSql, jsonResponse } from './_db';

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

const toRows = (result: any) => (Array.isArray(result) ? result : result?.rows ?? []);

const readBody = (body: string | null) => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const buildPaymentSelect = () => `
  SELECT
    pm.id,
    pm.user_id,
    pm.type,
    pm.provider,
    pm.last_four,
    pm.cardholder_name,
    pm.expires_at,
    pm.is_default,
    pm.metadata,
    pm.created_at,
    pm.updated_at
  FROM payment_methods pm
`;

const fetchPaymentMethods = async (userId?: string) => {
  const sql = getSql();
  const query = `${buildPaymentSelect()} ${
    userId ? 'WHERE pm.user_id = $1' : ''
  } ORDER BY pm.created_at DESC`;
  const params = userId ? [userId] : [];
  return toRows(await sql(query, params));
};

const fetchPaymentMethodById = async (id: string) => {
  const sql = getSql();
  const query = `${buildPaymentSelect()} WHERE pm.id = $1 LIMIT 1`;
  const rows = toRows(await sql(query, [id]));
  return rows[0] || null;
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
  return fetchPaymentMethodById(paymentId);
};

const updatePaymentMethod = async (id: string, payload: Partial<PaymentMethodPayload>) => {
  const sql = getSql();
  const updates: string[] = [];
  const values: any[] = [id];

  const setField = (field: string, value: any) => {
    values.push(value);
    updates.push(`${field} = $${values.length}`);
  };

  if (payload.type !== undefined) setField('type', payload.type);
  if (payload.provider !== undefined) setField('provider', payload.provider);
  if (payload.last_four !== undefined) setField('last_four', payload.last_four);
  if (payload.cardholder_name !== undefined) setField('cardholder_name', payload.cardholder_name);
  if (payload.expires_at !== undefined) setField('expires_at', payload.expires_at);
  if (payload.is_default !== undefined) setField('is_default', payload.is_default);
  if (payload.metadata !== undefined) setField('metadata', payload.metadata);

  if (updates.length) {
    updates.push(`updated_at = NOW()`);
    await sql(`UPDATE payment_methods SET ${updates.join(', ')} WHERE id = $1`, values);
  }

  return fetchPaymentMethodById(id);
};

const deletePaymentMethod = async (id: string) => {
  const sql = getSql();
  await sql(`DELETE FROM payment_methods WHERE id = $1`, [id]);
};

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const path = event.path || '';
  const paymentMatch = path.match(/payment-methods\/([^/]+)$/);
  const paymentId = paymentMatch?.[1] || null;

  try {
    if (method === 'GET' && !paymentId) {
      const payments = await fetchPaymentMethods(event.queryStringParameters?.user_id);
      return jsonResponse(200, { data: payments });
    }

    if (method === 'GET' && paymentId) {
      const payment = await fetchPaymentMethodById(paymentId);
      if (!payment) {
        return jsonResponse(404, { message: 'Método de pago no encontrado' });
      }
      return jsonResponse(200, { data: payment });
    }

    if (method === 'POST' && !paymentId) {
      const payload = readBody(event.body) as PaymentMethodPayload | null;
      if (!payload?.user_id) {
        return jsonResponse(400, { message: 'user_id es requerido' });
      }
      const payment = await createPaymentMethod(payload);
      return jsonResponse(201, { data: payment });
    }

    if ((method === 'PUT' || method === 'PATCH') && paymentId) {
      const payload = readBody(event.body) as Partial<PaymentMethodPayload> | null;
      if (!payload) {
        return jsonResponse(400, { message: 'Payload inválido' });
      }
      const payment = await updatePaymentMethod(paymentId, payload);
      if (!payment) {
        return jsonResponse(404, { message: 'Método de pago no encontrado' });
      }
      return jsonResponse(200, { data: payment });
    }

    if (method === 'DELETE' && paymentId) {
      await deletePaymentMethod(paymentId);
      return jsonResponse(204, {});
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Payment methods function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

