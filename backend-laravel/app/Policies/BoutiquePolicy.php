<?php

namespace App\Policies;

use App\Models\Boutique;
use App\Models\User;

class BoutiquePolicy
{
    public function view(?User $user, Boutique $boutique): bool
    {
        return true; // vitrine publique
    }

    public function create(User $user): bool
    {
        return $user->isProSeller();
    }

    public function update(User $user, Boutique $boutique): bool
    {
        return $user->id === $boutique->utilisateur_id || $user->isAdmin();
    }

    public function dashboard(User $user, Boutique $boutique): bool
    {
        return $user->id === $boutique->utilisateur_id || $user->isAdmin();
    }

    public function verify(User $user, Boutique $boutique): bool
    {
        return $user->isAdmin(); // KYC rapide par l'administration (App Flow §2 étape 3)
    }
}
