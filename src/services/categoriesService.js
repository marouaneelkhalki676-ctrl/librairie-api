const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { buildUpdate } = require('../utils/sql');

exports.list = async () => (await pool.query('SELECT * FROM categories ORDER BY nom'))[0];

exports.getById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(404, 'Catégorie introuvable');
  return rows[0];
};

exports.create = async ({ nom, description }) => {
  const [r] = await pool.query('INSERT INTO categories (nom, description) VALUES (?, ?)', [nom, description || null]);
  return exports.getById(r.insertId);
};

exports.update = async (id, data) => {
  await exports.getById(id);
  const { set, params } = buildUpdate(data, ['nom', 'description']);
  await pool.query(`UPDATE categories SET ${set} WHERE id = ?`, [...params, id]);
  return exports.getById(id);
};

exports.remove = async (id) => {
  await exports.getById(id);
  await pool.query('DELETE FROM categories WHERE id = ?', [id]); // ouvrages.categorie_id -> NULL
};
