const h = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const svc = require('../services/avisService');

exports.ajouterAvis = h(async (req, res) => ok(res, await svc.ajouterAvis(req.user.id, req.params.id, req.body), 201));
exports.soumettre = h(async (req, res) => ok(res, await svc.soumettreCommentaire(req.user.id, req.params.id, req.body), 201));
exports.enAttente = h(async (req, res) => ok(res, await svc.enAttente()));
exports.moderer = h(async (req, res) => ok(res, await svc.moderer(req.params.id, req.body.decision, req.user)));
