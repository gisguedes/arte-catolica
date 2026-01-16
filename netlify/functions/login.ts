import type { Handler } from '@netlify/functions';
import { getSql, jsonResponse } from './_db';
import { comparePassword, signToken } from './_auth';

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
  if (!payload?.email || !payload?.password) {
    return jsonResponse(400, { message: 'Email y contraseña son requeridos' });
  }

  try {
    const sql = getSql();
    const rows = toRows(
      await sql(
        `SELECT id, name, surname, email, password, avatar, provider, created_at, updated_at
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [payload.email]
      )
    );
    const user = rows[0];

    if (!user || !user.password) {
      return jsonResponse(401, { message: 'Credenciales inválidas' });
    }

    const valid = await comparePassword(payload.password, user.password);
    if (!valid) {
      return jsonResponse(401, { message: 'Credenciales inválidas' });
    }

    const token = signToken({ sub: user.id, email: user.email });

    return jsonResponse(200, {
      token,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Login error', error);
    return jsonResponse(500, { message: 'Error interno del servidor' });
  }
};

