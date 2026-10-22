const h = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const svc = require('../services/usersService');

exports.me = h(async (req, res) => ok(res, await svc.getById(req.user.id)));
exports.list = h(async (req, res) => {
  const { rows, pagination } = await svc.list(req.query);
  ok(res, rows, 200, { pagination });
});
exports.update = h(async (req, res) => ok(res, await svc.update(req.params.id, req.body, req.user)));
exports.deactivate = h(async (req, res) => { await svc.deactivate(req.params.id, req.user); res.status(204).end(); });
