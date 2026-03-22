const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway and most managed Postgres providers require SSL in production.
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

/**
 * Run a parameterised query.
 * @param {string} text   SQL string with $1, $2… placeholders
 * @param {any[]}  params Parameter values
 */
async function query(text, params) {
  const start = Date.now();
  const res   = await pool.query(text, params);
  const ms    = Date.now() - start;
  console.log(`[db] query executed in ${ms}ms — rows: ${res.rowCount}`);
  return res;
}

module.exports = { query, pool };
