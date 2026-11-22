-- djassa_escrow_db — séquestre GeniusPay, webhooks et PIN (données financières isolées)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS transactions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference     TEXT NOT NULL UNIQUE,
    type          TEXT NOT NULL CHECK (type IN ('achat','soulte','abonnement')),
    montant_fcfa  NUMERIC(12,2) NOT NULL CHECK (montant_fcfa > 0),
    statut        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (statut IN ('pending','held','released','refunded','failed')),
    acheteur_id   UUID NOT NULL, -- auth-subscription-service
    vendeur_id    UUID NOT NULL, -- auth-subscription-service
    article_id    UUID,          -- catalog-service
    offre_id      UUID,          -- troc-engine-service
    fournisseur   TEXT NOT NULL DEFAULT 'geniuspay'
                  CHECK (fournisseur IN ('geniuspay','wave','orange','mtn','moov')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    held_at       TIMESTAMPTZ,
    released_at   TIMESTAMPTZ,
    CONSTRAINT release_apres_held CHECK (released_at IS NULL OR held_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_transactions_statut ON transactions (statut);
CREATE INDEX IF NOT EXISTS idx_transactions_acheteur ON transactions (acheteur_id);

CREATE TABLE IF NOT EXISTS webhooks_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference     TEXT NOT NULL,
    fournisseur   TEXT NOT NULL,
    signature_ok  BOOLEAN NOT NULL,
    payload_hash  TEXT NOT NULL,
    traite_le     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (reference, payload_hash) -- idempotence : un webhook ne peut être traité deux fois
);

CREATE TABLE IF NOT EXISTS pins_remise (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    pin_hash      TEXT NOT NULL, -- bcrypt, jamais le PIN en clair
    tentatives    INTEGER NOT NULL DEFAULT 0 CHECK (tentatives BETWEEN 0 AND 5),
    verrouille_le TIMESTAMPTZ,
    expire_le     TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pin_transaction_unique ON pins_remise (transaction_id);

-- Indexes complémentaires (règle 22)
CREATE INDEX IF NOT EXISTS idx_transactions_vendeur ON transactions (vendeur_id);
CREATE INDEX IF NOT EXISTS idx_transactions_escrow_status ON transactions (escrow_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at DESC);
