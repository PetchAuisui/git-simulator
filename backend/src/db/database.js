require('dotenv').config();
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'git_simulator',
});

// Initialize database schema
const initDatabase = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Repositories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS repositories (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "repoName" TEXT NOT NULL,
        path TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users(id),
        UNIQUE("userId", "repoName")
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

const run = (sql, params = []) => {
  return pool.query(sql, params);
};

const get = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows[0];
};

const all = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows;
};

module.exports = {
  initDatabase,
  pool,
  run,
  get,
  all
};
