const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { getLocale, formatApiError } = require('../utils');
const {
  VENDOR_USER_ROLES,
  VENDOR_ASSIGNABLE_ROLES,
  isAssignableVendorRole,
} = require('../constants/vendor-roles');

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






