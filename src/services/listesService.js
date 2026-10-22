const { randomBytes } = require('crypto');
const pool = require('../config/db');
const { withTransaction } = pool;
const AppError = require('../utils/AppError');
const { creerCommande } = require('./commandesService');

exports.create = (userId, { nom, items }) => withTransaction(async (conn) => {
  const ids = [...new Set(items.map((i) => i.ouvrage_id))];
  if (ids.length !== items.length) throw new AppError(400, 'Un ouvrage ne peut apparaître qu\'une fois dans la liste');
  const [found] = await conn.query('SELECT id FROM ouvrages WHERE id IN (?)', [ids]);
  if (found.length !== ids.length) throw new AppError(404, 'Un ou plusieurs ouvrages sont introuvables');

  const code = randomBytes(6).toString('hex'); // 12 caractères hex, non devinable
  const [l] = await conn.query('INSERT INTO listes_cadeaux (nom, proprietaire_id, code_partage) VALUES (?,?,?)', [nom, userId, code]);
  for (const it of items) {
    await conn.query('INSERT INTO liste_items (liste_id, ouvrage_id, quantite_souhaitee) VALUES (?,?,?)',
      [l.insertId, it.ouvrage_id, it.quantite_souhaitee]);
  }
  return { id: l.insertId, nom, code_partage: code };
});

exports.getByCode = async (code) => {
  const [rows] = await pool.query(
    `SELECT l.id, l.nom, l.code_partage, l.date_creation, u.nom AS proprietaire
     FROM listes_cadeaux l JOIN users u ON u.id = l.proprietaire_id WHERE l.code_partage = ?`, [code]);
  if (!rows[0]) throw new AppError(404, 'Liste introuvable');
  const liste = rows[0];
  [liste.items] = await pool.query(
    `SELECT li.ouvrage_id, o.titre, o.auteur, o.prix, o.stock, li.quantite_souhaitee, li.quantite_achetee,
            (li.quantite_souhaitee - li.quantite_achetee) AS quantite_restante
     FROM liste_items li JOIN ouvrages o ON o.id = li.ouvrage_id WHERE li.liste_id = ?`, [liste.id]);
  return liste;
};

/** Achat direct d'un ouvrage de la liste par un ami : commande transactionnelle + mise à jour de la liste. */
exports.acheter = (listeId, buyer, body) => withTransaction(async (conn) => {
  const [l] = await conn.query('SELECT id FROM listes_cadeaux WHERE id = ?', [listeId]);
  if (!l[0]) throw new AppError(404, 'Liste introuvable');
  const [li] = await conn.query(
    'SELECT id, quantite_souhaitee, quantite_achetee FROM liste_items WHERE liste_id = ? AND ouvrage_id = ? FOR UPDATE',
    [listeId, body.ouvrage_id]);
  if (!li[0]) throw new AppError(404, 'Cet ouvrage ne fait pas partie de la liste');
  const restante = li[0].quantite_souhaitee - li[0].quantite_achetee;
  if (body.quantite > restante) throw new AppError(409, `Quantité restante dans la liste : ${restante}`);

  const res = await creerCommande(conn, buyer.id, [{ ouvrage_id: body.ouvrage_id, quantite: body.quantite }], body);
  await conn.query('UPDATE liste_items SET quantite_achetee = quantite_achetee + ? WHERE id = ?', [body.quantite, li[0].id]);
  return res;
});
