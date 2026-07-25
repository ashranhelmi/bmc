<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ParticipantController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'display_name' => ['required', 'string', 'max:40'],
            'color' => ['required', 'string', 'in:'.implode(',', config('bmc.participant_colors'))],
        ]);

        $board = Board::current();

        $participant = DB::transaction(function () use ($board, $validated, $request) {
            // Pessimistic lock over this board's connected participants —
            // a client-side "is it still free" check alone can't prevent two
            // simultaneous clicks on the same swatch both succeeding.
            $taken = Participant::where('board_id', $board->id)
                ->where('is_connected', true)
                ->lockForUpdate()
                ->pluck('color');

            if ($taken->contains($validated['color'])) {
                throw ValidationException::withMessages([
                    'color' => 'That color was just taken — pick another.',
                ]);
            }

            return Participant::create([
                'board_id' => $board->id,
                'display_name' => $validated['display_name'],
                'color' => $validated['color'],
                'is_host' => $request->session()->get('is_host') === true,
                'is_connected' => true,
            ]);
        });

        $request->session()->put('participant_id', $participant->id);

        return back();
    }

    /**
     * Frees a color for reassignment once a participant actually disconnects.
     * Called by any OTHER still-connected client's browser, in reaction to
     * Echo's presence-channel `.leaving()` event — which Reverb fires from
     * its own server-side connection/ping-timeout detection, not from the
     * disconnecting client's JS still running. (Laravel Reverb has no
     * Pusher-Cloud-style webhook system — this endpoint is the real
     * mechanism, not a stand-in for one.) Idempotent: harmless if called more
     * than once, or by more than one remaining participant's browser.
     */
    public function leave(Participant $participant)
    {
        $participant->update(['is_connected' => false]);

        return response()->noContent();
    }
}
