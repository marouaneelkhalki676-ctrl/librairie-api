const h = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const svc = require('../services/listesService');

exports.create = h(async (req, res) => ok(res, await svc.create(req.user.id, req.body), 201));
exports.getByCode = h(async (req, res) => ok(res, await svc.getByCode(req.params.code)));
exports.acheter = h(async (req, res) => ok(res, await svc.acheter(req.params.id, req.user, req.body), 201));
