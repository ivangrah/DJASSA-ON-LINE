<?php
namespace Tests\Feature;
use App\Console\Commands\ConsumeChatEvents;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class EventConsumerTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_succeeded_cree_notification_et_job_sans_pin(): void
    {
        app(ConsumeChatEvents::class)->handleEvent('payment.succeeded', [
            'user_id'=>self::USER,'reference'=>'DJASSA-PRO-E2E','pin'=>'1234','email'=>'acheteur@example.ci',
        ]);
        $this->assertSame(1, Notification::count());
        $this->assertCount(1, $this->queue->jobs);
        $this->assertSame('brevo.send',$this->queue->jobs[0]['type']);
        $this->assertArrayNotHasKey('pin',$this->queue->jobs[0]['payload']);
        $this->assertStringNotContainsString('1234', json_encode($this->queue->jobs));
    }

    public function test_evenement_inconnu_sans_effet(): void
    {
        app(ConsumeChatEvents::class)->handleEvent('unknown.event', ['user_id'=>self::USER]);
        $this->assertSame(0, Notification::count());
        $this->assertSame([], $this->queue->jobs);
    }

    public function test_idempotence_par_reference(): void
    {
        $cmd=app(ConsumeChatEvents::class);
        $payload=['user_id'=>self::USER,'reference'=>'DJASSA-PRO-IDEMP'];
        $cmd->handleEvent('payment.succeeded',$payload);
        $cmd->handleEvent('payment.succeeded',$payload);
        $this->assertSame(1, Notification::count());
    }
}
