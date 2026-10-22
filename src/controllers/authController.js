const h = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const svc = require('../services/authService');

exports.register = h(async (req, res) => ok(res, await svc.register(req.body), 201));
exports.login = h(async (req, res) => ok(res, await svc.login(req.body)));
