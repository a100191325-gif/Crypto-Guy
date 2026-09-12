'use strict';

const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/* ============== Create investment ============== */
router.post('/', authenticate, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { plan_name, amount, daily_profit } = req.body;

    if (!plan_name) {
      conn.release();
      return res.status(400).json({ success: false, message: 'plan_name is required.' });
    }

    const valueAmount = Number(amount);
    const valueProfit = Number(daily_profit);

    if (!valueAmount || valueAmount <= 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'amount must be positive.' });
    }
    if (!valueProfit || valueProfit <= 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'daily_profit must be positive.' });
    }

    await conn.beginTransaction();

    const [userRows] = await conn.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
    if (userRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (Number(userRows[0].balance) < valueAmount) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }

    // خصم الرصيد
    await conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [valueAmount, req.user.id]);

    // إنشاء الاستثمار
    const [result] = await conn.query(
      'INSERT INTO investments (user_id, plan_name, amount, daily_profit, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, plan_name, valueAmount, valueProfit, 'active']
    );

    await conn.commit();
    conn.release();

    return res.status(201).json({
      success: true,
      message: 'Investment created successfully.',
      data: { id: result.insertId, plan_name, amount: valueAmount, daily_profit: valueProfit, status: 'active' }
    });
  } catch (error) {
    try { await conn.rollback(); } catch (_) {}
    conn.release();
    console.error('Create investment error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ============== List user's investments ============== */
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, plan_name, amount, daily_profit, status, created_at FROM investments WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('List investments error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
