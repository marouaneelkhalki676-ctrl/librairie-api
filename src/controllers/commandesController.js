const h = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const svc = require('../services/commandesService');

exports.create = h(async (req, res) => ok(res, await svc.creerDepuisPanier(req.user.id, req.body), 201));
exports.list = h(async (req, res) => ok(res, await svc.listParClient(req.user.id)));
exports.get = h(async (req, res) => ok(res, await svc.getById(req.params.id, req.user)));
exports.updateStatut = h(async (req, res) => ok(res, await svc.updateStatut(req.params.id, req.body.statut, req.user)));
