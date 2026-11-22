<?php
use App\Http\Controllers\InternalController;
use Illuminate\Support\Facades\Route;
Route::post('/internal/chat/notifications',[InternalController::class,'createNotification']);
Route::post('/internal/chat/messages/system',[InternalController::class,'systemMessage']);
