<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Note;
use App\Models\Participant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteTest extends TestCase
{
    use RefreshDatabase;

    private function joinedSession(Board $board): Participant
    {
        $participant = Participant::factory()->for($board)->create();
        $this->withSession([
            'pin_verified_board_id' => $board->id,
            'participant_id' => $participant->id,
        ]);

        return $participant;
    }

    public function test_a_joined_participant_can_create_a_note_snapshotting_their_color_and_name(): void
    {
        $board = Board::factory()->started()->create();
        $participant = $this->joinedSession($board);

        $response = $this->post('/board/notes', [
            'section' => 'key_partners',
            'body' => 'A partner idea',
            'pos_x' => 40,
            'pos_y' => 50,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('notes', [
            'board_id' => $board->id,
            'body' => 'A partner idea',
            'color' => $participant->color,
            'author_name' => $participant->display_name,
        ]);
    }

    public function test_creating_a_note_requires_a_joined_participant(): void
    {
        $board = Board::factory()->started()->create();
        $this->withSession(['pin_verified_board_id' => $board->id]); // viewing only, never joined

        $response = $this->post('/board/notes', [
            'section' => 'key_partners',
            'body' => 'Should be rejected',
            'pos_x' => 40,
            'pos_y' => 50,
        ]);

        $response->assertForbidden();
    }

    public function test_notes_cannot_be_created_once_the_board_is_locked(): void
    {
        $board = Board::factory()->started()->locked()->create();
        $this->joinedSession($board);

        $response = $this->post('/board/notes', [
            'section' => 'key_partners',
            'body' => 'Too late',
            'pos_x' => 40,
            'pos_y' => 50,
        ]);

        $response->assertForbidden();
    }

    public function test_a_note_keeps_its_authors_color_permanently_after_they_disconnect(): void
    {
        $board = Board::factory()->started()->create();
        $participant = $this->joinedSession($board);
        $originalColor = $participant->color;

        $this->post('/board/notes', [
            'section' => 'key_partners',
            'body' => 'Persisted color',
            'pos_x' => 40,
            'pos_y' => 50,
        ])->assertSessionHasNoErrors();

        // Participant disconnects and their color gets reassigned to someone
        // else — the note must not follow that change.
        $participant->update(['is_connected' => false]);
        $participant->update(['color' => '#000000']);

        $note = Note::where('body', 'Persisted color')->first();
        $this->assertSame($originalColor, $note->color);
    }

    public function test_moving_a_note_across_sections_updates_its_section(): void
    {
        $board = Board::factory()->started()->create();
        $this->joinedSession($board);
        $note = Note::factory()->for($board)->create(['section' => 'key_partners']);

        $response = $this->patch("/board/notes/{$note->id}/position", [
            'pos_x' => 70,
            'pos_y' => 20,
            'section' => 'freeform',
        ]);

        $response->assertSessionHasNoErrors();
        $note->refresh();
        $this->assertSame('freeform', $note->section);
        $this->assertSame(70.0, $note->pos_x);
    }
}
