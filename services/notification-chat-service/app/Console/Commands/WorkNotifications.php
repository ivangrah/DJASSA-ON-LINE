<?php
namespace App\Console\Commands;
use App\Services\BrevoService;
use App\Services\RedisQueue;
use Illuminate\Console\Command;
class WorkNotifications extends Command
{
    protected $signature = 'chat:work-notifications {--once : Traiter un job puis quitter}';
    protected $description = 'Traite la file de jobs Brevo';
    public function __construct(private readonly RedisQueue $queue, private readonly BrevoService $brevo) { parent::__construct(); }
    public function handle(): int
    {
        do {
            $job=$this->queue->pop(2);
            if($job===null){ if($this->option('once'))return self::SUCCESS; continue; }
            $p=$job['payload']??[];
            if(!empty($p['email'])) $this->brevo->sendEmail($p['email'],'Djassa Online',$p['titre']??'Notification',$p['corps']??'');
            if(!empty($p['phone'])) $this->brevo->sendSms($p['phone'],$p['corps']??'Notification Djassa');
            if($this->option('once'))return self::SUCCESS;
        } while(true);
    }
}
