<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'expediteur_id',
        'destinataire_id',
        'article_id',
        'offre_troc_id',
        'type',
        'contenu',
        'payload',
        'lu_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'lu_at' => 'datetime',
        ];
    }

    public const TYPE_TEXTE = 'texte';
    public const TYPE_OFFRE_PRIX = 'offre_prix';
    public const TYPE_CARTE_TROC = 'carte_troc';
    public const TYPE_SYSTEME = 'systeme';

    public function scopeNonLus(Builder $query): Builder
    {
        return $query->whereNull('lu_at');
    }

    /** Conversation entre deux utilisateurs autour d'un article (ou globale). */
    public function scopeConversation(Builder $query, string $userA, string $userB, ?string $articleId = null): Builder
    {
        return $query
            ->where(fn ($q) => $q
                ->where(fn ($q2) => $q2
                    ->where('expediteur_id', $userA)
                    ->where('destinataire_id', $userB))
                ->orWhere(fn ($q2) => $q2
                    ->where('expediteur_id', $userB)
                    ->where('destinataire_id', $userA)))
            ->when($articleId, fn ($q) => $q->where('article_id', $articleId))
            ->orderBy('created_at');
    }

    public function expediteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'expediteur_id');
    }

    public function destinataire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'destinataire_id');
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class, 'article_id');
    }

    public function offreTroc(): BelongsTo
    {
        return $this->belongsTo(OffreTroc::class, 'offre_troc_id');
    }
}
