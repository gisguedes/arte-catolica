const express = require('express');
const { query } = require('../db');

const router = express.Router();

const getUserId = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const jwt = require('jsonwebtoken');
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'insecure-secret');
    return decoded.sub;
  } catch {
    return null;
  }
};

router.get('/', async (req, res) => {
  const userId = req.query.user_id || getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  try {
    const result = await query(
      `SELECT uf.id, uf.product_id, uf.created_at,
        (
          SELECT pp.price
          FROM product_prices pp
          WHERE pp.product_id = p.id
            AND pp.start_date <= CURRENT_DATE
            AND pp.end_date >= CURRENT_DATE
          ORDER BY pp.start_date DESC
          LIMIT 1
        ) AS price,
        COALESCE(p.status, 'approved') AS status,
        (
          SELECT image_path FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.is_primary DESC, pi."order" ASC NULLS LAST
          LIMIT 1
        ) AS image,
        COALESCE(pt.name, '') AS name
       FROM user_favorites uf
       JOIN products p ON p.id = uf.product_id
       LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'es'
       WHERE uf.user_id = $1 AND COALESCE(p.status, 'approved') != 'cancelled'
       ORDER BY uf.created_at DESC`,
      [userId]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Favorites list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/', async (req, res) => {
  const userId = req.body.user_id || getUserId(req);
  const { product_id: productId } = req.body || {};
  if (!userId || !productId) {
    return res.status(400).json({ message: 'user_id y product_id son requeridos' });
  }

  try {
    await query(
      `INSERT INTO user_favorites (id, user_id, product_id, created_at)
       VALUES (uuid_generate_v4(), $1, $2, NOW())
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, productId]
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(404).json({ message: 'Usuario o producto no encontrado' });
    }
    console.error('Favorite add error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.delete('/:productId', async (req, res) => {
  const userId = req.query.user_id || getUserId(req);
  const { productId } = req.params;
  if (!userId || !productId) {
    return res.status(400).json({ message: 'user_id y product_id son requeridos' });
  }

  try {
    const result = await query(
      'DELETE FROM user_favorites WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [userId, productId]
    );
    res.status(result.rowCount ? 204 : 404).send();
  } catch (error) {
    console.error('Favorite remove error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/artists', async (req, res) => {
  const userId = req.query.user_id || getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  try {
    const result = await query(
      `SELECT ufa.id, ufa.vendor_id, ufa.created_at,
        v.image,
        COALESCE(v.status, 'approved') AS status,
        COALESCE(vt.short_description, '') AS short_description,
        COALESCE(v.name, '') AS name
       FROM user_favorite_artists ufa
       JOIN vendors v ON v.id = ufa.vendor_id
       LEFT JOIN vendor_translations vt ON vt.vendor_id = v.id AND vt.locale = 'es'
       WHERE ufa.user_id = $1 AND COALESCE(v.status, 'approved') != 'cancelled'
       ORDER BY ufa.created_at DESC`,
      [userId]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Favorite artists list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/artists', async (req, res) => {
  const userId = req.body.user_id || getUserId(req);
  const { vendor_id: vendorId } = req.body || {};
  if (!userId || !vendorId) {
    return res.status(400).json({ message: 'user_id y vendor_id son requeridos' });
  }

  try {
    await query(
      `INSERT INTO user_favorite_artists (id, user_id, vendor_id, created_at)
       VALUES (uuid_generate_v4(), $1, $2, NOW())
       ON CONFLICT (user_id, vendor_id) DO NOTHING`,
      [userId, vendorId]
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(404).json({ message: 'Usuario o artista no encontrado' });
    }
    if (error.code === '42P01') {
      return res.status(500).json({ message: 'Tabla user_favorite_artists no existe. Ejecuta la migración api/sql/user_favorite_artists.sql' });
    }
    console.error('Favorite artist add error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.delete('/artists/:vendorId', async (req, res) => {
  const userId = req.query.user_id || getUserId(req);
  const { vendorId } = req.params;
  if (!userId || !vendorId) {
    return res.status(400).json({ message: 'user_id y vendor_id son requeridos' });
  }

  try {
    const result = await query(
      'DELETE FROM user_favorite_artists WHERE user_id = $1 AND vendor_id = $2 RETURNING id',
      [userId, vendorId]
    );
    res.status(result.rowCount ? 204 : 404).send();
  } catch (error) {
    if (error.code === '42P01') {
      return res.status(500).json({ message: 'Tabla user_favorite_artists no existe. Ejecuta la migración api/sql/user_favorite_artists.sql' });
    }
    console.error('Favorite artist remove error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/check/:productId', async (req, res) => {
  const userId = req.query.user_id || getUserId(req);
  const { productId } = req.params;
  if (!userId) {
    return res.json({ data: { is_favorite: false } });
  }

  try {
    const result = await query(
      'SELECT id FROM user_favorites WHERE user_id = $1 AND product_id = $2 LIMIT 1',
      [userId, productId]
    );
    res.json({ data: { is_favorite: result.rows.length > 0 } });
  } catch (error) {
    console.error('Favorite check error', error);
    res.json({ data: { is_favorite: false } });
  }
});

module.exports = router;
