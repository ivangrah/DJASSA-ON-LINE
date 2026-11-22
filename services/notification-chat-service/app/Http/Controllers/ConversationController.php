<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class ConversationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $id=(string)$request->header('X-User-Id');
        abort_unless($id!=='',401,'Identité manquante.');
        $data=$request->validate([
            'participant_2'=>['required','uuid'],
            'article_id'=>['nullable','uuid'],
            'offre_troc_id'=>['nullable','uuid'],
        ]);
        abort_if($data['participant_2']===$id,422,'Impossible de converser avec soi-même.');
        $conversation=Conversation::firstOrCreate([
            'participant_1'=>$id,'participant_2'=>$data['participant_2'],'article_id'=>$data['article_id']??null,
        ], ['offre_troc_id'=>$data['offre_troc_id']??null,'dernier_message_at'=>now()]);
        return response()->json($conversation->toArray(),201);
    }
}
