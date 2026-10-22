require('dotenv').config();
const mysql = require('mysql2/promise');

// Les paramètres de connexion viennent uniquement du fichier .env (jamais écrits dans le code).
const requis = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'];
const manquantes = requis.filter((k) => process.env[k] === undefined);
if (manquantes.length) {
  console.error(`Variables manquantes dans .env : ${manquantes.join(', ')}`);
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // peut être vide (ex. XAMPP)
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // DECIMAL -> number
});

/** Exécute fn(conn) dans une transaction (commit si OK, rollback sinon). */
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = pool;
module.exports.withTransaction = withTransaction;
