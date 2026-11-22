<?php
namespace App\Console\Commands;
use App\Models\OffreTroc;
use App\Services\RedisEventConsumer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
class ConsumeTrocEvents extends Command
{
    protected $signature = 'troc:consume-events {--once : Traiter un lot puis quitter}';
    protected $description = 'Consomme payment.succeeded et escrow.released pour clore les offres de troc';
    public function __construct(private readonly RedisEventConsumer $consumer) { parent::__construct(); }
    public function handle(): int
    {
        do {
            $lastId = (string) Cache::get('djassa.troc.events.last_id', '0-0');
            $events = $this->consumer->read($lastId);
            foreach ($events as $entry) {
                $this->handleEvent((string)($entry['fields']['event']??''), json_decode($entry['fields']['payload']??'{}', true) ?: []);
                $lastId = $entry['id'];
            }
            if ($events !== []) Cache::put('djassa.troc.events.last_id', $lastId, now()->addDay());
            if ($this->option('once')) return self::SUCCESS;
            sleep(1);
        } while (true);
    }
    /** Testable sans Redis. */
    public function handleEvent(string $event, array $payload): void
    {
        $reference = (string)($payload['reference'] ?? '');
        $offre = null;
        if ($reference !== '') $offre = OffreTroc::where('reference', $reference)->first();
        if (! $offre && isset($payload['offre_id'])) $offre = OffreTroc::find($payload['offre_id']);
        if (! $offre) return;

        if ($event === 'payment.succeeded' || $event === 'escrow.released') {
            if ($offre->statut === OffreTroc::STATUT_COMPLETED) return; // idempotent
            $offre->update(['statut' => OffreTroc::STATUT_COMPLETED]);
            Log::info('[Troc] Offre clôturée après paiement', ['offre_id' => $offre->id]);
        }
    }
}
