<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
/** Envois Brevo avec timeouts stricts (règle 18 : connect 3s / read 8s). */
class BrevoService
{
    public function isConfigured(): bool { return ! empty(config('services.brevo.api_key')); }

    public function sendEmail(string $toEmail, string $toName, string $subject, string $html): bool
    {
        if (! $this->isConfigured()) { Log::debug('[Brevo] non configuré, email ignoré'); return false; }
        try {
            $response = Http::withHeaders([
                'api-key' => config('services.brevo.api_key'), 'Content-Type' => 'application/json',
            ])->connectTimeout((int) config('services.brevo.connect_timeout', 3))
              ->timeout((int) config('services.brevo.timeout', 8))
              ->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => ['name'=>config('services.brevo.sender_name'),'email'=>config('services.brevo.sender_email')],
                'to' => [['name'=>$toName,'email'=>$toEmail]],
                'subject' => $subject, 'htmlContent' => $html,
              ]);
            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning('[Brevo] échec envoi email', ['error'=>$e->getMessage()]);
            return false;
        }
    }

    public function sendSms(string $phone, string $message): bool
    {
        if (! $this->isConfigured()) return false;
        try {
            $response = Http::withHeaders(['api-key'=>config('services.brevo.api_key'),'Content-Type'=>'application/json'])
                ->connectTimeout(3)->timeout(8)
                ->post('https://api.brevo.com/v3/transactions/smsmessages', [
                    'sender' => 'Djassa', 'recipient' => $phone, 'content' => $message,
                ]);
            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning('[Brevo] échec envoi SMS', ['error'=>$e->getMessage()]);
            return false;
        }
    }
}
