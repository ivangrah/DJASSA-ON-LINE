<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Http\Resources\OffreTrocResource;
use App\Models\OffreTroc;
use App\Models\VerrouStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class InternalController extends Controller
{
    private function verify(Request $request): void
    {
        $key = config('services.internal.signing_key');
        abort_if(empty($key), 503);
        $signature = (string) $request->header('X-Djassa-Signature');
        abort_unless($signature !== '', 401);
        $body = $request->getContent();
        foreach (array_unique([$body, '', '[]', '{}']) as $candidate) {
            if (hash_equals(hash_hmac('sha256', $request->getMethod()."\n".$request->getPathInfo()."\n".$candidate, $key), $signature)) return;
        }
        abort(401, 'Signature invalide.');
    }
    public function getOffre(Request $request, string $id): JsonResponse
    {
        $this->verify($request);
        return response()->json(OffreTrocResource::make(OffreTroc::with('articlesOfferts')->findOrFail($id))->resolve());
    }
    public function completeOffre(Request $request, string $id): JsonResponse
    {
        $this->verify($request);
        $offre = OffreTroc::findOrFail($id);
        if ($offre->statut !== OffreTroc::STATUT_COMPLETED) {
            $offre->update(['statut' => OffreTroc::STATUT_COMPLETED]);
            VerrouStock::where('offre_id', $offre->id)->delete();
        }
        return response()->json(['ok'=>true, 'statut'=>$offre->statut]);
    }
    public function releaseLock(Request $request, string $id): JsonResponse
    {
        $this->verify($request);
        VerrouStock::where('offre_id', $id)->delete();
        return response()->json(['ok'=>true]);
    }
}
