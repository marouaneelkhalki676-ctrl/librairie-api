const pool = require('../config/db');
const AppError = require('../utils/AppError');

async function ouvrageExiste(id) {
  const [r] = await pool.query('SELECT id FROM ouvrages WHERE id = ?', [id]);
  if (!r[0]) throw new AppError(404, 'Ouvrage introuvable');
}

/** Règle métier : le client doit avoir une commande payée/expédiée contenant l'ouvrage. */
async function aAchete(clientId, ouvrageId) {
  const [r] = await pool.query(
    `SELECT 1 FROM commandes c JOIN commande_items ci ON ci.commande_id = c.id
     WHERE c.client_id = ? AND ci.ouvrage_id = ? AND c.statut IN ('payee','expediee') LIMIT 1`, [clientId, ouvrageId]);
  return r.length > 0;
}

exports.ajouterAvis = async (clientId, ouvrageId, { note, commentaire }) => {
  await ouvrageExiste(ouvrageId);
  if (!(await aAchete(clientId, ouvrageId))) {
    throw new AppError(403, 'Vous devez avoir acheté cet ouvrage pour laisser un avis');
  }
  try {
    const [r] = await pool.query('INSERT INTO avis (client_id, ouvrage_id, note, commentaire) VALUES (?,?,?,?)',
      [clientId, ouvrageId, note, commentaire || null]);
    return { id: r.insertId, ouvrage_id: ouvrageId, note, commentaire: commentaire || null };
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new AppError(409, 'Vous avez déjà laissé un avis pour cet ouvrage');
    throw e;
  }
};

exports.soumettreCommentaire = async (clientId, ouvrageId, { contenu }) => {
  await ouvrageExiste(ouvrageId);
  const [r] = await pool.query('INSERT INTO commentaires (client_id, ouvrage_id, contenu, valide) VALUES (?,?,?,FALSE)',
    [clientId, ouvrageId, contenu]);
  return { id: r.insertId, ouvrage_id: ouvrageId, contenu, valide: false, message: 'Commentaire en attente de modération' };
};

exports.enAttente = async () => (await pool.query(
  `SELECT c.id, c.ouvrage_id, o.titre, c.contenu, c.date_soumission, u.nom AS client
   FROM commentaires c JOIN users u ON u.id = c.client_id JOIN ouvrages o ON o.id = c.ouvrage_id
   WHERE c.valide = FALSE AND c.rejete = FALSE ORDER BY c.date_soumission`))[0];

exports.moderer = async (id, decision, editeur) => {
  const [rows] = await pool.query('SELECT id, valide, rejete FROM commentaires WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(404, 'Commentaire introuvable');
  if (rows[0].valide || rows[0].rejete) throw new AppError(409, 'Ce commentaire a déjà été modéré');
  const valide = decision === 'valider';
  await pool.query('UPDATE commentaires SET valide = ?, rejete = ?, date_validation = NOW(), valide_par = ? WHERE id = ?',
    [valide, !valide, editeur.id, id]);
  return { id, valide, rejete: !valide, valide_par: editeur.id };
};
