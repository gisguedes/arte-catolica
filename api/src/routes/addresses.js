const express = require('express');
const { query } = require('../db');

const router = express.Router();

const buildAddressSelect = () => `
  SELECT
    a.id,
    a.user_id,
    a.type,
    a.first_name,
    a.last_name,
    a.address_line_1,
    a.address_line_2,
    a.city,
    a.state,
    a.postal_code,
    a.country,
    a.phone,
    a.is_default,
    a.created_at,
    a.updated_at
  FROM addresses a
`;

router.get('/', async (req, res) => {
  const { user_id: userId } = req.query;
  const sql = `${buildAddressSelect()} ${userId ? 'WHERE a.user_id = $1' : ''} ORDER BY a.created_at DESC`;

  try {
    const result = await query(sql, userId ? [userId] : []);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Addresses list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const sql = `${buildAddressSelect()} WHERE a.id = $1 LIMIT 1`;

  try {
    const result = await query(sql, [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Address show error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/', async (req, res) => {
  const payload = req.body || {};
  if (!payload.user_id) {
    return res.status(400).json({ message: 'user_id es requerido' });
  }

  try {
    const result = await query(
      `INSERT INTO addresses (
        id, user_id, type, first_name, last_name, address_line_1, address_line_2,
        city, state, postal_code, country, phone, is_default, created_at, updated_at
      )
      VALUES (uuid_generate_v4(), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
      RETURNING id`,
      [
        payload.user_id,
        payload.type ?? 'shipping',
        payload.first_name,
        payload.last_name,
        payload.address_line_1,
        payload.address_line_2 ?? null,
        payload.city,
        payload.state ?? null,
        payload.postal_code,
        payload.country ?? 'ES',
        payload.phone ?? null,
        payload.is_default ?? false,
      ]
    );

    const address = await query(`${buildAddressSelect()} WHERE a.id = $1 LIMIT 1`, [
      result.rows[0].id,
    ]);
    res.status(201).json({ data: address.rows[0] });
  } catch (error) {
    console.error('Address create error', error);
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

  if (payload.type !== undefined) setField('type', payload.type);
  if (payload.first_name !== undefined) setField('first_name', payload.first_name);
  if (payload.last_name !== undefined) setField('last_name', payload.last_name);
  if (payload.address_line_1 !== undefined) setField('address_line_1', payload.address_line_1);
  if (payload.address_line_2 !== undefined) setField('address_line_2', payload.address_line_2);
  if (payload.city !== undefined) setField('city', payload.city);
  if (payload.state !== undefined) setField('state', payload.state);
  if (payload.postal_code !== undefined) setField('postal_code', payload.postal_code);
  if (payload.country !== undefined) setField('country', payload.country);
  if (payload.phone !== undefined) setField('phone', payload.phone);
  if (payload.is_default !== undefined) setField('is_default', payload.is_default);

  try {
    if (updates.length) {
      updates.push('updated_at = NOW()');
      await query(`UPDATE addresses SET ${updates.join(', ')} WHERE id = $1`, values);
    }

    const address = await query(`${buildAddressSelect()} WHERE a.id = $1 LIMIT 1`, [
      req.params.id,
    ]);
    if (!address.rows[0]) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.json({ data: address.rows[0] });
  } catch (error) {
    console.error('Address update error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.patch('/:id', async (req, res) => {
  return router.handle({ ...req, method: 'PUT' }, res);
});

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM addresses WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Address delete error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

