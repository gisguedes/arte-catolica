const express = require('express');
const { query } = require('../db');
const { getLocale } = require('../utils');

const router = express.Router();

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
    ) AS image,
    CASE
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
    END AS vendor,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', c.id,
          'slug', c.slug,
          'name', COALESCE(ct.name, ''),
          'description', COALESCE(ct.description, ''),
          'is_active', c.is_active,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        ))
        FROM category_product cp
        JOIN categories c ON c.id = cp.category_id
        LEFT JOIN category_translations ct
          ON ct.category_id = c.id AND ct.locale = $1
        WHERE cp.product_id = p.id
      ),
      '[]'::jsonb
    ) AS categories,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', m.id,
          'slug', m.slug,
          'name', COALESCE(mt.name, ''),
          'is_active', m.is_active
        ))
        FROM material_product mp
        JOIN materials m ON m.id = mp.material_id
        LEFT JOIN material_translations mt
          ON mt.material_id = m.id AND mt.locale = $1
        WHERE mp.product_id = p.id
      ),
      '[]'::jsonb
    ) AS materials,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', co.id,
          'name', co.name,
          'hex', co.hex,
          'is_active', co.is_active
        ))
        FROM color_product cp
        JOIN colors co ON co.id = cp.color_id
        WHERE cp.product_id = p.id
      ),
      '[]'::jsonb
    ) AS colors,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pi.id,
            'image_path', pi.image_path,
            'order', pi."order",
            'is_primary', pi.is_primary
          )
          ORDER BY pi."order" ASC NULLS LAST
        )
        FROM product_images pi
        WHERE pi.product_id = p.id
      ),
      '[]'::jsonb
    ) AS images
  FROM products p
  LEFT JOIN product_translations pt
    ON pt.product_id = p.id AND pt.locale = $1
  LEFT JOIN vendors v ON v.id = p.vendor_id
`;

router.get('/', async (req, res) => {
  const locale = getLocale(req);
  const { category_slug: categorySlug, category_id: categoryId } = req.query;

  const params = [locale];
  let whereClause = 'p.is_active = true';

  if (categorySlug) {
    params.push(categorySlug);
    whereClause += ` AND EXISTS (
      SELECT 1
      FROM category_product cp
      JOIN categories c ON c.id = cp.category_id
      WHERE cp.product_id = p.id AND c.slug = $${params.length}
    )`;
  }

  if (categoryId) {
    params.push(categoryId);
    whereClause += ` AND EXISTS (
      SELECT 1
      FROM category_product cp
      JOIN categories c ON c.id = cp.category_id
      WHERE cp.product_id = p.id AND c.id = $${params.length}
    )`;
  }

  const sql = `${buildProductSelect()} WHERE ${whereClause} ORDER BY p.created_at DESC`;

  try {
    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Products list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildProductSelect()} WHERE p.id = $2 LIMIT 1`;

  try {
    const result = await query(sql, [locale, req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Product show error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

