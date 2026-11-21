<?php
declare(strict_types=1);

namespace Djassa\Models\Enums;

/** Séquence financière : pending -> held -> released (ou refunded / failed). */
enum StatutEscrow: string
{
    case PENDING  = 'pending';
    case HELD     = 'held';
    case RELEASED = 'released';
    case REFUNDED = 'refunded';
    case FAILED   = 'failed';
    public static function values(): array { return array_column(self::cases(), 'value'); }
}
