<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\V1\AbonnementController;
use App\Models\Abonnement;
use App\Services\RedisEventConsumer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ConsumeDomainEvents extends Command
{
    protected $signature = 'djassa:consume-events {--once : Traiter un lot puis quitter}';
    protected $description = 'Consomme les événements Redis Streams émis par les microservices';

    public function __construct(private readonly RedisEventConsumer $consumer)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        do {
            $lastId = (string) Cache::get('djassa.events.last_id', '0-0');
            $events = $this->consumer->read($lastId);

            foreach ($events as $entry) {
                $this->handleEvent(
                    (string) ($entry['fields']['event'] ?? ''),
                    json_decode($entry['fields']['payload'] ?? '{}', true) ?: []
                );
                $lastId = $entry['id'];
            }

            if ($events !== []) {
                Cache::put('djassa.events.last_id', $lastId, now()->addDay());
            }

            if ($this->option('once')) {
                return self::SUCCESS;
            }
            sleep(1);
        } while (true);
    }

    /** Dispatch d'un événement métier — testable sans Redis. */
    public function handleEvent(string $event, array $payload): void
    {
        if ($event === 'payment.succeeded' && ($payload['type'] ?? null) === 'abonnement') {
            $reference = (string) ($payload['reference'] ?? '');
            $abonnement = Abonnement::query()
                ->where('reference', $reference)->orWhere('geniuspay_ref', $reference)->first();

            if ($abonnement && $abonnement->statut !== Abonnement::STATUT_ACTIVE) {
                AbonnementController::activer($abonnement);
                Log::info('[Events] Abonnement Pro activé après webhook', ['reference' => $reference]);
            }

            return;
        }

        Log::info('[Events] Événement reçu (sans handler dédié)', ['event' => $event]);
    }
}
