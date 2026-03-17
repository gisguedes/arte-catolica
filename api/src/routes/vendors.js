const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const { getLocale, formatApiError } = require('../utils');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const PRODUCTS_UPLOADS = path.join(UPLOADS_DIR, 'products');
const {
  VENDOR_USER_ROLES,
  VENDOR_ASSIGNABLE_ROLES,
  isAssignableVendorRole,
} = require('../constants/vendor-roles');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'insecure-secret';

/** Fecha fin por defecto de un contrato de precio (fin de colaboración) */
const PRICE_CONTRACT_END_DEFAULT = '2999-12-31';

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
    COALESCE(vt.short_description, '') AS short_description,
    COALESCE(vt.description, '') AS description,
    v.image,
    v.website,
    COALESCE(v.social_links, '[]'::jsonb) AS social_links,
    v.city,
    v.country,
    v.postal_code,
    v.opening_date,
    COALESCE(v.status, 'approved') AS status,
    v.created_at,
    v.updated_at,
    (SELECT vsp.preparation_days FROM vendor_shipping_policy vsp WHERE vsp.vendor_id = v.id LIMIT 1) AS preparation_days,
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
    (
      SELECT pp.price
      FROM product_prices pp
      WHERE pp.product_id = p.id
        AND pp.start_date <= CURRENT_DATE
        AND pp.end_date >= CURRENT_DATE
      ORDER BY pp.start_date DESC
      LIMIT 1
    ) AS price,
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
  const { include_inactive: includeInactive, user_id: userIdParam } = req.query;
  const userId = userIdParam ? getUserIdFromToken(req) : null;
  if (userIdParam && !userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const conditions = [];
  const params = [];
  let fromClause = 'FROM vendors v';
  let joinClause = '';

  if (includeInactive !== 'true' && !userId) {
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
  let selectPart = buildVendorSelect('$1').replace('FROM vendors v', `FROM vendors v${joinClause}`);
  if (userId) {
    selectPart = selectPart.replace(
      ') AS artist_types\n  FROM vendors v',
      `) AS artist_types,
    (SELECT vu_inner.role FROM vendor_users vu_inner WHERE vu_inner.vendor_id = v.id AND vu_inner.user_id = $2) AS my_role
  FROM vendors v`
    );
  }
  const sql = `${selectPart} ${whereClause} ORDER BY v.created_at DESC`;

  try {
    const result = await query(sql, [locale, ...params]);
    const rows = result.rows;
    if (userId && rows.length === 1) {
      rows[0].my_role = rows[0].my_role || null;
    }
    res.json({ data: rows });
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
  const { name, surname, artist_type_ids, short_description } = payload;
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

  let vendorId;
  try {
    const vendorResult = await query(
      `INSERT INTO vendors (
        id, name, surname, opening_date, status, created_at, updated_at
      )
      VALUES (uuid_generate_v4(), $1, $2, NOW(), 'in_progress', NOW(), NOW())
      RETURNING id, name, surname, opening_date, status, created_at, updated_at`,
      [String(name).trim(), String(surname || '').trim()]
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
       VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())`,
      [vendorId, userId, VENDOR_USER_ROLES.OWNER]
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

router.patch('/:id/status', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const { status: newStatus } = req.body || {};
  const validStatuses = ['in_progress', 'approved', 'archived', 'cancelled'];
  if (!newStatus || !validStatuses.includes(newStatus)) {
    return res.status(400).json({ message: 'status inválido. Usar: in_progress, approved, archived, cancelled' });
  }

  try {
    const ownerCheck = await query(
      'SELECT v.status FROM vendor_users vu JOIN vendors v ON v.id = vu.vendor_id WHERE vu.vendor_id = $1 AND vu.user_id = $2 LIMIT 1',
      [req.params.id, userId]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
    await query(
      "UPDATE vendors SET status = $1, updated_at = NOW() WHERE id = $2",
      [newStatus, req.params.id]
    );
    const locale = getLocale(req);
    const selectSql = `${buildVendorSelect('$1')} WHERE v.id = $2 LIMIT 1`;
    const result = await query(selectSql, [locale, req.params.id]);
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Vendor status update error', error);
    res.status(500).json({ message: formatApiError('actualizar status vendor', error) });
  }
});

router.patch('/:id', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const vendorId = req.params.id;
  try {
    const ownerCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, userId]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
  } catch (error) {
    return res.status(500).json({ message: formatApiError('comprobar owner', error) });
  }

  const body = req.body || {};
  const locale = getLocale(req);
  const updates = [];
  const params = [];
  let paramIdx = 1;

  const vendorFields = {
    name: 'name',
    surname: 'surname',
    image: 'image',
    website: 'website',
    social_links: 'social_links',
    city: 'city',
    country: 'country',
    postal_code: 'postal_code',
  };
  for (const [key, col] of Object.entries(vendorFields)) {
    if (key in body) {
      const val = body[key];
      if (key === 'social_links') {
        updates.push(`${col} = $${paramIdx}::jsonb`);
        params.push(Array.isArray(val) ? JSON.stringify(val) : '[]');
      } else {
        updates.push(`${col} = $${paramIdx}`);
        params.push(val === '' || val === null || val === undefined ? null : String(val).trim());
      }
      paramIdx++;
    }
  }
  if (updates.length > 0) {
    updates.push(`updated_at = NOW()`);
    params.push(vendorId);
    await query(
      `UPDATE vendors SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
      params
    );
  }

  if ('short_description' in body || 'description' in body) {
    const shortDesc = body.short_description ?? '';
    const desc = body.description ?? '';
    await query(
      `INSERT INTO vendor_translations (id, vendor_id, locale, short_description, description)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4)
       ON CONFLICT (vendor_id, locale) DO UPDATE SET
         short_description = COALESCE(EXCLUDED.short_description, vendor_translations.short_description),
         description = COALESCE(EXCLUDED.description, vendor_translations.description)`,
      [vendorId, locale, shortDesc, desc]
    );
  }

  if ('preparation_days' in body) {
    const days = body.preparation_days == null ? 0 : Math.max(0, parseInt(body.preparation_days, 10) || 0);
    await query(
      `INSERT INTO vendor_shipping_policy (id, vendor_id, preparation_days, created_at, updated_at)
       VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW())
       ON CONFLICT (vendor_id) DO UPDATE SET preparation_days = $2, updated_at = NOW()`,
      [vendorId, days]
    );
  }

  if ('artist_type_ids' in body) {
    const ids = Array.isArray(body.artist_type_ids) ? body.artist_type_ids : [];
    const uniqueIds = [...new Set(ids.filter((id) => id && String(id).trim()))];
    await query('DELETE FROM artist_type_vendor WHERE vendor_id = $1', [vendorId]);
    for (const artistTypeId of uniqueIds) {
      try {
        await query(
          'INSERT INTO artist_type_vendor (vendor_id, artist_type_id) VALUES ($1, $2)',
          [vendorId, artistTypeId]
        );
      } catch (err) {
        if (err.code === '23503') {
          return res.status(400).json({ message: 'Uno de los tipos de artista no es válido' });
        }
        throw err;
      }
    }
  }

  const selectSql = `${buildVendorSelect('$1')} WHERE v.id = $2 LIMIT 1`;
  const result = await query(selectSql, [locale, vendorId]);
  res.json({ data: result.rows[0] });
});

