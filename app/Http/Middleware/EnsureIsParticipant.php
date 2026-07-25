<?php

namespace App\Http\Middleware;

use App\Models\Board;
use App\Models\Participant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates EDITING (creating/moving notes). Requires a participant identity
 * already claimed via ParticipantController::store — viewing alone
 * (EnsurePinVerified) is not enough.
 */
class EnsureIsParticipant
{
    public function handle(Request $request, Closure $next): Response
    {
        $board = Board::current();
        $participant = Participant::find($request->session()->get('participant_id'));

        if (! $participant || $participant->board_id !== $board->id || ! $participant->is_connected) {
            abort(403, 'Join the board with a name first.');
        }

        return $next($request);
    }
}
