const express = require('express');
const { query } = require('../db');
const { getLocale } = require('../utils');

const router = express.Router();

const buildVendorSelect = () => `
  SELECT
    v.id,
    v.name,
    v.surname,
    v.email,
    v.phone,
    v.nif,
    v.bio,
    v.image,
    v.website,
    v.city,
    v.country,
    v.postal_code,
    v.opening_date,
    v.is_active,
    v.created_at,
    v.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', at.id,
            'slug', at.slug,
            'name', at.name
          )
        )
        FROM artist_type_vendor atv
        JOIN artist_types at ON at.id = atv.artist_type_id
        WHERE atv.vendor_id = v.id
      ),
      '[]'::jsonb
    ) AS artist_types
  FROM vendors v
`;

const buildProductSelect = () => `
  SELECT
    p.id,
    p.vendor_id,
    p.price,
    p.stock,
    p.availability,
    p.height_cm,
    p.width_cm,
    p.depth_cm,
    p.sku,
    p.is_active,
    p.is_featured,
    p.created_at,
    p.updated_at,
    COALESCE(pt.name, '') AS name,
    COALESCE(pt.description, '') AS description,
    (
      SELECT image_path
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.is_primary DESC, pi."order" ASC NULLS LAST
      LIMIT 1
    ) AS image
  FROM products p
  LEFT JOIN product_translations pt
    ON pt.product_id = p.id AND pt.locale = $1
`;

router.get('/', async (req, res) => {
  const { include_inactive: includeInactive, user_id: userId } = req.query;
  const conditions = [];
  const params = [];

  if (includeInactive !== 'true') {
    conditions.push('v.is_active = true');
  }

  if (userId) {
    params.push(userId);
    conditions.push(`v.user_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `${buildVendorSelect()} ${whereClause} ORDER BY v.created_at DESC`;

  try {
    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Vendors list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const sql = `${buildVendorSelect()} WHERE v.id = $1 LIMIT 1`;

  try {
    const result = await query(sql, [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Artista no encontrado' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Vendor show error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id/products', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildProductSelect()} WHERE p.vendor_id = $2 AND p.is_active = true ORDER BY p.created_at DESC`;

  try {
    const result = await query(sql, [locale, req.params.id]);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Vendor products error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;



