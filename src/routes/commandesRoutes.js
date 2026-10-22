const router = require('express').Router();
const { authenticate, requireRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const s = require('../validators/schemas');
const c = require('../controllers/commandesController');

router.use(authenticate);
router.post('/', requireRoles('client'), validate(s.commandeCreate), c.create);
router.get('/', requireRoles('client'), c.list);
router.get('/:id', validate(s.idParam), c.get); // propriétaire, gestionnaire ou admin (vérifié dans le service)
router.put('/:id/status', requireRoles('gestionnaire'), validate(s.commandeStatut), c.updateStatut);
module.exports = router;
