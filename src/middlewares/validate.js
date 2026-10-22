const AppError = require('../utils/AppError');

/** validate({ params, query, body }) avec des schémas Joi. Remplace les valeurs par les valeurs nettoyées. */
module.exports = (schemas) => (req, res, next) => {
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const { error, value } = schemas[part].validate(req[part] || {}, {
      abortEarly: false, stripUnknown: true, convert: true,
    });
    if (error) {
      return next(new AppError(400, 'Données invalides',
        error.details.map((d) => ({ champ: d.path.join('.'), message: d.message }))));
    }
    req[part] = value;
  }
  next();
};
