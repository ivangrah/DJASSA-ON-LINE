#!/usr/bin/env bash
set -euo pipefail
# Seed idempotent de démonstration Djassa (5 bases). Requiert docker compose up.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
PSQL=(docker compose exec -T postgres psql -U postgres -v ON_ERROR_STOP=1)
PW='$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO' # password123

echo "== Auth DB =="
"${PSQL[@]}" -d djassa_auth_db <<'SQL'
BEGIN;
-- 10 utilisateurs variés Abidjan
INSERT INTO users (id,nom,email,telephone,password,role,statut,verifie,kyc_status,ville,quartier,solde_portefeuille,created_at,updated_at)
VALUES
('11111111-1111-4111-8111-111111111101','Awa Koné','awa.kone@djassa.demo','+2250701010101','$PW','particulier','actif',true,'none','Abidjan','Cocody',0,NOW()-INTERVAL '25 days',NOW()),
('11111111-1111-4111-8111-111111111102','Bakary Traoré','bakary.traore@djassa.demo','+2250702020202','$PW','particulier','actif',true,'none','Abidjan','Yopougon',0,NOW()-INTERVAL '24 days',NOW()),
('11111111-1111-4111-8111-111111111103','Clarisse N’Guessan','clarisse.nguessan@djassa.demo','+2250703030303','$PW','particulier','actif',true,'none','Abidjan','Marcory',0,NOW()-INTERVAL '23 days',NOW()),
('11111111-1111-4111-8111-111111111104','Daouda Coulibaly','daouda.coulibaly@djassa.demo','+2250704040404','$PW','particulier','actif',false,'none','Abidjan','Plateau',0,NOW()-INTERVAL '22 days',NOW()),
('11111111-1111-4111-8111-111111111105','Estelle Bamba','estelle.bamba@djassa.demo','+2250705050505','$PW','particulier','actif',true,'none','Abidjan','Treichville',0,NOW()-INTERVAL '21 days',NOW()),
('11111111-1111-4111-8111-111111111106','Fatou Diallo','fatou.diallo@djassa.demo','+2250706060606','$PW','particulier','actif',true,'none','Abidjan','Abobo',0,NOW()-INTERVAL '20 days',NOW()),
('22222222-2222-4222-8222-222222222201','Moussa Koffi','moussa.koffi@djassa.demo','+2250707070707','$PW','vendeur_pro','actif',true,'verified','Abidjan','Cocody',0,NOW()-INTERVAL '19 days',NOW()),
('22222222-2222-4222-8222-222222222202','Nadia Ouattara','nadia.ouattara@djassa.demo','+2250708080808','$PW','vendeur_pro','actif',true,'verified','Abidjan','Marcory',0,NOW()-INTERVAL '18 days',NOW()),
('22222222-2222-4222-8222-222222222203','Oumar Sylla','oumar.sylla@djassa.demo','+2250709090909','$PW','vendeur_pro','actif',true,'verified','Abidjan','Yopougon',0,NOW()-INTERVAL '17 days',NOW()),
('22222222-2222-4222-8222-222222222204','Prisca Yao','prisca.yao@djassa.demo','+2250710101010','$PW','vendeur_pro','actif',true,'verified','Abidjan','Plateau',0,NOW()-INTERVAL '16 days',NOW())
ON CONFLICT (email) DO UPDATE SET nom=EXCLUDED.nom, telephone=EXCLUDED.telephone, role=EXCLUDED.role, statut=EXCLUDED.statut, verifie=EXCLUDED.verifie, ville=EXCLUDED.ville, quartier=EXCLUDED.quartier, updated_at=NOW();

-- 3 offres d'abonnement
INSERT INTO offres_abonnement (code,nom,description,montant_fcfa,duree_jours,avantages,actif,created_at,updated_at)
VALUES
('GRATUIT','Gratuit','Découverte Djassa',0,365,'["Accès catalogue","Messagerie"]'::json,true,NOW(),NOW()),
('PRO_MENSUEL','Pro Mensuel','Boutique Pro mensuelle',15000,30,'["Boutique vérifiée","Articles neufs","Stats ventes"]'::json,true,NOW(),NOW()),
('PRO_ANNUEL','Pro Annuel','Boutique Pro annuelle',150000,365,'["Boutique vérifiée","Articles neufs","Stats ventes","Support prioritaire"]'::json,true,NOW(),NOW())
ON CONFLICT (code) DO UPDATE SET nom=EXCLUDED.nom, description=EXCLUDED.description, montant_fcfa=EXCLUDED.montant_fcfa, duree_jours=EXCLUDED.duree_jours, avantages=EXCLUDED.avantages, actif=EXCLUDED.actif, updated_at=NOW();

