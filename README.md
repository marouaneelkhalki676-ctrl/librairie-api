# 📚 Librairie en ligne — API REST

Projet **420-WA6-AG – Programmation Web avancée (Automne 2026)** — Étape 02 : de la modélisation à l'API.

API REST de vente d'ouvrages (Node.js + Express + MySQL) : catalogue, catégories, panier, commandes avec décrément transactionnel du stock, listes de cadeaux partageables, avis réservés aux acheteurs et commentaires modérés. Authentification **JWT + bcrypt**, rôles `client`, `editeur`, `gestionnaire`, `administrateur`.


## 👥 Membres et répartition des tâches

| Membre | Rôle / tâches |
|---|---|
| Marouane Elkhalki | Base de données, authentification, Postman |
| Hatim Byad | Ouvrages, catégories, panier |



## 🧰 Technologies

Node.js ≥ 18 · Express 4 · MySQL ≥ 8.0.16 (mysql2) · JWT (`jsonwebtoken`) · bcrypt (`bcryptjs`) · Joi · Helmet · CORS

## 🚀 Installation et exécution locale

```bash
# 1. Cloner et installer
git clone <URL_DU_DEPOT> && cd librairie-api
npm install

# 2. Configurer l'environnement
cp .env.example .env        # puis éditer DB_USER / DB_PASSWORD / JWT_SECRET

# 3. Créer la base + données de test (⚠ supprime et recrée les tables)
npm run db:init
#    ou manuellement : mysql -u root -p < sql/schema.sql && mysql -u root -p < sql/seed.sql

# 4. Démarrer l'API
npm start                   # http://localhost:3000/api   (npm run dev = rechargement auto)
```

### Variables d'environnement (`.env`)
| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port HTTP | 3000 |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Connexion MySQL | localhost, 3306, root, _vide_, librairie |
| `JWT_SECRET` | Clé de signature JWT (**obligatoire**, longue et aléatoire) | — |
| `JWT_EXPIRES_IN` | Durée de vie du token | 2h |
| `BCRYPT_ROUNDS` | Coût bcrypt | 10 |
| `PANIER_EXPIRATION_JOURS` | Inactivité avant suppression d'un panier | 7 |

> Front-end : cette étape ne couvre que l'API (le front sera développé à une étape ultérieure). CORS est activé pour permettre de le brancher.

### Comptes de test (mot de passe : `Password123!`)
| Email | Rôle |
|---|---|
| admin@librairie.test | administrateur |
| gestionnaire@librairie.test | gestionnaire |
| editeur@librairie.test | editeur |
| alice@librairie.test | client (a déjà une commande payée : ouvrages 1 et 3) |
| bob@librairie.test | client (panier actif + liste de cadeaux `a1b2c3d4e5f6`) |

## 🗂 Structure du dépôt

```
sql/        schema.sql (DDL) · seed.sql (données de test)
src/
  config/       connexion MySQL + helper de transaction
  routes/       définition des routes /api/...
  controllers/  adaptation HTTP (req/res)
  services/     logique métier et requêtes SQL
  middlewares/  auth JWT + rôles · validation Joi · erreurs centralisées
  validators/   schémas Joi
scripts/    initDb.js · cleanPaniers.js (expiration des paniers)
postman/    collection Postman (67 requêtes, tests automatiques)
docs/       ERD.png/.svg · schema_bd.pdf · dictionnaire.md · rapport.pdf
```

## 🔌 Endpoints

