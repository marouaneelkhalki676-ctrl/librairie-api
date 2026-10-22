const { randomUUID } = require('crypto');
const pool = require('../config/db');
const { withTransaction } = pool;
const AppError = require('../utils/AppError');

const TRANSITIONS = { en_cours: ['payee', 'annulee'], payee: ['expediee', 'annulee'], expediee: [], annulee: [] };

/**
 * Cœur transactionnel (à appeler DANS une transaction) :
 * verrouille les ouvrages, vérifie et décrémente le stock, crée commande + lignes + paiement simulé.
 * Si le stock est insuffisant -> AppError 409 -> rollback de toute la transaction.
 */
async function creerCommande(conn, clientId, lignes, infos) {
  const triees = [...lignes].sort((a, b) => a.ouvrage_id - b.ouvrage_id); // ordre fixe = pas de deadlock
  let total = 0;
  const details = [];
  for (const l of triees) {
    const [rows] = await conn.query('SELECT id, titre, prix, stock FROM ouvrages WHERE id = ? FOR UPDATE', [l.ouvrage_id]);
    const o = rows[0];
    if (!o) throw new AppError(404, `Ouvrage ${l.ouvrage_id} introuvable`);
    if (o.stock < l.quantite) {
      throw new AppError(409, `Stock insuffisant pour « ${o.titre} » (demandé : ${l.quantite}, disponible : ${o.stock})`);
    }
    await conn.query('UPDATE ouvrages SET stock = stock - ? WHERE id = ?', [l.quantite, o.id]);
    total += o.prix * l.quantite;
    details.push({ ouvrage_id: o.id, quantite: l.quantite, prix_unitaire: o.prix }); // prix figé
  }
  total = Math.round(total * 100) / 100;

  const reference = `SIM-${randomUUID()}`;
  const [c] = await conn.query(
    `INSERT INTO commandes (client_id, total, statut, adresse_livraison, mode_livraison, mode_paiement, payment_provider_id)
     VALUES (?, ?, 'payee', ?, ?, ?, ?)`,
    [clientId, total, infos.adresse_livraison, infos.mode_livraison, infos.mode_paiement, reference]);
  for (const d of details) {
    await conn.query(
      'INSERT INTO commande_items (commande_id, ouvrage_id, quantite, prix_unitaire) VALUES (?,?,?,?)',
      [c.insertId, d.ouvrage_id, d.quantite, d.prix_unitaire]);
  }
  await conn.query(
    `INSERT INTO payments (commande_id, provider, provider_payment_id, statut, amount) VALUES (?, 'simulation', ?, 'reussi', ?)`,
    [c.insertId, reference, total]);
  return {
    commande_id: c.insertId, total, statut: 'payee',
    paiement: { provider: 'simulation', reference, statut: 'reussi', url: `https://paiement.simulation.local/pay/${reference}` },
  };
}
exports.creerCommande = creerCommande;

exports.creerDepuisPanier = (clientId, infos) => withTransaction(async (conn) => {
  const [p] = await conn.query('SELECT id FROM panier WHERE client_id = ? AND actif = TRUE LIMIT 1 FOR UPDATE', [clientId]);
  if (!p[0]) throw new AppError(400, 'Votre panier est vide');
  const [items] = await conn.query('SELECT ouvrage_id, quantite FROM panier_items WHERE panier_id = ?', [p[0].id]);
  if (!items.length) throw new AppError(400, 'Votre panier est vide');
  const res = await creerCommande(conn, clientId, items, infos);
  await conn.query('UPDATE panier SET actif = FALSE WHERE id = ?', [p[0].id]); // panier archivé
  return res;
});

exports.listParClient = async (clientId) => (await pool.query(
  'SELECT id, `date`, total, statut, mode_livraison, mode_paiement FROM commandes WHERE client_id = ? ORDER BY `date` DESC, id DESC',
  [clientId]))[0];

exports.getById = async (id, user) => {
  const [rows] = await pool.query('SELECT * FROM commandes WHERE id = ?', [id]);
  const c = rows[0];
  if (!c) throw new AppError(404, 'Commande introuvable');
  const staff = ['administrateur', 'gestionnaire'].includes(user.role);
  if (!staff && c.client_id !== user.id) throw new AppError(403, 'Cette commande ne vous appartient pas');
  [c.items] = await pool.query(
    `SELECT ci.ouvrage_id, o.titre, ci.quantite, ci.prix_unitaire, (ci.quantite * ci.prix_unitaire) AS sous_total
     FROM commande_items ci JOIN ouvrages o ON o.id = ci.ouvrage_id WHERE ci.commande_id = ?`, [id]);
  [c.paiements] = await pool.query(
    'SELECT provider, provider_payment_id, statut, amount, created_at FROM payments WHERE commande_id = ?', [id]);
  return c;
};

exports.updateStatut = async (id, statut, user) => {
  await withTransaction(async (conn) => {
    const [rows] = await conn.query('SELECT id, statut FROM commandes WHERE id = ? FOR UPDATE', [id]);
    const c = rows[0];
    if (!c) throw new AppError(404, 'Commande introuvable');
    if (!TRANSITIONS[c.statut].includes(statut)) {
      throw new AppError(409, `Transition non autorisée : ${c.statut} → ${statut}`);
    }
    if (statut === 'annulee') { // on remet le stock
      const [items] = await conn.query('SELECT ouvrage_id, quantite FROM commande_items WHERE commande_id = ? ORDER BY ouvrage_id', [id]);
      for (const it of items) {
        await conn.query('UPDATE ouvrages SET stock = stock + ? WHERE id = ?', [it.quantite, it.ouvrage_id]);
      }
      await conn.query("UPDATE payments SET statut = 'rembourse' WHERE commande_id = ?", [id]);
    }
    await conn.query('UPDATE commandes SET statut = ? WHERE id = ?', [statut, id]);
  });
  return exports.getById(id, user);
};
