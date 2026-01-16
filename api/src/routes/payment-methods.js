const express = require('express');
const { query } = require('../db');

const router = express.Router();

const buildPaymentSelect = () => `
  SELECT
    pm.id,
    pm.user_id,
    pm.type,
    pm.provider,
    pm.last_four,
    pm.cardholder_name,
    pm.expires_at,
    pm.is_default,
    pm.metadata,
    pm.created_at,
    pm.updated_at
  FROM payment_methods pm
`;

router.get('/', async (req, res) => {
  const { user_id: userId } = req.query;
  const sql = `${buildPaymentSelect()} ${
    userId ? 'WHERE pm.user_id = $1' : ''
  } ORDER BY pm.created_at DESC`;

  try {
    const result = await query(sql, userId ? [userId] : []);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Payment methods list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const sql = `${buildPaymentSelect()} WHERE pm.id = $1 LIMIT 1`;

  try {
    const result = await query(sql, [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Método de pago no encontrado' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Payment method show error', error);
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
      `INSERT INTO payment_methods (
        id, user_id, type, provider, last_four, cardholder_name, expires_at,
        is_default, metadata, created_at, updated_at
      )
      VALUES (uuid_generate_v4(), $1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      RETURNING id`,
      [
        payload.user_id,
        payload.type ?? 'card',
        payload.provider ?? null,
        payload.last_four ?? null,
        payload.cardholder_name ?? null,
        payload.expires_at ?? null,
        payload.is_default ?? false,
        payload.metadata ?? null,
      ]
    );

    const payment = await query(`${buildPaymentSelect()} WHERE pm.id = $1 LIMIT 1`, [
      result.rows[0].id,
    ]);
    res.status(201).json({ data: payment.rows[0] });
  } catch (error) {
    console.error('Payment method create error', error);
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
  if (payload.provider !== undefined) setField('provider', payload.provider);
  if (payload.last_four !== undefined) setField('last_four', payload.last_four);
  if (payload.cardholder_name !== undefined) setField('cardholder_name', payload.cardholder_name);
  if (payload.expires_at !== undefined) setField('expires_at', payload.expires_at);
  if (payload.is_default !== undefined) setField('is_default', payload.is_default);
  if (payload.metadata !== undefined) setField('metadata', payload.metadata);

  try {
    if (updates.length) {
      updates.push('updated_at = NOW()');
      await query(`UPDATE payment_methods SET ${updates.join(', ')} WHERE id = $1`, values);
    }

    const payment = await query(`${buildPaymentSelect()} WHERE pm.id = $1 LIMIT 1`, [
      req.params.id,
    ]);
    if (!payment.rows[0]) {
      return res.status(404).json({ message: 'Método de pago no encontrado' });
    }
    res.json({ data: payment.rows[0] });
  } catch (error) {
    console.error('Payment method update error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.patch('/:id', async (req, res) => {
  return router.handle({ ...req, method: 'PUT' }, res);
});

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM payment_methods WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Payment method delete error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;



