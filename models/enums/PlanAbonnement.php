<?php
declare(strict_types=1);

namespace Djassa\Models\Enums;

/** null = offre pas encore choisie (obligatoire avant accès au dashboard). */
enum PlanAbonnement: string
{
    case GRATUIT = 'gratuit';
    case PRO     = 'pro';

    public static function values(): array { return array_column(self::cases(), 'value'); }
}
