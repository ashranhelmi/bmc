<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BoardFactory extends Factory
{
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'is_started' => false,
            'is_locked' => false,
            'schema_version' => 1,
        ];
    }

    public function started(): static
    {
        return $this->state(fn () => [
            'is_started' => true,
            'started_at' => now(),
            'pin' => str_pad((string) fake()->numberBetween(0, 999999), 6, '0', STR_PAD_LEFT),
        ]);
    }

    public function locked(): static
    {
        return $this->state(fn () => [
            'is_locked' => true,
            'locked_at' => now(),
        ]);
    }
}
