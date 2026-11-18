--
-- PostgreSQL database dump
--

\restrict nioKxjfrn4gWyuEmoUfg7HPcQAhuf0N76vBMwvQ6QVJLzf2BAdLeAqlL3Tuc3xQ

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    utilisateur_id uuid NOT NULL,
    boutique_id uuid,
    titre character varying(180) NOT NULL,
    description text,
    prix numeric(12,2) NOT NULL,
    prix_flash numeric(12,2),
    prix_negociable boolean DEFAULT false NOT NULL,
    condition character varying(20) DEFAULT 'bon_etat'::character varying NOT NULL,
    mode_transaction character varying(10) DEFAULT 'vente'::character varying NOT NULL,
    est_trocable boolean DEFAULT false NOT NULL,
    stock integer DEFAULT 1 NOT NULL,
    categorie character varying(100) NOT NULL,
    specs jsonb,
    images jsonb,
    ville character varying(100) DEFAULT 'Abidjan'::character varying NOT NULL,
    quartier character varying(100),
    statut character varying(12) DEFAULT 'draft'::character varying NOT NULL,
    vente_flash boolean DEFAULT false NOT NULL,
    flash_fin_at timestamp(0) with time zone,
    vues integer DEFAULT 0 NOT NULL,
    favoris integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    recherche tsvector GENERATED ALWAYS AS (to_tsvector('french'::regconfig, (((((COALESCE(titre, ''::character varying))::text || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || (COALESCE(categorie, ''::character varying))::text))) STORED,
    CONSTRAINT articles_condition_check CHECK (((condition)::text = ANY ((ARRAY['neuf'::character varying, 'comme_neuf'::character varying, 'bon_etat'::character varying, 'usage'::character varying])::text[]))),
    CONSTRAINT articles_mode_check CHECK (((mode_transaction)::text = ANY ((ARRAY['vente'::character varying, 'troc'::character varying, 'mixte'::character varying])::text[]))),
    CONSTRAINT articles_neuf_boutique_check CHECK ((((condition)::text <> 'neuf'::text) OR (boutique_id IS NOT NULL))),
    CONSTRAINT articles_prix_check CHECK ((prix >= (0)::numeric)),
    CONSTRAINT articles_prix_flash_check CHECK (((prix_flash IS NULL) OR (prix_flash >= (0)::numeric))),
    CONSTRAINT articles_statut_check CHECK (((statut)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'reserved'::character varying, 'sold'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT articles_stock_check CHECK ((stock >= 0))
);


--
-- Name: boutiques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.boutiques (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    utilisateur_id uuid NOT NULL,
    nom_boutique character varying(150) NOT NULL,
    slug character varying(170) NOT NULL,
    description text,
    logo character varying(255),
    banniere character varying(255),
    rccm_doc character varying(255),
    telephone character varying(20),
    categorie character varying(100),
    adresse character varying(255),
    ville character varying(100) DEFAULT 'Abidjan'::character varying NOT NULL,
    verifie boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    accepte_troc boolean DEFAULT true NOT NULL,
    note_moyenne numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    nombre_avis integer DEFAULT 0 NOT NULL,
    total_ventes bigint DEFAULT '0'::bigint NOT NULL,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    CONSTRAINT boutiques_note_check CHECK (((note_moyenne >= (0)::numeric) AND (note_moyenne <= (5)::numeric)))
);


--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expediteur_id uuid NOT NULL,
    destinataire_id uuid NOT NULL,
    article_id uuid,
    offre_troc_id uuid,
    type character varying(20) DEFAULT 'texte'::character varying NOT NULL,
    contenu text,
    payload jsonb,
    lu_at timestamp(0) with time zone,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    CONSTRAINT messages_parties_check CHECK ((expediteur_id <> destinataire_id)),
    CONSTRAINT messages_type_check CHECK (((type)::text = ANY ((ARRAY['texte'::character varying, 'offre_prix'::character varying, 'carte_troc'::character varying, 'systeme'::character varying])::text[])))
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: offres_troc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offres_troc (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_cible_id uuid NOT NULL,
    acheteur_id uuid NOT NULL,
    vendeur_id uuid NOT NULL,
    montant_soulte_fcfa numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    montant_contre_offre_fcfa numeric(12,2),
    message text,
    statut character varying(12) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    CONSTRAINT offres_troc_contre_offre_check CHECK (((montant_contre_offre_fcfa IS NULL) OR (montant_contre_offre_fcfa >= (0)::numeric))),
    CONSTRAINT offres_troc_pas_soi_meme_check CHECK ((acheteur_id <> vendeur_id)),
    CONSTRAINT offres_troc_soulte_check CHECK ((montant_soulte_fcfa >= (0)::numeric)),
    CONSTRAINT offres_troc_statut_check CHECK (((statut)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'countered'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: offres_troc_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offres_troc_articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    offre_troc_id uuid NOT NULL,
    article_offert_id uuid NOT NULL,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id uuid NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id uuid,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: souhaits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.souhaits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    utilisateur_id uuid NOT NULL,
    titre character varying(200) NOT NULL,
    description text,
    budget_max numeric(12,2),
    accepte_troc boolean DEFAULT true NOT NULL,
    categorie character varying(100),
    ville character varying(100) DEFAULT 'Abidjan'::character varying NOT NULL,
    statut character varying(12) DEFAULT 'active'::character varying NOT NULL,
    vues integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    mots_cles tsvector GENERATED ALWAYS AS (to_tsvector('french'::regconfig, (((((COALESCE(titre, ''::character varying))::text || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || (COALESCE(categorie, ''::character varying))::text))) STORED,
    CONSTRAINT souhaits_budget_check CHECK (((budget_max IS NULL) OR (budget_max >= (0)::numeric))),
    CONSTRAINT souhaits_statut_check CHECK (((statut)::text = ANY ((ARRAY['active'::character varying, 'fulfilled'::character varying, 'closed'::character varying])::text[])))
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    acheteur_id uuid NOT NULL,
    vendeur_id uuid NOT NULL,
    article_id uuid NOT NULL,
    offre_troc_id uuid,
    boutique_id uuid,
    type character varying(12) DEFAULT 'achat'::character varying NOT NULL,
    montant numeric(12,2) NOT NULL,
    frais_escrow numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    geniuspay_ref character varying(191),
    escrow_status character varying(12) DEFAULT 'initiated'::character varying NOT NULL,
    pin_hash character varying(255),
    pin_attempts smallint DEFAULT '0'::smallint NOT NULL,
    held_at timestamp(0) with time zone,
    released_at timestamp(0) with time zone,
    refunded_at timestamp(0) with time zone,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    CONSTRAINT transactions_escrow_status_check CHECK (((escrow_status)::text = ANY ((ARRAY['initiated'::character varying, 'held'::character varying, 'released'::character varying, 'refunded'::character varying, 'failed'::character varying])::text[]))),
    CONSTRAINT transactions_frais_check CHECK ((frais_escrow >= (0)::numeric)),
    CONSTRAINT transactions_montant_check CHECK ((montant >= (0)::numeric)),
    CONSTRAINT transactions_parties_check CHECK ((acheteur_id <> vendeur_id)),
    CONSTRAINT transactions_pin_attempts_check CHECK ((pin_attempts <= 5)),
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY ((ARRAY['achat'::character varying, 'troc_mixte'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom character varying(150) NOT NULL,
    email character varying(255),
    telephone character varying(20),
    password character varying(255),
    google_id character varying(191),
    avatar character varying(255),
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    kyc_status character varying(20) DEFAULT 'none'::character varying NOT NULL,
    ville character varying(100) DEFAULT 'Abidjan'::character varying NOT NULL,
    quartier character varying(100),
    solde_portefeuille numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    score_confiance integer DEFAULT 50 NOT NULL,
    email_verified_at timestamp(0) without time zone,
    telephone_verified_at timestamp(0) without time zone,
    remember_token character varying(100),
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    CONSTRAINT users_kyc_status_check CHECK (((kyc_status)::text = ANY ((ARRAY['none'::character varying, 'pending'::character varying, 'verified'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'pro_seller'::character varying, 'admin'::character varying])::text[]))),
    CONSTRAINT users_score_confiance_check CHECK (((score_confiance >= 0) AND (score_confiance <= 100))),
    CONSTRAINT users_solde_check CHECK ((solde_portefeuille >= (0)::numeric))
);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: boutiques boutiques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boutiques
    ADD CONSTRAINT boutiques_pkey PRIMARY KEY (id);


--
-- Name: boutiques boutiques_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boutiques
    ADD CONSTRAINT boutiques_slug_unique UNIQUE (slug);


--
-- Name: boutiques boutiques_utilisateur_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boutiques
    ADD CONSTRAINT boutiques_utilisateur_id_unique UNIQUE (utilisateur_id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: offres_troc_articles offres_troc_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_troc_articles
    ADD CONSTRAINT offres_troc_articles_pkey PRIMARY KEY (id);


--
-- Name: offres_troc_articles offres_troc_articles_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_troc_articles
    ADD CONSTRAINT offres_troc_articles_unique UNIQUE (offre_troc_id, article_offert_id);


--
-- Name: offres_troc offres_troc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_troc
    ADD CONSTRAINT offres_troc_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: souhaits souhaits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.souhaits
    ADD CONSTRAINT souhaits_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_geniuspay_ref_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_geniuspay_ref_unique UNIQUE (geniuspay_ref);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_google_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_telephone_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_telephone_unique UNIQUE (telephone);


--
-- Name: idx_articles_boutique; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_boutique ON public.articles USING btree (boutique_id) WHERE (boutique_id IS NOT NULL);


--
-- Name: idx_articles_categorie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_categorie ON public.articles USING btree (categorie);


--
-- Name: idx_articles_condition; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_condition ON public.articles USING btree (condition);


--
-- Name: idx_articles_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_mode ON public.articles USING btree (mode_transaction) WHERE ((statut)::text = 'published'::text);


--
-- Name: idx_articles_recherche_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_recherche_gin ON public.articles USING gin (recherche);


--
-- Name: idx_articles_specs_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_specs_gin ON public.articles USING gin (specs);


--
-- Name: idx_articles_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_statut ON public.articles USING btree (statut);


--
-- Name: idx_articles_trocable; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_trocable ON public.articles USING btree (est_trocable) WHERE (est_trocable = true);


--
-- Name: idx_articles_vente_flash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_vente_flash ON public.articles USING btree (vente_flash, flash_fin_at) WHERE (vente_flash = true);


--
-- Name: idx_boutiques_categorie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boutiques_categorie ON public.boutiques USING btree (categorie);


--
-- Name: idx_boutiques_verifie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boutiques_verifie ON public.boutiques USING btree (verifie) WHERE (verifie = true);


--
-- Name: idx_messages_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_article ON public.messages USING btree (article_id, created_at);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (expediteur_id, destinataire_id, created_at);


--
-- Name: idx_messages_non_lus; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_non_lus ON public.messages USING btree (destinataire_id) WHERE (lu_at IS NULL);


--
-- Name: idx_messages_offre_troc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_offre_troc ON public.messages USING btree (offre_troc_id) WHERE (offre_troc_id IS NOT NULL);


--
-- Name: idx_offres_troc_acheteur; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offres_troc_acheteur ON public.offres_troc USING btree (acheteur_id);


--
-- Name: idx_offres_troc_article_cible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offres_troc_article_cible ON public.offres_troc USING btree (article_cible_id);


--
-- Name: idx_offres_troc_articles_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offres_troc_articles_article ON public.offres_troc_articles USING btree (article_offert_id);


--
-- Name: idx_offres_troc_articles_offre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offres_troc_articles_offre ON public.offres_troc_articles USING btree (offre_troc_id);


--
-- Name: idx_offres_troc_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offres_troc_statut ON public.offres_troc USING btree (statut);


--
-- Name: idx_offres_troc_vendeur; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offres_troc_vendeur ON public.offres_troc USING btree (vendeur_id);


--
-- Name: idx_souhaits_categorie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_souhaits_categorie ON public.souhaits USING btree (categorie);


--
-- Name: idx_souhaits_mots_cles_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_souhaits_mots_cles_gin ON public.souhaits USING gin (mots_cles);


--
-- Name: idx_souhaits_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_souhaits_statut ON public.souhaits USING btree (statut) WHERE ((statut)::text = 'active'::text);


--
-- Name: idx_transactions_acheteur; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_acheteur ON public.transactions USING btree (acheteur_id);


--
-- Name: idx_transactions_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_article ON public.transactions USING btree (article_id);


--
-- Name: idx_transactions_escrow_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_escrow_status ON public.transactions USING btree (escrow_status);


--
-- Name: idx_transactions_offre_troc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_offre_troc ON public.transactions USING btree (offre_troc_id) WHERE (offre_troc_id IS NOT NULL);


--
-- Name: idx_transactions_vendeur; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_vendeur ON public.transactions USING btree (vendeur_id);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: articles trg_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: boutiques trg_boutiques_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_boutiques_updated_at BEFORE UPDATE ON public.boutiques FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: messages trg_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: offres_troc trg_offres_troc_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_offres_troc_updated_at BEFORE UPDATE ON public.offres_troc FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: souhaits trg_souhaits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_souhaits_updated_at BEFORE UPDATE ON public.souhaits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: transactions trg_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: articles articles_boutique_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_boutique_id_foreign FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON DELETE SET NULL;


--
-- Name: articles articles_utilisateur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_utilisateur_id_foreign FOREIGN KEY (utilisateur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: boutiques boutiques_utilisateur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boutiques
    ADD CONSTRAINT boutiques_utilisateur_id_foreign FOREIGN KEY (utilisateur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_article_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_article_id_foreign FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE SET NULL;


--
-- Name: messages messages_destinataire_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_destinataire_id_foreign FOREIGN KEY (destinataire_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_expediteur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_expediteur_id_foreign FOREIGN KEY (expediteur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_offre_troc_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_offre_troc_id_foreign FOREIGN KEY (offre_troc_id) REFERENCES public.offres_troc(id) ON DELETE SET NULL;


--
-- Name: offres_troc offres_troc_acheteur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_troc
    ADD CONSTRAINT offres_troc_acheteur_id_foreign FOREIGN KEY (acheteur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: offres_troc offres_troc_article_cible_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_troc
    ADD CONSTRAINT offres_troc_article_cible_id_foreign FOREIGN KEY (article_cible_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: offres_troc_articles offres_troc_articles_article_offert_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_troc_articles
    ADD CONSTRAINT offres_troc_articles_article_offert_id_foreign FOREIGN KEY (article_offert_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: offres_troc_articles offres_troc_articles_offre_troc_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_troc_articles
    ADD CONSTRAINT offres_troc_articles_offre_troc_id_foreign FOREIGN KEY (offre_troc_id) REFERENCES public.offres_troc(id) ON DELETE CASCADE;


--
-- Name: offres_troc offres_troc_vendeur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_troc
    ADD CONSTRAINT offres_troc_vendeur_id_foreign FOREIGN KEY (vendeur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: souhaits souhaits_utilisateur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.souhaits
    ADD CONSTRAINT souhaits_utilisateur_id_foreign FOREIGN KEY (utilisateur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_acheteur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_acheteur_id_foreign FOREIGN KEY (acheteur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_article_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_article_id_foreign FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE RESTRICT;


--
-- Name: transactions transactions_boutique_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_boutique_id_foreign FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_offre_troc_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_offre_troc_id_foreign FOREIGN KEY (offre_troc_id) REFERENCES public.offres_troc(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_vendeur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_vendeur_id_foreign FOREIGN KEY (vendeur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict nioKxjfrn4gWyuEmoUfg7HPcQAhuf0N76vBMwvQ6QVJLzf2BAdLeAqlL3Tuc3xQ