// --- Gestión de usuarios del vendor (solo owner) ---
router.get('/:id/users', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const vendorId = req.params.id;
  try {
    const memberCheck = await query(
      'SELECT vu.role FROM vendor_users vu WHERE vu.vendor_id = $1 AND vu.user_id = $2 LIMIT 1',
      [vendorId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
    const result = await query(
      `SELECT vu.id, vu.user_id, vu.role, vu.created_at,
        u.name, u.surname, u.email
       FROM vendor_users vu
       JOIN users u ON u.id = vu.user_id
       WHERE vu.vendor_id = $1
       ORDER BY vu.role = '${VENDOR_USER_ROLES.OWNER}' DESC, u.name ASC, u.surname ASC`,
      [vendorId]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Vendor users list error', error);
    res.status(500).json({ message: formatApiError('listar usuarios vendor', error) });
  }
});

router.post('/:id/users', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const vendorId = req.params.id;
  const { email, role } = req.body || {};
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ message: 'email es requerido' });
  }
  if (!isAssignableVendorRole(role)) {
    return res.status(400).json({
      message: `role inválido. Usar: ${VENDOR_ASSIGNABLE_ROLES.join(', ')}`,
    });
  }
  try {
    const ownerCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 AND role = $3 LIMIT 1',
      [vendorId, userId, VENDOR_USER_ROLES.OWNER]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Solo el owner puede añadir usuarios' });
    }
    const userByEmail = await query(
      'SELECT id, name, surname, email FROM users WHERE LOWER(email) = LOWER($1) AND COALESCE(active, true) = true LIMIT 1',
      [email.trim()]
    );
    if (userByEmail.rows.length === 0) {
      return res.status(404).json({ message: 'No existe ningún usuario con ese email' });
    }
    const targetUserId = userByEmail.rows[0].id;
    const existing = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, targetUserId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Ese usuario ya está en el equipo' });
    }
    await query(
      `INSERT INTO vendor_users (id, vendor_id, user_id, role, created_at, updated_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())`,
      [vendorId, targetUserId, role]
    );
    const u = userByEmail.rows[0];
    res.status(201).json({
      data: {
        user_id: u.id,
        name: u.name,
        surname: u.surname,
        email: u.email,
        role,
      },
    });
  } catch (error) {
    console.error('Vendor add user error', error);
    res.status(500).json({ message: formatApiError('añadir usuario', error) });
  }
});

