<?php

namespace App\Policies;

use App\Models\Souhait;
use App\Models\User;

class SouhaitPolicy
{
    public function view(?User $user, Souhait $souhait): bool
    {
        return true; // mur public
    }

    public function delete(User $user, Souhait $souhait): bool
    {
        return $user->id === $souhait->utilisateur_id || $user->isAdmin();
    }
}
