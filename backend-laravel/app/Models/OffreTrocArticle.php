<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pivot explicite `offres_troc_articles` (MLD) — 1..N articles offerts par offre.
 */
class OffreTrocArticle extends Model
{
    protected $connection = 'troc';

    use HasFactory, HasUuids;

    protected $table = 'offres_troc_articles';

    protected $fillable = [
        'offre_troc_id',
        'article_offert_id',
    ];

    public function offreTroc(): BelongsTo
    {
        return $this->belongsTo(OffreTroc::class, 'offre_troc_id');
    }

    public function articleOffert(): BelongsTo
    {
        return $this->belongsTo(Article::class, 'article_offert_id');
    }
}