-- 15 entrées d'audit
INSERT INTO audit_logs (user_id,action,ip,user_agent,meta,created_at)
SELECT * FROM (VALUES
('11111111-1111-4111-8111-111111111101'::uuid,'auth.login','41.202.10.1','Mozilla/5.0','{"channel":"web"}'::json,NOW()-INTERVAL '15 days'),
('11111111-1111-4111-8111-111111111101'::uuid,'auth.logout','41.202.10.1','Mozilla/5.0','{}'::json,NOW()-INTERVAL '15 days'),
('11111111-1111-4111-8111-111111111102'::uuid,'auth.login_failed','41.202.10.2','Mozilla/5.0','{"reason":"bad_password"}'::json,NOW()-INTERVAL '14 days'),
('11111111-1111-4111-8111-111111111102'::uuid,'auth.login','41.202.10.2','Mozilla/5.0','{}'::json,NOW()-INTERVAL '14 days'),
('22222222-2222-4222-8222-222222222201'::uuid,'auth.login','41.202.20.1','Mozilla/5.0','{"role":"vendeur_pro"}'::json,NOW()-INTERVAL '13 days'),
('22222222-2222-4222-8222-222222222201'::uuid,'auth.logout','41.202.20.1','Mozilla/5.0','{}'::json,NOW()-INTERVAL '13 days'),
('11111111-1111-4111-8111-111111111103'::uuid,'auth.login','41.202.10.3','Mozilla/5.0','{}'::json,NOW()-INTERVAL '12 days'),
('11111111-1111-4111-8111-111111111104'::uuid,'auth.login_failed','41.202.10.4','Mozilla/5.0','{"reason":"bad_password"}'::json,NOW()-INTERVAL '11 days'),
('22222222-2222-4222-8222-222222222202'::uuid,'auth.login','41.202.20.2','Mozilla/5.0','{}'::json,NOW()-INTERVAL '10 days'),
('22222222-2222-4222-8222-222222222202'::uuid,'auth.logout','41.202.20.2','Mozilla/5.0','{}'::json,NOW()-INTERVAL '10 days'),
('11111111-1111-4111-8111-111111111105'::uuid,'auth.login','41.202.10.5','Mozilla/5.0','{}'::json,NOW()-INTERVAL '9 days'),
('22222222-2222-4222-8222-222222222203'::uuid,'auth.login','41.202.20.3','Mozilla/5.0','{}'::json,NOW()-INTERVAL '8 days'),
('11111111-1111-4111-8111-111111111106'::uuid,'auth.login_failed','41.202.10.6','Mozilla/5.0','{"reason":"bad_password"}'::json,NOW()-INTERVAL '7 days'),
('22222222-2222-4222-8222-222222222204'::uuid,'auth.login','41.202.20.4','Mozilla/5.0','{}'::json,NOW()-INTERVAL '6 days'),
('22222222-2222-4222-8222-222222222204'::uuid,'auth.logout','41.202.20.4','Mozilla/5.0','{}'::json,NOW()-INTERVAL '6 days')
) AS v(user_id,action,ip,user_agent,meta,created_at)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.action=v.action AND a.user_id=v.user_id AND a.created_at=v.created_at);
COMMIT;
SQL

