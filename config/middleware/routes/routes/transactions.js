'use strict';

const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/* ============== Create transaction ============== */
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, amount, method } = req.body;

    if (!['deposit', 'withdraw'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be deposit or withdraw.' });
    }

    const value = Number(amount);
    if (!value || value <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number.' });
    }

    const [result] = await db.query(
      'INSERT INTO transactions (user_id, type, amount, method, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, type, value, method || null, 'pending']
    );

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully.',
      data: { id: result.insertId, type, amount: value, status: 'pending' }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/* ============== List user's transactions ============== */
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, type, amount, method, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('List transactions error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
