-- Jeu de données de démonstration ancré à Abidjan.
-- À exécuter avec psql : psql -f database/seeders/abidjan_seed.sql
-- Les UUID sont volontairement déterministes pour rendre les tests reproductibles.

\set ON_ERROR_STOP on

\connect djassa_auth_db
INSERT INTO users (id, nom, email, telephone, role, plan_abonnement, abonnement_actif_jusqu_au, verifie)
VALUES
 ('11111111-1111-4111-8111-111111111111','Aya Konan','aya.konan@example.ci','+225 07 00 00 00 01','particulier','gratuit',NULL,TRUE),
 ('22222222-2222-4222-8222-222222222222','Boutique Cocody','contact@cocody.example.ci','+225 05 00 00 00 02','vendeur_pro','pro',now() + interval '30 days',TRUE)
ON CONFLICT (id) DO NOTHING;

\connect djassa_catalog_db
INSERT INTO categories (nom, slug) VALUES
 ('Téléphones','telephones'), ('Vêtements','vetements'), ('Mobilier','mobilier'),
 ('Électronique','electronique'), ('Livres','livres')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO boutiques (id, proprietaire_id, nom, slug, quartier, ville, verifiee) VALUES
 ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222',
  'Cocody Style','cocody-style','Cocody','Abidjan',TRUE),
 ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222',
  'Marcory Select','marcory-select','Marcory','Abidjan',TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO articles (id, boutique_id, vendeur_id, categorie_id, titre, etat, marche, prix_fcfa, stock, quartier)
SELECT '55555555-5555-4555-8555-555555555555', b.id, '22222222-2222-4222-8222-222222222222', c.id,
       'iPhone 13 128 Go reconditionné', 'used','occasion', 185000.00, 1, 'Yopougon'
FROM boutiques b, categories c WHERE b.slug='cocody-style' AND c.slug='telephones'
ON CONFLICT (id) DO NOTHING;

INSERT INTO articles (id, boutique_id, vendeur_id, categorie_id, titre, etat, marche, prix_fcfa, stock, quartier)
SELECT '66666666-6666-4666-8666-666666666666', b.id, '22222222-2222-4222-8222-222222222222', c.id,
       'Casque audio sans fil neuf', 'new','neuf', 42500.00, 8, 'Plateau'
FROM boutiques b, categories c WHERE b.slug='marcory-select' AND c.slug='electronique'
ON CONFLICT (id) DO NOTHING;
