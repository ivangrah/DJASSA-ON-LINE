<?php
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;
Route::get('/api/v1/messages/conversations',[MessageController::class,'conversations']);
Route::get('/api/v1/messages/thread',[MessageController::class,'thread']);
Route::get('/api/v1/messages/unread-count',[MessageController::class,'unreadCount']);
Route::post('/api/v1/messages',[MessageController::class,'store']);
Route::post('/api/v1/messages/{message}/read',[MessageController::class,'read']);
Route::post('/api/v1/conversations',[ConversationController::class,'store']);
Route::get('/api/v1/notifications',[NotificationController::class,'index']);
Route::post('/api/v1/notifications/{notification}/read',[NotificationController::class,'markRead']);
Route::post('/api/v1/admin/notifications/broadcast',[\App\Http\Controllers\AdminCampaignController::class,'broadcast']);
