<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AdminCampaign extends Model
{
    use HasUuids;

    protected $table = 'admin_campaigns';

    protected $fillable = [
        'titre', 'message', 'audience', 'target_user_id', 'priorite',
        'send_email', 'destinataires_count', 'statut', 'requested_by',
    ];

    protected $casts = [
        'send_email' => 'boolean',
        'destinataires_count' => 'integer',
    ];
}
