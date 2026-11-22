<?php

namespace Tests\Feature;

use App\Console\Commands\ConsumeDomainEvents;
use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Le consumer Redis active bien l'abonnement Pro après payment.succeeded du service escrow. */
class DomainEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_succeeded_active_la_formule_pro(): void
    {
        $user = User::factory()->create(['plan_abonnement' => null]);
        $abonnement = Abonnement::create([
            'utilisateur_id' => $user->id,
            'formule' => Abonnement::FORMULE_PRO,
            'montant_fcfa' => Abonnement::PRIX_PRO,
            'statut' => Abonnement::STATUT_PENDING,
            'reference' => 'DJASSA-PRO-EVENT-1',
        ]);

        app(ConsumeDomainEvents::class)->handleEvent('payment.succeeded', [
            'type' => 'abonnement', 'reference' => $abonnement->reference,
        ]);

        $this->assertSame(Abonnement::STATUT_ACTIVE, $abonnement->fresh()->statut);
        $this->assertSame(User::ROLE_VENDEUR_PRO, $user->fresh()->role);
        $this->assertSame(User::PLAN_PRO, $user->fresh()->plan_abonnement);
    }

    public function test_evenement_inconnu_est_sans_effet(): void
    {
        app(ConsumeDomainEvents::class)->handleEvent('payment.held', ['transaction_id' => 'x']);

        $this->assertSame(0, Abonnement::count());
    }
}
