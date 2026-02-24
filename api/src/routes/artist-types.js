const express = require('express');
const { query } = require('../db');
const { getLocale } = require('../utils');

const router = express.Router();

const buildArtistTypeSelect = () => `
  SELECT
    at.id,
    at.alias,
    COALESCE(att.name, at.alias, '') AS name,
    COALESCE(att.slug, at.alias, '') AS slug,
    att.description,
    at.created_at,
    at.updated_at
  FROM artist_types at
  LEFT JOIN artist_type_translations att
    ON att.artist_type_id = at.id AND att.locale = $1
`;

router.get('/', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildArtistTypeSelect()} ORDER BY att.name ASC NULLS LAST, at.alias ASC`;

  try {
    const result = await query(sql, [locale]);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Artist types list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const locale = getLocale(req);
  const sql = `${buildArtistTypeSelect()} WHERE at.id = $2 LIMIT 1`;

  try {
    const result = await query(sql, [locale, req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Tipo de artista no encontrado' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Artist type show error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;