echo "== Catalog DB =="
"${PSQL[@]}" -d djassa_catalog_db <<'SQL'
BEGIN;
INSERT INTO boutiques (id,utilisateur_id,nom_boutique,slug,description,telephone,categorie,ville,is_active,verifie,accepte_troc,note_moyenne,nombre_avis,total_ventes,created_at,updated_at)
VALUES
('33333333-3333-4333-8333-333333333301','22222222-2222-4222-8222-222222222201','Cocody Tech Store','cocody-tech-store','Smartphones et accessoires premium à Cocody.','+2250707070707','electronique','Abidjan',true,true,true,4.7,12,8,NOW()-INTERVAL '18 days',NOW()),
('33333333-3333-4333-8333-333333333302','22222222-2222-4222-8222-222222222202','Marcory Maison','marcory-maison','Maison, déco et petit électroménager.','+2250708080808','maison','Abidjan',true,true,false,4.5,9,6,NOW()-INTERVAL '17 days',NOW()),
('33333333-3333-4333-8333-333333333303','22222222-2222-4222-8222-222222222203','Yopougon Fashion','yopougon-fashion','Mode urbaine et accessoires.','+2250709090909','mode','Abidjan',true,true,true,4.6,15,10,NOW()-INTERVAL '16 days',NOW()),
('33333333-3333-4333-8333-333333333304','22222222-2222-4222-8222-222222222204','Plateau Pro Market','plateau-pro-market','Équipements pro et bureautique.','+2250710101010','business','Abidjan',true,true,false,4.8,7,5,NOW()-INTERVAL '15 days',NOW())
ON CONFLICT (id) DO UPDATE SET nom_boutique=EXCLUDED.nom_boutique, slug=EXCLUDED.slug, description=EXCLUDED.description, ville=EXCLUDED.ville, verifie=EXCLUDED.verifie, is_active=EXCLUDED.is_active, updated_at=NOW();

