-- ============================================================
--  Librairie en ligne - Schéma MySQL 8 (DDL)
--  420-WA6-AG - Étape 02
-- ============================================================
CREATE DATABASE IF NOT EXISTS librairie
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE librairie;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS payments, commentaires, avis, liste_items, listes_cadeaux,
  commande_items, commandes, panier_items, panier, ouvrages, categories, users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. users
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('client','editeur','gestionnaire','administrateur') NOT NULL DEFAULT 'client',
  actif         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- 2. categories
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(100) NOT NULL,
  description TEXT NULL,
  CONSTRAINT uq_categories_nom UNIQUE (nom)
) ENGINE=InnoDB;

-- 3. ouvrages
CREATE TABLE ouvrages (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  titre        VARCHAR(255)  NOT NULL,
  auteur       VARCHAR(255)  NOT NULL,
  isbn         VARCHAR(20)   NOT NULL,
  description  TEXT NULL,
  prix         DECIMAL(10,2) NOT NULL,
  stock        INT           NOT NULL DEFAULT 0,
  categorie_id INT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_ouvrages_isbn UNIQUE (isbn),
  CONSTRAINT ck_ouvrages_prix  CHECK (prix >= 0),
  CONSTRAINT ck_ouvrages_stock CHECK (stock >= 0),
  CONSTRAINT fk_ouvrages_categorie FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_ouvrages_categorie (categorie_id),
  INDEX idx_ouvrages_stock (stock),
  INDEX idx_ouvrages_titre (titre),
  INDEX idx_ouvrages_auteur (auteur)
) ENGINE=InnoDB;

-- 4. panier (un seul panier actif par client, géré côté service)
CREATE TABLE panier (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  client_id  INT NOT NULL,
  actif      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_panier_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_panier_client_actif (client_id, actif),
  INDEX idx_panier_expiration (actif, updated_at)
) ENGINE=InnoDB;

-- 5. panier_items
CREATE TABLE panier_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  panier_id     INT NOT NULL,
  ouvrage_id    INT NOT NULL,
  quantite      INT NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  CONSTRAINT ck_panier_items_qte CHECK (quantite > 0),
  CONSTRAINT uq_panier_items UNIQUE (panier_id, ouvrage_id),
  CONSTRAINT fk_pi_panier  FOREIGN KEY (panier_id)  REFERENCES panier(id)   ON DELETE CASCADE,
  CONSTRAINT fk_pi_ouvrage FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. commandes
CREATE TABLE commandes (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  client_id           INT NOT NULL,
  `date`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total               DECIMAL(10,2) NOT NULL,
  statut              ENUM('en_cours','payee','annulee','expediee') NOT NULL DEFAULT 'en_cours',
  adresse_livraison   TEXT NOT NULL,
  mode_livraison      VARCHAR(50) NOT NULL,
  mode_paiement       VARCHAR(50) NOT NULL,
  payment_provider_id VARCHAR(100) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT ck_commandes_total CHECK (total >= 0),
  CONSTRAINT fk_commandes_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_commandes_client (client_id),
  INDEX idx_commandes_statut (statut)
) ENGINE=InnoDB;

-- 7. commande_items (prix figé au moment de l'achat)
CREATE TABLE commande_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  commande_id   INT NOT NULL,
  ouvrage_id    INT NOT NULL,
  quantite      INT NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  CONSTRAINT ck_ci_qte CHECK (quantite > 0),
  CONSTRAINT uq_commande_items UNIQUE (commande_id, ouvrage_id),
  CONSTRAINT fk_ci_commande FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_ouvrage  FOREIGN KEY (ouvrage_id)  REFERENCES ouvrages(id)  ON DELETE RESTRICT,
  INDEX idx_ci_ouvrage (ouvrage_id)
) ENGINE=InnoDB;

-- 8. listes_cadeaux
CREATE TABLE listes_cadeaux (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nom             VARCHAR(150) NOT NULL,
  proprietaire_id INT NOT NULL,
  code_partage    VARCHAR(32) NOT NULL,
  date_creation   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_listes_code UNIQUE (code_partage),
  CONSTRAINT fk_listes_proprio FOREIGN KEY (proprietaire_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_listes_proprio (proprietaire_id)
) ENGINE=InnoDB;

-- 9. liste_items
CREATE TABLE liste_items (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  liste_id          INT NOT NULL,
  ouvrage_id        INT NOT NULL,
  quantite_souhaitee INT NOT NULL DEFAULT 1,
  quantite_achetee   INT NOT NULL DEFAULT 0,
  CONSTRAINT ck_li_souhaitee CHECK (quantite_souhaitee > 0),
  CONSTRAINT ck_li_achetee   CHECK (quantite_achetee >= 0 AND quantite_achetee <= quantite_souhaitee),
  CONSTRAINT uq_liste_items UNIQUE (liste_id, ouvrage_id),
  CONSTRAINT fk_li_liste   FOREIGN KEY (liste_id)   REFERENCES listes_cadeaux(id) ON DELETE CASCADE,
  CONSTRAINT fk_li_ouvrage FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id)       ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. avis (un avis par client et par ouvrage)
CREATE TABLE avis (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  client_id   INT NOT NULL,
  ouvrage_id  INT NOT NULL,
  note        TINYINT NOT NULL,
  commentaire TEXT NULL,
  `date`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_avis_note CHECK (note BETWEEN 1 AND 5),
  CONSTRAINT uq_avis_client_ouvrage UNIQUE (client_id, ouvrage_id),
  CONSTRAINT fk_avis_client  FOREIGN KEY (client_id)  REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_avis_ouvrage FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id) ON DELETE CASCADE,
  INDEX idx_avis_ouvrage (ouvrage_id)
) ENGINE=InnoDB;

-- 11. commentaires (modérés : valide=false à la soumission)
CREATE TABLE commentaires (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  client_id       INT NOT NULL,
  ouvrage_id      INT NOT NULL,
  contenu         TEXT NOT NULL,
  valide          BOOLEAN NOT NULL DEFAULT FALSE,
  rejete          BOOLEAN NOT NULL DEFAULT FALSE,
  date_soumission DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_validation DATETIME NULL,
  valide_par      INT NULL,
  CONSTRAINT fk_com_client  FOREIGN KEY (client_id)  REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_com_ouvrage FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id) ON DELETE CASCADE,
  CONSTRAINT fk_com_valideur FOREIGN KEY (valide_par) REFERENCES users(id)   ON DELETE SET NULL,
  INDEX idx_com_ouvrage_valide (ouvrage_id, valide),
  INDEX idx_com_moderation (valide, rejete)
) ENGINE=InnoDB;

-- 12. payments (simulation : aucune donnée bancaire n'est stockée)
CREATE TABLE payments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  commande_id         INT NOT NULL,
  provider            VARCHAR(50)  NOT NULL,
  provider_payment_id VARCHAR(100) NOT NULL,
  statut              VARCHAR(30)  NOT NULL,
  amount              DECIMAL(10,2) NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_commande FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
  INDEX idx_pay_commande (commande_id)
) ENGINE=InnoDB;
