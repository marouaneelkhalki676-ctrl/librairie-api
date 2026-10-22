exports.notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route introuvable : ${req.method} ${req.originalUrl}` });

// Gestion centralisée des erreurs
exports.errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  let message = err.message;
  let details = err.details;

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401; message = 'Token invalide ou expiré';
  } else if (err.code === 'ER_DUP_ENTRY') {
    status = 409; message = 'Cette valeur existe déjà (contrainte d\'unicité)';
  } else if (err.errno === 1451) {
    status = 409; message = 'Suppression impossible : cet élément est référencé par d\'autres données';
  } else if (err.errno === 1452) {
    status = 400; message = 'Référence invalide (clé étrangère inexistante)';
  } else if (err.type === 'entity.parse.failed') {
    status = 400; message = 'Corps JSON invalide';
  }

  if (status >= 500) {
    console.error(err);
    message = 'Erreur interne du serveur';
    details = undefined;
  }
  res.status(status).json({ success: false, message, ...(details && { details }) });
};
