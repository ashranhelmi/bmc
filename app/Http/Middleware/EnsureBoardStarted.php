<?php

namespace App\Http\Middleware;

use App\Models\Board;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBoardStarted
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Board::current()->is_started) {
            abort(403, 'The board has not started yet.');
        }

        return $next($request);
    }
}
