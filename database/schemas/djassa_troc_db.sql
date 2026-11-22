-- djassa_troc_db — troc pur / mixte et verrous d'inventaire

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS offres_troc (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediteur_id       UUID NOT NULL, -- auth-subscription-service
    destinataire_id     UUID NOT NULL, -- auth-subscription-service
    article_cible_id    UUID NOT NULL, -- catalog-service (référence logique)
    type                TEXT NOT NULL CHECK (type IN ('pur','mixte')),
    montant_soulte_fcfa NUMERIC(12,2) DEFAULT 0 CHECK (montant_soulte_fcfa >= 0),
    statut              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (statut IN ('pending','countered','accepted','refused','expired')),
    message             TEXT,
    expire_le           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT soulte_si_mixte CHECK (
        (type = 'pur' AND montant_soulte_fcfa = 0) OR type = 'mixte'
    )
);
CREATE INDEX IF NOT EXISTS idx_troc_expediteur ON offres_troc (expediteur_id);
CREATE INDEX IF NOT EXISTS idx_troc_destinataire ON offres_troc (destinataire_id);

CREATE TABLE IF NOT EXISTS items_echanges (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offre_id     UUID NOT NULL REFERENCES offres_troc(id) ON DELETE CASCADE,
    article_id   UUID NOT NULL, -- catalog-service
    proprietaire UUID NOT NULL, -- auth-subscription-service
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (offre_id, article_id)
);

CREATE TABLE IF NOT EXISTS verrous_stock (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id  UUID NOT NULL,
    offre_id    UUID REFERENCES offres_troc(id) ON DELETE CASCADE,
    expire_le   TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (article_id, offre_id)
);
CREATE INDEX IF NOT EXISTS idx_verrous_expiration ON verrous_stock (expire_le);

-- Indexes complémentaires (règle 22)
CREATE INDEX IF NOT EXISTS idx_troc_statut ON offres_troc (statut);
CREATE INDEX IF NOT EXISTS idx_troc_created_at ON offres_troc (created_at DESC);
