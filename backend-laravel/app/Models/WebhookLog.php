<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Journal d'idempotence des webhooks.
 * Pendant la transition Strangler Fig, le journal reste sur la base de l'orchestrateur ;
 * il suivra escrow-payment-service lors de l'extraction (Phase 2).
 */
class WebhookLog extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'webhooks_logs';

    protected $fillable = [
        'fournisseur', 'reference', 'event_id', 'payload_hash', 'traite_le',
    ];

    protected function casts(): array
    {
        return ['traite_le' => 'datetime'];
    }
}
