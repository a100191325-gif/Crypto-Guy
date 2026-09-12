'use strict';

const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'backend_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
  decimalNumbers: true
});

// نسخة Promise للاستخدام مع async/await
const promisePool = pool.promise();

// اختبار الاتصال عند بدء التشغيل
(async () => {
  try {
    const connection = await promisePool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL pool connected successfully.');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
})();

module.exports = promisePool;
