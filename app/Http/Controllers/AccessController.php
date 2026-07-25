<?php

namespace App\Http\Controllers;

use App\Models\Board;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AccessController extends Controller
{
    /**
     * Gates VIEWING the board — see EnsurePinVerified. Rate-limited at the
     * route level (throttle:10,1) since this is a short PIN worth guarding
     * against brute-forcing.
     */
    public function verifyPin(Request $request)
    {
        $validated = $request->validate([
            'pin' => ['required', 'string', 'size:6'],
        ]);

        $board = Board::current();

        if (! $board->is_started || $validated['pin'] !== $board->pin) {
            throw ValidationException::withMessages(['pin' => 'Incorrect PIN.']);
        }

        $request->session()->put('pin_verified_board_id', $board->id);

        return back();
    }
}
