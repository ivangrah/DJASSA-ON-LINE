<?php

namespace App\Policies;

use App\Models\OffreTroc;
use App\Models\User;

class BarterOfferPolicy
{
    public function view(User $user, OffreTroc $offre): bool
    {
        return $user->id === $offre->acheteur_id
            || $user->id === $offre->vendeur_id
            || $user->isAdmin();
    }
}
