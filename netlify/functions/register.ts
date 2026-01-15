import type { Handler } from '@netlify/functions';
import { randomUUID } from 'crypto';
import { getSql, jsonResponse } from './_db';
import { hashPassword, signToken } from './_auth';

const toRows = (result: any) => (Array.isArray(result) ? result : result?.rows ?? []);

const readBody = (body: string | null) => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

export const handler: Handler = async (event) => {
  if ((event.httpMethod || 'POST').toUpperCase() !== 'POST') {
    return jsonResponse(405, { message: 'Método no permitido' });
  }

  const payload = readBody(event.body);
  if (!payload?.email || !payload?.password || !payload?.name) {
    return jsonResponse(400, { message: 'Nombre, email y contraseña son requeridos' });
  }

  if (typeof payload.password === 'string' && payload.password.length < 6) {
    return jsonResponse(400, { message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const sql = getSql();
    const existing = toRows(
      await sql(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [payload.email])
    );
    if (existing.length) {
      return jsonResponse(409, { message: 'El email ya está registrado' });
    }

    const userId = randomUUID();
    const passwordHash = await hashPassword(payload.password);

    await sql(
      `INSERT INTO users (
        id,
        name,
        surname,
        email,
        password,
        provider,
        provider_id,
        avatar,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
      [
        userId,
        payload.name,
        payload.surname ?? null,
        payload.email,
        passwordHash,
        payload.provider ?? 'email',
        payload.provider_id ?? null,
        payload.avatar ?? null,
      ]
    );

    const token = signToken({ sub: userId, email: payload.email });

    return jsonResponse(201, {
      token,
      user: {
        id: userId,
        name: payload.name,
        surname: payload.surname ?? null,
        email: payload.email,
        avatar: payload.avatar ?? null,
        provider: payload.provider ?? 'email',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Register error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

