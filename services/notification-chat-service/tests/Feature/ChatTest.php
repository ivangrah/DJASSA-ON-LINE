<?php

namespace Tests\Feature;

use App\Models\Message;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_liste_conversations_paginee_pour_le_participant(): void
    {
        $this->conversation();
        $this->withHeader('X-User-Id', self::USER)->getJson('/api/v1/messages/conversations')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [], 'meta' => ['current_page', 'last_page', 'total']]);
    }

    public function test_liste_conversations_expose_with_boutique_verifiee(): void
    {
        $this->conversation();
        Http::fake([
            '*' => Http::response([
                'id' => self::OTHER,
                'nom' => 'Boutique Test',
                'role' => 'vendeur_pro',
                'is_pro' => true,
                'boutique' => ['nom_boutique' => 'Boutique Test', 'slug' => 'boutique-test', 'verifie' => true],
            ]),
        ]);

        $response = $this->withHeader('X-User-Id', self::USER)->getJson('/api/v1/messages/conversations')
            ->assertStatus(200);

        $response->assertJsonPath('data.0.with.role', 'vendeur_pro');
        $response->assertJsonPath('data.0.with.is_pro', true);
        $response->assertJsonPath('data.0.with.boutique.verifie', true);
    }

    public function test_liste_conversations_resiste_a_indisponibilite_auth(): void
    {
        $this->conversation();
        Http::fake(['*' => Http::response([], 500)]);

        $this->withHeader('X-User-Id', self::USER)->getJson('/api/v1/messages/conversations')
            ->assertStatus(200)
            ->assertJsonPath('data.0.with', null);
    }

    public function test_thread_refuse_un_non_participant(): void
    {
        $conversation = $this->conversation();
        $this->withHeader('X-User-Id', '99999999-9999-4999-8999-999999999999')
            ->getJson('/api/v1/messages/thread?conversation_id='.$conversation->id)
            ->assertStatus(403);
    }

    public function test_envoi_message_et_unread_count(): void
    {
        $conversation = $this->conversation();
        $this->withHeader('X-User-Id', self::USER)->postJson('/api/v1/messages', [
            'conversation_id' => $conversation->id,
            'contenu' => 'Bonjour',
        ])->assertStatus(201);

        $this->assertSame(1, Message::count());
        $this->withHeader('X-User-Id', self::OTHER)->getJson('/api/v1/messages/unread-count')
            ->assertStatus(200)
            ->assertJsonPath('count', 1);
    }

    public function test_message_trop_long_est_rejete(): void
    {
        $conversation = $this->conversation();
        $this->withHeader('X-User-Id', self::USER)->postJson('/api/v1/messages', [
            'conversation_id' => $conversation->id,
            'contenu' => str_repeat('x', 4001),
        ])->assertStatus(422);
    }

    public function test_notifications_paginees(): void
    {
        Notification::create([
            'user_id' => self::USER,
            'type' => 'payment.succeeded',
            'titre' => 'Abonnement Pro active',
            'canal' => 'email',
        ]);

        $this->withHeader('X-User-Id', self::USER)->getJson('/api/v1/notifications')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [], 'meta' => ['total']]);
    }
}
