const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { buildUpdate } = require('../utils/sql');

const PUBLIC = 'id, nom, email, role, actif, created_at, updated_at';

exports.getById = async (id) => {
  const [rows] = await pool.query(`SELECT ${PUBLIC} FROM users WHERE id = ?`, [id]);
  if (!rows[0]) throw new AppError(404, 'Utilisateur introuvable');
  return rows[0];
};

exports.list = async ({ page, limit }) => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  const [rows] = await pool.query(`SELECT ${PUBLIC} FROM users ORDER BY id LIMIT ? OFFSET ?`,
    [limit, (page - 1) * limit]);
  return { rows, pagination: { page, limit, total } };
};

exports.update = async (id, data, actor) => {
  const isAdmin = actor.role === 'administrateur';
  if (!isAdmin && actor.id !== id) throw new AppError(403, 'Vous ne pouvez modifier que votre propre profil');
  if (!isAdmin && (data.role !== undefined || data.actif !== undefined)) {
    throw new AppError(403, 'Seul un administrateur peut modifier le rôle ou le statut d\'un compte');
  }
  await exports.getById(id);
  const patch = { ...data };
  if (patch.password) {
    patch.password_hash = await bcrypt.hash(patch.password, Number(process.env.BCRYPT_ROUNDS) || 10);
  }
  const { set, params } = buildUpdate(patch, ['nom', 'email', 'password_hash', 'role', 'actif']);
  await pool.query(`UPDATE users SET ${set} WHERE id = ?`, [...params, id]);
  return exports.getById(id);
};

/** Désactivation (soft delete) : on garde l'historique des commandes. */
exports.deactivate = async (id, actor) => {
  if (actor.id === id) throw new AppError(400, 'Vous ne pouvez pas désactiver votre propre compte');
  await exports.getById(id);
  await pool.query('UPDATE users SET actif = FALSE WHERE id = ?', [id]);
};
