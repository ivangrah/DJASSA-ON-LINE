<?php
declare(strict_types=1);

namespace Djassa\Models\Enums;

enum StatutTroc: string
{
    case PENDING  = 'pending';
    case COUNTERED = 'countered';
    case ACCEPTED = 'accepted';
    case REFUSED  = 'refused';
    case EXPIRED  = 'expired';
    public static function values(): array { return array_column(self::cases(), 'value'); }
}
