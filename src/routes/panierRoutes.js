const router = require('express').Router();
const { authenticate, requireRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const s = require('../validators/schemas');
const c = require('../controllers/panierController');

router.use(authenticate, requireRoles('client'));
router.get('/', c.get);
router.post('/items', validate(s.panierAdd), c.addItem);
router.put('/items/:id', validate(s.panierUpdate), c.updateItem);
router.delete('/items/:id', validate(s.idParam), c.removeItem);
module.exports = router;
