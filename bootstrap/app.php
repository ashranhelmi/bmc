<?php

use App\Http\Middleware\EnsureBoardNotLocked;
use App\Http\Middleware\EnsureBoardStarted;
use App\Http\Middleware\EnsureIsHost;
use App\Http\Middleware\EnsureIsParticipant;
use App\Http\Middleware\EnsurePinVerified;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'is.host' => EnsureIsHost::class,
            'board.started' => EnsureBoardStarted::class,
            'board.unlocked' => EnsureBoardNotLocked::class,
            'pin.verified' => EnsurePinVerified::class,
            'is.participant' => EnsureIsParticipant::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
