const Joi = require('joi');

const id = Joi.number().integer().positive().required();
const idParam = Joi.object({ id });

const ROLES = ['client', 'editeur', 'gestionnaire', 'administrateur'];
const STATUTS = ['en_cours', 'payee', 'annulee', 'expediee'];

const livraison = {
  adresse_livraison: Joi.string().trim().min(5).max(500).required(),
  mode_livraison: Joi.string().valid('standard', 'express', 'retrait').default('standard'),
  mode_paiement: Joi.string().valid('simulation', 'carte', 'paypal').default('simulation'),
};

const ouvrageFields = {
  titre: Joi.string().trim().min(1).max(255),
  auteur: Joi.string().trim().min(1).max(255),
  isbn: Joi.string().trim().pattern(/^[0-9-]{10,17}$/).message('"isbn" doit contenir 10 à 17 chiffres/tirets'),
  description: Joi.string().allow('', null).max(5000),
  prix: Joi.number().min(0).precision(2),
  stock: Joi.number().integer().min(0),
  categorie_id: Joi.number().integer().positive().allow(null),
};

module.exports = {
  idParam: { params: idParam },

  register: { body: Joi.object({
    nom: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(255).required(),
    password: Joi.string().min(8).max(72).required(), // 72 octets = limite de bcrypt
  }) },
  login: { body: Joi.object({
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
    password: Joi.string().required(),
  }) },

  userUpdate: { params: idParam, body: Joi.object({
    nom: Joi.string().trim().min(2).max(100),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(255),
    password: Joi.string().min(8).max(72),
    role: Joi.string().valid(...ROLES),
    actif: Joi.boolean(),
  }).min(1) },
  usersQuery: { query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }) },

  categoryCreate: { body: Joi.object({
    nom: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().allow('', null).max(2000),
  }) },
  categoryUpdate: { params: idParam, body: Joi.object({
    nom: Joi.string().trim().min(2).max(100),
    description: Joi.string().allow('', null).max(2000),
  }).min(1) },

  ouvrageCreate: { body: Joi.object({
    ...ouvrageFields,
    titre: ouvrageFields.titre.required(),
    auteur: ouvrageFields.auteur.required(),
    isbn: ouvrageFields.isbn.required(),
    prix: ouvrageFields.prix.required(),
    stock: ouvrageFields.stock.default(0),
  }) },
  ouvrageUpdate: { params: idParam, body: Joi.object(ouvrageFields).min(1) },
  ouvrageQuery: { query: Joi.object({
    q: Joi.string().trim().max(100),
    categorie_id: Joi.number().integer().positive(),
    tri: Joi.string().valid('recent', 'prix_asc', 'prix_desc', 'titre', 'popularite').default('recent'),
    inclure_epuises: Joi.boolean().default(false),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(12),
  }) },

  panierAdd: { body: Joi.object({
    ouvrage_id: id,
    quantite: Joi.number().integer().min(1).max(99).default(1),
  }) },
  panierUpdate: { params: idParam, body: Joi.object({
    quantite: Joi.number().integer().min(1).max(99).required(),
  }) },

  commandeCreate: { body: Joi.object(livraison) },
  commandeStatut: { params: idParam, body: Joi.object({
    statut: Joi.string().valid(...STATUTS).required(),
  }) },

  listeCreate: { body: Joi.object({
    nom: Joi.string().trim().min(2).max(150).required(),
    items: Joi.array().min(1).max(50).items(Joi.object({
      ouvrage_id: id,
      quantite_souhaitee: Joi.number().integer().min(1).max(99).default(1),
    })).required(),
  }) },
  listeCode: { params: Joi.object({ code: Joi.string().hex().length(12).required() }) },
  listeAcheter: { params: idParam, body: Joi.object({
    ouvrage_id: id,
    quantite: Joi.number().integer().min(1).max(99).default(1),
    ...livraison,
  }) },

  avisCreate: { params: idParam, body: Joi.object({
    note: Joi.number().integer().min(1).max(5).required(),
    commentaire: Joi.string().allow('', null).max(2000),
  }) },
  commentaireCreate: { params: idParam, body: Joi.object({
    contenu: Joi.string().trim().min(3).max(2000).required(),
  }) },
  commentaireModerer: { params: idParam, body: Joi.object({
    decision: Joi.string().valid('valider', 'rejeter').default('valider'),
  }) },
};
