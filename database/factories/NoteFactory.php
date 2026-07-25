<?php

namespace Database\Factories;

use App\Models\Board;
use Illuminate\Database\Eloquent\Factories\Factory;

class NoteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'board_id' => Board::factory(),
            'section' => fake()->randomElement(array_keys(config('bmc.sections'))),
            'body' => fake()->sentence(),
            'color' => fake()->randomElement(config('bmc.participant_colors')),
            'author_name' => fake()->firstName(),
            'pos_x' => fake()->randomFloat(2, 0, 100),
            'pos_y' => fake()->randomFloat(2, 0, 100),
        ];
    }
}