Réponse succès : `{ "success": true, "data": ... }` · Erreur : `{ "success": false, "message": "...", "details": [...] }`.
Authentification : header `Authorization: Bearer <token>`. L'**administrateur** a accès à toutes les routes protégées par rôle.

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Inscription (rôle forcé à `client`, mot de passe haché) |
| POST | `/api/auth/login` | public | Connexion → JWT |
| GET | `/api/users/me` | connecté | Profil |
| GET | `/api/users` | admin | Liste paginée |
| PUT | `/api/users/:id` | admin ou propriétaire | Modifier (rôle/actif : admin seulement) |
| DELETE | `/api/users/:id` | admin | Désactiver un compte |
| GET | `/api/categories` · `/:id` | public | Lire |
| POST / PUT / DELETE | `/api/categories` · `/:id` | éditeur, gestionnaire | Gérer |
| GET | `/api/ouvrages` | public | Liste (stock > 0). Filtres : `q`, `categorie_id`, `tri` (`recent`, `prix_asc`, `prix_desc`, `titre`, `popularite`), `page`, `limit` |
| GET | `/api/ouvrages/:id` | public | Détail + avis + commentaires validés |
| POST / PUT / DELETE | `/api/ouvrages` · `/:id` | gestionnaire, éditeur | Gérer |
| GET | `/api/panier` | client | Panier actif |
| POST | `/api/panier/items` | client | Ajouter `{ouvrage_id, quantite}` |
| PUT / DELETE | `/api/panier/items/:id` | client | Modifier la quantité / retirer |
| POST | `/api/commandes` | client | Valider le panier (transaction, stock décrémenté, paiement simulé) |
| GET | `/api/commandes` | client | Historique |
| GET | `/api/commandes/:id` | propriétaire, gestionnaire, admin | Détail |
| PUT | `/api/commandes/:id/status` | gestionnaire, admin | Statut (annulation = stock restitué) |
| POST | `/api/listes` | client | Créer une liste → `code_partage` |
| GET | `/api/listes/:code` | public | Consulter par code |
| POST | `/api/listes/:id/acheter` | client | Achat direct d'un ouvrage de la liste |
| POST | `/api/ouvrages/:id/avis` | client (acheteur) | Avis 1..5 (403 si pas d'achat, 409 si doublon) |
| POST | `/api/ouvrages/:id/commentaires` | client | Commentaire (`valide=false`) |
| GET | `/api/commentaires/en-attente` | éditeur | File de modération |
| PUT | `/api/commentaires/:id/valider` | éditeur | `{ "decision": "valider" \| "rejeter" }` |

### Exemples (curl)

```bash
# Connexion → récupérer le token
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"bob@librairie.test","password":"Password123!"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')

# Recherche publique
curl "localhost:3000/api/ouvrages?q=code&tri=popularite"

# Ajouter au panier, puis commander
curl -X POST localhost:3000/api/panier/items -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"ouvrage_id":4,"quantite":2}'
curl -X POST localhost:3000/api/commandes -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"adresse_livraison":"10 rue des Tests, Montréal"}'

# Consulter une liste de cadeaux (ami, sans compte)
curl localhost:3000/api/listes/a1b2c3d4e5f6
```

### Postman
Importer `postman/Librairie-API.postman_collection.json`, lancer `npm run db:init` puis exécuter la collection dans l'ordre avec le **Collection Runner** (les tokens et identifiants sont stockés automatiquement dans les variables). Résultat attendu : 67 requêtes, 72 assertions réussies. Ligne de commande : `npx newman run postman/Librairie-API.postman_collection.json`.

## 🔒 Règles métier (résumé)

- Public : seuls les ouvrages avec `stock > 0` sont listés (détail d'un ouvrage épuisé = 404, visible du personnel).
- Commande : transaction (`SELECT … FOR UPDATE`, décrément, commande, lignes, paiement) ; stock insuffisant → 409 + rollback.
- Avis : uniquement si une commande `payee`/`expediee` du client contient l'ouvrage ; un avis par client/ouvrage.
- Commentaires : `valide=false` à la soumission ; un éditeur valide ou rejette.
- Paniers inactifs supprimés par `npm run clean:paniers` — cron : `0 3 * * * cd /chemin/librairie-api && npm run clean:paniers`.
- Aucune information bancaire n'est stockée (paiement simulé).

## 📄 Livrables

Schéma BD (`docs/schema_bd.pdf`, `docs/ERD.png`) · Dictionnaire (`docs/dictionnaire.md`) · Rapport (`docs/rapport.pdf`) · Postman (`postman/`) · Scripts SQL (`sql/`).
