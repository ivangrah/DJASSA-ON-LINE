<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class MessageController extends Controller
{
    public function conversations(Request $request): JsonResponse
    {
        $id=$this->userId($request);
        $page=Conversation::select(['id','participant_1','participant_2','article_id','offre_troc_id','dernier_message_at','created_at'])
            ->where('participant_1',$id)->orWhere('participant_2',$id)
            ->latest('dernier_message_at')->paginate(20);
        return response()->json(['data'=>$page->items(),'meta'=>['current_page'=>$page->currentPage(),'last_page'=>$page->lastPage(),'total'=>$page->total()]]);
    }

    public function thread(Request $request): JsonResponse
    {
        $id=$this->userId($request);
        $conversationId=(string)$request->query('conversation_id','');
        abort_unless($conversationId!=='',422,'conversation_id requis.');
        $conversation=Conversation::findOrFail($conversationId);
        abort_unless($conversation->hasParticipant($id),403,'Accès refusé à cette conversation.');
        $page=Message::select(['id','conversation_id','expediteur_id','destinataire_id','type','contenu','payload','lu_at','created_at'])
            ->where('conversation_id',$conversationId)->latest()->paginate(20);
        return response()->json(['data'=>$page->items(),'meta'=>['current_page'=>$page->currentPage(),'last_page'=>$page->lastPage(),'total'=>$page->total()]]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json(['count'=>Message::where('destinataire_id',$this->userId($request))->whereNull('lu_at')->count()]);
    }

    public function store(Request $request): JsonResponse
    {
        $id=$this->userId($request);
        $data=$request->validate([
            'conversation_id' => ['required','uuid'],
            'contenu' => ['required','string','max:4000'],
            'type' => ['sometimes','in:texte,offre_prix,carte_troc,systeme'],
            'payload' => ['sometimes','array'],
        ]);
        $conversation=Conversation::findOrFail($data['conversation_id']);
        abort_unless($conversation->hasParticipant($id),403,'Accès refusé à cette conversation.');
        $destinataire=$conversation->participant_1===$id?$conversation->participant_2:$conversation->participant_1;
        $message=Message::create([
            'conversation_id'=>$conversation->id,'expediteur_id'=>$id,'destinataire_id'=>$destinataire,
            'type'=>$data['type']??Message::TYPE_TEXTE,'contenu'=>$data['contenu'],'payload'=>$data['payload']??null,
        ]);
        $conversation->update(['dernier_message_at'=>now()]);
        return response()->json($message->toArray(),201);
    }

    public function read(Request $request, string $id): JsonResponse
    {
        $message=Message::findOrFail($id);
        abort_unless($message->destinataire_id===$this->userId($request),403);
        $message->update(['lu_at'=>now()]);
        return response()->json(['read'=>true]);
    }

    private function userId(Request $request): string
    {
        $id=(string)$request->header('X-User-Id');
        abort_unless($id!=='',401,'Identité manquante.');
        return $id;
    }
}
