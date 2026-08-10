// backend/src/config/database.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'gateway01.us-west-2.prod.aws.tidbcloud.com',
  user: process.env.DB_USER || '199rhE1cyGSyfjZ.root',
  password: process.env.DB_PASSWORD || 'fTrXZpd8n8YLjwy4',
  database: process.env.DB_NAME || 'vexastore',
  port: Number(process.env.DB_PORT) || 4000,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 15,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Host:', process.env.DB_HOST);
    console.error('   Database:', process.env.DB_NAME);
    console.error('   User:', process.env.DB_USER);
    return false;
  }
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection lost. Attempting to reconnect...');
  }
});

module.exports = { pool, testConnection };
