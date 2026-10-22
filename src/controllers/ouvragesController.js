const h = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const svc = require('../services/ouvragesService');

const isStaff = (req) => !!req.user && ['editeur', 'gestionnaire', 'administrateur'].includes(req.user.role);

exports.list = h(async (req, res) => {
  const { rows, pagination } = await svc.list(req.query, isStaff(req));
  ok(res, rows, 200, { pagination });
});
exports.get = h(async (req, res) => ok(res, await svc.getById(req.params.id, isStaff(req))));
exports.create = h(async (req, res) => ok(res, await svc.create(req.body), 201));
exports.update = h(async (req, res) => ok(res, await svc.update(req.params.id, req.body)));
exports.remove = h(async (req, res) => { await svc.remove(req.params.id); res.status(204).end(); });