router.delete('/:id/users/:userId', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const { id: vendorId, userId: targetUserId } = req.params;
  if (targetUserId === userId) {
    return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
  }
  try {
    const ownerCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 AND role = $3 LIMIT 1',
      [vendorId, userId, VENDOR_USER_ROLES.OWNER]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Solo el owner puede eliminar usuarios' });
    }
    const target = await query(
      'SELECT role FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, targetUserId]
    );
    if (target.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado en el equipo' });
    }
    if (target.rows[0].role === VENDOR_USER_ROLES.OWNER) {
      return res.status(400).json({ message: 'No se puede eliminar al owner' });
    }
    await query(
      'DELETE FROM vendor_users WHERE vendor_id = $1 AND user_id = $2',
      [vendorId, targetUserId]
    );
    res.status(204).send();
  } catch (error) {
    console.error('Vendor remove user error', error);
    res.status(500).json({ message: formatApiError('eliminar usuario', error) });
  }
});

// --- Datos de facturación (company) ---
router.get('/:id/company', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const vendorId = req.params.id;
  try {
    const memberCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
    const result = await query(
      `SELECT id, vendor_id, legal_name, nif, phone, email, street, postal_code, city, country, created_at, updated_at
       FROM companies WHERE vendor_id = $1 LIMIT 1`,
      [vendorId]
    );
    const company = result.rows[0] || null;
    res.json({ data: company });
  } catch (error) {
    console.error('Vendor company get error', error);
    res.status(500).json({ message: formatApiError('obtener datos de facturación', error) });
  }
});

