const h = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const svc = require('../services/categoriesService');

exports.list = h(async (req, res) => ok(res, await svc.list()));
exports.get = h(async (req, res) => ok(res, await svc.getById(req.params.id)));
exports.create = h(async (req, res) => ok(res, await svc.create(req.body), 201));
exports.update = h(async (req, res) => ok(res, await svc.update(req.params.id, req.body)));
exports.remove = h(async (req, res) => { await svc.remove(req.params.id); res.status(204).end(); });
