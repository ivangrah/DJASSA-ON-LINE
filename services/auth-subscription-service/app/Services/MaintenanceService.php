<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Interrupteur Mode Maintenance stocké dans Redis (clé djassa:system:maintenance).
 * RESP minimal sur socket — aucune dépendance Composer (comme RedisCache du catalogue).
 */
class MaintenanceService
{
    private const KEY = 'djassa:system:maintenance';

    public function __construct(
        private readonly string $host,
        private readonly int $port,
    ) {}

    public function enable(string $message): array
    {
        $state = ['enabled' => true, 'message' => $message, 'updated_at' => now()->toIso8601String()];
        $this->command(['SET', self::KEY, json_encode($state, JSON_UNESCAPED_UNICODE)]);
        return $state;
    }

    public function disable(): array
    {
        $state = ['enabled' => false, 'message' => '', 'updated_at' => now()->toIso8601String()];
        $this->command(['SET', self::KEY, json_encode($state, JSON_UNESCAPED_UNICODE)]);
        return $state;
    }

    public function state(): array
    {
        $raw = $this->command(['GET', self::KEY]);
        if (is_string($raw) && $raw !== '') {
            $data = json_decode($raw, true);
            if (is_array($data)) return $data;
        }
        return ['enabled' => false, 'message' => '', 'updated_at' => null];
    }

    public function isEnabled(): bool
    {
        return (bool) ($this->state()['enabled'] ?? false);
    }

    private function command(array $args): mixed
    {
        $socket = @fsockopen($this->host, $this->port, $errno, $errstr, 0.3);
        if (! $socket) {
            Log::debug('[Maintenance] Redis indisponible', ['error' => $errstr]);
            return null;
        }
        try {
            fwrite($socket, $this->encode($args));
            return $this->read($socket);
        } catch (\Throwable $e) {
            Log::debug('[Maintenance] commande échouée', ['error' => $e->getMessage()]);
            return null;
        } finally {
            fclose($socket);
        }
    }

    private function encode(array $args): string
    {
        $out = '*'.count($args)."\r\n";
        foreach ($args as $a) { $out .= '$'.strlen((string) $a)."\r\n".(string) $a."\r\n"; }
        return $out;
    }

    private function read($socket, int $depth = 0): mixed
    {
        $line = fgets($socket);
        if ($line === false || $line === '' || $depth > 8) return null;
        $line = rtrim($line, "\r\n");
        $t = $line[0] ?? '';
        $r = substr($line, 1);
        if ($t === '+') return $r;
        if ($t === '-') return null;
        if ($t === ':') return (int) $r;
        if ($t === '$') {
            $n = (int) $r; if ($n < 0) return null;
            $d = ''; while (strlen($d) < $n) { $c = fread($socket, $n - strlen($d)); if (! $c) break; $d .= $c; }
            fread($socket, 2); return $d;
        }
        if ($t === '*') {
            $n = (int) $r; if ($n < 0) return null;
            $a = []; for ($i = 0; $i < $n; $i++) { $a[] = $this->read($socket, $depth + 1); }
            return $a;
        }
        return $line;
    }
}