router.put('/:id/company', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const vendorId = req.params.id;
  const body = req.body || {};
  try {
    const memberCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
    const legal_name = body.legal_name != null ? String(body.legal_name).trim() : null;
    const nif = body.nif != null ? String(body.nif).trim() : null;
    const phone = body.phone != null ? String(body.phone).trim() : null;
    const email = body.email != null ? String(body.email).trim() : null;
    const street = body.street != null ? String(body.street).trim() : null;
    const postal_code = body.postal_code != null ? String(body.postal_code).trim() : null;
    const city = body.city != null ? String(body.city).trim() : null;
    const country = body.country != null ? String(body.country).trim() : null;

    const existing = await query('SELECT id FROM companies WHERE vendor_id = $1 LIMIT 1', [vendorId]);
    if (existing.rows.length > 0) {
      await query(
        `UPDATE companies SET
          legal_name = $1, nif = $2, phone = $3, email = $4,
          street = $5, postal_code = $6, city = $7, country = $8,
          updated_at = NOW()
         WHERE vendor_id = $9`,
        [legal_name, nif, phone, email, street, postal_code, city, country, vendorId]
      );
    } else {
      await query(
        `INSERT INTO companies (id, vendor_id, legal_name, nif, phone, email, street, postal_code, city, country, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [vendorId, legal_name, nif, phone, email, street, postal_code, city, country]
      );
    }
    const result = await query(
      `SELECT id, vendor_id, legal_name, nif, phone, email, street, postal_code, city, country, created_at, updated_at
       FROM companies WHERE vendor_id = $1 LIMIT 1`,
      [vendorId]
    );
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Vendor company put error', error);
    res.status(500).json({ message: formatApiError('guardar datos de facturación', error) });
  }
});

// --- Cuentas bancarias del vendor ---
router.get('/:id/bank-accounts', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const vendorId = req.params.id;
  try {
    const memberCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
    const result = await query(
      `SELECT id, vendor_id, account_holder_name, iban, swift_bic, bank_name, is_default, created_at, updated_at
       FROM vendor_bank_accounts
       WHERE vendor_id = $1 AND COALESCE(is_active, true) = true
       ORDER BY is_default DESC, created_at ASC`,
      [vendorId]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Vendor bank accounts list error', error);
    res.status(500).json({ message: formatApiError('listar cuentas bancarias', error) });
  }
});

router.post('/:id/bank-accounts', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const vendorId = req.params.id;
  const body = req.body || {};
  const account_holder_name = body.account_holder_name != null ? String(body.account_holder_name).trim() : '';
  const iban = body.iban != null ? String(body.iban).trim().replace(/\s/g, '') : '';
  if (!account_holder_name || !iban) {
    return res.status(400).json({ message: 'Titular de la cuenta e IBAN son obligatorios' });
  }
  try {
    const memberCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
    const swift_bic = body.swift_bic != null ? String(body.swift_bic).trim() || null : null;
    const bank_name = body.bank_name != null ? String(body.bank_name).trim() || null : null;
    const is_default = Boolean(body.is_default);
    if (is_default) {
      await query(
        'UPDATE vendor_bank_accounts SET is_default = false WHERE vendor_id = $1 AND COALESCE(is_active, true) = true',
        [vendorId]
      );
    }
    const result = await query(
      `INSERT INTO vendor_bank_accounts (id, vendor_id, account_holder_name, iban, swift_bic, bank_name, is_default, created_at, updated_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, vendor_id, account_holder_name, iban, swift_bic, bank_name, is_default, created_at, updated_at`,
      [vendorId, account_holder_name, iban, swift_bic, bank_name, is_default]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Vendor bank account create error', error);
    res.status(500).json({ message: formatApiError('crear cuenta bancaria', error) });
  }
});

router.delete('/:id/bank-accounts/:accountId', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const { id: vendorId, accountId } = req.params;
  try {
    const memberCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
    const result = await query(
      `UPDATE vendor_bank_accounts SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND vendor_id = $2 AND COALESCE(is_active, true) = true
       RETURNING id`,
      [accountId, vendorId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Vendor bank account delete error', error);
    res.status(500).json({ message: formatApiError('eliminar cuenta bancaria', error) });
  }
});

router.get('/:id', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildVendorSelect('$1')} WHERE v.id = $2 LIMIT 1`;

  try {
    const result = await query(sql, [locale, req.params.id]);
    const vendor = result.rows[0];
    if (!vendor) {
      return res.status(404).json({ message: 'Artista no encontrado' });
    }
    const status = vendor.status ?? 'approved';
    if (status === 'in_progress' || status === 'cancelled') {
      return res.status(404).json({ message: 'Artista no encontrado' });
    }
    res.json({ data: vendor });
  } catch (error) {
    console.error('Vendor show error', error);
    res.status(500).json({ message: formatApiError('obtener vendor', error) });
  }
});

router.post('/:id/products', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const vendorId = req.params.id;
  try {
    const memberCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
  } catch (error) {
    return res.status(500).json({ message: formatApiError('comprobar vendor', error) });
  }

  const body = req.body || {};
  const name = body.name != null ? String(body.name).trim() : '';
  const description = body.description != null ? String(body.description).trim() : '';
  const priceRaw = body.price != null ? Number(body.price) : null;
  const hasPrice = Number.isFinite(priceRaw) && priceRaw >= 0;
  const price = hasPrice ? priceRaw : null;
  if (!name) {
    return res.status(400).json({ message: 'name es requerido' });
  }
  if (body.price != null && !hasPrice) {
    return res.status(400).json({ message: 'price debe ser un número mayor o igual a 0' });
  }

  const locale = getLocale(req);
  const stock = body.stock != null ? (Number(body.stock) || null) : null;
  const availability = body.availability != null ? String(body.availability).trim() || null : null;
  const heightCm = body.height_cm != null ? (Number(body.height_cm) || null) : null;
  const widthCm = body.width_cm != null ? (Number(body.width_cm) || null) : null;
  const depthCm = body.depth_cm != null ? (Number(body.depth_cm) || null) : null;
  const sku = body.sku != null ? String(body.sku).trim() || null : null;
  const categoryIds = Array.isArray(body.category_ids) ? body.category_ids : [];
  const materialIds = Array.isArray(body.material_ids) ? body.material_ids : [];
  const techniqueIds = Array.isArray(body.technique_ids) ? body.technique_ids : [];
  const colorIds = Array.isArray(body.color_ids) ? body.color_ids : [];

  const steps = {
    insertProduct: 'insertar product',
    insertTranslation: 'insertar product_translations',
    insertFirstPrice: 'insertar product_prices',
    insertCategories: 'category_product',
    insertMaterials: 'material_product',
    insertTechniques: 'product_technique',
    insertColors: 'color_product',
    selectProduct: 'recuperar product',
  };

  let productId;
  try {
    const productResult = await query(
      `INSERT INTO products (
        id, vendor_id, price, stock, availability, height_cm, width_cm, depth_cm, sku,
        is_active, is_featured, status, created_at, updated_at
      )
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, true, false, 'in_progress', NOW(), NOW())
      RETURNING id`,
      [vendorId, price, stock, availability, heightCm, widthCm, depthCm, sku]
    );
    productId = productResult.rows[0].id;
  } catch (error) {
    console.error('Product create error [' + steps.insertProduct + ']', error);
    return res.status(500).json({ message: formatApiError(steps.insertProduct, error) });
  }

  if (hasPrice) {
    try {
      await query(
        `INSERT INTO product_prices (id, product_id, price, start_date, end_date, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, CURRENT_DATE, '2999-12-31', NOW(), NOW())`,
        [productId, price]
      );
    } catch (error) {
      console.error('Product create error [' + steps.insertFirstPrice + ']', error);
      return res.status(500).json({ message: formatApiError(steps.insertFirstPrice, error) });
    }
  }

  try {
    await query(
      `INSERT INTO product_translations (id, product_id, locale, name, description)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
      [productId, locale, name, description]
    );
  } catch (error) {
    console.error('Product create error [' + steps.insertTranslation + ']', error);
    return res.status(500).json({ message: formatApiError(steps.insertTranslation, error) });
  }

  for (const categoryId of [...new Set(categoryIds)].filter(Boolean)) {
    try {
      await query(
        'INSERT INTO category_product (product_id, category_id) VALUES ($1, $2)',
        [productId, categoryId]
      );
    } catch (err) {
      if (err.code === '23503') {
        return res.status(400).json({ message: 'Una categoría no es válida' });
      }
      throw err;
    }
  }
  for (const materialId of [...new Set(materialIds)].filter(Boolean)) {
    try {
      await query(
        'INSERT INTO material_product (product_id, material_id) VALUES ($1, $2)',
        [productId, materialId]
      );
    } catch (err) {
      if (err.code === '23503') {
        return res.status(400).json({ message: 'Un material no es válido' });
      }
      throw err;
    }
  }
  for (const techniqueId of [...new Set(techniqueIds)].filter(Boolean)) {
    try {
      await query(
        'INSERT INTO product_technique (product_id, technique_id) VALUES ($1, $2)',
        [productId, techniqueId]
      );
    } catch (err) {
      if (err.code === '23503') {
        return res.status(400).json({ message: 'Una técnica no es válida' });
      }
      throw err;
    }
  }
  for (const colorId of [...new Set(colorIds)].filter(Boolean)) {
    try {
      await query(
        'INSERT INTO color_product (product_id, color_id) VALUES ($1, $2)',
        [productId, colorId]
      );
    } catch (err) {
      if (err.code === '23503') {
        return res.status(400).json({ message: 'Un color no es válido' });
      }
      throw err;
    }
  }

  try {
    const sql = `${buildProductSelect()} WHERE p.id = $2 LIMIT 1`;
    const result = await query(sql, [locale, productId]);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Product create error [' + steps.selectProduct + ']', error);
    res.status(500).json({ message: formatApiError(steps.selectProduct, error) });
  }
});

router.patch('/:id/products/:productId', async (req, res) => {
  const access = await ensureVendorProductAccess(req, res);
  if (!access) return;
  const { vendorId, productId } = access;
  const body = req.body || {};
  const name = body.name != null ? String(body.name).trim() : null;
  const description = body.description != null ? String(body.description).trim() : null;
  if (name !== null && name === '') {
    return res.status(400).json({ message: 'name no puede estar vacío' });
  }
  const stock = body.stock !== undefined ? (body.stock == null || body.stock === '' ? null : Number(body.stock)) : undefined;
  const availability = body.availability !== undefined ? (body.availability == null || body.availability === '' ? null : String(body.availability).trim()) : undefined;
  const heightCm = body.height_cm !== undefined ? (body.height_cm == null || body.height_cm === '' ? null : Number(body.height_cm)) : undefined;
  const widthCm = body.width_cm !== undefined ? (body.width_cm == null || body.width_cm === '' ? null : Number(body.width_cm)) : undefined;
  const depthCm = body.depth_cm !== undefined ? (body.depth_cm == null || body.depth_cm === '' ? null : Number(body.depth_cm)) : undefined;
  const sku = body.sku !== undefined ? (body.sku == null || body.sku === '' ? null : String(body.sku).trim()) : undefined;
  const categoryIds = body.category_ids !== undefined ? (Array.isArray(body.category_ids) ? body.category_ids : []) : undefined;
  const materialIds = body.material_ids !== undefined ? (Array.isArray(body.material_ids) ? body.material_ids : []) : undefined;
  const techniqueIds = body.technique_ids !== undefined ? (Array.isArray(body.technique_ids) ? body.technique_ids : []) : undefined;
  const colorIds = body.color_ids !== undefined ? (Array.isArray(body.color_ids) ? body.color_ids : []) : undefined;

  const locale = getLocale(req);

  try {
    const productUpdates = [];
    const productParams = [];
    let paramIdx = 1;
    if (stock !== undefined) {
      productUpdates.push(`stock = $${paramIdx}`);
      productParams.push(stock);
      paramIdx++;
    }
    if (availability !== undefined) {
      productUpdates.push(`availability = $${paramIdx}`);
      productParams.push(availability);
      paramIdx++;
    }
    if (heightCm !== undefined) {
      productUpdates.push(`height_cm = $${paramIdx}`);
      productParams.push(heightCm);
      paramIdx++;
    }
    if (widthCm !== undefined) {
      productUpdates.push(`width_cm = $${paramIdx}`);
      productParams.push(widthCm);
      paramIdx++;
    }
    if (depthCm !== undefined) {
      productUpdates.push(`depth_cm = $${paramIdx}`);
      productParams.push(depthCm);
      paramIdx++;
    }
    if (sku !== undefined) {
      productUpdates.push(`sku = $${paramIdx}`);
      productParams.push(sku);
      paramIdx++;
    }
    if (productUpdates.length > 0) {
      productUpdates.push('updated_at = NOW()');
      productParams.push(productId);
      await query(
        `UPDATE products SET ${productUpdates.join(', ')} WHERE id = $${paramIdx}`,
        productParams
      );
    }

    if (name !== null || description !== null) {
      const transUpdates = [];
      const transParams = [];
      let tIdx = 1;
      if (name !== null) {
        transUpdates.push(`name = $${tIdx}`);
        transParams.push(name);
        tIdx++;
      }
      if (description !== null) {
        transUpdates.push(`description = $${tIdx}`);
        transParams.push(description);
        tIdx++;
      }
      if (transUpdates.length > 0) {
        transParams.push(productId, locale);
        const updated = await query(
          `UPDATE product_translations SET ${transUpdates.join(', ')} WHERE product_id = $${tIdx} AND locale = $${tIdx + 1}`,
          transParams
        );
        if (updated.rowCount === 0) {
          const insName = name !== null ? name : '';
          const insDesc = description !== null ? description : '';
          await query(
            `INSERT INTO product_translations (id, product_id, locale, name, description)
             VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
            [productId, locale, insName, insDesc]
          );
        }
      }
    }

    if (categoryIds !== undefined) {
      await query('DELETE FROM category_product WHERE product_id = $1', [productId]);
      for (const id of [...new Set(categoryIds)].filter(Boolean)) {
        try {
          await query('INSERT INTO category_product (product_id, category_id) VALUES ($1, $2)', [productId, id]);
        } catch (err) {
          if (err.code === '23503') return res.status(400).json({ message: 'Una categoría no es válida' });
          throw err;
        }
      }
    }
    if (materialIds !== undefined) {
      await query('DELETE FROM material_product WHERE product_id = $1', [productId]);
      for (const id of [...new Set(materialIds)].filter(Boolean)) {
        try {
          await query('INSERT INTO material_product (product_id, material_id) VALUES ($1, $2)', [productId, id]);
        } catch (err) {
          if (err.code === '23503') return res.status(400).json({ message: 'Un material no es válido' });
          throw err;
        }
      }
    }
    if (techniqueIds !== undefined) {
      await query('DELETE FROM product_technique WHERE product_id = $1', [productId]);
      for (const id of [...new Set(techniqueIds)].filter(Boolean)) {
        try {
          await query('INSERT INTO product_technique (product_id, technique_id) VALUES ($1, $2)', [productId, id]);
        } catch (err) {
          if (err.code === '23503') return res.status(400).json({ message: 'Una técnica no es válida' });
          throw err;
        }
      }
    }
    if (colorIds !== undefined) {
      await query('DELETE FROM color_product WHERE product_id = $1', [productId]);
      for (const id of [...new Set(colorIds)].filter(Boolean)) {
        try {
          await query('INSERT INTO color_product (product_id, color_id) VALUES ($1, $2)', [productId, id]);
        } catch (err) {
          if (err.code === '23503') return res.status(400).json({ message: 'Un color no es válido' });
          throw err;
        }
      }
    }

    const sql = `${buildProductSelect()} WHERE p.id = $2 LIMIT 1`;
    const result = await query(sql, [locale, productId]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Product patch error', error);
    res.status(500).json({ message: formatApiError('actualizar producto', error) });
  }
});

