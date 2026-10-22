const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

const ROUNDS = () => Number(process.env.BCRYPT_ROUNDS) || 10;

exports.register = async ({ nom, email, password }) => {
  const hash = await bcrypt.hash(password, ROUNDS());
  // Le rôle est TOUJOURS 'client' à l'inscription (jamais fourni par l'utilisateur).
  const [r] = await pool.query(
    'INSERT INTO users (nom, email, password_hash, role) VALUES (?, ?, ?, ?)', [nom, email, hash, 'client']);
  return { id: r.insertId, nom, email, role: 'client' };
};

exports.login = async ({ email, password }) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  const ok = user && user.actif && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new AppError(401, 'Email ou mot de passe invalide'); // message identique : pas de fuite d'info
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
  return { token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } };
};
