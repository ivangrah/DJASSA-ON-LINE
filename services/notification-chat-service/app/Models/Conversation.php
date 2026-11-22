<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class Conversation extends Model
{
    use HasUuids;
    protected $fillable = ['participant_1','participant_2','article_id','offre_troc_id','dernier_message_at'];
    protected $casts = ['dernier_message_at' => 'datetime'];
    public function messages() { return $this->hasMany(Message::class); }
    public function hasParticipant(string $userId): bool
    { return $this->participant_1 === $userId || $this->participant_2 === $userId; }
}
