const express = require('express');
const { query } = require('../db');
const { getLocale } = require('../utils');

const router = express.Router();

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseTimeToParts = (timeValue) => {
  if (!timeValue) {
    return { hours: 23, minutes: 59 };
  }
  const value = typeof timeValue === 'string' ? timeValue : String(timeValue);
  const [hours, minutes] = value.split(':').map((part) => Number(part ?? 0));
  return {
    hours: Number.isFinite(hours) ? hours : 23,
    minutes: Number.isFinite(minutes) ? minutes : 59,
  };
};

const buildShipDatesFromDays = (startDate, endDate, shippingDays) => {
  const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const allowed = new Set((shippingDays || []).map((day) => day.toLowerCase()));
  const dates = [];
  for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
    const dayKey = dayMap[cursor.getDay()];
    if (allowed.size === 0 || allowed.has(dayKey)) {
      dates.push(new Date(cursor));
    }
  }
  return dates;
};

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
    ) AS image,
    CASE
      WHEN v.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', v.id,
        'name', v.name,
        'surname', v.surname,
        'short_description', COALESCE(vt.short_description, ''),
        'description', COALESCE(vt.description, ''),
        'image', v.image,
        'website', v.website,
        'social_links', COALESCE(v.social_links, '[]'::jsonb),
        'city', v.city,
        'country', v.country,
        'postal_code', v.postal_code,
        'opening_date', v.opening_date,
        'artist_types', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', at.id,
            'alias', at.alias,
            'slug', COALESCE(att.slug, at.alias, ''),
            'name', COALESCE(att.name, at.alias, '')
          )), '[]'::jsonb)
          FROM artist_type_vendor atv
          JOIN artist_types at ON at.id = atv.artist_type_id
          LEFT JOIN artist_type_translations att ON att.artist_type_id = at.id AND att.locale = $1
          WHERE atv.vendor_id = v.id
        ),
        'status', COALESCE(v.status, 'approved'),
        'created_at', v.created_at,
        'updated_at', v.updated_at
      )
    END AS vendor,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', c.id,
          'slug', COALESCE(ct.slug, ''),
          'name', COALESCE(ct.name, ''),
          'description', COALESCE(ct.description, ''),
          'image_url', c.image_url,
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
          'slug', COALESCE(mt.slug, m.alias, ''),
          'name', COALESCE(mt.name, ''),
          'characteristics', (SELECT COALESCE(jsonb_agg(mct.name ORDER BY mc.sort_order), '[]'::jsonb) FROM material_characteristics mc LEFT JOIN material_characteristic_translations mct ON mct.material_characteristic_id = mc.id AND mct.locale = $1 WHERE mc.material_id = m.id),
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
    ) AS images,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', t.id,
          'alias', t.alias,
          'slug', COALESCE(tt.slug, t.alias, ''),
          'name', COALESCE(tt.name, t.alias, ''),
          'description', tt.description
        ))
        FROM product_technique pt
        JOIN techniques t ON t.id = pt.technique_id
        LEFT JOIN technique_translations tt ON tt.technique_id = t.id AND tt.locale = $1
        WHERE pt.product_id = p.id
      ),
      '[]'::jsonb
    ) AS techniques
  FROM products p
  LEFT JOIN product_translations pt
    ON pt.product_id = p.id AND pt.locale = $1
  LEFT JOIN vendors v ON v.id = p.vendor_id
  LEFT JOIN vendor_translations vt ON vt.vendor_id = v.id AND vt.locale = $1
