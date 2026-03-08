const express = require('express');
const { query } = require('../db');
const { getLocale } = require('../utils');

const router = express.Router();

const buildVendorSelect = (localeParam = '$1') => `
  SELECT
    v.id,
    v.name,
    v.surname,
    v.phone,
    v.nif,
    COALESCE(vt.short_description, '') AS short_description,
    COALESCE(vt.description, '') AS description,
    v.image,
    v.website,
    COALESCE(v.social_links, '[]'::jsonb) AS social_links,
    v.city,
    v.country,
    v.postal_code,
    v.opening_date,
    v.is_active,
    COALESCE(v.status, 'approved') AS status,
    v.created_at,
    v.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', at.id,
            'alias', at.alias,
            'slug', COALESCE(att.slug, at.alias, ''),
            'name', COALESCE(att.name, at.alias, '')
          )
        )
        FROM artist_type_vendor atv
        JOIN artist_types at ON at.id = atv.artist_type_id
        LEFT JOIN artist_type_translations att ON att.artist_type_id = at.id AND att.locale = ${localeParam}
        WHERE atv.vendor_id = v.id
      ),
      '[]'::jsonb
    ) AS artist_types
  FROM vendors v
  LEFT JOIN vendor_translations vt ON vt.vendor_id = v.id AND vt.locale = ${localeParam}
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
    COALESCE(p.status, 'approved') AS status,
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
  let fromClause = 'FROM vendors v';
  let joinClause = '';

  if (includeInactive !== 'true') {
    conditions.push("(COALESCE(v.status, 'approved') = 'approved')");
  }

  if (userId) {
    params.push(userId);
    const paramNum = params.length + 1;
    joinClause = ` INNER JOIN vendor_users vu ON vu.vendor_id = v.id AND vu.user_id = $${paramNum}`;
    conditions.push(`vu.user_id = $${paramNum}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const locale = getLocale(req);
  const selectPart = buildVendorSelect('$1').replace('FROM vendors v', `FROM vendors v${joinClause}`);
  const sql = `${selectPart} ${whereClause} ORDER BY v.created_at DESC`;

  try {
    const result = await query(sql, [locale, ...params]);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Vendors list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildVendorSelect('$1')} WHERE v.id = $2 LIMIT 1`;

  try {
    const result = await query(sql, [locale, req.params.id]);
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
  const sql = `${buildProductSelect()} WHERE p.vendor_id = $2 AND (COALESCE(p.status, 'approved') = 'approved') ORDER BY p.created_at DESC`;

  try {
    const result = await query(sql, [locale, req.params.id]);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Vendor products error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;






