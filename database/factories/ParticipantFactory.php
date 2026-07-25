<?php

namespace Database\Factories;

use App\Models\Board;
use Illuminate\Database\Eloquent\Factories\Factory;

class ParticipantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'board_id' => Board::factory(),
            'display_name' => fake()->firstName(),
            'color' => fake()->randomElement(config('bmc.participant_colors')),
            'is_host' => false,
            'is_connected' => true,
        ];
    }
}
