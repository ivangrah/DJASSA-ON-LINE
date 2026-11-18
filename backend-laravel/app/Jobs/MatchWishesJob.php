<?php

namespace App\Jobs;

use App\Models\Article;
use App\Services\WishlistMatchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Scan asynchrone du Mur des Souhaits à la publication d'un article
 * (App Flow §3 — job asynchrone : alerte Brevo + message in-app).
 * En dev : QUEUE_CONNECTION=sync (exécution inline) ; en prod : Redis + Horizon.
 */
class MatchWishesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly Article $article)
    {
    }

    public function handle(WishlistMatchService $matcher): void
    {
        $count = $matcher->matchEtNotifier($this->article);

        if ($count > 0) {
            Log::info('[MatchWishes] Souhaits notifiés', ['article_id' => $this->article->id, 'count' => $count]);
        }
    }
}
