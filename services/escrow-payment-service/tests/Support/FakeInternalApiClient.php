<?php

namespace Tests\Support;

use App\Services\InternalApiClient;

class FakeInternalApiClient extends InternalApiClient
{
    public array $calls = [];
    public array $article = ['id' => '11111111-1111-4111-8111-111111111111', 'utilisateur_id' => '22222222-2222-4222-8222-222222222222', 'prix_actuel' => 12000, 'statut' => 'published'];

    public function __construct() { parent::__construct('http://internal', 'test'); }

    public function getArticle(string $articleId): array { $this->calls[] = ['getArticle', $articleId]; return $this->article + ['id' => $articleId]; }
    public function getUser(string $userId): array { $this->calls[] = ['getUser', $userId]; return ['id' => $userId, 'email' => 'acheteur@example.ci', 'nom' => 'Acheteur Test']; }
    public function setArticleStatut(string $articleId, string $statut): array { $this->calls[] = ['setArticleStatut', $articleId, $statut]; return ['ok' => true]; }
    public function creditWallet(string $userId, float $montant): array { $this->calls[] = ['creditWallet', $userId, $montant]; return ['ok' => true]; }
    public function completeOffre(string $offreId): array { $this->calls[] = ['completeOffre', $offreId]; return ['ok' => true]; }
    public function getOffre(string $offreId): array { return ['acheteur_id' => $offreId, 'vendeur_id' => '22222222-2222-4222-8222-222222222222', 'montant_soulte_fcfa' => 2000, 'article_cible_id' => '11111111-1111-4111-8111-111111111111']; }
}
