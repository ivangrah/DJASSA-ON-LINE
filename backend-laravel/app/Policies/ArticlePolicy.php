<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    public function view(?User $user, Article $article): bool
    {
        return $article->statut === Article::STATUT_PUBLISHED
            || ($user && ($user->id === $article->utilisateur_id || $user->isAdmin()));
    }

    public function create(User $user): bool
    {
        return true; // l'attribution neuf/boutique est gérée par StoreProductRequest
    }

    public function update(User $user, Article $article): bool
    {
        return $user->id === $article->utilisateur_id || $user->isAdmin();
    }

    public function delete(User $user, Article $article): bool
    {
        return $user->id === $article->utilisateur_id || $user->isAdmin();
    }

    public function manageFlashSale(User $user, Article $article): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $boutique = $article->boutique;

        // Ventes Flash réservées aux Boutiques Pro vérifiées (App Flow §6)
        return $boutique !== null
            && $boutique->utilisateur_id === $user->id
            && $boutique->verifie;
    }
}
