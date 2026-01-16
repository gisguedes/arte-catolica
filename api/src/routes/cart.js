const express = require('express');
const { query } = require('../db');
const { getLocale } = require('../utils');

const router = express.Router();

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

router.get('/', async (req, res) => {
  const userId = req.query.user_id;
  const locale = getLocale(req);

  if (!userId) {
    return res.status(400).json({ message: 'user_id es requerido' });
  }

  try {
    const result = await query(
      `${buildCartSelect()} WHERE ci.user_id = $1 ORDER BY ci.updated_at DESC`,
      [userId, locale]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Cart list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/', async (req, res) => {
  const payload = req.body || {};
  const locale = getLocale(req);
  if (!payload.user_id || !payload.product_id) {
    return res.status(400).json({ message: 'user_id y product_id son requeridos' });
  }
  if (!payload.quantity || payload.quantity <= 0) {
    return res.status(400).json({ message: 'quantity debe ser mayor a 0' });
  }

  try {
    await query(
      `INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at)
       VALUES ($1,$2,$3,NOW(),NOW())
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()`,
      [payload.user_id, payload.product_id, payload.quantity]
    );

    const result = await query(
      `${buildCartSelect()} WHERE ci.user_id = $1 ORDER BY ci.updated_at DESC`,
      [payload.user_id, locale]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Cart upsert error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.delete('/', async (req, res) => {
  const userId = req.query.user_id;
  const productId = req.query.product_id;
  const locale = getLocale(req);

  if (!userId || !productId) {
    return res.status(400).json({ message: 'user_id y product_id son requeridos' });
  }

  try {
    await query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [
      userId,
      productId,
    ]);
    const result = await query(
      `${buildCartSelect()} WHERE ci.user_id = $1 ORDER BY ci.updated_at DESC`,
      [userId, locale]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Cart delete error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.delete('/clear', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).json({ message: 'user_id es requerido' });
  }

  try {
    await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    res.status(204).send();
  } catch (error) {
    console.error('Cart clear error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

