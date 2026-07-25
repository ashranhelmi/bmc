<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Participant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParticipantTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_viewer_can_join_with_a_name_and_color(): void
    {
        $board = Board::factory()->started()->create();

        $this->withSession(['pin_verified_board_id' => $board->id]);
        $response = $this->post('/board/participants', [
            'display_name' => 'Ashran',
            'color' => config('bmc.participant_colors')[0],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('participants', [
            'board_id' => $board->id,
            'display_name' => 'Ashran',
            'color' => config('bmc.participant_colors')[0],
        ]);
    }

    public function test_joining_requires_the_pin_to_already_be_verified(): void
    {
        Board::factory()->started()->create();

        $response = $this->post('/board/participants', [
            'display_name' => 'Ashran',
            'color' => config('bmc.participant_colors')[0],
        ]);

        $response->assertForbidden();
    }

    public function test_a_color_already_held_by_a_connected_participant_cannot_be_claimed_again(): void
    {
        $board = Board::factory()->started()->create();
        $color = config('bmc.participant_colors')[0];
        Participant::factory()->for($board)->create(['color' => $color, 'is_connected' => true]);

        $this->withSession(['pin_verified_board_id' => $board->id]);
        $response = $this->post('/board/participants', [
            'display_name' => 'Second Person',
            'color' => $color,
        ]);

        $response->assertSessionHasErrors('color');
        $this->assertSame(
            1,
            Participant::where('board_id', $board->id)->where('color', $color)->count(),
            'only the original claim should exist — the second must have been rejected'
        );
    }

    public function test_a_color_held_by_a_disconnected_participant_can_be_claimed(): void
    {
        $board = Board::factory()->started()->create();
        $color = config('bmc.participant_colors')[0];
        Participant::factory()->for($board)->create(['color' => $color, 'is_connected' => false]);

        $this->withSession(['pin_verified_board_id' => $board->id]);
        $response = $this->post('/board/participants', [
            'display_name' => 'New Person',
            'color' => $color,
        ]);

        $response->assertSessionHasNoErrors();
    }

    public function test_leave_marks_a_participant_disconnected_and_is_idempotent(): void
    {
        $board = Board::factory()->started()->create();
        $participant = Participant::factory()->for($board)->create(['is_connected' => true]);

        // Called by another already-joined participant's browser reacting to
        // a presence .leaving() event — so the caller is always pin-verified.
        $this->withSession(['pin_verified_board_id' => $board->id]);
        $this->post(route('participants.leave', $participant))->assertNoContent();
        $this->assertFalse($participant->fresh()->is_connected);

        // Calling it again (e.g. two remaining participants both react to
        // the same .leaving() event) must not error.
        $this->post(route('participants.leave', $participant))->assertNoContent();
    }
}
