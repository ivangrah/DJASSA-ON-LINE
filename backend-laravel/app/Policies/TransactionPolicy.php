<?php

namespace App\Policies;

use App\Models\Transaction;
use App\Models\User;

class TransactionPolicy
{
    public function view(User $user, Transaction $transaction): bool
    {
        return $user->id === $transaction->acheteur_id
            || $user->id === $transaction->vendeur_id
            || $user->isAdmin();
    }

    public function verifyPin(User $user, Transaction $transaction): bool
    {
        return $user->id === $transaction->vendeur_id || $user->isAdmin();
    }

    public function receipt(User $user, Transaction $transaction): bool
    {
        return $this->view($user, $transaction);
    }
}
