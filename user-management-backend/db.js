const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
