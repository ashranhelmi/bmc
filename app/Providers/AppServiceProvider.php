<?php

namespace App\Providers;

use App\Models\Participant;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Not a real login system — this app has none. Registered purely so
        // $request->user() resolves to something real for Laravel's own
        // broadcasting internals (presence-channel auth requires a genuine
        // Authenticatable to build its broadcastIdentifier). Resolves from
        // the same plain session('participant_id') used everywhere else.
        Auth::viaRequest('participant', function () {
            return Participant::find(session('participant_id'));
        });
    }
}
