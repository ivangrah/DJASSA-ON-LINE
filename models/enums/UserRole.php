<?php
declare(strict_types=1);

namespace Djassa\Models\Enums;

/** Rôles stricts — toute autre valeur doit être rejetée à la validation. */
enum UserRole: string
{
    case PARTICULIER = 'particulier';
    case VENDEUR_PRO = 'vendeur_pro';
    case ADMIN       = 'admin';

    public static function values(): array { return array_column(self::cases(), 'value'); }
    public function peutPublierNeuf(): bool { return $this === self::VENDEUR_PRO || $this === self::ADMIN; }
}
