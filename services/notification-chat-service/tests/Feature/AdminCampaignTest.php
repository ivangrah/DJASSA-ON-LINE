<?php
namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCampaignTest extends TestCase
{
    use RefreshDatabase;

    public function test_acces_refuse_sans_role_admin(): void
    {
        $this->withHeaders(['X-User-Role' => 'particulier', 'Accept' => 'application/json'])
            ->postJson('/api/v1/admin/notifications/broadcast', [
                'audience' => 'all', 'titre' => 'X', 'corps' => 'Y',
            ])->assertStatus(403);
    }

    public function test_campagne_mise_en_file(): void
    {
        $this->withHeaders(['X-User-Role' => 'admin', 'Accept' => 'application/json'])
            ->postJson('/api/v1/admin/notifications/broadcast', [
                'audience' => 'all', 'titre' => 'Campagne', 'corps' => 'Bonjour à tous', 'email' => false,
                'confirm_mass' => true,
            ])->assertStatus(202)->assertJsonPath('queued', true);
    }
}
