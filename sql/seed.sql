-- Données de test. Mot de passe de TOUS les comptes : Password123!
USE librairie;

INSERT INTO users (id, nom, email, password_hash, role) VALUES
 (1,'Admin Grasset','admin@librairie.test','$2b$10$.tyC3BmkfrPoFKbcplssU.mZMcnsBqDPcgUPyeKysRnMigkeNOs2O','administrateur'),
 (2,'Gaëlle Gestionnaire','gestionnaire@librairie.test','$2b$10$.tyC3BmkfrPoFKbcplssU.mZMcnsBqDPcgUPyeKysRnMigkeNOs2O','gestionnaire'),
 (3,'Eric Editeur','editeur@librairie.test','$2b$10$.tyC3BmkfrPoFKbcplssU.mZMcnsBqDPcgUPyeKysRnMigkeNOs2O','editeur'),
 (4,'Alice Client','alice@librairie.test','$2b$10$.tyC3BmkfrPoFKbcplssU.mZMcnsBqDPcgUPyeKysRnMigkeNOs2O','client'),
 (5,'Bob Client','bob@librairie.test','$2b$10$.tyC3BmkfrPoFKbcplssU.mZMcnsBqDPcgUPyeKysRnMigkeNOs2O','client');

INSERT INTO categories (id, nom, description) VALUES
 (1,'Roman','Romans et fiction'),
 (2,'Informatique','Programmation et technologies'),
 (3,'Science','Vulgarisation scientifique'),
 (4,'Jeunesse','Livres pour enfants et adolescents');

INSERT INTO ouvrages (id, titre, auteur, isbn, description, prix, stock, categorie_id) VALUES
 (1,'L''Étranger','Albert Camus','9782070360024','Roman classique.',12.50,9,1),
 (2,'Clean Code','Robert C. Martin','9780132350884','Guide du code propre.',49.99,15,2),
 (3,'Une brève histoire du temps','Stephen Hawking','9782081421509','Cosmologie pour tous.',19.95,7,3),
 (4,'Le Petit Prince','Antoine de Saint-Exupéry','9782070612758','Conte poétique.',9.99,30,4),
 (5,'JavaScript: The Good Parts','Douglas Crockford','9780596517748','Les bons côtés de JS.',34.00,5,2),
 (6,'Les Misérables','Victor Hugo','9782253096344','Fresque sociale.',17.90,12,1),
 (7,'Cosmos','Carl Sagan','9782266149488','Voyage dans l''univers.',16.50,6,3),
 (8,'Ouvrage épuisé (test)','Auteur Test','9780000000008','Stock à 0 : invisible côté public.',10.00,0,1);

-- Commande d'Alice (payée) : lui donne le droit de laisser un avis sur les ouvrages 1 et 3
INSERT INTO commandes (id, client_id, total, statut, adresse_livraison, mode_livraison, mode_paiement, payment_provider_id)
 VALUES (1,4,32.45,'payee','123 rue Test, Montréal','standard','simulation','SIM-SEED-0001');
INSERT INTO commande_items (commande_id, ouvrage_id, quantite, prix_unitaire) VALUES
 (1,1,1,12.50),(1,3,1,19.95);
INSERT INTO payments (commande_id, provider, provider_payment_id, statut, amount)
 VALUES (1,'simulation','SIM-SEED-0001','reussi',32.45);

INSERT INTO avis (client_id, ouvrage_id, note, commentaire) VALUES (4,1,5,'Un classique incontournable.');

INSERT INTO commentaires (client_id, ouvrage_id, contenu, valide, date_validation, valide_par) VALUES
 (4,1,'Très belle édition, livraison rapide.',TRUE,NOW(),3);
INSERT INTO commentaires (client_id, ouvrage_id, contenu) VALUES
 (4,3,'Passionnant mais parfois difficile.');

-- Panier actif de Bob et liste de cadeaux de Bob
INSERT INTO panier (id, client_id, actif) VALUES (1,5,TRUE);
INSERT INTO panier_items (panier_id, ouvrage_id, quantite, prix_unitaire) VALUES (1,5,1,34.00);

INSERT INTO listes_cadeaux (id, nom, proprietaire_id, code_partage) VALUES (1,'Anniversaire de Bob',5,'a1b2c3d4e5f6');
INSERT INTO liste_items (liste_id, ouvrage_id, quantite_souhaitee) VALUES (1,2,2),(1,4,1);
