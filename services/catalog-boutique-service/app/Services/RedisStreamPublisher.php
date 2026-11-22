<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Publisher d'événements Redis Streams (D3) sans extension ni dépendance :
 * implémentation minimale du protocole RESP via socket TCP.
 * Les événements sont best-effort : la base escrow reste la source de vérité.
 * Le PIN n'est JAMAIS publié (D4).
 */
class RedisStreamPublisher
{
    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly string $stream,
    ) {
    }

    public function publish(string $event, array $payload): bool
    {
        $fields = [
            'event' => $event,
            'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'published_at' => now()->toIso8601String(),
        ];
        $args = ['XADD', $this->stream, '*'];
        foreach ($fields as $key => $value) {
            $args[] = (string) $key;
            $args[] = (string) $value;
        }

        try {
            $socket = fsockopen($this->host, $this->port, $errno, $errstr, 0.5);
            if (! $socket) {
                Log::warning('[Events] Redis injoignable', ['event' => $event, 'error' => $errstr]);

                return false;
            }
            fwrite($socket, $this->encode($args));
            $response = fgets($socket);
            fclose($socket);

            return is_string($response) && ! str_starts_with($response, '-');
        } catch (\Throwable $e) {
            Log::warning('[Events] Publication échouée', ['event' => $event, 'error' => $e->getMessage()]);

            return false;
        }
    }

    private function encode(array $args): string
    {
        $out = '*'.count($args)."\r\n";
        foreach ($args as $arg) {
            $out .= '$'.strlen($arg)."\r\n".$arg."\r\n";
        }

        return $out;
    }
}
