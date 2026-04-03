const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PGUSER || process.env.USER, // default to current user
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'postgres',
  password: process.env.PGPASSWORD || '',
  port: process.env.PGPORT || 5432,
});

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Ensure columns exist (for existing tables)
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS dob DATE;
        `);
        
        // Remove old column if it exists just to be clean
        await pool.query(`
            ALTER TABLE users DROP COLUMN IF EXISTS full_name;
        `);

        console.log('Database initialized successfully: users table is up-to-date.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

module.exports = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      console.log(`[DB] Executing: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`[DB] Executed in ${duration}ms. Rows: ${res.rowCount}`);
      return res;
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`[DB] Error in ${duration}ms! Query: ${text}`, err);
      throw err;
    }
  },
  initDB
};