router.get('/:id/products/:productId/prices', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const vendorId = req.params.id;
  const productId = req.params.productId;
  try {
    const memberCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
    const productCheck = await query(
      'SELECT 1 FROM products WHERE id = $1 AND vendor_id = $2 LIMIT 1',
      [productId, vendorId]
    );
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    const result = await query(
      `SELECT id, product_id, price, start_date, end_date, created_at, updated_at
       FROM product_prices
       WHERE product_id = $1
       ORDER BY start_date DESC`,
      [productId]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Product prices list error', error);
    res.status(500).json({ message: formatApiError('listar precios', error) });
  }
});

router.post('/:id/products/:productId/prices', async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  const vendorId = req.params.id;
  const productId = req.params.productId;
  try {
    const memberCheck = await query(
      'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
      [vendorId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    }
    const productCheck = await query(
      'SELECT 1 FROM products WHERE id = $1 AND vendor_id = $2 LIMIT 1',
      [productId, vendorId]
    );
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    return res.status(500).json({ message: formatApiError('comprobar permiso', error) });
  }

  const body = req.body || {};
  const priceRaw = body.price;
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ message: 'price es requerido y debe ser un número mayor o igual a 0' });
  }

  let newStartDate;
  let newEndDate;
  if (body.start_date != null && body.start_date !== '') {
    const parsed = new Date(body.start_date);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ message: 'start_date no es una fecha válida' });
    }
    newStartDate = parsed.toISOString().slice(0, 10);
  } else {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    newStartDate = tomorrow.toISOString().slice(0, 10);
  }
  if (body.end_date != null && body.end_date !== '') {
    const parsed = new Date(body.end_date);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ message: 'end_date no es una fecha válida' });
    }
    newEndDate = parsed.toISOString().slice(0, 10);
  } else {
    newEndDate = PRICE_CONTRACT_END_DEFAULT;
  }
  if (newStartDate >= newEndDate) {
    return res.status(400).json({ message: 'start_date debe ser anterior a end_date' });
  }

  let previousEndDate = null;
  if (body.previous_end_date != null && body.previous_end_date !== '') {
    const parsed = new Date(body.previous_end_date);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ message: 'previous_end_date no es una fecha válida' });
    }
    previousEndDate = parsed.toISOString().slice(0, 10);
    if (previousEndDate >= newStartDate) {
      return res.status(400).json({ message: 'previous_end_date debe ser anterior a start_date del nuevo precio' });
    }
  }

  try {
    const openContract = await query(
      `SELECT id, end_date FROM product_prices
       WHERE product_id = $1 AND end_date >= $2
       ORDER BY start_date DESC LIMIT 1`,
      [productId, PRICE_CONTRACT_END_DEFAULT]
    );
    const openRow = openContract.rows[0];
    if (openRow) {
      const closeEndDate = previousEndDate || (() => {
        const d = new Date(newStartDate + 'T00:00:00.000Z');
        d.setUTCDate(d.getUTCDate() - 1);
        return d.toISOString().slice(0, 10);
      })();
      if (previousEndDate && closeEndDate >= newStartDate) {
        return res.status(400).json({ message: 'previous_end_date debe ser anterior a start_date del nuevo precio' });
      }
      await query(
        'UPDATE product_prices SET end_date = $1, updated_at = NOW() WHERE id = $2',
        [closeEndDate, openRow.id]
      );
    }

    const overlap = await query(
      `SELECT 1 FROM product_prices
       WHERE product_id = $1
         AND start_date <= $2
         AND end_date >= $3
       LIMIT 1`,
      [productId, newEndDate, newStartDate]
    );
    if (overlap.rows.length > 0) {
      return res.status(400).json({ message: 'Las fechas solapan con otro contrato de precio existente' });
    }

    const insertResult = await query(
      `INSERT INTO product_prices (id, product_id, price, start_date, end_date, created_at, updated_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING id, product_id, price, start_date, end_date, created_at, updated_at`,
      [productId, price, newStartDate, newEndDate]
    );
    res.status(201).json({ data: insertResult.rows[0] });
  } catch (error) {
    console.error('Product price create error', error);
    res.status(500).json({ message: formatApiError('crear precio', error) });
  }
});

