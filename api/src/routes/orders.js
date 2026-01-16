const express = require('express');
const { query } = require('../db');

const router = express.Router();

const buildOrderSelect = () => `
  SELECT
    o.id,
    o.user_id,
    o.address_id,
    o.payment_method_id,
    o.order_number,
    o.status,
    o.subtotal,
    o.tax,
    o.shipping_cost,
    o.total,
    o.notes,
    o.created_at,
    o.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
        )
        FROM order_items oi
        WHERE oi.order_id = o.id
      ),
      '[]'::jsonb
    ) AS items,
    (
      SELECT jsonb_build_object(
        'id', a.id,
        'user_id', a.user_id,
        'type', a.type,
        'first_name', a.first_name,
        'last_name', a.last_name,
        'address_line_1', a.address_line_1,
        'address_line_2', a.address_line_2,
        'city', a.city,
        'state', a.state,
        'postal_code', a.postal_code,
        'country', a.country,
        'phone', a.phone,
        'is_default', a.is_default,
        'created_at', a.created_at,
        'updated_at', a.updated_at
      )
      FROM addresses a
      WHERE a.id = o.address_id
    ) AS address,
    (
      SELECT jsonb_build_object(
        'id', pm.id,
        'user_id', pm.user_id,
        'type', pm.type,
        'provider', pm.provider,
        'last_four', pm.last_four,
        'cardholder_name', pm.cardholder_name,
        'expires_at', pm.expires_at,
        'is_default', pm.is_default,
        'metadata', pm.metadata,
        'created_at', pm.created_at,
        'updated_at', pm.updated_at
      )
      FROM payment_methods pm
      WHERE pm.id = o.payment_method_id
    ) AS payment_method
  FROM orders o
`;

const generateOrderNumber = () =>
  `ORD-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.floor(
    Math.random() * 9000 + 1000
  )}`;

router.get('/', async (req, res) => {
  const { user_id: userId } = req.query;
  const sql = `${buildOrderSelect()} ${userId ? 'WHERE o.user_id = $1' : ''} ORDER BY o.created_at DESC`;

  try {
    const result = await query(sql, userId ? [userId] : []);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Orders list error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  const sql = `${buildOrderSelect()} WHERE o.id = $1 LIMIT 1`;

  try {
    const result = await query(sql, [req.params.id]);
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Order show error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/', async (req, res) => {
  const payload = req.body || {};

  if (!payload.user_id || !payload.address_id || !payload.payment_method_id) {
    return res.status(400).json({ message: 'user_id, address_id y payment_method_id son requeridos' });
  }

  const items = payload.items || [];
  const subtotal =
    payload.subtotal ??
    items.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0);
  const tax = payload.tax ?? 0;
  const shippingCost = payload.shipping_cost ?? 0;
  const total = payload.total ?? subtotal + tax + shippingCost;

  try {
    const orderResult = await query(
      `INSERT INTO orders (
        id, user_id, address_id, payment_method_id, order_number, status,
        subtotal, tax, shipping_cost, total, notes, created_at, updated_at
      )
      VALUES (uuid_generate_v4(), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
      RETURNING id`,
      [
        payload.user_id,
        payload.address_id,
        payload.payment_method_id,
        payload.order_number || generateOrderNumber(),
        payload.status || 'pending',
        subtotal,
        tax,
        shippingCost,
        total,
        payload.notes ?? null,
      ]
    );

    const orderId = orderResult.rows[0].id;
    for (const item of items) {
      const unitPrice = Number(item.unit_price || 0);
      const quantity = Number(item.quantity || 0);
      const totalPrice = item.total_price ?? unitPrice * quantity;
      await query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1,$2,$3,$4,$5,NOW(),NOW())`,
        [orderId, item.product_id, quantity, unitPrice, totalPrice]
      );
    }

    const order = await query(`${buildOrderSelect()} WHERE o.id = $1 LIMIT 1`, [orderId]);
    res.status(201).json({ data: order.rows[0] });
  } catch (error) {
    console.error('Order create error', error);
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

  if (payload.status !== undefined) setField('status', payload.status);
  if (payload.subtotal !== undefined) setField('subtotal', payload.subtotal);
  if (payload.tax !== undefined) setField('tax', payload.tax);
  if (payload.shipping_cost !== undefined) setField('shipping_cost', payload.shipping_cost);
  if (payload.total !== undefined) setField('total', payload.total);
  if (payload.notes !== undefined) setField('notes', payload.notes);

  try {
    if (updates.length) {
      updates.push('updated_at = NOW()');
      await query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $1`, values);
    }

    if (payload.items) {
      await query('DELETE FROM order_items WHERE order_id = $1', [req.params.id]);
      for (const item of payload.items) {
        const unitPrice = Number(item.unit_price || 0);
        const quantity = Number(item.quantity || 0);
        const totalPrice = item.total_price ?? unitPrice * quantity;
        await query(
          `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, created_at, updated_at)
           VALUES (uuid_generate_v4(), $1,$2,$3,$4,$5,NOW(),NOW())`,
          [req.params.id, item.product_id, quantity, unitPrice, totalPrice]
        );
      }
    }

    const order = await query(`${buildOrderSelect()} WHERE o.id = $1 LIMIT 1`, [req.params.id]);
    if (!order.rows[0]) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    res.json({ data: order.rows[0] });
  } catch (error) {
    console.error('Order update error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.patch('/:id', async (req, res) => {
  return router.handle({ ...req, method: 'PUT' }, res);
});

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Order delete error', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;

