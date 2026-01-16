const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || '';

const ssl =
  connectionString && connectionString.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined;

const pool = new Pool({ connectionString, ssl });

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};



