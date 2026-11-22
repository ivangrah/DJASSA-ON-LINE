<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    // D2 : les connexions de domaine pointent toutes vers djassa_test (phpunit.xml)
    // mais restent des connexions PDO distinctes. RefreshDatabase ne transige que
    // la connexion par défaut : les assertions doivent donc cibler explicitement
    // la connexion du domaine concerné (voir ContractTest, GeniusPayWebhookTest).
}
