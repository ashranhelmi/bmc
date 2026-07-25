<?php

namespace App\Http\Middleware;

use App\Models\Board;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * There is no login for the host — whoever's browser session set these flags
 * (by being the one that called BoardController::start()) is treated as the
 * host. This is obscurity, not real access control: anyone on the LAN who
 * hits POST /board/start before the facilitator does could claim host.
 * Accepted trade-off for a low-stakes LAN tool with no real data at risk —
 * see requirements.md.
 */
class EnsureIsHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $board = Board::current();

        if ($request->session()->get('is_host') !== true
            || $request->session()->get('host_board_id') !== $board->id) {
            abort(403);
        }

        return $next($request);
    }
}
