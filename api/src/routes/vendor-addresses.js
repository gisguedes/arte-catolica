const express = require('express');
const { query } = require('../db');

const router = express.Router();

const buildSelect = () => `
  SELECT
    va.id,
    va.vendor_id,
    va.alias,
    va.address_line_1,
    va.address_line_2,
    va.city,
    va.postal_code,
    va.country,
    va.phone,
    va.created_at,
    va.updated_at
  FROM vendor_addresses va
`;

router.get('/', async (req, res) => {
  const { vendor_id: vendorId } = req.query;
  const sql = `${buildSelect()} ${vendorId ? 'WHERE va.vendor_id = $1' : ''} ORDER BY va.alias ASC`;

  try {
    const result = await query(sql, vendorId ? [vendorId] : []);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Vendor addresses list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const sql = `${buildSelect()} WHERE va.id = $1 LIMIT 1`;

  try {
    const result = await query(sql, [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Vendor address show error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/', async (req, res) => {
  const payload = req.body || {};
  if (!payload.vendor_id) {
    return res.status(400).json({ message: 'vendor_id es requerido' });
  }

  try {
    const result = await query(
      `INSERT INTO vendor_addresses (
        id, vendor_id, alias, address_line_1, address_line_2,
        city, postal_code, country, phone, created_at, updated_at
      )
      VALUES (uuid_generate_v4(), $1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      RETURNING id`,
      [
        payload.vendor_id,
        payload.alias ?? 'main',
        payload.address_line_1 ?? null,
        payload.address_line_2 ?? null,
        payload.city ?? null,
        payload.postal_code ?? null,
        payload.country ?? null,
        payload.phone ?? null,
      ]
    );

    const address = await query(`${buildSelect()} WHERE va.id = $1 LIMIT 1`, [
      result.rows[0].id,
    ]);
    res.status(201).json({ data: address.rows[0] });
  } catch (error) {
    console.error('Vendor address create error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.put('/:id', async (req, res) => {
  const payload = req.body || {};
  const updates = [];
  const values = [req.params.id];

  const setField = (field, value) => {
    values.push(value);
    updates.push(`${field} = $${values.length}`);
  };

  if (payload.alias !== undefined) setField('alias', payload.alias);
  if (payload.address_line_1 !== undefined) setField('address_line_1', payload.address_line_1);
  if (payload.address_line_2 !== undefined) setField('address_line_2', payload.address_line_2);
  if (payload.city !== undefined) setField('city', payload.city);
  if (payload.postal_code !== undefined) setField('postal_code', payload.postal_code);
  if (payload.country !== undefined) setField('country', payload.country);
  if (payload.phone !== undefined) setField('phone', payload.phone);

  try {
    if (updates.length) {
      updates.push('updated_at = NOW()');
      await query(`UPDATE vendor_addresses SET ${updates.join(', ')} WHERE id = $1`, values);
    }

    const address = await query(`${buildSelect()} WHERE va.id = $1 LIMIT 1`, [
      req.params.id,
    ]);
    if (!address.rows[0]) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.json({ data: address.rows[0] });
  } catch (error) {
    console.error('Vendor address update error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.patch('/:id', (req, res) => router.handle({ ...req, method: 'PUT' }, res));

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM vendor_addresses WHERE id = $1 RETURNING id', [
      req.params.id,
    ]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Vendor address delete error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
