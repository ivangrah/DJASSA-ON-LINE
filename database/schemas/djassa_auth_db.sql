-- djassa_auth_db — identités, rôles et offres (auth-subscription-service)
-- UUID en clé primaire, rôles et forfaits validés par CHECK.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom                       TEXT NOT NULL,
    email                     TEXT NOT NULL UNIQUE,
    telephone                 TEXT,
    password_hash             TEXT,
    google_id                 TEXT UNIQUE,
    role                      TEXT NOT NULL DEFAULT 'particulier'
                              CHECK (role IN ('particulier','vendeur_pro','admin')),
    plan_abonnement           TEXT CHECK (plan_abonnement IS NULL OR plan_abonnement IN ('gratuit','pro')),
    abonnement_actif_jusqu_au TIMESTAMPTZ,
    verifie                   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pro_dates_coherentes CHECK (
        plan_abonnement <> 'pro' OR abonnement_actif_jusqu_au IS NOT NULL
    )
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users (plan_abonnement);

CREATE TABLE IF NOT EXISTS abonnements (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    formule    TEXT NOT NULL CHECK (formule IN ('gratuit','pro')),
    statut     TEXT NOT NULL DEFAULT 'pending'
               CHECK (statut IN ('pending','active','cancelled','expired')),
    debut_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    fin_at     TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT abonnement_dates_ok CHECK (fin_at IS NULL OR fin_at > debut_at)
);
CREATE INDEX IF NOT EXISTS idx_abonnements_user ON abonnements (user_id, statut);

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL DEFAULT 'api',
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pat_user ON personal_access_tokens (user_id);
