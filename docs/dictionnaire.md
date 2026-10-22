# Dictionnaire des tables

Base **librairie** (MySQL 8, InnoDB, utf8mb4). Les contraintes `CHECK` exigent MySQL ≥ 8.0.16.

## 1. users
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | Identifiant |
| nom | VARCHAR(100) | NOT NULL | Nom affiché |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Identifiant de connexion |
| password_hash | VARCHAR(255) | NOT NULL | Hash bcrypt (jamais le mot de passe) |
| role | ENUM | NOT NULL, défaut `client` | client / editeur / gestionnaire / administrateur |
| actif | BOOLEAN | NOT NULL, défaut TRUE | Désactivation logique du compte |
| created_at, updated_at | TIMESTAMP | NOT NULL | Horodatages automatiques |

Index : `uq_users_email`, `idx_users_role`.

## 2. categories
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| nom | VARCHAR(100) | NOT NULL, UNIQUE | |
| description | TEXT | NULL | |

## 3. ouvrages
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK | |
| titre, auteur | VARCHAR(255) | NOT NULL | Index sur chacun (recherche) |
| isbn | VARCHAR(20) | NOT NULL, UNIQUE | |
| description | TEXT | NULL | |
| prix | DECIMAL(10,2) | NOT NULL, CHECK ≥ 0 | |
| stock | INT | NOT NULL, défaut 0, CHECK ≥ 0 | Le SGBD interdit un stock négatif |
| categorie_id | INT | FK → categories.id, ON DELETE SET NULL | |
| created_at, updated_at | TIMESTAMP | NOT NULL | |

Index : `idx_ouvrages_categorie`, `idx_ouvrages_stock`, `idx_ouvrages_titre`, `idx_ouvrages_auteur`.

## 4. panier
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK | |
| client_id | INT | NOT NULL, FK → users.id, ON DELETE CASCADE | |
| actif | BOOLEAN | NOT NULL, défaut TRUE | TRUE = session en cours ; FALSE = archivé après commande |
| created_at, updated_at | TIMESTAMP | NOT NULL | `updated_at` sert à l'expiration |

Index : `(client_id, actif)`, `(actif, updated_at)` (requête de nettoyage).

## 5. panier_items
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK | |
| panier_id | INT | NOT NULL, FK → panier.id, CASCADE | |
| ouvrage_id | INT | NOT NULL, FK → ouvrages.id, CASCADE | |
| quantite | INT | NOT NULL, CHECK > 0 | |
| prix_unitaire | DECIMAL(10,2) | NOT NULL | Prix au moment de l'ajout (indicatif) |

Contrainte : `UNIQUE (panier_id, ouvrage_id)` — un ouvrage = une seule ligne par panier.

## 6. commandes
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK | |
| client_id | INT | NOT NULL, FK → users.id, RESTRICT | |
| date | DATETIME | NOT NULL, défaut NOW | |
| total | DECIMAL(10,2) | NOT NULL, CHECK ≥ 0 | |
| statut | ENUM | NOT NULL, défaut `en_cours` | en_cours / payee / annulee / expediee |
| adresse_livraison | TEXT | NOT NULL | |
| mode_livraison, mode_paiement | VARCHAR(50) | NOT NULL | |
| payment_provider_id | VARCHAR(100) | NULL | Référence externe (simulation) |
| created_at, updated_at | TIMESTAMP | NOT NULL | |

Index : `idx_commandes_client`, `idx_commandes_statut`.

## 7. commande_items
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK | |
| commande_id | INT | NOT NULL, FK → commandes.id, CASCADE | |
| ouvrage_id | INT | NOT NULL, FK → ouvrages.id, RESTRICT | Un ouvrage vendu ne peut pas être supprimé |
| quantite | INT | NOT NULL, CHECK > 0 | |
| prix_unitaire | DECIMAL(10,2) | NOT NULL | Prix **figé** à l'achat |

Contrainte : `UNIQUE (commande_id, ouvrage_id)`. Index : `idx_ci_ouvrage` (calcul de popularité, vérification d'achat).

## 8. listes_cadeaux
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK | |
| nom | VARCHAR(150) | NOT NULL | |
| proprietaire_id | INT | NOT NULL, FK → users.id, CASCADE | |
| code_partage | VARCHAR(32) | NOT NULL, UNIQUE | Token de partage (12 car. hex aléatoires) |
| date_creation | DATETIME | NOT NULL, défaut NOW | |

## 9. liste_items
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK | |
| liste_id | INT | NOT NULL, FK → listes_cadeaux.id, CASCADE | |
| ouvrage_id | INT | NOT NULL, FK → ouvrages.id, CASCADE | |
| quantite_souhaitee | INT | NOT NULL, CHECK > 0 | |
| quantite_achetee | INT | NOT NULL, défaut 0, CHECK 0 ≤ x ≤ souhaitée | Ajout par rapport au schéma proposé : suivi des achats d'amis |

Contrainte : `UNIQUE (liste_id, ouvrage_id)`.

## 10. avis
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK | |
| client_id | INT | NOT NULL, FK → users.id, CASCADE | |
| ouvrage_id | INT | NOT NULL, FK → ouvrages.id, CASCADE | |
| note | TINYINT | NOT NULL, CHECK 1..5 | |
| commentaire | TEXT | NULL | Texte libre facultatif |
| date | DATETIME | NOT NULL, défaut NOW | |

Contrainte : `UNIQUE (client_id, ouvrage_id)` — un avis par client et par ouvrage. Index : `idx_avis_ouvrage`.

## 11. commentaires
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK | |
| client_id | INT | NOT NULL, FK → users.id, CASCADE | |
| ouvrage_id | INT | NOT NULL, FK → ouvrages.id, CASCADE | |
| contenu | TEXT | NOT NULL | |
| valide | BOOLEAN | NOT NULL, défaut FALSE | Visible publiquement seulement si TRUE |
| rejete | BOOLEAN | NOT NULL, défaut FALSE | Ajout : distingue « en attente » de « rejeté » |
| date_soumission | DATETIME | NOT NULL, défaut NOW | |
| date_validation | DATETIME | NULL | |
| valide_par | INT | NULL, FK → users.id, SET NULL | Éditeur modérateur |

Index : `(ouvrage_id, valide)` (affichage public), `(valide, rejete)` (file de modération).

## 12. payments (optionnel, implémenté en simulation)
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INT | PK | |
| commande_id | INT | NOT NULL, FK → commandes.id, CASCADE | |
| provider | VARCHAR(50) | NOT NULL | `simulation` |
| provider_payment_id | VARCHAR(100) | NOT NULL | Référence externe |
| statut | VARCHAR(30) | NOT NULL | reussi / rembourse |
| amount | DECIMAL(10,2) | NOT NULL | |
| created_at | TIMESTAMP | NOT NULL | |

Aucune donnée bancaire (numéro de carte, CVV…) n'est stockée.
