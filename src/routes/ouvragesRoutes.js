const router = require('express').Router();
const { authenticate, optionalAuth, requireRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const s = require('../validators/schemas');
const c = require('../controllers/ouvragesController');
const avis = require('../controllers/avisController');

const staff = [authenticate, requireRoles('gestionnaire', 'editeur')];

router.get('/', optionalAuth, validate(s.ouvrageQuery), c.list);
router.get('/:id', optionalAuth, validate(s.idParam), c.get);
router.post('/', ...staff, validate(s.ouvrageCreate), c.create);
router.put('/:id', ...staff, validate(s.ouvrageUpdate), c.update);
router.delete('/:id', ...staff, validate(s.idParam), c.remove);

// Avis & commentaires d'un ouvrage
router.post('/:id/avis', authenticate, requireRoles('client'), validate(s.avisCreate), avis.ajouterAvis);
router.post('/:id/commentaires', authenticate, requireRoles('client'), validate(s.commentaireCreate), avis.soumettre);
module.exports = router;