async function ensureVendorProductAccess(req, res) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    res.status(401).json({ message: 'Token inválido o expirado' });
    return null;
  }
  const vendorId = req.params.id;
  const productId = req.params.productId;
  const memberCheck = await query(
    'SELECT 1 FROM vendor_users WHERE vendor_id = $1 AND user_id = $2 LIMIT 1',
    [vendorId, userId]
  );
  if (memberCheck.rows.length === 0) {
    res.status(404).json({ message: 'Vendor no encontrado o sin permiso' });
    return null;
  }
  const productCheck = await query(
    'SELECT 1 FROM products WHERE id = $1 AND vendor_id = $2 LIMIT 1',
    [productId, vendorId]
  );
  if (productCheck.rows.length === 0) {
    res.status(404).json({ message: 'Producto no encontrado' });
    return null;
  }
  return { vendorId, productId };
}

router.post('/:id/products/:productId/images', async (req, res) => {
  const access = await ensureVendorProductAccess(req, res);
  if (!access) return;
  const { productId } = access;
  const body = req.body || {};
  let imageData = body.image;
  if (!imageData || typeof imageData !== 'string') {
    return res.status(400).json({ message: 'image es requerido (base64 o data URL)' });
  }
  const match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
  const base64 = match ? match[2] : imageData;
  const ext = match && /jpeg|jpg|png|webp|gif/.test(match[1]) ? match[1].replace('jpeg', 'jpg') : 'jpg';
  let buf;
  try {
    buf = Buffer.from(base64, 'base64');
  } catch (e) {
    return res.status(400).json({ message: 'image no es un base64 válido' });
  }
  if (buf.length > 5 * 1024 * 1024) {
    return res.status(400).json({ message: 'La imagen no debe superar 5 MB' });
  }
  const dir = path.join(PRODUCTS_UPLOADS, productId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filename = `${require('crypto').randomUUID()}.${ext}`;
  const filePath = path.join(dir, filename);
  const relativePath = `products/${productId}/${filename}`;
  try {
    fs.writeFileSync(filePath, buf);
  } catch (err) {
    console.error('Product image write error', err);
    return res.status(500).json({ message: 'Error al guardar la imagen' });
  }
  let order = body.order != null && body.order !== '' ? Number(body.order) : null;
  if (order == null || !Number.isFinite(order)) {
    const maxOrder = await query(
      'SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM product_images WHERE product_id = $1',
      [productId]
    );
    order = maxOrder.rows[0]?.next_order ?? 0;
  }
  const isPrimary = body.is_primary === true || body.is_primary === 'true';
  const colorId = body.color_id && String(body.color_id).trim() ? String(body.color_id).trim() : null;
  try {
    let row;
    try {
      if (colorId) {
        await query(
          'UPDATE product_images SET color_id = NULL WHERE product_id = $1 AND color_id = $2',
          [productId, colorId]
        );
      }
      const insertResult = await query(
        `INSERT INTO product_images (id, product_id, image_path, "order", is_primary, color_id)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
         RETURNING id, product_id, image_path, "order", is_primary, color_id`,
        [productId, relativePath, order, isPrimary, colorId]
      );
      row = insertResult.rows[0];
    } catch (e) {
      if (e.code !== '42703') throw e;
      const insertResult = await query(
        `INSERT INTO product_images (id, product_id, image_path, "order", is_primary)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4)
         RETURNING id, product_id, image_path, "order", is_primary`,
        [productId, relativePath, order, isPrimary]
      );
      row = { ...insertResult.rows[0], color_id: colorId || null };
    }
    res.status(201).json({ data: row });
  } catch (err) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {}
    console.error('Product image insert error', err);
    res.status(500).json({ message: formatApiError('insertar imagen', err) });
  }
});

