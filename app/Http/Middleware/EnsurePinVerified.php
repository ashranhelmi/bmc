<?php

namespace App\Http\Middleware;

use App\Models\Board;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates VIEWING the board. Separate from EnsureIsParticipant, which gates
 * EDITING — per the requirement, the PIN unlocks read-only access; a display
 * name (no PIN re-entry) is what unlocks editing on top of that.
 */
class EnsurePinVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $board = Board::current();

        if ($request->session()->get('pin_verified_board_id') !== $board->id
            && $request->session()->get('is_host') !== true) {
            abort(403, 'PIN required.');
        }

        return $next($request);
    }
}
