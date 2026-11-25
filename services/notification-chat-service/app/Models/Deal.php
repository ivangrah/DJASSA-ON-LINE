<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Deal extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'conversation_id', 'article_id', 'propose_par',
        'montant_fcfa', 'lieu_remise', 'statut',
    ];

    protected $casts = [
        'montant_fcfa' => 'decimal:2',
    ];

    public const STATUT_PROPOSED = 'proposed';
    public const STATUT_ACCEPTED = 'accepted';
    public const STATUT_COUNTERED = 'countered';
    public const STATUT_REJECTED = 'rejected';

    public function conversation(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function estActif(): bool
    {
        return in_array($this->statut, [self::STATUT_PROPOSED, self::STATUT_COUNTERED], true);
    }
}
