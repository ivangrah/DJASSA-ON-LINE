<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Brevo (ex-Sendinblue) — e-mails transactionnels (API REST v3) & SMS OTP.
 *
 * Tous les envois sont non-bloquants : en cas d'absence de BREVO_API_KEY
 * (développement local), les messages sont journalisés dans les logs Laravel
 * (et les e-mails peuvent partir par Mailpit via le mailer SMTP configuré).
 */
class BrevoNotificationService
{
    public function isConfigured(): bool
    {
        return ! empty(config('services.brevo.api_key'));
    }

    /**
     * E-mail transactionnel avec template Brevo dynamique (fallback : HTML généré localement).
     */
    public function sendEmail(string $toEmail, string $toName, string $subject, array $params = [], ?string $htmlContent = null): bool
    {
        if (! $this->isConfigured()) {
            Log::info('[Brevo:DEV] email', ['to' => $toEmail, 'subject' => $subject, 'params' => $params]);

            // En développement : double dépôt dans Mailpit (http://127.0.0.1:8025) pour visualiser les e-mails (PIN, reçus…)
            try {
                if (config('mail.default') !== 'log') {
                    \Illuminate\Support\Facades\Mail::html($htmlContent ?? $this->renderFallback($subject, $params), function ($mail) use ($toEmail, $toName, $subject) {
                        $mail->to($toEmail, $toName)->subject($subject)->from(config('mail.from.address'), config('mail.from.name'));
                    });
                }
            } catch (\Throwable $mailException) {
                Log::warning('[Brevo:DEV] Mailpit indisponible', ['error' => $mailException->getMessage()]);
            }

            return true;
        }

        try {
            $response = Http::baseUrl('https://api.brevo.com/v3')
                ->withHeaders(['api-key' => config('services.brevo.api_key')])
                ->acceptJson()
                ->timeout(15)
                ->post('/smtp/email', [
                    'sender' => [
                        'name' => config('services.brevo.sender_name'),
                        'email' => config('services.brevo.sender_email'),
                    ],
                    'to' => [['email' => $toEmail, 'name' => $toName]],
                    'subject' => $subject,
                    'htmlContent' => $htmlContent ?? $this->renderFallback($subject, $params),
                    'params' => $params,
                ]);

            if (! $response->successful()) {
                Log::error('[Brevo] Échec envoi email', ['status' => $response->status(), 'body' => $response->body()]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('[Brevo] Exception envoi email', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * SMS transactionnel (OTP vérification boutique pro, alertes critiques).
     */
    public function sendSms(string $phone, string $message): bool
    {
        if (! $this->isConfigured()) {
            Log::info('[Brevo:DEV] sms', ['to' => $phone, 'message' => $message]);

            return true;
        }

        try {
            $response = Http::baseUrl('https://api.brevo.com/v3')
                ->withHeaders(['api-key' => config('services.brevo.api_key')])
                ->acceptJson()
                ->timeout(15)
                ->post('/transactionalSMS/sms', [
                    'sender' => config('services.brevo.sms_sender', 'DJASSA'),
                    'recipient' => $phone,
                    'content' => $message,
                    'type' => 'transactional',
                ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('[Brevo] Exception envoi SMS', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /* ------------------------------------------------------------------
     |  Scénarios métier Djassa
     * ------------------------------------------------------------------ */

    public function pinEscrowEmail(object $acheteur, string $pin, float $montant, string $articleTitre): bool
    {
        return $this->sendEmail(
            $acheteur->email,
            $acheteur->nom,
            'Votre code PIN de remise Djassa Online',
            ['PIN' => $pin, 'MONTANT' => number_format($montant, 0, ',', ' '), 'ARTICLE' => $articleTitre],
            $this->renderFallback('Code PIN de remise', [
                'Votre code PIN à 4 chiffres pour <strong>'.e($articleTitre).'</strong> :',
                '<p style="font-size:28px;letter-spacing:8px;font-weight:800;color:#E11D48">'.$pin.'</p>',
                '<p>Montrez ce code au vendeur <strong>uniquement au moment de la remise physique</strong> de l’article. Ne le partagez avec personne d’autre.</p>',
            ])
        );
    }

    public function souhaitMatchEmail(object $utilisateur, string $souhaitTitre, string $articleTitre, string $articleUrl): bool
    {
        return $this->sendEmail(
            $utilisateur->email,
            $utilisateur->nom,
            'Mur des Souhaits — « '.$souhaitTitre.' » a peut-être trouvé preneur',
            ['SOUHAIT' => $souhaitTitre, 'ARTICLE' => $articleTitre, 'URL' => $articleUrl],
            $this->renderFallback('Votre souhait a matché !', [
                'Un article correspondant à votre recherche <strong>« '.e($souhaitTitre).' »</strong> vient d’être publié :',
                '<p><strong>'.e($articleTitre).'</strong></p>',
                '<p><a href="'.e($articleUrl).'" style="background:#E11D48;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Voir l’annonce</a></p>',
            ])
        );
    }

    public function offreTrocEmail(object $vendeur, string $articleTitre, string $proposeurNom, float $soulte): bool
    {
        return $this->sendEmail(
            $vendeur->email,
            $vendeur->nom,
            'Nouvelle proposition de troc sur « '.$articleTitre.' »',
            ['ARTICLE' => $articleTitre, 'PROPOSEUR' => $proposeurNom, 'SOULTE' => number_format($soulte, 0, ',', ' ')],
            $this->renderFallback('Proposition de troc reçue', [
                e($proposeurNom).' vous propose un troc sur votre article <strong>« '.e($articleTitre).' »</strong>'
                .($soulte > 0 ? ' avec <strong>'.number_format($soulte, 0, ',', ' ').' FCFA</strong> de soulte.' : '.'),
                '<p>Ouvrez l’application Djassa Online pour accepter, refuser ou faire une contre-offre.</p>',
            ])
        );
    }

    public function boutiqueVerifieeSms(object $pro, string $boutiqueNom): bool
    {
        return $this->sendSms($pro->telephone ?? '', 'DJASSA ONLINE : Félicitations ! Votre boutique « '.$boutiqueNom.' » est vérifiée. Le badge Vendeur Vérifié est actif.');
    }

    /* ------------------------------------------------------------------ */

    private function renderFallback(string $heading, array $lines): string
    {
        $body = implode('<br>', array_map(fn ($line) => is_string($line) && str_starts_with(trim($line), '<') ? $line : '<p style="margin:0 0 12px">'.$line.'</p>', $lines));

        return <<<HTML
        <div style="font-family:'Inter',Arial,sans-serif;max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #F5F5F5;border-radius:12px;overflow:hidden">
          <div style="background:#121212;padding:20px 24px">
            <span style="font-family:'Plus Jakarta Sans',Arial;font-weight:800;font-size:18px;color:#FFFFFF">Djassa <span style="color:#E11D48">Online</span></span>
          </div>
          <div style="padding:24px;color:#121212">
            <h2 style="font-family:'Plus Jakarta Sans',Arial;font-size:16px;margin:0 0 12px;color:#121212">{$heading}</h2>
            {$body}
          </div>
          <div style="padding:14px 24px;background:#F5F5F5;font-size:11px;color:#64748B">Djassa Online — la marketplace de revente et de troc en Afrique de l'Ouest · no-reply@djassaonline.ci</div>
        </div>
        HTML;
    }
}