-- 12 articles variés (neuf B2C + occasion C2C), images webp existantes
INSERT INTO articles (id,utilisateur_id,boutique_id,titre,description,prix,prix_flash,prix_negociable,condition,mode_transaction,est_trocable,stock,categorie,specs,images,ville,quartier,statut,vente_flash,flash_fin_at,vues,favoris,created_at,updated_at)
VALUES
('44444444-4444-4444-8444-444444444401','22222222-2222-4222-8222-222222222201','33333333-3333-4333-8333-333333333301','iPhone 13 128Go','iPhone 13 neuf, garantie 12 mois.',450000,NULL,false,'neuf','escrow',false,5,'electronique','{"marque":"Apple","stockage":"128Go"}'::jsonb,'["/images/illustrations/cart-3d-phone.webp"]'::jsonb,'Abidjan','Cocody','published',false,NULL,120,14,NOW()-INTERVAL '14 days',NOW()),
('44444444-4444-4444-8444-444444444402','22222222-2222-4222-8222-222222222201','33333333-3333-4333-8333-333333333301','Samsung Galaxy A35','Smartphone neuf Android.',185000,169000,false,'neuf','escrow',false,8,'electronique','{"marque":"Samsung"}'::jsonb,'["/images/illustrations/cart-rose-3d.webp"]'::jsonb,'Abidjan','Cocody','published',true,NOW()+INTERVAL '2 days',98,9,NOW()-INTERVAL '13 days',NOW()),
('44444444-4444-4444-8444-444444444403','22222222-2222-4222-8222-222222222201','33333333-3333-4333-8333-333333333301','AirPods Pro occasion','Très bon état, boîte incluse.',65000,NULL,true,'bon_etat','escrow',true,1,'electronique','{"etat":"tres_bon"}'::jsonb,'["/images/cart-floating-products.webp"]'::jsonb,'Abidjan','Cocody','published',false,NULL,76,7,NOW()-INTERVAL '12 days',NOW()),
('44444444-4444-4444-8444-444444444404','22222222-2222-4222-8222-222222222202','33333333-3333-4333-8333-333333333302','Mixeur Blender Pro','Mixeur neuf 1200W.',45000,NULL,false,'neuf','escrow',false,10,'maison','{"puissance":"1200W"}'::jsonb,'["/images/cart-basket-receipt.webp"]'::jsonb,'Abidjan','Marcory','published',false,NULL,55,4,NOW()-INTERVAL '11 days',NOW()),
('44444444-4444-4444-8444-444444444405','22222222-2222-4222-8222-222222222202','33333333-3333-4333-8333-333333333302','Canapé 3 places','Canapé occasion propre.',120000,NULL,true,'bon_etat','escrow',true,1,'maison','{"couleur":"gris"}'::jsonb,'["/images/illustrations/storefront-flat.webp"]'::jsonb,'Abidjan','Marcory','published',false,NULL,66,5,NOW()-INTERVAL '10 days',NOW()),
('44444444-4444-4444-8444-444444444406','22222222-2222-4222-8222-222222222202','33333333-3333-4333-8333-333333333302','Micro-ondes 25L','Micro-ondes neuf.',75000,69000,false,'neuf','escrow',false,6,'maison','{"volume":"25L"}'::jsonb,'["/images/promo-megaphone.webp"]'::jsonb,'Abidjan','Marcory','published',true,NOW()+INTERVAL '3 days',44,3,NOW()-INTERVAL '9 days',NOW()),
('44444444-4444-4444-8444-444444444407','22222222-2222-4222-8222-222222222203','33333333-3333-4333-8333-333333333303','Sneakers Urban','Paire neuve taille 42.',35000,NULL,false,'neuf','escrow',false,12,'mode','{"taille":"42"}'::jsonb,'["/images/hero-shopping-bags.webp"]'::jsonb,'Abidjan','Yopougon','published',false,NULL,88,11,NOW()-INTERVAL '8 days',NOW()),
('44444444-4444-4444-8444-444444444408','22222222-2222-4222-8222-222222222203','33333333-3333-4333-8333-333333333303','Montre classique','Montre occasion élégante.',28000,NULL,true,'bon_etat','escrow',true,1,'mode','{"etat":"bon"}'::jsonb,'["/images/bag-heart.webp"]'::jsonb,'Abidjan','Yopougon','published',false,NULL,39,2,NOW()-INTERVAL '7 days',NOW()),
('44444444-4444-4444-8444-444444444409','22222222-2222-4222-8222-222222222203','33333333-3333-4333-8333-333333333303','Sac cuir femme','Sac neuf cuir synthétique premium.',52000,NULL,false,'neuf','escrow',false,7,'mode','{"matiere":"cuir"}'::jsonb,'["/images/hero-bags-burst.webp"]'::jsonb,'Abidjan','Yopougon','published',false,NULL,71,8,NOW()-INTERVAL '6 days',NOW()),
('44444444-4444-4444-8444-444444444410','22222222-2222-4222-8222-222222222204','33333333-3333-4333-8333-333333333304','Imprimante Laser Pro','Imprimante neuve bureau.',165000,NULL,false,'neuf','escrow',false,4,'business','{"type":"laser"}'::jsonb,'["/images/illustrations/ecommerce-laptop-payment.webp"]'::jsonb,'Abidjan','Plateau','published',false,NULL,33,3,NOW()-INTERVAL '5 days',NOW()),
('44444444-4444-4444-8444-444444444411','22222222-2222-4222-8222-222222222204','33333333-3333-4333-8333-333333333304','Chaise bureau ergonomique','Chaise occasion pro.',55000,NULL,true,'bon_etat','escrow',true,2,'business','{"ergonomie":"haute"}'::jsonb,'["/images/illustrations/storefront-arrows.webp"]'::jsonb,'Abidjan','Plateau','published',false,NULL,27,2,NOW()-INTERVAL '4 days',NOW()),
('44444444-4444-4444-8444-444444444412','22222222-2222-4222-8222-222222222204','33333333-3333-4333-8333-333333333304','Scanner documents','Scanner neuf compact.',89000,79000,false,'neuf','escrow',false,6,'business','{"format":"A4"}'::jsonb,'["/images/illustrations/ecommerce-laptop-iso.webp"]'::jsonb,'Abidjan','Plateau','published',true,NOW()+INTERVAL '1 day',41,4,NOW()-INTERVAL '3 days',NOW())
ON CONFLICT (id) DO UPDATE SET titre=EXCLUDED.titre, prix=EXCLUDED.prix, statut=EXCLUDED.statut, images=EXCLUDED.images, updated_at=NOW();
COMMIT;
SQL

