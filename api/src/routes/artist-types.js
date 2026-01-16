const express = require('express');
const { query } = require('../db');

const router = express.Router();

const buildArtistTypeSelect = () => `
  SELECT
    at.id,
    at.slug,
    at.name,
    at.created_at,
    at.updated_at
  FROM artist_types at
`;

router.get('/', async (req, res) => {
  const sql = `${buildArtistTypeSelect()} ORDER BY at.name ASC`;

  try {
    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Artist types list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const sql = `${buildArtistTypeSelect()} WHERE at.id = $1 LIMIT 1`;

  try {
    const result = await query(sql, [req.params.id]);
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

