<?php

use App\Http\Controllers\AccessController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\ParticipantController;
use Illuminate\Support\Facades\Route;

Route::get('/', [BoardController::class, 'show'])->name('board.show');

Route::post('/board/start', [BoardController::class, 'start'])->name('board.start');
Route::post('/board/verify-pin', [AccessController::class, 'verifyPin'])
    ->middleware('throttle:10,1')
    ->name('board.verify-pin');

Route::middleware('is.host')->group(function () {
    Route::post('/board/lock', [BoardController::class, 'lock'])->name('board.lock');
    Route::post('/board/unlock', [BoardController::class, 'unlock'])->name('board.unlock');
    Route::post('/board/import', [BoardController::class, 'import'])->name('board.import');
});

Route::middleware('pin.verified')->group(function () {
    Route::get('/board/export', [BoardController::class, 'export'])->name('board.export');
    Route::post('/board/participants', [ParticipantController::class, 'store'])->name('participants.store');
    Route::post('/board/participants/{participant}/leave', [ParticipantController::class, 'leave'])->name('participants.leave');
});

Route::middleware(['board.started', 'board.unlocked', 'is.participant'])->group(function () {
    Route::post('/board/notes', [NoteController::class, 'store'])->name('notes.store');
    Route::post('/board/notes/reorder', [NoteController::class, 'reorder'])->name('notes.reorder');
    Route::patch('/board/notes/{note}/pic', [NoteController::class, 'updatePic'])->name('notes.updatePic');
});
