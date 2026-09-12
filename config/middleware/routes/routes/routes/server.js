'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const db = require('./config/db');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const investmentRoutes = require('./routes/investments');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

/* ============== Global Middleware ============== */
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* ============== Static Files ============== */
app.use(express.static(path.join(__dirname, 'public')));

/* ============== Health Check ============== */
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running.', timestamp: new Date().toISOString() });
});

/* ============== API Routes ============== */
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/investments', investmentRoutes);

/* ============== 404 Handler ============== */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

/* ============== Global Error Handler ============== */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.'
  });
});

/* ============== Start Server ============== */
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

/* ============== Graceful Shutdown ============== */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  server.close(async () => {
    try {
      await db.end();
      console.log('✅ MySQL pool closed.');
    } catch (e) {
      console.error('Error closing MySQL pool:', e.message);
    }
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

module.exports = app;
