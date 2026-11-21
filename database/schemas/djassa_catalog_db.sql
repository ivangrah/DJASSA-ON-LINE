-- djassa_catalog_db — catalogue, boutiques pro et mur des souhaits

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom   TEXT NOT NULL UNIQUE,
    slug  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS boutiques (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietaire_id UUID NOT NULL, -- référence logique vers auth-subscription-service (pas de FK inter-bases)
    nom             TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT,
    quartier        TEXT,
    ville           TEXT NOT NULL DEFAULT 'Abidjan',
    verifiee        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_boutiques_proprio ON boutiques (proprietaire_id);

CREATE TABLE IF NOT EXISTS articles (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boutique_id  UUID REFERENCES boutiques(id) ON DELETE SET NULL,
    vendeur_id   UUID NOT NULL, -- auth-subscription-service
    categorie_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    titre        TEXT NOT NULL,
    description  TEXT,
    etat         TEXT NOT NULL CHECK (etat IN ('used','new')),
    marche       TEXT NOT NULL DEFAULT 'occasion' CHECK (marche IN ('occasion','neuf')),
    prix_fcfa    NUMERIC(12,2) NOT NULL CHECK (prix_fcfa >= 0),
    stock        INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
    troc_active  BOOLEAN NOT NULL DEFAULT FALSE,
    quartier     TEXT,
    ville        TEXT NOT NULL DEFAULT 'Abidjan',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT article_coherence CHECK (
        (etat = 'new' AND marche = 'neuf' AND boutique_id IS NOT NULL) OR
        (etat = 'used' AND marche = 'occasion')
    )
);
CREATE INDEX IF NOT EXISTS idx_articles_vendeur ON articles (vendeur_id);
CREATE INDEX IF NOT EXISTS idx_articles_boutique ON articles (boutique_id);

CREATE TABLE IF NOT EXISTS souhaits (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL, -- auth-subscription-service
    categorie_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    titre        TEXT NOT NULL,
    budget_max    NUMERIC(12,2) CHECK (budget_max IS NULL OR budget_max >= 0),
    quartier     TEXT,
    actif        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_souhaits_user ON souhaits (user_id);