`;

router.get('/', async (req, res) => {
  const locale = getLocale(req);
  const {
    category_slug: categorySlug,
    category_id: categoryId,
    technique_slug: techniqueSlug,
    material_slug: materialSlug,
    characteristic_slug: characteristicSlug,
  } = req.query;

  const params = [locale];
  let whereClause = "(COALESCE(p.status, 'approved') IN ('approved', 'archived'))";

  if (materialSlug) {
    params.push(Array.isArray(materialSlug) ? materialSlug : [materialSlug]);
    const idx = params.length;
    whereClause += ` AND EXISTS (
      SELECT 1 FROM material_product mp
      JOIN materials m ON m.id = mp.material_id
      LEFT JOIN material_translations mt ON mt.material_id = m.id AND mt.locale = $1
      WHERE mp.product_id = p.id AND (COALESCE(mt.slug, m.alias, '') = ANY($${idx}))
    )`;
  }

  if (characteristicSlug) {
    params.push(Array.isArray(characteristicSlug) ? characteristicSlug : [characteristicSlug]);
    const idx = params.length;
    whereClause += ` AND EXISTS (
      SELECT 1 FROM material_product mp
      JOIN material_characteristics mc ON mc.material_id = mp.material_id
      LEFT JOIN material_characteristic_translations mct
        ON mct.material_characteristic_id = mc.id AND mct.locale = $1
      WHERE mp.product_id = p.id AND (COALESCE(mct.slug, mc.alias, '') = ANY($${idx}))
    )`;
  }

  if (techniqueSlug) {
    params.push(techniqueSlug);
    whereClause += ` AND EXISTS (
      SELECT 1
      FROM product_technique pt
      JOIN techniques t ON t.id = pt.technique_id
      JOIN technique_translations tt ON tt.technique_id = t.id AND tt.locale = $1
      WHERE pt.product_id = p.id AND tt.slug = $${params.length}
    )`;
  }

  if (categorySlug) {
    params.push(categorySlug);
    whereClause += ` AND EXISTS (
      SELECT 1
      FROM category_product cp
      JOIN categories c ON c.id = cp.category_id
      JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = $1
      WHERE cp.product_id = p.id AND ct.slug = $${params.length}
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

  const sql = `${buildProductSelect()} WHERE ${whereClause} ORDER BY (CASE WHEN COALESCE(p.status, 'approved') = 'archived' THEN 1 ELSE 0 END), p.created_at DESC`;

  try {
    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Products list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/status', async (req, res) => {
  const ids = req.query.ids;
  const idList = Array.isArray(ids) ? ids : ids ? String(ids).split(',') : [];
  if (idList.length === 0) {
    return res.json({ data: {} });
  }
  try {
    const result = await query(
      `SELECT id, COALESCE(status, 'approved') AS status FROM products WHERE id = ANY($1)`,
      [idList]
    );
    const data = {};
    for (const row of result.rows) {
      data[row.id] = row.status;
    }
    res.json({ data });
  } catch (error) {
    console.error('Products status error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id/shipping-calendar', async (req, res) => {
  const {
    destination_country: destinationCountry,
    destination_postal_code: destinationPostalCode,
    destination_region: destinationRegion,
  } = req.query;

  try {
    const productResult = await query(
      `SELECT p.id, p.vendor_id, v.city, v.postal_code, v.country
       FROM products p
       JOIN vendors v ON v.id = p.vendor_id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (!productResult.rows[0]) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const productRow = productResult.rows[0];
    const vendorId = productRow.vendor_id;

    const [vendorPolicyResult, productPolicyResult] = await Promise.all([
      query('SELECT * FROM vendor_shipping_policy WHERE vendor_id = $1 LIMIT 1', [vendorId]),
      query('SELECT * FROM product_shipping_policy WHERE product_id = $1 LIMIT 1', [req.params.id]),
    ]);

    const vendorPolicy = vendorPolicyResult.rows[0] || null;
    const productPolicy = productPolicyResult.rows[0] || null;

    // Sin política de envío (ni vendor ni producto) → no hay fechas disponibles
    if (!vendorPolicy && !productPolicy) {
      return res.json({
        data: {
          origin_country: productRow.country,
          origin_postal_code: productRow.postal_code,
          destination_country: productRow.country,
          destination_postal_code: productRow.postal_code,
          destination_region: null,
          ship_dates: [],
          blocked_dates: [],
          default_ship_date: null,
          carrier_id: null,
          transit_days_min: 2,
          transit_days_max: 5,
        },
      });
    }

    const policy = productPolicy?.override_vendor_policy
      ? { ...(vendorPolicy || {}), ...productPolicy }
      : vendorPolicy || productPolicy || {};

    const preparationDays = Number(policy.preparation_days ?? 0);
    const extraPreparationDays = Number(policy.extra_preparation_days ?? 0);
    const shippingDays = policy.shipping_days || [];
    const shippingDates = policy.shipping_dates || [];
    const dailyCapacity = policy.daily_ship_capacity ?? null;
    const hourSalesClose = policy.hour_sales_close;

    const originCountry = policy.origin_country || productRow.country;
    const originPostalCode = policy.origin_postal_code || productRow.postal_code;
    const originRegion = policy.origin_region || null;
    const destinationCountryResolved = destinationCountry || originCountry;
    const destinationPostalCodeResolved = destinationPostalCode || originPostalCode;

    const now = new Date();
    const earliestDate = addDays(startOfDay(now), preparationDays + extraPreparationDays);
    const endDate = addDays(earliestDate, 60);

    let candidateDates = [];
    if (Array.isArray(shippingDates) && shippingDates.length > 0) {
      candidateDates = shippingDates
        .map((date) => new Date(date))
        .filter((date) => date >= earliestDate && date <= endDate);
    } else {
      candidateDates = buildShipDatesFromDays(earliestDate, endDate, shippingDays);
    }

    const { hours, minutes } = parseTimeToParts(hourSalesClose);
    candidateDates = candidateDates.filter((date) => {
      const cutoff = new Date(date);
      cutoff.setDate(cutoff.getDate() - 1);
      cutoff.setHours(hours, minutes, 0, 0);
      return now <= cutoff;
    });

    const dateKeys = candidateDates.map((date) => formatDateKey(date));

    const capacityResult = await query(
      `SELECT ship_date, product_id, vendor_id, max_capacity, current_booked
       FROM shipping_capacity_date
       WHERE ship_date BETWEEN $1 AND $2
         AND (product_id = $3 OR (product_id IS NULL AND vendor_id = $4))`,
      [formatDateKey(earliestDate), formatDateKey(endDate), req.params.id, vendorId]
    );

    const productCapacityMap = new Map();
    const vendorCapacityMap = new Map();

    for (const row of capacityResult.rows) {
      const key = formatDateKey(new Date(row.ship_date));
      if (row.product_id) {
        productCapacityMap.set(key, row);
      } else {
        vendorCapacityMap.set(key, row);
      }
    }

    const availableDates = [];
    const blockedDates = [];

    for (const key of dateKeys) {
      const productCapacity = productCapacityMap.get(key);
      const vendorCapacity = vendorCapacityMap.get(key);
      const maxCapacity = productCapacity?.max_capacity ?? vendorCapacity?.max_capacity ?? dailyCapacity;
      const booked = productCapacity?.current_booked ?? vendorCapacity?.current_booked ?? 0;
      if (maxCapacity !== null && booked >= Number(maxCapacity)) {
        blockedDates.push(key);
      } else {
        availableDates.push(key);
      }
    }

    const carrierId =
      (Array.isArray(policy.allowed_carrier_ids) && policy.allowed_carrier_ids[0]) ||
      policy.default_carrier_id ||
      null;

    const zoneResult = await query(
      `SELECT czt.transit_days_min, czt.transit_days_max
       FROM shipping_zone z
       JOIN carrier_zone_transit czt ON czt.zone_id = z.id
       WHERE z.origin_country = $1
         AND z.destination_country = $2
         AND ($3::uuid IS NULL OR czt.carrier_id = $3)
         AND ($4::text IS NULL OR z.origin_region = $4 OR z.origin_region IS NULL)
         AND ($5::text IS NULL OR z.destination_region = $5 OR z.destination_region IS NULL)
       ORDER BY (z.origin_region IS NULL) ASC, (z.destination_region IS NULL) ASC
       LIMIT 1`,
      [originCountry, destinationCountryResolved, carrierId, originRegion, destinationRegion || null]
    );

    const transitDaysMin = zoneResult.rows[0]?.transit_days_min ?? 2;
    const transitDaysMax = zoneResult.rows[0]?.transit_days_max ?? 5;

    res.json({
      data: {
        origin_country: originCountry,
        origin_postal_code: originPostalCode,
        destination_country: destinationCountryResolved,
        destination_postal_code: destinationPostalCodeResolved,
        destination_region: destinationRegion || null,
        ship_dates: availableDates,
        blocked_dates: blockedDates,
        default_ship_date: availableDates[0] || null,
        carrier_id: carrierId,
        transit_days_min: transitDaysMin,
        transit_days_max: transitDaysMax,
      },
    });
  } catch (error) {
    console.error('Shipping calendar error', error);
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




