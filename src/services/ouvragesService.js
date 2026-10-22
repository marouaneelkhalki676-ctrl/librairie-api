const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { buildUpdate } = require('../utils/sql');

const ORDERS = {
  recent: 'o.created_at DESC, o.id DESC',
  prix_asc: 'o.prix ASC',
  prix_desc: 'o.prix DESC',
  titre: 'o.titre ASC',
  popularite: 'ventes DESC, o.titre ASC',
};

const SELECT = `
  SELECT o.id, o.titre, o.auteur, o.isbn, o.description, o.prix, o.stock, o.categorie_id,
         c.nom AS categorie, COALESCE(p.ventes, 0) AS ventes,
         (SELECT ROUND(AVG(a.note), 2) FROM avis a WHERE a.ouvrage_id = o.id) AS note_moyenne
  FROM ouvrages o
  LEFT JOIN categories c ON c.id = o.categorie_id
  LEFT JOIN (
    SELECT ci.ouvrage_id, SUM(ci.quantite) AS ventes
    FROM commande_items ci JOIN commandes cm ON cm.id = ci.commande_id
    WHERE cm.statut IN ('payee', 'expediee') GROUP BY ci.ouvrage_id
  ) p ON p.ouvrage_id = o.id`;

/** Liste publique : uniquement stock > 0 (sauf personnel + inclure_epuises=true). */
exports.list = async ({ q, categorie_id, tri, inclure_epuises, page, limit }, isStaff) => {
  const where = [];
  const params = [];
  if (!(isStaff && inclure_epuises)) where.push('o.stock > 0');
  if (q) {
    where.push('(o.titre LIKE ? OR o.auteur LIKE ? OR o.isbn LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (categorie_id) { where.push('o.categorie_id = ?'); params.push(categorie_id); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ouvrages o ${w}`, params);
  const [rows] = await pool.query(
    `${SELECT} ${w} ORDER BY ${ORDERS[tri]} LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
  rows.forEach((r) => { r.ventes = Number(r.ventes); });
  return { rows, pagination: { page, limit, total } };
};

/** Détail + avis + commentaires validés. Un ouvrage épuisé reste invisible pour le public. */
exports.getById = async (id, isStaff) => {
  const [rows] = await pool.query(`${SELECT} WHERE o.id = ?`, [id]);
  const o = rows[0];
  if (!o || (o.stock === 0 && !isStaff)) throw new AppError(404, 'Ouvrage introuvable');
  o.ventes = Number(o.ventes);
  [o.avis] = await pool.query(
    `SELECT a.id, a.note, a.commentaire, a.date, u.nom AS client
     FROM avis a JOIN users u ON u.id = a.client_id WHERE a.ouvrage_id = ? ORDER BY a.date DESC`, [id]);
  [o.commentaires] = await pool.query(
    `SELECT c.id, c.contenu, c.date_soumission, u.nom AS client
     FROM commentaires c JOIN users u ON u.id = c.client_id
     WHERE c.ouvrage_id = ? AND c.valide = TRUE ORDER BY c.date_soumission DESC`, [id]);
  return o;
};

exports.create = async (d) => {
  const [r] = await pool.query(
    `INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id) VALUES (?,?,?,?,?,?,?)`,
    [d.titre, d.auteur, d.isbn, d.description || null, d.prix, d.stock, d.categorie_id || null]);
  return exports.getById(r.insertId, true);
};

exports.update = async (id, d) => {
  await exports.getById(id, true);
  const { set, params } = buildUpdate(d, ['titre', 'auteur', 'isbn', 'description', 'prix', 'stock', 'categorie_id']);
  await pool.query(`UPDATE ouvrages SET ${set} WHERE id = ?`, [...params, id]);
  return exports.getById(id, true);
};

exports.remove = async (id) => {
  await exports.getById(id, true);
  await pool.query('DELETE FROM ouvrages WHERE id = ?', [id]); // refusé (409) si déjà commandé
};
