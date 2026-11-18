<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    /**
     * Un message est lisible par ses deux participants uniquement.
     */
    public function view(User $user, Message $message): bool
    {
        return $user->id === $message->expediteur_id
            || $user->id === $message->destinataire_id
            || $user->isAdmin();
    }

    public function markRead(User $user, Message $message): bool
    {
        return $user->id === $message->destinataire_id;
    }
}
