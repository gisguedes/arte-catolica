const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'insecure-secret';

router.post('/register', async (req, res) => {
  const { name, surname, email, password, provider, provider_id, avatar } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
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

module.exports = router;

