// Crée la base, les tables et les données de test (ATTENTION : supprime les tables existantes).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const requis = ['DB_HOST', 'DB_PORT', 'DB_USER'];
  const manquantes = requis.filter((k) => process.env[k] === undefined);
  if (manquantes.length) throw new Error(`Variables manquantes dans .env : ${manquantes.join(', ')}`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });
  for (const f of ['schema.sql', 'seed.sql']) {
    await conn.query(fs.readFileSync(path.join(__dirname, '..', 'sql', f), 'utf8'));
    console.log(`✔ ${f} exécuté`);
  }
  await conn.end();
})().catch((e) => { console.error('Échec :', e.message); process.exit(1); });
