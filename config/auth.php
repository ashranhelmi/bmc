<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    |
    | This app has no accounts/login system — participants and the host are
    | identified entirely by plain session values (see EnsureIsHost, the
    | Participant model, and AccessController). The 'web' guard below uses
    | a custom 'participant' driver (registered in AppServiceProvider via
    | Auth::viaRequest) purely so $request->user() resolves to something
    | real for Laravel's OWN broadcasting internals — presence-channel
    | authorization needs a genuine Authenticatable, not a login flow.
    |
    */

    'defaults' => [
        'guard' => 'web',
        'passwords' => 'users',
    ],

    'guards' => [
        'web' => [
            'driver' => 'participant',
        ],
    ],

    'providers' => [
        // Unused — the 'participant' guard driver resolves the user itself
        // via Auth::viaRequest, without consulting a provider.
    ],

    'passwords' => [],

    'password_timeout' => 10800,

];
