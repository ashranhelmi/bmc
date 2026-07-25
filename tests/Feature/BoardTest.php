<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Note;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class BoardTest extends TestCase
{
    use RefreshDatabase;

    public function test_start_claims_host_and_generates_a_pin(): void
    {
        $response = $this->post('/board/start');

        $board = Board::current();
        $response->assertSessionHas('is_host', true);
        $response->assertSessionHas('host_board_id', $board->id);
        $this->assertTrue($board->is_started);
        $this->assertNotNull($board->pin);
        $this->assertSame(6, strlen($board->pin));
    }

    public function test_a_visitor_without_host_flags_cannot_restart_an_already_started_board(): void
    {
        // Simulates a board already started by someone else — this visitor's
        // own (empty) session has no is_host/host_board_id flags.
        Board::factory()->started()->create();

        $response = $this->post('/board/start');

        $response->assertForbidden();
    }

    public function test_lock_and_unlock_require_host(): void
    {
        $board = Board::factory()->started()->create();

        $this->post('/board/lock')->assertForbidden();

        $this->withSession(['is_host' => true, 'host_board_id' => $board->id]);
        $this->post('/board/lock')->assertSessionHasNoErrors();
        $this->assertTrue($board->fresh()->is_locked);

        $this->post('/board/unlock')->assertSessionHasNoErrors();
        $this->assertFalse($board->fresh()->is_locked);
    }

    public function test_export_includes_freeform_notes_and_schema_version(): void
    {
        $board = Board::factory()->started()->create(['schema_version' => 1]);
        Note::factory()->for($board)->create(['section' => 'key_partners']);
        Note::factory()->for($board)->create(['section' => 'freeform', 'body' => 'a stray note']);

        $this->withSession(['pin_verified_board_id' => $board->id]);
        $response = $this->get('/board/export');

        $response->assertOk();
        $response->assertJsonPath('schema_version', 1);
        $response->assertJsonCount(2, 'notes');
        $response->assertJsonFragment(['section' => 'freeform', 'body' => 'a stray note']);
    }

    public function test_import_restores_lock_state_exactly_without_touching_start_or_pin(): void
    {
        $board = Board::factory()->started()->create(['is_locked' => false]);
        $originalPin = $board->pin;
        Note::factory()->for($board)->create(['body' => 'old note, will be replaced']);

        $payload = [
            'schema_version' => 1,
            'is_locked' => true,
            'notes' => [
                ['section' => 'key_partners', 'body' => 'imported note', 'color' => '#2a78d6', 'author_name' => 'Alex', 'pos_x' => 40, 'pos_y' => 40],
                ['section' => 'freeform', 'body' => 'imported freeform note', 'color' => '#eb6834', 'author_name' => 'Sam', 'pos_x' => 60, 'pos_y' => 60],
            ],
        ];

        $file = UploadedFile::fake()->createWithContent('export.json', json_encode($payload));

        $this->withSession(['is_host' => true, 'host_board_id' => $board->id]);
        $response = $this->post('/board/import', ['file' => $file]);

        $response->assertSessionHasNoErrors();
        $board->refresh();
        $this->assertTrue($board->is_locked, 'is_locked should be restored exactly from the import payload');
        $this->assertTrue($board->is_started, 'is_started must NOT be touched by import');
        $this->assertSame($originalPin, $board->pin, 'pin must NOT be touched by import');
        $this->assertCount(2, $board->notes);
        $this->assertDatabaseHas('notes', ['body' => 'imported freeform note', 'section' => 'freeform']);
        $this->assertDatabaseMissing('notes', ['body' => 'old note, will be replaced']);
    }

    public function test_verify_pin_rejects_wrong_pin(): void
    {
        $board = Board::factory()->started()->create(['pin' => '123456']);

        $response = $this->post('/board/verify-pin', ['pin' => '000000']);

        $response->assertSessionHasErrors('pin');
        $this->assertNull(session('pin_verified_board_id'));
    }

    public function test_verify_pin_accepts_correct_pin(): void
    {
        $board = Board::factory()->started()->create(['pin' => '123456']);

        $response = $this->post('/board/verify-pin', ['pin' => '123456']);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('pin_verified_board_id', $board->id);
    }
}
