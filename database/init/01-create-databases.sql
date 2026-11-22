-- Djassa Online — initialisation PostgreSQL (Database-per-Service)
-- Exécuté par l'image postgres via /docker-entrypoint-initdb.d au premier démarrage.
-- IMPORTANT : remplacer les mots de passe change_me_* par des secrets en production.
\set ON_ERROR_STOP on

-- 1. Rôles dédiés (un par domaine)
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'djassa_auth', 'change_me_djassa_auth')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'djassa_auth') \gexec
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'djassa_catalog', 'change_me_djassa_catalog')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'djassa_catalog') \gexec
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'djassa_troc', 'change_me_djassa_troc')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'djassa_troc') \gexec
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'djassa_escrow', 'change_me_djassa_escrow')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'djassa_escrow') \gexec
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'djassa_chat', 'change_me_djassa_chat')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'djassa_chat') \gexec

-- 2. Bases isolées — CREATE DATABASE ne peut PAS être appelé depuis une fonction PL/pgSQL
SELECT format('CREATE DATABASE %I OWNER %I', 'djassa_auth_db', 'djassa_auth')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'djassa_auth_db') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', 'djassa_catalog_db', 'djassa_catalog')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'djassa_catalog_db') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', 'djassa_troc_db', 'djassa_troc')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'djassa_troc_db') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', 'djassa_escrow_db', 'djassa_escrow')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'djassa_escrow_db') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', 'djassa_chat_db', 'djassa_chat')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'djassa_chat_db') \gexec

-- 3. Aucun privilège PUBLIC sur les bases (règle de isolation D2)
REVOKE ALL ON DATABASE djassa_auth_db FROM PUBLIC;
REVOKE ALL ON DATABASE djassa_catalog_db FROM PUBLIC;
REVOKE ALL ON DATABASE djassa_troc_db FROM PUBLIC;
REVOKE ALL ON DATABASE djassa_escrow_db FROM PUBLIC;
REVOKE ALL ON DATABASE djassa_chat_db FROM PUBLIC;
