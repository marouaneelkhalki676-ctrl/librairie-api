const router = require('express').Router();
const { authenticate, requireRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const s = require('../validators/schemas');
const c = require('../controllers/avisController');

router.use(authenticate, requireRoles('editeur'));
router.get('/en-attente', c.enAttente);
router.put('/:id/valider', validate(s.commentaireModerer), c.moderer); // body: { "decision": "valider" | "rejeter" }
module.exports = router;
