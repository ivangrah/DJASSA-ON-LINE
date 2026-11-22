<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! app()->environment('testing')) {
            return;
        }

        // D2 : les 5 connexions de domaine pointent vers djassa_test (phpunit.xml)
        // mais ouvrent chacune un PDO distinct. RefreshDatabase ne transige que la
        // connexion par défaut : sans partage, les insertions via auth/catalog/troc/…
        // ne sont pas visibles dans la transaction (FK violées) et fuient entre tests.
        // En testing uniquement, on réutilise le PDO de 'pgsql' pour toutes les connexions.
        $pdo = DB::connection('pgsql')->getPdo();

        foreach (['auth', 'catalog', 'troc', 'escrow', 'chat'] as $connection) {
            DB::connection($connection)->setPdo($pdo);
        }
    }
}
