-- djassa_chat_db — messagerie et notifications (temps réel Redis/WebSockets)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS conversations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1  UUID NOT NULL, -- auth-subscription-service
    participant_2  UUID NOT NULL, -- auth-subscription-service
    article_id     UUID,          -- catalog-service
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (participant_1, participant_2, article_id),
    CONSTRAINT participants_distincts CHECK (participant_1 <> participant_2)
);

CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    expediteur_id   UUID NOT NULL, -- auth-subscription-service
    contenu         TEXT NOT NULL CHECK (length(contenu) <= 4000),
    lu_le           TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL, -- auth-subscription-service
    type        TEXT NOT NULL CHECK (type IN ('troc','vente','souhait','abonnement','securite')),
    titre       TEXT NOT NULL,
    corps       TEXT,
    canal       TEXT NOT NULL DEFAULT 'email' CHECK (canal IN ('email','sms','push','in_app')),
    lu_le       TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at);

-- Indexes complémentaires (règle 22)
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages (destinataire_id);
CREATE INDEX IF NOT EXISTS idx_messages_lu_at ON messages (lu_at);
