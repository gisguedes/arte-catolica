const express = require('express');
const { query } = require('../db');

const router = express.Router();

const buildColorSelect = () => `
  SELECT
    c.id,
    c.name,
    c.hex,
    c.is_active,
    c.created_at,
    c.updated_at
  FROM colors c
`;

router.get('/', async (req, res) => {
  const includeInactive = req.query.include_inactive === 'true';
  const sql = `${buildColorSelect()} ${
    includeInactive ? '' : 'WHERE c.is_active = true'
  } ORDER BY c.created_at DESC`;

  try {
    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Colors list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const sql = `${buildColorSelect()} WHERE c.id = $1 LIMIT 1`;

  try {
    const result = await query(sql, [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Color no encontrado' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Color show error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;



