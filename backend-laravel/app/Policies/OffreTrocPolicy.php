<?php

namespace App\Policies;

use App\Models\OffreTroc;
use App\Models\User;

/**
 * OffreTrocPolicy — auto-découverte Laravel pour le modèle `OffreTroc`.
 * Remplace l'ancienne BarterOfferPolicy (nom non aligné sur le modèle).
 */
class OffreTrocPolicy
{
    public function view(User $user, OffreTroc $offre): bool
    {
        return $user->id === $offre->acheteur_id
            || $user->id === $offre->vendeur_id
            || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        // Un compte doit avoir choisi son offre avant de troquer.
        return $user->hasChosenPlan();
    }

    public function respond(User $user, OffreTroc $offre): bool
    {
        return $user->id === $offre->vendeur_id || $user->isAdmin();
    }

    public function delete(User $user, OffreTroc $offre): bool
    {
        return $user->id === $offre->acheteur_id || $user->isAdmin();
    }
}
