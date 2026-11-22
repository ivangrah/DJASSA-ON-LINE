<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** Journal d'idempotence — propriété exclusive du domaine escrow (validation point 4). */
class WebhookLog extends Model
{
    use HasUuids;

    protected $table = 'webhooks_logs';

    protected $fillable = ['fournisseur', 'reference', 'event_id', 'payload_hash', 'traite_le'];

    protected function casts(): array
    {
        return ['traite_le' => 'datetime'];
    }
}
