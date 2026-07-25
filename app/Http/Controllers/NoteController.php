<?php

namespace App\Http\Controllers;

use App\Events\NoteCreated;
use App\Events\NoteMoved;
use App\Models\Board;
use App\Models\Note;
use App\Models\Participant;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function store(Request $request)
    {
        $sectionKeys = array_merge(
            array_keys(config('bmc.sections')),
            [config('bmc.freeform_key')],
        );

        $validated = $request->validate([
            'section' => ['required', 'string', 'in:'.implode(',', $sectionKeys)],
            'body' => ['nullable', 'string', 'max:500'],
            'pos_x' => ['required', 'numeric'],
            'pos_y' => ['required', 'numeric'],
        ]);

        $board = Board::current();
        $participant = Participant::findOrFail($request->session()->get('participant_id'));

        // color/author_name are snapshotted at creation time and never
        // re-derived from the live participant — see requirements.md and the
        // notes migration comment.
        $note = Note::create([
            'board_id' => $board->id,
            'section' => $validated['section'],
            'body' => $validated['body'] ?? '',
            'color' => $participant->color,
            'author_name' => $participant->display_name,
            'participant_id' => $participant->id,
            'pos_x' => $validated['pos_x'],
            'pos_y' => $validated['pos_y'],
        ]);

        broadcast(new NoteCreated($note))->toOthers();

        return back();
    }

    public function updatePosition(Request $request, Note $note)
    {
        $sectionKeys = array_merge(
            array_keys(config('bmc.sections')),
            [config('bmc.freeform_key')],
        );

        $validated = $request->validate([
            'pos_x' => ['required', 'numeric'],
            'pos_y' => ['required', 'numeric'],
            // Present when a note is dragged across section boundaries
            // (including into/out of the free-form area) — absent when it's
            // just repositioned within its current container.
            'section' => ['sometimes', 'string', 'in:'.implode(',', $sectionKeys)],
        ]);

        $note->update($validated);

        broadcast(new NoteMoved($note))->toOthers();

        return back();
    }
}
