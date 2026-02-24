const express = require('express');
const { query } = require('../db');
const { getLocale } = require('../utils');

const router = express.Router();

const buildMaterialSelect = () => `
  SELECT
    m.id,
    m.alias,
    COALESCE(mt.slug, m.alias, '') AS slug,
    m.is_active,
    m.created_at,
    m.updated_at,
    COALESCE(mt.name, '') AS name,
    (SELECT COALESCE(jsonb_agg(mct.name ORDER BY mc.sort_order), '[]'::jsonb)
     FROM material_characteristics mc
     LEFT JOIN material_characteristic_translations mct ON mct.material_characteristic_id = mc.id AND mct.locale = $1
     WHERE mc.material_id = m.id) AS characteristics
  FROM materials m
  LEFT JOIN material_translations mt
    ON mt.material_id = m.id AND mt.locale = $1
`;

router.get('/', async (req, res) => {
  const locale = getLocale(req);
  const includeInactive = req.query.include_inactive === 'true';
  const sql = `${buildMaterialSelect()} ${
    includeInactive ? '' : 'WHERE m.is_active = true'
  } ORDER BY m.created_at DESC`;

  try {
    const result = await query(sql, [locale]);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Materials list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildMaterialSelect()} WHERE m.id = $2 LIMIT 1`;

  try {
    const result = await query(sql, [locale, req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Material no encontrado' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Material show error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/** Actualizar material: name en material_translations; characteristics en material_characteristics (array, una por línea) */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const locale = getLocale(req);
  const { name, characteristics } = req.body || {};

  try {
    const existing = await query('SELECT id FROM materials WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ message: 'Material no encontrado' });
    }

    if (name !== undefined) {
      const newName = String(name).trim();
      await query(
          `INSERT INTO material_translations (material_id, locale, name)
           VALUES ($1, $2, $3)
           ON CONFLICT (material_id, locale) DO UPDATE SET
             name = EXCLUDED.name,
             updated_at = NOW()`,
        [id, locale, newName]
      );
    }

    if (characteristics !== undefined) {
      await query(
        'DELETE FROM material_characteristic_translations WHERE material_characteristic_id IN (SELECT id FROM material_characteristics WHERE material_id = $1)',
        [id]
      );
      await query('DELETE FROM material_characteristics WHERE material_id = $1', [id]);
      const list = Array.isArray(characteristics) ? characteristics : [];
      for (let i = 0; i < list.length; i++) {
        const name = String(list[i]).trim();
        if (!name) continue;
        const slug = name.toLowerCase()
          .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
          .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const ins = await query(
          'INSERT INTO material_characteristics (material_id, alias, sort_order) VALUES ($1, $2, $3) RETURNING id',
          [id, slug || `char-${i}`, i]
        );
        const charId = ins.rows[0].id;
        await query(
          `INSERT INTO material_characteristic_translations (material_characteristic_id, locale, name, slug)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (material_characteristic_id, locale) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug`,
          [charId, locale, name, slug || `char-${i}`]
        );
      }
    }

    const result = await query(
      `${buildMaterialSelect()} WHERE m.id = $2 LIMIT 1`,
      [locale, id]
    );
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Material update error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/** Crear material (nombre obligatorio; slug opcional, se genera desde el nombre) */
router.post('/', async (req, res) => {
  const locale = getLocale(req);
  const { name, slug: slugInput, characteristics } = req.body || {};

  if (!name || String(name).trim() === '') {
    return res.status(400).json({ message: 'El nombre del material es obligatorio' });
  }

  const slug =
    slugInput && String(slugInput).trim()
      ? String(slugInput).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : String(name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9áéíóúñ]/g, '').replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');

  try {
    const insert = await query(
      `INSERT INTO materials (alias) VALUES ($1) RETURNING id`,
      [slug]
    );
    const materialId = insert.rows[0].id;

    await query(
      `INSERT INTO material_translations (material_id, locale, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (material_id, locale) DO UPDATE SET
         name = EXCLUDED.name,
         updated_at = NOW()`,
      [materialId, locale, String(name).trim()]
    );

    const charList = Array.isArray(characteristics) ? characteristics : (characteristics && String(characteristics).trim() ? String(characteristics).trim().split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : []);
    for (let i = 0; i < charList.length; i++) {
      const name = String(charList[i]).trim();
      if (!name) continue;
      const slug = name.toLowerCase()
          .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
          .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const ins = await query(
        'INSERT INTO material_characteristics (material_id, alias, sort_order) VALUES ($1, $2, $3) RETURNING id',
        [materialId, slug || `char-${i}`, i]
      );
      const charId = ins.rows[0].id;
      await query(
        `INSERT INTO material_characteristic_translations (material_characteristic_id, locale, name, slug)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (material_characteristic_id, locale) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug`,
        [charId, locale, name, slug || `char-${i}`]
      );
    }

    const result = await query(
      `${buildMaterialSelect()} WHERE m.id = $2 LIMIT 1`,
      [locale, materialId]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un material con ese slug' });
    }
    console.error('Material create error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;






