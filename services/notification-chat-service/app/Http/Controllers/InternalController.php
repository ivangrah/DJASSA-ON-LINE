<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class InternalController extends Controller
{
    private function verify(Request $request): void
    {
        $key=config('services.internal.signing_key');
        abort_if(empty($key),503);
        $signature=(string)$request->header('X-Djassa-Signature');
        abort_unless($signature!=='',401);
        $body=$request->getContent();
        foreach(array_unique([$body,'','[]','{}']) as $candidate){
            if(hash_equals(hash_hmac('sha256',$request->getMethod()."\n".$request->getPathInfo()."\n".$candidate,$key),$signature))return;
        }
        abort(401,'Signature invalide.');
    }
    public function createNotification(Request $request): JsonResponse
    {
        $this->verify($request);
        $data=$request->validate([
            'user_id'=>['required','uuid'],'type'=>['required','string','max:30'],
            'titre'=>['required','string','max:180'],'corps'=>['nullable','string'],
            'canal'=>['sometimes','in:email,sms,push,in_app'],'source_reference'=>['nullable','string','max:191'],
        ]);
        $n=Notification::create($data+['canal'=>$data['canal']??'in_app']);
        return response()->json($n->toArray(),201);
    }
    public function systemMessage(Request $request): JsonResponse
    {
        $this->verify($request);
        $data=$request->validate([
            'conversation_id'=>['required','uuid'],'expediteur_id'=>['required','uuid'],
            'destinataire_id'=>['required','uuid'],'contenu'=>['required','string','max:4000'],
        ]);
        $m=Message::create($data+['type'=>Message::TYPE_SYSTEME]);
        return response()->json($m->toArray(),201);
    }
}
