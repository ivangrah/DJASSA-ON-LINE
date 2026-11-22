<?php
namespace App\Console\Commands;
use App\Models\Notification;
use App\Services\RedisEventConsumer;
use App\Services\RedisQueue;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
class ConsumeChatEvents extends Command
{
    protected $signature = 'chat:consume-events {--once : Traiter un lot puis quitter}';
    protected $description = 'Consomme les événements métier et alimente notifications + file Brevo';
    public function __construct(private readonly RedisEventConsumer $consumer, private readonly RedisQueue $queue) { parent::__construct(); }
    public function handle(): int
    {
        do {
            $lastId=(string)Cache::get('djassa.chat.events.last_id','0-0');
            $events=$this->consumer->read($lastId);
            foreach($events as $entry){
                $this->handleEvent((string)($entry['fields']['event']??''), json_decode($entry['fields']['payload']??'{}',true) ?: []);
                $lastId=$entry['id'];
            }
            if($events!==[])Cache::put('djassa.chat.events.last_id',$lastId,now()->addDay());
            if($this->option('once'))return self::SUCCESS;
            sleep(1);
        } while(true);
    }
    /** Testable sans Redis. Le PIN n'est jamais inclus : seules des métadonnées sont conservées. */
    public function handleEvent(string $event, array $payload): void
    {
        $templates = [
            'payment.succeeded' => ['Abonnement Pro activé', 'Votre formule Pro est active.', 'email'],
            'escrow.released'   => ['Fonds libérés', 'Les fonds de votre transaction ont été libérés.', 'email'],
            'troc.offre_created'=> ['Nouvelle proposition de troc', 'Vous avez reçu une proposition de troc.', 'push'],
            'souhait.created'   => ['Souhait publié', 'Votre souhait est en ligne.', 'in_app'],
        ];
        if (! isset($templates[$event])) return;
        [$titre,$corps,$canal] = $templates[$event];
        $userId = (string)($payload['user_id'] ?? $payload['acheteur_id'] ?? $payload['destinataire_id'] ?? '');
        if ($userId === '') return;
        $reference = (string)($payload['reference'] ?? '');

        if ($reference !== '' && Notification::where('source_reference', $reference)->where('type', $event)->exists()) return; // idempotent

        $notification = Notification::create([
            'user_id'=>$userId,'type'=>$event,'titre'=>$titre,'corps'=>$corps,
            'canal'=>$canal,'source_reference'=>$reference !== '' ? $reference : null,
        ]);
        $jobPayload = [
            'notification_id'=>$notification->id,'user_id'=>$userId,
            'email'=>$payload['email'] ?? null,'phone'=>$payload['phone'] ?? null,
            'titre'=>$titre,'corps'=>$corps,
        ];
        // Sécurité : aucun champ PIN ne peut être propagé dans la file.
        unset($jobPayload['pin'], $jobPayload['pin_hash']);
        $this->queue->push('brevo.send', $jobPayload);
        Log::info('[Chat] Notification créée', ['event'=>$event,'notification_id'=>$notification->id]);
    }
}
