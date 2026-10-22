// Tâche d'expiration : supprime les paniers actifs inactifs depuis N jours (items supprimés en cascade).
// Cron (tous les jours à 3h) :  0 3 * * *  cd /chemin/projet && npm run clean:paniers
require('dotenv').config();
const pool = require('../src/config/db');

(async () => {
  const jours = Number(process.env.PANIER_EXPIRATION_JOURS) || 7;
  const [r] = await pool.query(
    'DELETE FROM panier WHERE actif = TRUE AND updated_at < (NOW() - INTERVAL ? DAY)', [jours]);
  console.log(`🧹 ${r.affectedRows} panier(s) expiré(s) supprimé(s) (inactifs > ${jours} jours)`);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
