const router = require('express').Router();
const { authenticate, requireRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const s = require('../validators/schemas');
const c = require('../controllers/listesController');

router.post('/', authenticate, requireRoles('client'), validate(s.listeCreate), c.create);
router.get('/:code', validate(s.listeCode), c.getByCode); // public : consultation par un ami via le code
router.post('/:id/acheter', authenticate, requireRoles('client'), validate(s.listeAcheter), c.acheter);
module.exports = router;
