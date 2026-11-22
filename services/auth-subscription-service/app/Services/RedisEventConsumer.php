<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Lecture des événements Redis Streams (D3) via un client RESP minimal sur socket.
 * Aucune extension phpredis ni dépendance Composer requise.
 */
class RedisEventConsumer
{
    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly string $stream,
    ) {
    }

    /** @return array<int, array{id: string, fields: array<string, string>}> */
    public function read(string $lastId, int $count = 20): array
    {
        $socket = @fsockopen($this->host, $this->port, $errno, $errstr, 0.5);
        if (! $socket) {
            Log::warning('[Events] Redis injoignable', ['error' => $errstr]);

            return [];
        }

        try {
            fwrite($socket, $this->encode(['XREAD', 'COUNT', (string) $count, 'STREAMS', $this->stream, $lastId]));
            $response = $this->readResponse($socket);
        } finally {
            fclose($socket);
        }

        $entries = [];
        foreach (is_array($response) ? $response : [] as $streamResult) {
            foreach ($streamResult[1] ?? [] as $entry) {
                $fields = [];
                $pairs = $entry[1] ?? [];
                for ($i = 0; $i + 1 < count($pairs); $i += 2) {
                    $fields[(string) $pairs[$i]] = (string) $pairs[$i + 1];
                }
                $entries[] = ['id' => (string) $entry[0], 'fields' => $fields];
            }
        }

        return $entries;
    }

    private function encode(array $args): string
    {
        $out = '*'.count($args)."\r\n";
        foreach ($args as $arg) {
            $out .= '$'.strlen((string) $arg)."\r\n".(string) $arg."\r\n";
        }

        return $out;
    }

    private function readResponse($socket, int $depth = 0): mixed
    {
        if ($depth > 12) {
            throw new RuntimeException('Réponse Redis trop profonde.');
        }
        $line = fgets($socket);
        if ($line === false || $line === '') {
            return null;
        }
        $line = rtrim($line, "\r\n");
        $type = $line[0] ?? '';
        $rest = substr($line, 1);

        return match ($type) {
            '+' => $rest,
            '-' => throw new RuntimeException($rest),
            ':' => (int) $rest,
            '$' => $this->readBulk($socket, (int) $rest),
            '*' => $this->readArray($socket, (int) $rest, $depth),
            default => $line,
        };
    }

    private function readBulk($socket, int $length): ?string
    {
        if ($length < 0) {
            return null;
        }
        $data = '';
        while (strlen($data) < $length) {
            $chunk = fread($socket, $length - strlen($data));
            if ($chunk === false || $chunk === '') {
                break;
            }
            $data .= $chunk;
        }
        fread($socket, 2);

        return $data;
    }

    private function readArray($socket, int $count, int $depth): ?array
    {
        if ($count < 0) {
            return null;
        }
        $items = [];
        for ($i = 0; $i < $count; $i++) {
            $items[] = $this->readResponse($socket, $depth + 1);
        }

        return $items;
    }
}
