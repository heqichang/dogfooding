const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'short_link_db',
});

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS short_links (
        id SERIAL PRIMARY KEY,
        short_code VARCHAR(20) NOT NULL UNIQUE,
        original_url TEXT NOT NULL,
        expires_at TIMESTAMP,
        visit_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_short_code ON short_links(short_code)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expires_at ON short_links(expires_at)
    `);

    console.log('Connected to PostgreSQL database');
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
}

initDatabase();

module.exports = pool;
