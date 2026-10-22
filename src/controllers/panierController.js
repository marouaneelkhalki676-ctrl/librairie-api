const h = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const svc = require('../services/panierService');

exports.get = h(async (req, res) => ok(res, await svc.get(req.user.id)));
exports.addItem = h(async (req, res) => ok(res, await svc.addItem(req.user.id, req.body), 201));
exports.updateItem = h(async (req, res) => ok(res, await svc.updateItem(req.user.id, req.params.id, req.body)));
exports.removeItem = h(async (req, res) => ok(res, await svc.removeItem(req.user.id, req.params.id)));