router.patch('/:id/products/:productId/images/:imageId', async (req, res) => {
  const access = await ensureVendorProductAccess(req, res);
  if (!access) return;
  const { productId } = access;
  const imageId = req.params.imageId;
  const body = req.body || {};
  const updates = [];
  const params = [];
  let paramIdx = 1;
  if (body.color_id !== undefined) {
    const colorId = body.color_id && String(body.color_id).trim() ? String(body.color_id).trim() : null;
    params.push(colorId);
    updates.push(`color_id = $${paramIdx}`);
    paramIdx++;
  }
  if (body.order !== undefined) {
    params.push(body.order == null ? null : Number(body.order));
    updates.push(`"order" = $${paramIdx}`);
    paramIdx++;
  }
  if (body.is_primary !== undefined) {
    params.push(body.is_primary === true || body.is_primary === 'true');
    updates.push(`is_primary = $${paramIdx}`);
    paramIdx++;
  }
  if (updates.length === 0) {
    return res.status(400).json({ message: 'Indica al menos un campo a actualizar: color_id, order, is_primary' });
  }
  try {
    const imageRow = await query(
      'SELECT id FROM product_images WHERE id = $1 AND product_id = $2',
      [imageId, productId]
    );
    if (imageRow.rows.length === 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }
    if (body.color_id !== undefined && body.color_id) {
      await query(
        'UPDATE product_images SET color_id = NULL WHERE product_id = $1 AND color_id = $2 AND id != $3',
        [productId, body.color_id, imageId]
      );
    }
    params.push(imageId);
    await query(
      `UPDATE product_images SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
      params
    );
    const result = await query(
      'SELECT id, product_id, image_path, "order", is_primary, color_id FROM product_images WHERE id = $1',
      [imageId]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Product image patch error', err);
    res.status(500).json({ message: formatApiError('actualizar imagen', err) });
  }
});

router.delete('/:id/products/:productId/images/:imageId', async (req, res) => {
  const access = await ensureVendorProductAccess(req, res);
  if (!access) return;
  const { productId } = access;
  const imageId = req.params.imageId;
  try {
    const row = await query(
      'SELECT id, image_path FROM product_images WHERE id = $1 AND product_id = $2',
      [imageId, productId]
    );
    if (row.rows.length === 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }
    const filePath = path.join(UPLOADS_DIR, row.rows[0].image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await query('DELETE FROM product_images WHERE id = $1', [imageId]);
    res.status(204).send();
  } catch (err) {
    console.error('Product image delete error', err);
    res.status(500).json({ message: formatApiError('eliminar imagen', err) });
  }
});

router.get('/:id/products', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildProductSelect()} WHERE p.vendor_id = $2 AND (COALESCE(p.status, 'approved') NOT IN ('cancelled')) ORDER BY (CASE WHEN COALESCE(p.status, 'approved') = 'archived' THEN 1 ELSE 0 END), p.created_at DESC`;

  try {
    const result = await query(sql, [locale, req.params.id]);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Vendor products error', error);
    res.status(500).json({ message: formatApiError('listar productos vendor', error) });
  }
});

module.exports = router;






