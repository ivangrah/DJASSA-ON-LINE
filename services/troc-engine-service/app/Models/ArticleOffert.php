<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
/** Référence logique à un article du domaine catalog (aucune relation cross-base). */
class ArticleOffert extends Model
{
    use HasUuids;
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'articles_ref';
    protected $fillable = ['id', 'titre'];
}
