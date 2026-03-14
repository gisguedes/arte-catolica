const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { getLocale, formatApiError } = require('../utils');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'insecure-secret';

function getUserIdFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.sub;
  } catch {
    return null;
  }
}

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
    res.status(500).json({ message: formatApiError('listar vendors', error) });
  }
});

router.post('/', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  const payload = req.body || {};
  const { name, surname, phone, nif, artist_type_ids, short_description } = payload;
  if (!name || !surname) {
    return res.status(400).json({ message: 'name y surname son requeridos' });
  }

  const artistTypeIds = Array.isArray(artist_type_ids) ? artist_type_ids : artist_type_ids ? [artist_type_ids] : [];

  const steps = {
    checkExisting: 'comprobar vendor existente',
    insertVendor: 'insertar vendor',
    insertTranslations: 'insertar vendor_translations',
    insertVendorUser: 'insertar vendor_users',
    insertArtistTypes: 'insertar artist_type_vendor',
    selectVendor: 'recuperar vendor creado',
  };

  try {
    const existingVendor = await query(
      'SELECT vu.vendor_id FROM vendor_users vu WHERE vu.user_id = $1 LIMIT 1',
      [userId]
    );
    if (existingVendor.rows.length > 0) {
      return res.status(409).json({ message: 'Ya tienes un perfil de vendedor' });
    }
  } catch (error) {
    console.error('Vendor create error [' + steps.checkExisting + ']', error);
    return res.status(500).json({ message: formatApiError(steps.checkExisting, error) });
  }

  let userEmail;
  try {
    const userRow = await query('SELECT email FROM users WHERE id = $1 LIMIT 1', [userId]);
    userEmail = userRow.rows[0]?.email;
    if (!userEmail) {
      return res.status(400).json({ message: 'Usuario sin email válido' });
    }
  } catch (error) {
    console.error('Vendor create error [obtener email usuario]', error);
    return res.status(500).json({ message: formatApiError('obtener email usuario', error) });
  }

  let vendorId;
  try {
    const vendorResult = await query(
      `INSERT INTO vendors (
        id, name, surname, email, phone, nif, opening_date, is_active, created_at, updated_at
      )
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, NOW(), true, NOW(), NOW())
      RETURNING id, name, surname, phone, nif, opening_date, is_active, created_at, updated_at`,
      [
        String(name).trim(),
        String(surname || '').trim(),
        userEmail,
        phone ? String(phone).trim() : null,
        nif ? String(nif).trim() : null,
      ]
    );
    const vendor = vendorResult.rows[0];
    vendorId = vendor.id;
  } catch (error) {
    console.error('Vendor create error [' + steps.insertVendor + ']', error);
    return res.status(500).json({ message: formatApiError(steps.insertVendor, error) });
  }

  try {
    await query(
      `INSERT INTO vendor_translations (id, vendor_id, locale, short_description, description)
       VALUES (uuid_generate_v4(), $1, 'es', $2, '')
       ON CONFLICT (vendor_id, locale) DO UPDATE SET short_description = EXCLUDED.short_description`,
      [vendorId, short_description ? String(short_description).trim() : '']
    );
  } catch (error) {
    console.error('Vendor create error [' + steps.insertTranslations + ']', error);
    return res.status(500).json({ message: formatApiError(steps.insertTranslations, error) });
  }

  try {
    await query(
      `INSERT INTO vendor_users (id, vendor_id, user_id, role, created_at, updated_at)
       VALUES (uuid_generate_v4(), $1, $2, 'owner', NOW(), NOW())`,
      [vendorId, userId]
    );
  } catch (error) {
    console.error('Vendor create error [' + steps.insertVendorUser + ']', error);
    return res.status(500).json({ message: formatApiError(steps.insertVendorUser, error) });
  }

  const uniqueArtistTypeIds = [...new Set(artistTypeIds.filter(Boolean))];
  for (const artistTypeId of uniqueArtistTypeIds) {
    try {
      await query(
        `INSERT INTO artist_type_vendor (vendor_id, artist_type_id) VALUES ($1, $2)`,
        [vendorId, artistTypeId]
      );
    } catch (error) {
      if (error.code === '23503') {
        return res.status(400).json({ message: 'artist_type_id no válido' });
      }
      console.error('Vendor create error [' + steps.insertArtistTypes + ']', error);
      return res.status(500).json({ message: formatApiError(steps.insertArtistTypes, error) });
    }
  }

  try {
    const locale = getLocale(req);
    const selectSql = `${buildVendorSelect('$1')} WHERE v.id = $2 LIMIT 1`;
    const result = await query(selectSql, [locale, vendorId]);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Vendor create error [' + steps.selectVendor + ']', error);
    return res.status(500).json({ message: formatApiError(steps.selectVendor, error) });
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
    res.status(500).json({ message: formatApiError('obtener vendor', error) });
  }
});

router.get('/:id/products', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildProductSelect()} WHERE p.vendor_id = $2 AND (COALESCE(p.status, 'approved') IN ('approved', 'archived')) ORDER BY (CASE WHEN COALESCE(p.status, 'approved') = 'archived' THEN 1 ELSE 0 END), p.created_at DESC`;

  try {
    const result = await query(sql, [locale, req.params.id]);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Vendor products error', error);
    res.status(500).json({ message: formatApiError('listar productos vendor', error) });
  }
});

module.exports = router;






