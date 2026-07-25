<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Implements Authenticatable purely so Laravel's OWN broadcasting internals
 * work — presence-channel authorization (PusherBroadcaster::
 * validAuthenticationResponse()) unconditionally calls
 * $request->user()->getAuthIdentifier(), assuming a real Auth guard user
 * exists, which crashed when there was none. This is not a real login
 * system — see the 'participant' guard registered in AppServiceProvider,
 * which resolves this purely from session('participant_id'), the same
 * plain-session identity already used everywhere else in this app.
 */
class Participant extends Model implements AuthenticatableContract
{
    use Authenticatable, HasFactory;

    protected $fillable = [
        'board_id',
        'display_name',
        'color',
        'is_host',
        'is_connected',
    ];

    protected $casts = [
        'is_host' => 'boolean',
        'is_connected' => 'boolean',
    ];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }
}
