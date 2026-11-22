<?php

namespace App\Console\Commands;

use App\Models\Abonnement;
use App\Models\User;
use App\Services\RedisEventConsumer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ConsumeAuthEvents extends Command
{
    protected $signature = 'auth:consume-events {--once : Traiter un lot puis quitter}';
    protected $description = 'Consomme payment.succeeded et active les abonnements Pro';

    public function __construct(private readonly RedisEventConsumer $consumer)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        do {
            $lastId = (string) Cache::get('djassa.auth.events.last_id', '0-0');
            $events = $this->consumer->read($lastId);

            foreach ($events as $entry) {
                $this->handleEvent(
                    (string) ($entry['fields']['event'] ?? ''),
                    json_decode($entry['fields']['payload'] ?? '{}', true) ?: []
                );
                $lastId = $entry['id'];
            }
            if ($events !== []) {
                Cache::put('djassa.auth.events.last_id', $lastId, now()->addDay());
            }
            if ($this->option('once')) {
                return self::SUCCESS;
            }
            sleep(1);
        } while (true);
    }

    /** Testable sans Redis. */
    public function handleEvent(string $event, array $payload): void
    {
        if ($event !== 'payment.succeeded' || ($payload['type'] ?? null) !== 'abonnement') {
            return;
        }

        $reference = (string) ($payload['reference'] ?? '');
        $abonnement = Abonnement::query()
            ->where('reference', $reference)->orWhere('geniuspay_ref', $reference)->first();

        if (! $abonnement || $abonnement->statut === Abonnement::STATUT_ACTIVE) {
            return; // idempotent
        }

        $debut = now();
        $abonnement->update([
            'statut' => Abonnement::STATUT_ACTIVE,
            'debut_at' => $debut,
            'fin_at' => $debut->copy()->addMonth(),
        ]);
        User::whereKey($abonnement->utilisateur_id)->update([
            'plan_abonnement' => User::PLAN_PRO,
            'role' => User::ROLE_VENDEUR_PRO,
            'abonnement_actif_jusqu_au' => $debut->copy()->addMonth(),
        ]);
        Log::info('[Auth] Abonnement Pro activé', ['reference' => $reference]);
    }
}
