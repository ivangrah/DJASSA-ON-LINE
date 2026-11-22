<?php
namespace Tests\Feature;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class InternalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_appel_sans_signature_est_refuse(): void
    {
        $this->postJson('/internal/chat/notifications',['user_id'=>self::USER,'type'=>'x','titre'=>'y'])->assertStatus(401);
    }

    public function test_creation_notification_signee(): void
    {
        $path='/internal/chat/notifications';
        $payload=['user_id'=>self::USER,'type'=>'systeme','titre'=>'Test','canal'=>'in_app'];
        $this->withHeaders($this->signed('POST',$path,$payload))->postJson($path,$payload)
            ->assertStatus(201)->assertJsonPath('titre','Test');
        $this->assertSame(1,Notification::count());
    }
}
