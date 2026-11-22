<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $id=(string)$request->header('X-User-Id');
        abort_unless($id!=='',401,'Identité manquante.');
        $page=Notification::select(['id','user_id','type','titre','corps','canal','lu_le','created_at'])
            ->where('user_id',$id)->latest()->paginate(20);
        return response()->json(['data'=>$page->items(),'meta'=>['current_page'=>$page->currentPage(),'last_page'=>$page->lastPage(),'total'=>$page->total()]]);
    }
    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification=Notification::findOrFail($id);
        abort_unless($notification->user_id===(string)$request->header('X-User-Id'),403);
        $notification->update(['lu_le'=>now()]);
        return response()->json(['read'=>true]);
    }
}
