<?php

namespace App\Support;

/**
 * Détecte le mode d'isolation des bases (D2).
 *
 * En mode monolithe (toutes les connexions pointent vers DB_DATABASE), les clés
 * étrangères cross-domaines sont conservées : c'est le cas des tests PHPUnit
 * (phpunit.xml force les 5 connexions vers djassa_test).
 *
 * En mode isolé (DB_AUTH_DATABASE, DB_CATALOG_DATABASE… distincts), ces contraintes
 * sont désactivées à la migration : l'intégrité inter-domaines est alors portée par
 * l'application (API interne signée + événements), pas par une FK PostgreSQL impossible
 * entre bases distinctes.
 */
final class DomainSchema
{
    public static function isolated(): bool
    {
        $base = config('database.connections.pgsql.database');

        foreach (['auth', 'catalog', 'troc', 'escrow', 'chat'] as $domain) {
            if (config("database.connections.$domain.database") !== $base) {
                return true;
            }
        }

        return false;
    }
}
