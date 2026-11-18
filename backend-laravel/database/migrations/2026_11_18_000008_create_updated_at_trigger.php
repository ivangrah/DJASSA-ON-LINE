<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Djassa Online — trigger `set_updated_at` (DDL Figure 5 : tg_update_timestamp)
     * Filet de sécurité côté base pour updated_at — Eloquent gère les timestamps,
     * le trigger couvre les écritures hors ORM (imports SQL, scripts ops).
     */
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION set_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_users_updated_at      BEFORE UPDATE ON users      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            CREATE TRIGGER trg_boutiques_updated_at  BEFORE UPDATE ON boutiques  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            CREATE TRIGGER trg_articles_updated_at   BEFORE UPDATE ON articles   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            CREATE TRIGGER trg_offres_troc_updated_at BEFORE UPDATE ON offres_troc FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            CREATE TRIGGER trg_souhaits_updated_at   BEFORE UPDATE ON souhaits   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            CREATE TRIGGER trg_messages_updated_at   BEFORE UPDATE ON messages   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
            DROP TRIGGER IF EXISTS trg_boutiques_updated_at ON boutiques;
            DROP TRIGGER IF EXISTS trg_articles_updated_at ON articles;
            DROP TRIGGER IF EXISTS trg_offres_troc_updated_at ON offres_troc;
            DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
            DROP TRIGGER IF EXISTS trg_souhaits_updated_at ON souhaits;
            DROP TRIGGER IF EXISTS trg_messages_updated_at ON messages;
            DROP FUNCTION IF EXISTS set_updated_at();
        SQL);
    }
};
