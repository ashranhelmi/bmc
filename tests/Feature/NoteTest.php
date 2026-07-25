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
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('notes', [
            'board_id' => $board->id,
            'body' => 'A partner idea',
            'color' => $participant->color,
            'author_name' => $participant->display_name,
        ]);
    }

    public function test_notes_are_appended_to_the_end_of_their_section_in_creation_order(): void
    {
        $board = Board::factory()->started()->create();
        $this->joinedSession($board);

        $this->post('/board/notes', ['section' => 'key_partners', 'body' => 'first'])
            ->assertSessionHasNoErrors();
        $this->post('/board/notes', ['section' => 'key_partners', 'body' => 'second'])
            ->assertSessionHasNoErrors();

        $notes = Note::where('board_id', $board->id)->orderBy('sort_order')->pluck('body');
        $this->assertSame(['first', 'second'], $notes->all());
    }

    public function test_creating_a_note_requires_a_joined_participant(): void
    {
        $board = Board::factory()->started()->create();
        $this->withSession(['pin_verified_board_id' => $board->id]); // viewing only, never joined

        $response = $this->post('/board/notes', [
            'section' => 'key_partners',
            'body' => 'Should be rejected',
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
        ])->assertSessionHasNoErrors();

        // Participant disconnects and their color gets reassigned to someone
        // else — the note must not follow that change.
        $participant->update(['is_connected' => false]);
        $participant->update(['color' => '#000000']);

        $note = Note::where('body', 'Persisted color')->first();
        $this->assertSame($originalColor, $note->color);
    }

    public function test_reorder_moves_a_note_across_sections_and_reindexes_both(): void
    {
        $board = Board::factory()->started()->create();
        $this->joinedSession($board);
        $moved = Note::factory()->for($board)->create(['section' => 'key_partners', 'sort_order' => 0]);
        $staysBehind = Note::factory()->for($board)->create(['section' => 'key_partners', 'sort_order' => 1]);
        $alreadyInFreeform = Note::factory()->for($board)->create(['section' => 'freeform', 'sort_order' => 0]);

        $response = $this->post('/board/notes/reorder', [
            'sections' => [
                'key_partners' => [$staysBehind->id],
                'freeform' => [$alreadyInFreeform->id, $moved->id],
            ],
        ]);

        $response->assertSessionHasNoErrors();

        $moved->refresh();
        $staysBehind->refresh();
        $alreadyInFreeform->refresh();

        $this->assertSame('freeform', $moved->section);
        $this->assertSame(1, $moved->sort_order);
        $this->assertSame('key_partners', $staysBehind->section);
        $this->assertSame(0, $staysBehind->sort_order, 'left-behind sibling should be reindexed to close the gap');
        $this->assertSame(0, $alreadyInFreeform->sort_order);
    }

    public function test_reorder_rejects_an_unknown_section_key(): void
    {
        $board = Board::factory()->started()->create();
        $this->joinedSession($board);
        $note = Note::factory()->for($board)->create();

        $response = $this->post('/board/notes/reorder', [
            'sections' => ['not_a_real_section' => [$note->id]],
        ]);

        $response->assertStatus(422);
    }

    public function test_reorder_requires_a_joined_participant(): void
    {
        $board = Board::factory()->started()->create();
        $this->withSession(['pin_verified_board_id' => $board->id]);
        $note = Note::factory()->for($board)->create(['section' => 'key_partners']);

        $response = $this->post('/board/notes/reorder', [
            'sections' => ['key_partners' => [$note->id]],
        ]);

        $response->assertForbidden();
    }

    public function test_a_joined_participant_can_assign_a_pic_to_any_note_regardless_of_who_authored_it(): void
    {
        $board = Board::factory()->started()->create();
        $this->joinedSession($board);
        $note = Note::factory()->for($board)->create(['author_name' => 'Ivan', 'pic' => null]);

        $response = $this->patch("/board/notes/{$note->id}/pic", ['pic' => 'Maslin']);

        $response->assertSessionHasNoErrors();
        $note->refresh();
        $this->assertSame('Maslin', $note->pic);
        $this->assertSame('Ivan', $note->author_name, 'PIC must not overwrite who actually typed the note');
    }

    public function test_pic_can_be_cleared_back_to_unassigned(): void
    {
        $board = Board::factory()->started()->create();
        $this->joinedSession($board);
        $note = Note::factory()->for($board)->create(['pic' => 'Ivan']);

        $this->patch("/board/notes/{$note->id}/pic", ['pic' => ''])
            ->assertSessionHasNoErrors();

        $this->assertNull($note->fresh()->pic);
    }

    public function test_assigning_a_pic_requires_a_joined_participant(): void
    {
        $board = Board::factory()->started()->create();
        $this->withSession(['pin_verified_board_id' => $board->id]);
        $note = Note::factory()->for($board)->create();

        $response = $this->patch("/board/notes/{$note->id}/pic", ['pic' => 'Someone']);

        $response->assertForbidden();
    }

    public function test_assigning_a_pic_on_a_note_from_another_board_is_rejected(): void
    {
        $board = Board::factory()->started()->create();
        $this->joinedSession($board);
        $otherBoardsNote = Note::factory()->for(Board::factory()->create())->create();

        $response = $this->patch("/board/notes/{$otherBoardsNote->id}/pic", ['pic' => 'Someone']);

        $response->assertNotFound();
    }
}
