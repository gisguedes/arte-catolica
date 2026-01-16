const express = require('express');
const { query } = require('../db');
const { getLocale } = require('../utils');

const router = express.Router();

const buildMaterialSelect = () => `
  SELECT
    m.id,
    m.slug,
    m.is_active,
    m.created_at,
    m.updated_at,
    COALESCE(mt.name, '') AS name
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

module.exports = router;



