const router = require('express').Router();
const { authenticate, requireRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const s = require('../validators/schemas');
const c = require('../controllers/usersController');

router.use(authenticate);
router.get('/me', c.me);                                                              // profil (JWT)
router.get('/', requireRoles(), validate(s.usersQuery), c.list);                      // liste (admin)
router.put('/:id', validate(s.userUpdate), c.update);                                 // admin ou propriétaire
router.delete('/:id', requireRoles(), validate(s.idParam), c.deactivate);             // désactivation (admin)
module.exports = router;
