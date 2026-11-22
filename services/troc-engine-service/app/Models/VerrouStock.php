<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class VerrouStock extends Model
{
    use HasUuids;

    protected $table = 'verrous_stock';
    protected $fillable = ['article_id','offre_id','expire_le'];
    protected $casts = ['expire_le' => 'datetime'];
}
