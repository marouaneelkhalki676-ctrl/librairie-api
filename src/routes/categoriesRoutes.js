const router = require('express').Router();
const { authenticate, requireRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const s = require('../validators/schemas');
const c = require('../controllers/categoriesController');

const staff = [authenticate, requireRoles('editeur', 'gestionnaire')];
router.get('/', c.list);
router.get('/:id', validate(s.idParam), c.get);
router.post('/', ...staff, validate(s.categoryCreate), c.create);
router.put('/:id', ...staff, validate(s.categoryUpdate), c.update);
router.delete('/:id', ...staff, validate(s.idParam), c.remove);
module.exports = router;
