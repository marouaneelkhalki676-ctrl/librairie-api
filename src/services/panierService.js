const pool = require('../config/db');
const AppError = require('../utils/AppError');

async function panierActif(clientId) {
  const [rows] = await pool.query('SELECT id FROM panier WHERE client_id = ? AND actif = TRUE LIMIT 1', [clientId]);
  if (rows[0]) return rows[0].id;
  const [r] = await pool.query('INSERT INTO panier (client_id, actif) VALUES (?, TRUE)', [clientId]);
  return r.insertId;
}

const touch = (panierId) => pool.query('UPDATE panier SET updated_at = NOW() WHERE id = ?', [panierId]);

exports.get = async (clientId) => {
  const panier_id = await panierActif(clientId);
  const [items] = await pool.query(
    `SELECT pi.id, pi.ouvrage_id, o.titre, o.auteur, pi.quantite, pi.prix_unitaire,
            o.prix AS prix_actuel, o.stock, (pi.quantite * o.prix) AS sous_total
     FROM panier_items pi JOIN ouvrages o ON o.id = pi.ouvrage_id
     WHERE pi.panier_id = ? ORDER BY pi.id`, [panier_id]);
  const total = Math.round(items.reduce((s, i) => s + i.sous_total, 0) * 100) / 100;
  return { panier_id, items, total };
};

async function ouvrageDisponible(ouvrageId) {
  const [rows] = await pool.query('SELECT id, prix, stock FROM ouvrages WHERE id = ?', [ouvrageId]);
  if (!rows[0] || rows[0].stock <= 0) throw new AppError(404, 'Ouvrage introuvable ou épuisé');
  return rows[0];
}

exports.addItem = async (clientId, { ouvrage_id, quantite }) => {
  const o = await ouvrageDisponible(ouvrage_id);
  const panierId = await panierActif(clientId);
  const [ex] = await pool.query('SELECT quantite FROM panier_items WHERE panier_id = ? AND ouvrage_id = ?', [panierId, ouvrage_id]);
  const nouvelle = (ex[0] ? ex[0].quantite : 0) + quantite;
  if (nouvelle > o.stock) throw new AppError(409, `Stock insuffisant (disponible : ${o.stock})`);
  await pool.query(
    `INSERT INTO panier_items (panier_id, ouvrage_id, quantite, prix_unitaire) VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE quantite = VALUES(quantite)`, [panierId, ouvrage_id, nouvelle, o.prix]);
  await touch(panierId);
  return exports.get(clientId);
};

async function itemDuClient(clientId, itemId) {
  const [rows] = await pool.query(
    `SELECT pi.id, pi.panier_id, pi.ouvrage_id FROM panier_items pi
     JOIN panier p ON p.id = pi.panier_id
     WHERE pi.id = ? AND p.client_id = ? AND p.actif = TRUE`, [itemId, clientId]);
  if (!rows[0]) throw new AppError(404, 'Article introuvable dans votre panier');
  return rows[0];
}

exports.updateItem = async (clientId, itemId, { quantite }) => {
  const item = await itemDuClient(clientId, itemId);
  const o = await ouvrageDisponible(item.ouvrage_id);
  if (quantite > o.stock) throw new AppError(409, `Stock insuffisant (disponible : ${o.stock})`);
  await pool.query('UPDATE panier_items SET quantite = ? WHERE id = ?', [quantite, itemId]);
  await touch(item.panier_id);
  return exports.get(clientId);
};

exports.removeItem = async (clientId, itemId) => {
  const item = await itemDuClient(clientId, itemId);
  await pool.query('DELETE FROM panier_items WHERE id = ?', [itemId]);
  await touch(item.panier_id);
  return exports.get(clientId);
};
