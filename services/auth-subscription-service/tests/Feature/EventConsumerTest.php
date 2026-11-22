<?php
namespace Tests\Feature;
use App\Console\Commands\ConsumeAuthEvents;
use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class EventConsumerTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_succeeded_active_le_pro(): void
    {
        $user = User::create([
            'nom' => 'Event Test', 'email' => 'event@example.ci', 'password' => bcrypt('password123'),
            'role' => User::ROLE_PARTICULIER, 'plan_abonnement' => User::PLAN_GRATUIT,
        ]);
        $abo = Abonnement::create([
            'utilisateur_id' => $user->id, 'formule' => Abonnement::FORMULE_PRO,
            'montant_fcfa' => Abonnement::PRIX_PRO, 'statut' => Abonnement::STATUT_PENDING,
            'reference' => 'DJASSA-PRO-EVENT',
        ]);

        app(ConsumeAuthEvents::class)->handleEvent('payment.succeeded', [
            'type' => 'abonnement', 'reference' => $abo->reference,
        ]);

        $this->assertSame(Abonnement::STATUT_ACTIVE, $abo->fresh()->statut);
        $this->assertSame(User::ROLE_VENDEUR_PRO, $user->fresh()->role);
    }
}
