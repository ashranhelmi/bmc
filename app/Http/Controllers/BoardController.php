<?php

namespace App\Http\Controllers;

use App\Events\BoardImported;
use App\Events\BoardLockToggled;
use App\Events\BoardStarted;
use App\Models\Board;
use App\Models\Note;
use App\Models\Participant;
use App\Support\LanAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BoardController extends Controller
{
    public function show(Request $request): Response
    {
        $board = Board::current();
        $participant = Participant::find($request->session()->get('participant_id'));
        $isHost = $request->session()->get('is_host') === true
            && $request->session()->get('host_board_id') === $board->id;

        return Inertia::render('Board/Show', [
            'board' => [
                'id' => $board->id,
                'isStarted' => $board->is_started,
                'isLocked' => $board->is_locked,
                'schemaVersion' => $board->schema_version,
                // Both only ever sent to the host — never leaked to other viewers.
                'pin' => $isHost ? $board->pin : null,
                'lanUrl' => $isHost ? $this->lanUrl($request) : null,
            ],
            'isHost' => $isHost,
            'pinVerified' => $request->session()->get('pin_verified_board_id') === $board->id
                || $request->session()->get('is_host') === true,
            'participant' => $participant && $participant->is_connected ? [
                'id' => $participant->id,
                'displayName' => $participant->display_name,
                'color' => $participant->color,
            ] : null,
            'sections' => config('bmc.sections'),
            'freeformKey' => config('bmc.freeform_key'),
            'participantColors' => config('bmc.participant_colors'),
            // Initial snapshot for JoinPrompt's disabled-swatch hint — a
            // not-yet-joined viewer can't subscribe to the presence channel
            // at all (its auth requires an existing participant_id), so this
            // can't come from Echo the way it does after joining. The real
            // correctness guarantee is still the server-side transaction in
            // ParticipantController, not this hint.
            'takenColors' => $board->connectedParticipants()->pluck('color'),
            'notes' => $board->is_started ? $board->notes()->get([
                'id', 'section', 'body', 'color', 'author_name', 'pos_x', 'pos_y',
            ]) : [],
        ]);
    }

    /**
     * The URL participants should actually use — derived from the server's
     * own detected LAN IP plus this request's real scheme/port, not from
     * however the host happened to address this particular request. Falls
     * back to null (letting the frontend fall back to window.location) if
     * detection fails.
     */
    private function lanUrl(Request $request): ?string
    {
        $ip = LanAddress::detect();

        if (! $ip) {
            return null;
        }

        return sprintf('%s://%s:%s', $request->getScheme(), $ip, $request->getPort());
    }

    public function start(Request $request)
    {
        $board = Board::current();
        $isCurrentHost = $request->session()->get('is_host') === true
            && $request->session()->get('host_board_id') === $board->id;

        if ($board->is_started && ! $isCurrentHost) {
            abort(403, 'A session is already running.');
        }

        $board->update([
            'is_started' => true,
            'started_at' => $board->started_at ?? now(),
            'pin' => str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT),
        ]);

        $request->session()->put('is_host', true);
        $request->session()->put('host_board_id', $board->id);
        $request->session()->put('pin_verified_board_id', $board->id);

        broadcast(new BoardStarted($board))->toOthers();

        return back();
    }

    public function lock(Request $request)
    {
        $board = Board::current();
        $board->update(['is_locked' => true, 'locked_at' => now()]);

        broadcast(new BoardLockToggled($board))->toOthers();

        return back();
    }

    public function unlock(Request $request)
    {
        $board = Board::current();
        $board->update(['is_locked' => false, 'locked_at' => null]);

        broadcast(new BoardLockToggled($board))->toOthers();

        return back();
    }

    public function export(Request $request)
    {
        $board = Board::current();

        return response()->json([
            'schema_version' => $board->schema_version,
            'board_uuid' => $board->uuid,
            'is_locked' => $board->is_locked,
            'exported_at' => now()->toIso8601String(),
            'notes' => $board->notes()->get([
                'section', 'body', 'color', 'author_name', 'pos_x', 'pos_y',
            ]),
        ]);
    }

    public function import(Request $request)
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimetypes:application/json,text/plain'],
        ]);

        $payload = json_decode(file_get_contents($validated['file']->getRealPath()), true);

        if (! is_array($payload) || ! isset($payload['notes']) || ! is_array($payload['notes'])) {
            abort(422, 'That file does not look like a bmc export.');
        }

        $board = Board::current();

        DB::transaction(function () use ($board, $payload) {
            $board->notes()->delete();

            foreach ($payload['notes'] as $note) {
                Note::create([
                    'board_id' => $board->id,
                    'section' => $note['section'] ?? config('bmc.freeform_key'),
                    'body' => $note['body'] ?? '',
                    'color' => $note['color'] ?? '#000000',
                    'author_name' => $note['author_name'] ?? 'Unknown',
                    'pos_x' => $note['pos_x'] ?? 0,
                    'pos_y' => $note['pos_y'] ?? 0,
                ]);
            }

            // Restores the imported board's CONTENT lock state exactly —
            // does not touch is_started/pin, which are session-join
            // mechanics, not exported content. See requirements.md.
            $board->update(['is_locked' => (bool) ($payload['is_locked'] ?? false)]);
        });

        broadcast(new BoardImported($board))->toOthers();

        return back();
    }
}
