const express = require('express');
const { query } = require('../db');
const { getLocale } = require('../utils');

const router = express.Router();

const buildTechniqueSelect = () => `
  SELECT
    t.id,
    t.alias,
    COALESCE(tt.name, t.alias, '') AS name,
    COALESCE(tt.slug, t.alias, '') AS slug,
    tt.description,
    t.created_at,
    t.updated_at
  FROM techniques t
  LEFT JOIN technique_translations tt
    ON tt.technique_id = t.id AND tt.locale = $1
`;

router.get('/', async (req, res) => {
  const locale = getLocale(req);
  const { slug } = req.query;

  let sql;
  const params = [locale];

  if (slug) {
    params.push(slug);
    sql = `${buildTechniqueSelect()} WHERE tt.slug = $2 LIMIT 1`;
  } else {
    sql = `${buildTechniqueSelect()} ORDER BY tt.name ASC NULLS LAST, t.alias ASC`;
  }

  try {
    const result = await query(sql, params);
    if (slug) {
      if (!result.rows[0]) {
        return res.status(404).json({ message: 'Técnica no encontrada' });
      }
      res.json({ data: result.rows[0] });
    } else {
      res.json({ data: result.rows });
    }
  } catch (error) {
    console.error('Techniques list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildTechniqueSelect()} WHERE t.id = $2 LIMIT 1`;

  try {
    const result = await query(sql, [locale, req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Técnica no encontrada' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Technique show error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
