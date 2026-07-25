<?php

namespace App\Http\Middleware;

use App\Models\Board;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBoardNotLocked
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Board::current()->is_locked) {
            abort(403, 'The board is locked.');
        }

        return $next($request);
    }
}
