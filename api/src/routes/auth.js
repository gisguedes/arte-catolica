const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const verifyAppleToken = require('verify-apple-id-token').default;
const { query } = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'insecure-secret';

function validatePassword(password) {
  const p = String(password);
  if (p.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Z]/.test(p)) return 'La contraseña debe incluir una letra mayúscula';
  if (!/[a-z]/.test(p)) return 'La contraseña debe incluir una letra minúscula';
  if (!/[0-9]/.test(p)) return 'La contraseña debe incluir un número';
  if (!/[^A-Za-z0-9]/.test(p)) return 'La contraseña debe incluir un carácter especial';
  return null;
}
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;

router.post('/register', async (req, res) => {
  const { name, surname, email, password, provider, provider_id, avatar } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
  }
  const pwErr = validatePassword(password);
  if (pwErr) {
    return res.status(400).json({ message: pwErr });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (id, name, surname, email, password, provider, provider_id, avatar, created_at, updated_at)
       VALUES (uuid_generate_v4(), $1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
       RETURNING id, name, surname, email, avatar, provider, created_at, updated_at`,
      [
        name,
        surname ?? null,
        email,
        passwordHash,
        provider ?? 'email',
        provider_id ?? null,
        avatar ?? null,
      ]
    );

    const user = result.rows[0];
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Register error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  try {
    const result = await query(
      `SELECT id, name, surname, email, password, avatar, provider, created_at, updated_at
       FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    const user = result.rows[0];
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
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
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

function buildUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function findOrCreateOAuthUser({ email, name, surname, provider, providerId, avatar }) {
  const existingByProvider = providerId
    ? await query(
        'SELECT id, name, surname, email, avatar, provider FROM users WHERE provider = $1 AND provider_id = $2 LIMIT 1',
        [provider, providerId]
      )
    : { rows: [] };

  if (existingByProvider.rows.length) {
    return existingByProvider.rows[0];
  }

  const existingByEmail = await query('SELECT id, name, surname, email, avatar, provider FROM users WHERE email = $1 LIMIT 1', [
    email,
  ]);
  if (existingByEmail.rows.length) {
    const u = existingByEmail.rows[0];
    await query(
      'UPDATE users SET provider = $1, provider_id = $2, avatar = COALESCE($3, avatar), updated_at = NOW() WHERE id = $4',
      [provider, providerId, avatar, u.id]
    );
    return { ...u, provider, provider_id: providerId, avatar: avatar ?? u.avatar };
  }

  const insert = await query(
    `INSERT INTO users (id, name, surname, email, password, provider, provider_id, avatar, created_at, updated_at)
     VALUES (uuid_generate_v4(), $1, $2, $3, NULL, $4, $5, $6, NOW(), NOW())
     RETURNING id, name, surname, email, avatar, provider, created_at, updated_at`,
    [name ?? email?.split('@')[0] ?? 'Usuario', surname ?? '', email, provider, providerId ?? null, avatar ?? null]
  );
  return insert.rows[0];
}

router.post('/google', async (req, res) => {
  const { id_token: idToken, credential } = req.body || {};
  const token = idToken || credential;
  if (!token) {
    return res.status(400).json({ message: 'id_token o credential es requerido' });
  }
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ message: 'Configuración de Google incompleta' });
  }

  try {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const providerId = payload.sub;
    const name = payload.given_name;
    const surname = payload.family_name || '';
    const avatar = payload.picture;

    const user = await findOrCreateOAuthUser({
      email,
      name,
      surname,
      provider: 'google',
      providerId,
      avatar,
    });

    const jwtToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: jwtToken, user: buildUserResponse(user) });
  } catch (error) {
    console.error('Google auth error', error);
    res.status(401).json({ message: 'Token de Google inválido' });
  }
});

router.post('/apple', async (req, res) => {
  const { id_token: idToken } = req.body || {};
  if (!idToken) {
    return res.status(400).json({ message: 'id_token es requerido' });
  }
  if (!APPLE_CLIENT_ID) {
    return res.status(500).json({ message: 'Configuración de Apple incompleta' });
  }

  try {
    const payload = await verifyAppleToken({
      idToken,
      clientId: APPLE_CLIENT_ID,
    });

    const email = payload.email || `${payload.sub}@privaterelay.appleid.com`;
    const providerId = payload.sub;
    const name = payload.email ? (payload.name?.givenName || email?.split('@')[0] || 'Usuario') : null;
    const surname = payload.name?.familyName || '';

    const user = await findOrCreateOAuthUser({
      email,
      name,
      surname,
      provider: 'apple',
      providerId,
      avatar: null,
    });

    const jwtToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: jwtToken, user: buildUserResponse(user) });
  } catch (error) {
    console.error('Apple auth error', error);
    res.status(401).json({ message: 'Token de Apple inválido' });
  }
});

module.exports = router;