echo "== Escrow DB =="
"${PSQL[@]}" -d djassa_escrow_db <<'SQL'
BEGIN;
-- 10 transactions réparties sur 30 jours (held/released/refunded), montants FCFA
INSERT INTO transactions (id,acheteur_id,vendeur_id,article_id,boutique_id,type,montant,frais_escrow,geniuspay_ref,escrow_status,pin_hash,pin_attempts,held_at,released_at,refunded_at,created_at,updated_at)
VALUES
('55555555-5555-4555-8555-555555555501','11111111-1111-4111-8111-111111111101','22222222-2222-4222-8222-222222222201','44444444-4444-4444-8444-444444444401','33333333-3333-4333-8333-333333333301','achat',450000,5000,'GP-DEMO-001','released','$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO',0,NOW()-INTERVAL '29 days',NOW()-INTERVAL '28 days',NULL,NOW()-INTERVAL '29 days',NOW()-INTERVAL '28 days'),
('55555555-5555-4555-8555-555555555502','11111111-1111-4111-8111-111111111102','22222222-2222-4222-8222-222222222201','44444444-4444-4444-8444-444444444402','33333333-3333-4333-8333-333333333301','achat',169000,2000,'GP-DEMO-002','held','$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO',0,NOW()-INTERVAL '25 days',NULL,NULL,NOW()-INTERVAL '25 days',NOW()-INTERVAL '25 days'),
('55555555-5555-4555-8555-555555555503','11111111-1111-4111-8111-111111111103','22222222-2222-4222-8222-222222222202','44444444-4444-4444-8444-444444444404','33333333-3333-4333-8333-333333333302','achat',45000,1000,'GP-DEMO-003','released','$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO',0,NOW()-INTERVAL '22 days',NOW()-INTERVAL '21 days',NULL,NOW()-INTERVAL '22 days',NOW()-INTERVAL '21 days'),
('55555555-5555-4555-8555-555555555504','11111111-1111-4111-8111-111111111104','22222222-2222-4222-8222-222222222202','44444444-4444-4444-8444-444444444406','33333333-3333-4333-8333-333333333302','achat',69000,1000,'GP-DEMO-004','refunded','$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO',0,NOW()-INTERVAL '20 days',NULL,NOW()-INTERVAL '19 days',NOW()-INTERVAL '20 days',NOW()-INTERVAL '19 days'),
('55555555-5555-4555-8555-555555555505','11111111-1111-4111-8111-111111111105','22222222-2222-4222-8222-222222222203','44444444-4444-4444-8444-444444444407','33333333-3333-4333-8333-333333333303','achat',35000,500,'GP-DEMO-005','released','$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO',0,NOW()-INTERVAL '17 days',NOW()-INTERVAL '16 days',NULL,NOW()-INTERVAL '17 days',NOW()-INTERVAL '16 days'),
('55555555-5555-4555-8555-555555555506','11111111-1111-4111-8111-111111111106','22222222-2222-4222-8222-222222222203','44444444-4444-4444-8444-444444444409','33333333-3333-4333-8333-333333333303','achat',52000,500,'GP-DEMO-006','held','$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO',0,NOW()-INTERVAL '14 days',NULL,NULL,NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days'),
('55555555-5555-4555-8555-555555555507','11111111-1111-4111-8111-111111111101','22222222-2222-4222-8222-222222222204','44444444-4444-4444-8444-444444444410','33333333-3333-4333-8333-333333333304','achat',165000,2000,'GP-DEMO-007','released','$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO',0,NOW()-INTERVAL '11 days',NOW()-INTERVAL '10 days',NULL,NOW()-INTERVAL '11 days',NOW()-INTERVAL '10 days'),
('55555555-5555-4555-8555-555555555508','11111111-1111-4111-8111-111111111102','22222222-2222-4222-8222-222222222204','44444444-4444-4444-8444-444444444412','33333333-3333-4333-8333-333333333304','achat',79000,1000,'GP-DEMO-008','held','$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO',0,NOW()-INTERVAL '8 days',NULL,NULL,NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days'),
('55555555-5555-4555-8555-555555555509','11111111-1111-4111-8111-111111111103','22222222-2222-4222-8222-222222222201','44444444-4444-4444-8444-444444444403','33333333-3333-4333-8333-333333333301','achat',65000,1000,'GP-DEMO-009','released','$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO',0,NOW()-INTERVAL '5 days',NOW()-INTERVAL '4 days',NULL,NOW()-INTERVAL '5 days',NOW()-INTERVAL '4 days'),
('55555555-5555-4555-8555-555555555510','11111111-1111-4111-8111-111111111104','22222222-2222-4222-8222-222222222203','44444444-4444-4444-8444-444444444408','33333333-3333-4333-8333-333333333303','achat',28000,500,'GP-DEMO-010','refunded','$2y$12$LCgTnlZeYoFbyfEqpNEDAe1xJv/LLq4v7rc/QoSsT.olI9x3z2FcO',0,NOW()-INTERVAL '2 days',NULL,NOW()-INTERVAL '1 day',NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET escrow_status=EXCLUDED.escrow_status, montant=EXCLUDED.montant, held_at=EXCLUDED.held_at, released_at=EXCLUDED.released_at, refunded_at=EXCLUDED.refunded_at, updated_at=NOW();
COMMIT;
SQL

echo "== Troc DB =="
"${PSQL[@]}" -d djassa_troc_db <<'SQL'
BEGIN;
INSERT INTO articles_ref (id,titre,created_at,updated_at)
VALUES
('44444444-4444-4444-8444-444444444401','iPhone 13 128Go',NOW(),NOW()),
('44444444-4444-4444-8444-444444444403','AirPods Pro occasion',NOW(),NOW()),
('44444444-4444-4444-8444-444444444405','Canapé 3 places',NOW(),NOW()),
('44444444-4444-4444-8444-444444444408','Montre classique',NOW(),NOW()),
('44444444-4444-4444-8444-444444444411','Chaise bureau ergonomique',NOW(),NOW()),
('44444444-4444-4444-8444-444444444407','Sneakers Urban',NOW(),NOW()),
('44444444-4444-4444-8444-444444444409','Sac cuir femme',NOW(),NOW()),
('44444444-4444-4444-8444-444444444410','Imprimante Laser Pro',NOW(),NOW())
ON CONFLICT (id) DO UPDATE SET titre=EXCLUDED.titre, updated_at=NOW();

INSERT INTO offres_troc (id,article_cible_id,acheteur_id,vendeur_id,montant_soulte_fcfa,montant_contre_offre_fcfa,message,reference,statut,created_at,updated_at)
VALUES
('66666666-6666-4666-8666-666666666601','44444444-4444-4444-8444-444444444403','11111111-1111-4111-8111-111111111101','22222222-2222-4222-8222-222222222201',0,0,'Troc pur écouteurs contre accessoire.','TROC-DEMO-001','pending',NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days'),
('66666666-6666-4666-8666-666666666602','44444444-4444-4444-8444-444444444405','11111111-1111-4111-8111-111111111102','22222222-2222-4222-8222-222222222202',15000,0,'Troc mixte avec soulte 15 000 FCFA.','TROC-DEMO-002','accepted',NOW()-INTERVAL '11 days',NOW()-INTERVAL '10 days'),
('66666666-6666-4666-8666-666666666603','44444444-4444-4444-8444-444444444408','11111111-1111-4111-8111-111111111103','22222222-2222-4222-8222-222222222203',0,0,'Échange montre contre sac.','TROC-DEMO-003','rejected',NOW()-INTERVAL '9 days',NOW()-INTERVAL '8 days'),
('66666666-6666-4666-8666-666666666604','44444444-4444-4444-8444-444444444411','11111111-1111-4111-8111-111111111104','22222222-2222-4222-8222-222222222204',10000,0,'Troc mixte chaise bureau.','TROC-DEMO-004','pending',NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days'),
('66666666-6666-4666-8666-666666666605','44444444-4444-4444-8444-444444444407','11111111-1111-4111-8111-111111111105','22222222-2222-4222-8222-222222222203',5000,0,'Troc mixte sneakers + soulte.','TROC-DEMO-005','accepted',NOW()-INTERVAL '5 days',NOW()-INTERVAL '4 days'),
('66666666-6666-4666-8666-666666666606','44444444-4444-4444-8444-444444444410','11111111-1111-4111-8111-111111111106','22222222-2222-4222-8222-222222222204',0,0,'Troc pur imprimante contre équipement.','TROC-DEMO-006','pending',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET statut=EXCLUDED.statut, montant_soulte_fcfa=EXCLUDED.montant_soulte_fcfa, message=EXCLUDED.message, updated_at=NOW();
COMMIT;
SQL

echo "== Redis cache flush (djassa:*) =="
# Flush ciblé des clés djassa:* sans vider toute l'instance Redis.
docker compose exec -T redis redis-cli --scan --pattern 'djassa:*' | while read -r k; do
  [ -n "$k" ] && docker compose exec -T redis redis-cli DEL "$k" >/dev/null || true
done

echo "Seed démo terminé."
