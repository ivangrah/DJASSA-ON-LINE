-- Jeu de données de démonstration Djassa Online (schéma microservices actuel).
-- Exécuter avec : psql -U postgres -f database/seeders/demo_accounts.sql
-- (connecte sur djassa_auth_db puis djassa_catalog_db)
-- Mot de passe commun pour les 3 comptes : password123

\set ON_ERROR_STOP on

\connect djassa_auth_db
INSERT INTO users (id, nom, email, telephone, password, role, plan_abonnement, abonnement_actif_jusqu_au, verifie)
VALUES
 ('11111111-1111-4111-8111-111111111111','Aya Konan','particulier@djassa.ci','+225 07 00 00 00 01','$2y$12$Iz5rMSVdLgw9.WkhCG0fv.zCl2PUUXAP7A8M9wIaZ1FshBDqCdYCa','particulier','gratuit',NULL,TRUE),
 ('22222222-2222-4222-8222-222222222222','Boutique Cocody','pro@djassa.ci','+225 05 00 00 00 02','$2y$12$Iz5rMSVdLgw9.WkhCG0fv.zCl2PUUXAP7A8M9wIaZ1FshBDqCdYCa','vendeur_pro','pro',now() + interval '30 days',TRUE),
 ('99999999-9999-4999-8999-999999999999','Admin Djassa','admin@djassa.ci','+225 07 00 00 00 00','$2y$12$Iz5rMSVdLgw9.WkhCG0fv.zCl2PUUXAP7A8M9wIaZ1FshBDqCdYCa','admin','pro',now() + interval '365 days',TRUE)
ON CONFLICT (email) DO UPDATE SET password=EXCLUDED.password, role=EXCLUDED.role, plan_abonnement=EXCLUDED.plan_abonnement, abonnement_actif_jusqu_au=EXCLUDED.abonnement_actif_jusqu_au, verifie=TRUE;

\connect djassa_catalog_db
INSERT INTO categories (nom, slug) VALUES
 ('Téléphones','telephones'), ('Vêtements','vetements'), ('Mobilier','mobilier'),
 ('Électronique','electronique'), ('Livres','livres')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO boutiques (id, utilisateur_id, nom_boutique, slug, ville, verifie, is_active)
VALUES ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','Cocody Style','cocody-style','Abidjan',TRUE,TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO articles (utilisateur_id, boutique_id, titre, description, prix, condition, mode_transaction, est_trocable, stock, categorie, ville, statut, images)
SELECT '22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','iPhone 13 128 Go reconditionné','Excellent état, batterie 92%.',185000.00,'bon_etat','vente',TRUE,1,'Téléphones','Abidjan','published','["/images/illustrations/cart-3d-phone.webp"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE titre='iPhone 13 128 Go reconditionné');

INSERT INTO articles (utilisateur_id, boutique_id, titre, description, prix, condition, mode_transaction, est_trocable, stock, categorie, ville, statut, images)
SELECT '22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','Casque audio sans fil neuf','Neuf sous blister.',42500.00,'neuf','vente',FALSE,8,'Électronique','Abidjan','published','["/images/illustrations/hero-cart-3d.webp"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE titre='Casque audio sans fil neuf');