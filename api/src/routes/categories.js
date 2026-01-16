const express = require('express');
const { query } = require('../db');
const { getLocale } = require('../utils');

const router = express.Router();

const buildCategorySelect = () => `
  SELECT
    c.id,
    c.slug,
    c.is_active,
    c.created_at,
    c.updated_at,
    COALESCE(ct.name, '') AS name,
    COALESCE(ct.description, '') AS description
  FROM categories c
  LEFT JOIN category_translations ct
    ON ct.category_id = c.id AND ct.locale = $1
`;

router.get('/', async (req, res) => {
  const locale = getLocale(req);
  const includeInactive = req.query.include_inactive === 'true';
  const sql = `${buildCategorySelect()} ${
    includeInactive ? '' : 'WHERE c.is_active = true'
  } ORDER BY c.created_at DESC`;

  try {
    const result = await query(sql, [locale]);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Categories list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildCategorySelect()} WHERE c.id = $2 LIMIT 1`;

  try {
    const result = await query(sql, [locale, req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Category show error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

