const router = require('express').Router();
const validate = require('../middlewares/validate');
const s = require('../validators/schemas');
const c = require('../controllers/authController');

router.post('/register', validate(s.register), c.register);
router.post('/login', validate(s.login), c.login);
module.exports = router;
