-- Djassa Online — initialisation PostgreSQL (Database-per-Service)
-- Exécuté une seule fois par l'image officielle postgres via /docker-entrypoint-initdb.d.
-- IMPORTANT : remplacer les mots de passe change_me_* par des secrets injectés en production.

\set ON_ERROR_STOP on

DO $$
DECLARE
    item record;
BEGIN
    FOR item IN
        SELECT * FROM (VALUES
            ('djassa_auth_db',    'djassa_auth'),
            ('djassa_catalog_db', 'djassa_catalog'),
            ('djassa_troc_db',    'djassa_troc'),
            ('djassa_escrow_db',  'djassa_escrow'),
            ('djassa_chat_db',    'djassa_chat')
        ) AS t(dbname, rolename)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = item.rolename) THEN
            EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', item.rolename,
                           'change_me_' || item.rolename);
        END IF;

        EXECUTE format('REVOKE ALL ON DATABASE %I FROM PUBLIC', item.dbname);

        IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = item.dbname) THEN
            EXECUTE format('CREATE DATABASE %I OWNER %I', item.dbname, item.rolename);
        END IF;
    END LOOP;
END $$;

-- Chaque service est propriétaire de SCHEMA public dans SA base uniquement.
-- Aucun rôle n'a de privilège sur la base d'un autre service (règle d'or n°1).
DO $$
DECLARE item record;
BEGIN
    FOR item IN SELECT * FROM (VALUES
        ('djassa_auth_db','djassa_auth'), ('djassa_catalog_db','djassa_catalog'),
        ('djassa_troc_db','djassa_troc'), ('djassa_escrow_db','djassa_escrow'),
        ('djassa_chat_db','djassa_chat')
    ) AS t(dbname, rolename) LOOP
        EXECUTE format('GRANT ALL ON SCHEMA public TO %I', item.rolename);
    END LOOP;
END $$;
