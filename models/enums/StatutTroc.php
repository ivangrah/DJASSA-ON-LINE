<?php
declare(strict_types=1);

namespace Djassa\Models\Enums;

/** Aligné sur la contrainte DB offres_troc_statut_check. */
enum StatutTroc: string
{
    case PENDING   = 'pending';
    case ACCEPTED  = 'accepted';
    case REJECTED  = 'rejected';
    case COUNTERED = 'countered';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public static function values(): array { return array_column(self::cases(), 'value'); }
}
