<?php

namespace App\Http\Controllers;

use App\Events\NoteCreated;
use App\Events\NotesReordered;
use App\Models\Board;
use App\Models\Note;
use App\Models\Participant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NoteController extends Controller
{
    public function store(Request $request)
    {
        $sectionKeys = $this->sectionKeys();

        $validated = $request->validate([
            'section' => ['required', 'string', 'in:'.implode(',', $sectionKeys)],
            'body' => ['nullable', 'string', 'max:500'],
        ]);

        $board = Board::current();
        $participant = Participant::findOrFail($request->session()->get('participant_id'));

        // New notes always append to the end of their section — participants
        // choose a position by dragging afterward, not on creation.
        $nextOrder = 1 + (int) Note::where('board_id', $board->id)
            ->where('section', $validated['section'])
            ->max('sort_order');

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
            'sort_order' => $nextOrder,
        ]);

        broadcast(new NoteCreated($note))->toOthers();

        return back();
    }

    /**
     * Handles both within-section reordering and cross-section moves
     * (including into/out of the free-form area) in one call — the payload
     * is the FULL final ordered id list for every section that changed,
     * not an incremental delta, which avoids any shifting-index bugs when
     * multiple notes move in one drag.
     */
    public function reorder(Request $request)
    {
        $sectionKeys = $this->sectionKeys();

        $validated = $request->validate([
            'sections' => ['required', 'array', 'min:1'],
            'sections.*' => ['array'],
            'sections.*.*' => ['integer'],
        ]);

        if (array_diff(array_keys($validated['sections']), $sectionKeys)) {
            abort(422, 'Unknown section.');
        }

        $board = Board::current();

        $changed = DB::transaction(function () use ($validated, $board) {
            $changed = collect();

            foreach ($validated['sections'] as $sectionKey => $noteIds) {
                foreach ($noteIds as $index => $noteId) {
                    $note = Note::where('board_id', $board->id)->findOrFail($noteId);
                    $note->update(['section' => $sectionKey, 'sort_order' => $index]);
                    $changed->push($note);
                }
            }

            return $changed;
        });

        broadcast(new NotesReordered($changed, $board->id))->toOthers();

        return back();
    }

    private function sectionKeys(): array
    {
        return array_merge(
            array_keys(config('bmc.sections')),
            [config('bmc.freeform_key')],
        );
    }
}
