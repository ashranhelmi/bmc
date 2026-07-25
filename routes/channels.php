<?php

use App\Models\Participant;
use Illuminate\Support\Facades\Broadcast;

// Broadcast::channel() closures receive the AUTH GUARD's resolved user as
// their first argument, not the Request — always null here, since this app
// has no Auth guard at all. session() (the global helper, not $request-
// >session()) is what actually reaches the current request's session data,
// the same plain-session identity pattern used by EnsureIsParticipant.
Broadcast::channel('presence-board.{boardId}', function ($user, $boardId) {
    $participant = Participant::find(session('participant_id'));

    if (! $participant || (string) $participant->board_id !== (string) $boardId || ! $participant->is_connected) {
        return false;
    }

    return [
        'id' => $participant->id,
        'name' => $participant->display_name,
        'color' => $participant->color,
        'isHost' => $participant->is_host,
    ];
});
