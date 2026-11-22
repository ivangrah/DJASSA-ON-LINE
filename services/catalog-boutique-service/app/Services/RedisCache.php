<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Cache Redis des données chaudes (règle 16) via RESP minimal sur socket —
 * aucune extension phpredis ni dépendance Composer. Dégradation gracieuse :
 * si Redis est indisponible, le callback est exécuté sans cache.
 */
class RedisCache
{
    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly string $prefix,
        private readonly int $ttl,
    ) {
    }

    public function remember(string $key, callable $callback, ?int $ttl = null): mixed
    {
        $full = $this->prefix.$key;
        $cached = $this->command(['GET', $full]);
        if (is_string($cached) && $cached !== '') {
            $data = json_decode($cached, true);
            if ($data !== null) {
                return $data;
            }
        }

        $value = $callback();
        $this->command(['SET', $full, json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 'EX', (string) ($ttl ?? $this->ttl)]);

        return $value;
    }

    /** Invalidation par préfixe : catalogue:, boutique:, etc. */
    public function forget(string $prefix): void
    {
        $keys = $this->command(['KEYS', $this->prefix.$prefix.'*']);
        if (is_array($keys) && $keys !== []) {
            $this->command(array_merge(['DEL'], array_slice($keys, 0, 500)));
        }
    }

    private function command(array $args): mixed
    {
        $socket = @fsockopen($this->host, $this->port, $errno, $errstr, 0.3);
        if (! $socket) {
            Log::debug('[Cache] Redis indisponible', ['error' => $errstr]);

            return null;
        }
        try {
            fwrite($socket, $this->encode($args));

            return $this->read($socket);
        } catch (\Throwable $e) {
            Log::debug('[Cache] Commande échouée', ['error' => $e->getMessage()]);

            return null;
        } finally {
            fclose($socket);
        }
    }

    private function encode(array $args): string
    {
        $out = '*'.count($args)."\r\n";
        foreach ($args as $arg) {
            $out .= '$'.strlen((string) $arg)."\r\n".(string) $arg."\r\n";
        }

        return $out;
    }

    private function read($socket, int $depth = 0): mixed
    {
        $line = fgets($socket);
        if ($line === false || $line === '' || $depth > 8) {
            return null;
        }
        $line = rtrim($line, "\r\n");
        $type = $line[0] ?? '';
        $rest = substr($line, 1);

        if ($type === '+') return $rest;
        if ($type === '-') return null;
        if ($type === ':') return (int) $rest;
        if ($type === '$') {
            $len = (int) $rest;
            if ($len < 0) return null;
            $data = '';
            while (strlen($data) < $len) {
                $chunk = fread($socket, $len - strlen($data));
                if (! $chunk) break;
                $data .= $chunk;
            }
            fread($socket, 2);
            return $data;
        }
        if ($type === '*') {
            $count = (int) $rest;
            if ($count < 0) return null;
            $items = [];
            for ($i = 0; $i < $count; $i++) { $items[] = $this->read($socket, $depth + 1); }
            return $items;
        }
        return $line;
    }
}
