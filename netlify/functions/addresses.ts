import type { Handler } from '@netlify/functions';
import { randomUUID } from 'crypto';
import { getSql, jsonResponse } from './_db';

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

const toRows = (result: any) => (Array.isArray(result) ? result : result?.rows ?? []);

const readBody = (body: string | null) => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const buildAddressSelect = () => `
  SELECT
    a.id,
    a.user_id,
    a.type,
    a.first_name,
    a.last_name,
    a.address_line_1,
    a.address_line_2,
    a.city,
    a.state,
    a.postal_code,
    a.country,
    a.phone,
    a.is_default,
    a.created_at,
    a.updated_at
  FROM addresses a
`;

const fetchAddresses = async (userId?: string) => {
  const sql = getSql();
  const query = `${buildAddressSelect()} ${userId ? 'WHERE a.user_id = $1' : ''} ORDER BY a.created_at DESC`;
  const params = userId ? [userId] : [];
  return toRows(await sql(query, params));
};

const fetchAddressById = async (id: string) => {
  const sql = getSql();
  const query = `${buildAddressSelect()} WHERE a.id = $1 LIMIT 1`;
  const rows = toRows(await sql(query, [id]));
  return rows[0] || null;
};

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
  return fetchAddressById(addressId);
};

const updateAddress = async (id: string, payload: Partial<AddressPayload>) => {
  const sql = getSql();
  const updates: string[] = [];
  const values: any[] = [id];

  const setField = (field: string, value: any) => {
    values.push(value);
    updates.push(`${field} = $${values.length}`);
  };

  if (payload.type !== undefined) setField('type', payload.type);
  if (payload.first_name !== undefined) setField('first_name', payload.first_name);
  if (payload.last_name !== undefined) setField('last_name', payload.last_name);
  if (payload.address_line_1 !== undefined) setField('address_line_1', payload.address_line_1);
  if (payload.address_line_2 !== undefined) setField('address_line_2', payload.address_line_2);
  if (payload.city !== undefined) setField('city', payload.city);
  if (payload.state !== undefined) setField('state', payload.state);
  if (payload.postal_code !== undefined) setField('postal_code', payload.postal_code);
  if (payload.country !== undefined) setField('country', payload.country);
  if (payload.phone !== undefined) setField('phone', payload.phone);
  if (payload.is_default !== undefined) setField('is_default', payload.is_default);

  if (updates.length) {
    updates.push(`updated_at = NOW()`);
    await sql(`UPDATE addresses SET ${updates.join(', ')} WHERE id = $1`, values);
  }

  return fetchAddressById(id);
};

const deleteAddress = async (id: string) => {
  const sql = getSql();
  await sql(`DELETE FROM addresses WHERE id = $1`, [id]);
};

export const handler: Handler = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const path = event.path || '';
  const addressMatch = path.match(/addresses\/([^/]+)$/);
  const addressId = addressMatch?.[1] || null;

  try {
    if (method === 'GET' && !addressId) {
      const addresses = await fetchAddresses(event.queryStringParameters?.user_id);
      return jsonResponse(200, { data: addresses });
    }

    if (method === 'GET' && addressId) {
      const address = await fetchAddressById(addressId);
      if (!address) {
        return jsonResponse(404, { message: 'Dirección no encontrada' });
      }
      return jsonResponse(200, { data: address });
    }

    if (method === 'POST' && !addressId) {
      const payload = readBody(event.body) as AddressPayload | null;
      if (!payload?.user_id) {
        return jsonResponse(400, { message: 'user_id es requerido' });
      }
      const address = await createAddress(payload);
      return jsonResponse(201, { data: address });
    }

    if ((method === 'PUT' || method === 'PATCH') && addressId) {
      const payload = readBody(event.body) as Partial<AddressPayload> | null;
      if (!payload) {
        return jsonResponse(400, { message: 'Payload inválido' });
      }
      const address = await updateAddress(addressId, payload);
      if (!address) {
        return jsonResponse(404, { message: 'Dirección no encontrada' });
      }
      return jsonResponse(200, { data: address });
    }

    if (method === 'DELETE' && addressId) {
      await deleteAddress(addressId);
      return jsonResponse(204, {});
    }

    return jsonResponse(405, { message: 'Método no permitido' });
  } catch (error) {
    console.error('Addresses function error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

