const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

async function resolveUser(header) {
  if (!header || !header.startsWith('Bearer ')) return null;
  const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  // On relit l'utilisateur : rôle à jour + compte désactivé = accès refusé immédiatement.
  const [rows] = await pool.query('SELECT id, nom, email, role, actif FROM users WHERE id = ?', [payload.id]);
  const user = rows[0];
  if (!user || !user.actif) throw new AppError(401, 'Compte introuvable ou désactivé');
  return user;
}

/** Exige un JWT valide. */
exports.authenticate = async (req, res, next) => {
  try {
    const user = await resolveUser(req.headers.authorization);
    if (!user) throw new AppError(401, 'Authentification requise (header Authorization: Bearer <token>)');
    req.user = user;
    next();
  } catch (e) { next(e); }
};

/** JWT facultatif : renseigne req.user s'il est présent (routes publiques). */
exports.optionalAuth = async (req, res, next) => {
  try {
    req.user = await resolveUser(req.headers.authorization);
    next();
  } catch (e) { next(e); }
};

/** Autorise les rôles listés ; l'administrateur a toujours accès. */
exports.requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError(401, 'Authentification requise'));
  if (req.user.role === 'administrateur' || roles.includes(req.user.role)) return next();
  next(new AppError(403, 'Accès refusé : rôle insuffisant'));
};
